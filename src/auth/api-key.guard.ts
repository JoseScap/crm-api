import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private cacheService: CacheService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    const userApiKey = this.cacheService.getUserApiKey(apiKey);

    if (!userApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (!userApiKey.is_active) {
      throw new UnauthorizedException('API key is not active');
    }

    // Attach the API key info to the request for later use
    request.userApiKey = userApiKey;

    return true;
  }
}

