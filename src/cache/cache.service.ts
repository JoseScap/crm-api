import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Database } from '../supabase/supabase.schema';

type UserApiKey = Database['public']['Tables']['user_api_keys']['Row'];

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private userApiKeysByUserId: Map<string, UserApiKey[]> = new Map();

  constructor(private supabaseService: SupabaseService) {}

  async onModuleInit() {
    await this.loadUserApiKeys();
  }

  private async loadUserApiKeys() {
    try {
      this.logger.log('Loading user API keys from Supabase...');
      const client = this.supabaseService.getClient();
      const { data, error } = await client.from('user_api_keys').select('*');

      if (error) {
        this.logger.error('Error loading user API keys:', error);
        throw error;
      }

      // Clear existing cache
      this.userApiKeysByUserId.clear();

      // Populate cache grouped by user_id
      if (data) {
        for (const apiKey of data) {
          if (!this.userApiKeysByUserId.has(apiKey.user_id)) {
            this.userApiKeysByUserId.set(apiKey.user_id, []);
          }
          this.userApiKeysByUserId.get(apiKey.user_id)?.push(apiKey);
        }
        this.logger.log(
          `Loaded ${data.length} user API keys into cache (${this.userApiKeysByUserId.size} users)`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to load user API keys:', error);
      throw error;
    }
  }

  getUserApiKey(key: string): UserApiKey | undefined {
    // Search through all user arrays to find the key
    for (const apiKeys of this.userApiKeysByUserId.values()) {
      const found = apiKeys.find((apiKey) => apiKey.key === key);
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  getUserApiKeysByUserId(userId: string): UserApiKey[] {
    return this.userApiKeysByUserId.get(userId) || [];
  }

  getAllUserApiKeys(): UserApiKey[] {
    // Flatten all arrays into a single array
    return Array.from(this.userApiKeysByUserId.values()).flat();
  }

  async refreshUserApiKeys() {
    await this.loadUserApiKeys();
  }
}

