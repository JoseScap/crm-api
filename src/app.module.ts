import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { DealsModule } from './deals/deals.module';

@Module({
  imports: [SupabaseModule, DealsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
