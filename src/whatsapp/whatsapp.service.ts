import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { WHATSAPP_MESSAGING_PRODUCT } from './whatsapp.constants';
import { MessageType, RecipientType, SendMessagePayload, TextMessageContent } from './whatsapp.types';
import { validateMessageType, validateRecipientType } from './whatsapp.helpers';

@Injectable()
export class WhatsappService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly axiosInstance: AxiosInstance;

  constructor(private configService: ConfigService) {
    const baseUrl = this.configService.get<string>('KAPSO_BASE_URL');
    const kapsoApiKey = this.configService.get<string>('KAPSO_API_KEY');

    if (!kapsoApiKey || !baseUrl) {
      throw new Error('Missing KAPSO_API_KEY or KAPSO_BASE_URL environment variable');
    }

    this.baseUrl = baseUrl;
    this.apiKey = kapsoApiKey;

    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      headers: {
        'X-API-Key': this.apiKey,
      },
    });
  }

  async getMessages(
    phoneNumberId: string,
    options?: {
      phoneNumber?: string;
      limit?: number;
      before?: string;
      after?: string;
    },
  ) {
    const params = new URLSearchParams();
    
    if (options?.phoneNumber) {
      params.append('phone_number', options.phoneNumber);
    }
    
    if (options?.limit !== undefined) {
      // Validate limit range: 1 <= x <= 100
      const limit = Math.max(1, Math.min(100, options.limit));
      params.append('limit', limit.toString());
    } else {
      params.append('limit', '20');
    }
    
    if (options?.before) {
      params.append('before', options.before);
    }
    
    if (options?.after) {
      params.append('after', options.after);
    }
    
    const queryString = params.toString();
    const url = `/v24.0/${phoneNumberId}/messages${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.axiosInstance.get(url);
    return response.data;
  }

  async sendMessage(
    phoneNumberId: string,
    to: string,
    text: TextMessageContent,
    recipientType: RecipientType = RecipientType.INDIVIDUAL,
    type: MessageType = MessageType.TEXT,
  ) {
    // Validate that only supported types are used
    validateMessageType(type);
    validateRecipientType(recipientType);

    const payload: SendMessagePayload = {
      messaging_product: WHATSAPP_MESSAGING_PRODUCT,
      recipient_type: recipientType,
      to,
      type,
      text,
    };

    const response = await this.axiosInstance.post(
      `/v24.0/${phoneNumberId}/messages`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  }
}

