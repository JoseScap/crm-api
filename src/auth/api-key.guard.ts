import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(private cacheService: CacheService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const method = request.method;
    const path = request.path;

    if (!apiKey) {
      this.logger.warn(
        `Missing x-api-key header - ${method} ${path} from ${request.ip}`,
      );
      throw new UnauthorizedException('Missing x-api-key header');
    }

    const userApiKey = this.cacheService.getUserApiKey(apiKey);

    if (!userApiKey) {
      this.logger.warn(
        `Invalid API key attempted - ${method} ${path} from ${request.ip}`,
      );
      throw new UnauthorizedException('Invalid API key');
    }

    if (!userApiKey.is_active) {
      this.logger.warn(
        `Inactive API key attempted - user_id: ${userApiKey.user_id}, key_index: ${userApiKey.key_index} - ${method} ${path} from ${request.ip}`,
      );
      throw new UnauthorizedException('API key is not active');
    }

    // Attach the API key info to the request for later use
    request.userApiKey = userApiKey;

    this.logger.log(
      `API key validated successfully - user_id: ${userApiKey.user_id}, key_index: ${userApiKey.key_index} - ${method} ${path}`,
    );

    return true;
  }
}

