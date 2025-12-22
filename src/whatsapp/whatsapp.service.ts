import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsAppClient } from '@kapso/whatsapp-cloud-api';

@Injectable()
export class WhatsappService {
  private client: WhatsAppClient;

  constructor(private configService: ConfigService) {
    const baseUrl = this.configService.get<string>('KAPSO_BASE_URL');
    const kapsoApiKey = this.configService.get<string>('KAPSO_API_KEY');

    if (!kapsoApiKey || !baseUrl) {
      throw new Error('Missing KAPSO_API_KEY environment variable');
    }

    this.client = new WhatsAppClient({
      baseUrl,
      kapsoApiKey,
    });
  }

  getClient(): WhatsAppClient {
    return this.client;
  }
}

