import { Controller, Post, Body } from '@nestjs/common';
import { EventsService } from './events.service';
import type { EventBody } from './events.types';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('webhook')
  async handleEvent(@Body() body: EventBody) {
    return this.eventsService.handleEvent(body);
  }
}

