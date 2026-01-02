import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SignatureService } from './signature.service';
import { SignatureConfig, SIGNATURE_CONFIG_KEY } from './signature.config';
import { ConfigService } from '@nestjs/config';

export const UseSignature = (config: SignatureConfig) =>
  SetMetadata(SIGNATURE_CONFIG_KEY, config);

@Injectable()
export class SignatureGuard implements CanActivate {
  private readonly logger = new Logger(SignatureGuard.name);

  constructor(
    private signatureService: SignatureService,
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const path = request.path;

    this.logger.log(`=== SIGNATURE GUARD - Starting validation ===`);
    this.logger.log(`Method: ${method}, Path: ${path}, IP: ${request.ip}`);

    // Get signature config from metadata
    const config = this.reflector.get<SignatureConfig>(
      SIGNATURE_CONFIG_KEY,
      context.getHandler(),
    );

    if (!config) {
      this.logger.error(
        `Signature config not found for ${method} ${path}. Make sure to use @UseSignature() decorator.`,
      );
      throw new UnauthorizedException('Signature validation not configured');
    }

    this.logger.log(`Config found - secretKeyEnvVar: ${config.secretKeyEnvVar}, headerNameEnvVar: ${config.headerNameEnvVar}`);
    this.logger.log(`Algorithm: ${config.algorithm || 'sha256'}, Encoding: ${config.encoding || 'hex'}`);

    // Get secret key from environment variable
    const secretKey = this.configService.get<string>(config.secretKeyEnvVar);
    if (!secretKey) {
      this.logger.error(
        `Secret key not found in environment variable ${config.secretKeyEnvVar} - ${method} ${path}`,
      );
      throw new UnauthorizedException(
        `Webhook secret key not configured: ${config.secretKeyEnvVar}`,
      );
    }
    this.logger.log(`Secret key retrieved from ${config.secretKeyEnvVar} (length: ${secretKey.length})`);

    // Get header name from environment variable
    const headerName = this.configService.get<string>(
      config.headerNameEnvVar,
    );
    if (!headerName) {
      this.logger.error(
        `Header name not found in environment variable ${config.headerNameEnvVar} - ${method} ${path}`,
      );
      throw new UnauthorizedException(
        `Webhook header name not configured: ${config.headerNameEnvVar}`,
      );
    }
    this.logger.log(`Header name retrieved from ${config.headerNameEnvVar}: ${headerName}`);

    // Get signature from header using the configured header name
    // Try common header name variations (case-insensitive)
    const headerVariations = [
      headerName,
      headerName.toLowerCase(),
      headerName.toUpperCase(),
    ];

    this.logger.log(`Searching for signature in headers: ${headerVariations.join(', ')}`);
    this.logger.log(`Available headers: ${Object.keys(request.headers).join(', ')}`);

    let signature: string | undefined;
    for (const headerVar of headerVariations) {
      const value = request.headers[headerVar];
      if (value) {
        signature = Array.isArray(value)
          ? (value[0] as string)
          : (value as string);
        this.logger.log(
          `Found signature in header[${headerVar}]: ${signature.substring(0, 20)}... (length: ${signature.length})`,
        );
        break;
      } else {
        this.logger.debug(`Header[${headerVar}]: NOT FOUND`);
      }
    }

    if (!signature) {
      this.logger.warn(
        `Missing signature header (${headerName}) - ${method} ${path} from ${request.ip}`,
      );
      this.logger.warn(`Tried header variations: ${headerVariations.join(', ')}`);
      throw new UnauthorizedException(
        `Missing signature header: ${headerName}`,
      );
    }

    // At this point, signature is guaranteed to be defined
    const signatureValue: string = signature;
    this.logger.log(`Signature extracted successfully (length: ${signatureValue.length})`);

    // Get payload for signature validation
    // According to Kapso docs: "Always verify against the raw JSON payload"
    // Use rawBody if available, otherwise stringify the parsed body
    let payload: string;
    if (request.rawBody) {
      payload = request.rawBody.toString();
      this.logger.log(`Using rawBody for validation (length: ${payload.length})`);
      this.logger.debug(`RawBody preview: ${payload.substring(0, 100)}...`);
    } else if (request.body) {
      // Fallback: stringify the parsed body
      payload = JSON.stringify(request.body);
      this.logger.warn(
        'Using parsed body for signature validation. Consider configuring raw body parser.',
      );
      this.logger.log(`Stringified body length: ${payload.length}`);
      this.logger.debug(`Stringified body preview: ${payload.substring(0, 100)}...`);
    } else {
      this.logger.warn(
        `Missing request body for signature validation - ${method} ${path} from ${request.ip}`,
      );
      throw new UnauthorizedException('Missing request body');
    }

    this.logger.log(`Payload prepared for validation (length: ${payload.length})`);

    // Validate signature using configured algorithm and encoding
    this.logger.log(`Calling signature validation service...`);
    const algorithm = config.algorithm || 'sha256';
    const encoding = config.encoding || 'hex';
    const isValid = this.signatureService.validateSignature(
      payload,
      signatureValue,
      secretKey,
      algorithm,
      encoding,
    );

    if (!isValid) {
      this.logger.warn(
        `Invalid signature - ${method} ${path} from ${request.ip}`,
      );
      this.logger.warn(`Signature validation failed. Check payload, signature, and secret key.`);
      throw new UnauthorizedException('Invalid signature');
    }

    this.logger.log(`Signature validated successfully - ${method} ${path}`);
    this.logger.log(`=== SIGNATURE GUARD - Validation complete ===`);
    return true;
  }
}

