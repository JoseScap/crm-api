import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}

