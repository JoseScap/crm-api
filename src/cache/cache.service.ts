import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { Database } from '../supabase/supabase.schema';

type UserApiKey = Database['public']['Tables']['user_api_keys']['Row'];

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private userApiKeysCache: Map<string, UserApiKey> = new Map();

  constructor(private supabaseService: SupabaseService) {}

  async onModuleInit() {
    await this.loadUserApiKeys();
  }

  private async loadUserApiKeys() {
    try {
      this.logger.log('Loading user API keys from Supabase...');
      const client = this.supabaseService.getClient();
      const { data, error } = await client.from('user_api_keys').select('*');

      const userDictionary = {}

      if (error) {
        this.logger.error('Error loading user API keys:', error);
        throw error;
      }

      // Clear existing cache
      this.userApiKeysCache.clear();

      // Populate cache by key for O(1) lookup
      if (data) {
        for (const apiKey of data) {
          this.userApiKeysCache.set(apiKey.key, apiKey);
          userDictionary[apiKey.user_id] = apiKey;
        }
        this.logger.log(`Loaded ${data.length} user API keys into cache`);
        this.logger.log(`Loaded keys for ${Object.keys(userDictionary).length} users`);
      }
    } catch (error) {
      this.logger.error('Failed to load user API keys:', error);
      throw error;
    }
  }

  getUserApiKey(key: string): UserApiKey | undefined {
    return this.userApiKeysCache.get(key);
  }

  getUserApiKeysByUserId(userId: string): UserApiKey[] {
    // Filter all keys by user_id
    return Array.from(this.userApiKeysCache.values()).filter(
      (apiKey) => apiKey.user_id === userId,
    );
  }

  getAllUserApiKeys(): UserApiKey[] {
    return Array.from(this.userApiKeysCache.values());
  }

  async refreshUserApiKeys() {
    await this.loadUserApiKeys();
  }
}

