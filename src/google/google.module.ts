import { Module } from '@nestjs/common';
import { GoogleService } from './google.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [GoogleService],
  exports: [GoogleService],
})
export class GoogleModule {}

