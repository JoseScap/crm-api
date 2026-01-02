import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { SignatureConfig } from './signature.config';

@Injectable()
export class SignatureService {
  private readonly logger = new Logger(SignatureService.name);

  /**
   * Validates webhook signature using HMAC
   * Supports multiple algorithms (sha256, sha1, sha512) and encodings (hex, base64)
   *
   * @param payload - The raw JSON payload (should be JSON.stringify of the body)
   * @param signature - The signature from the webhook header
   * @param secret - The webhook secret key
   * @param algorithm - HMAC algorithm to use (default: 'sha256')
   * @param encoding - Encoding format for the signature (default: 'hex')
   * @returns true if signature is valid, false otherwise
   */
  validateSignature(
    payload: string | object,
    signature: string,
    secret: string,
    algorithm: 'sha256' | 'sha1' | 'sha512' = 'sha256',
    encoding: 'hex' | 'base64' = 'hex',
  ): boolean {
    this.logger.log(`=== SIGNATURE SERVICE - Starting validation ===`);
    this.logger.log(`Algorithm: ${algorithm}, Encoding: ${encoding}`);
    this.logger.log(`Payload type: ${typeof payload}`);
    this.logger.log(`Signature length: ${signature.length}`);
    this.logger.log(`Secret key length: ${secret.length}`);
    this.logger.debug(`Signature preview: ${signature.substring(0, 20)}...`);

    try {
      // Convert payload to JSON string if it's an object
      // Always verify against the raw JSON payload
      const payloadString =
        typeof payload === 'string' ? payload : JSON.stringify(payload);

      this.logger.log(`Payload string length: ${payloadString.length}`);
      this.logger.debug(`Payload preview: ${payloadString.substring(0, 100)}...`);

      // Create HMAC signature with specified algorithm and encoding
      this.logger.log(`Creating HMAC ${algorithm.toUpperCase()} signature with ${encoding} encoding...`);
      const expectedSignature = crypto
        .createHmac(algorithm, secret)
        .update(payloadString)
        .digest(encoding);

      this.logger.log(`Expected signature length: ${expectedSignature.length}`);
      this.logger.debug(`Expected signature preview: ${expectedSignature.substring(0, 20)}...`);
      this.logger.debug(`Received signature preview: ${signature.substring(0, 20)}...`);

      // Use timing-safe comparison to prevent timing attacks
      // Never use === or == to compare signatures
      this.logger.log(`Performing timing-safe comparison...`);
      
      // Ensure both signatures are the same length for comparison
      if (signature.length !== expectedSignature.length) {
        this.logger.warn(
          `Signature length mismatch - Expected: ${expectedSignature.length}, Received: ${signature.length}`,
        );
        return false;
      }

      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );

      if (isValid) {
        this.logger.log(`Signature validation: SUCCESS`);
      } else {
        this.logger.warn(`Signature validation: FAILED`);
        this.logger.warn(`Signatures do not match`);
        this.logger.debug(`Expected: ${expectedSignature}`);
        this.logger.debug(`Received: ${signature}`);
      }

      this.logger.log(`=== SIGNATURE SERVICE - Validation complete ===`);
      return isValid;
    } catch (error) {
      this.logger.error(`Error during signature validation: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      return false;
    }
  }
}

