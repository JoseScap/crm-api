import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [WhatsappModule, CacheModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}

