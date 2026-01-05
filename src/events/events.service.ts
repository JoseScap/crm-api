import { Injectable, Logger } from '@nestjs/common';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { EventBody, EventResponse } from './events.types';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async handleEvent(body: EventBody): Promise<EventResponse> {
    try {
      const { response: responseMessage, leadId } = body;

      const { data: lead, error: leadError } = await this.supabaseService.getClient()
        .from('pipeline_stage_leads')
        .select('phone_number, pipeline_stages(pipelines(whatsapp_phone_number_id))')
        .eq('id', Number(leadId))
        .single()

      if (lead?.pipeline_stages?.pipelines?.whatsapp_phone_number_id && lead?.phone_number) {
        this.logger.error('Missing phoneNumberId or phoneNumber in lead', lead);
        return {
          status: 'error',
          message: 'Missing phoneNumberId or phoneNumber in lead',
        };
      }

      if (leadError) {
        this.logger.error('Error getting lead:', leadError);
        return {
          status: 'error',
          message: 'Error getting lead',
        };
      }

      if (!responseMessage || typeof responseMessage !== 'string') {
        this.logger.warn(
          'Invalid AI Agent response format - missing or invalid response field',
          body,
        );
        return {
          status: 'error',
          message: 'Invalid response format',
        };
      }

      if (!lead) {
        this.logger.warn(
          'Missing lead in request body',
          body,
        );
        return {
          status: 'error',
          message: 'Missing phoneNumberId or phoneNumber',
        };
      }

      this.logger.log(
        `Received AI Agent response (length: ${responseMessage.length}) for phoneNumber: ${lead?.phone_number}`,
      );

      // Send the AI Agent response via WhatsApp
      try {
        await this.whatsappService.sendMessage(
          lead?.pipeline_stages?.pipelines?.whatsapp_phone_number_id ?? '',
          lead?.phone_number ?? '',
          {
            body: responseMessage,
            preview_url: false,
          },
        );

        this.logger.log(
          `Successfully sent AI Agent response to ${lead?.phone_number} via WhatsApp`,
        );

        return {
          status: 'success',
          message: 'AI Agent response sent via WhatsApp',
        };
      } catch (whatsappError) {
        this.logger.error(
          `Error sending AI Agent response via WhatsApp:`,
          whatsappError,
        );
        return {
          status: 'error',
          message: 'Failed to send message via WhatsApp',
          error:
            whatsappError instanceof Error
              ? whatsappError.message
              : 'Unknown error',
        };
      }
    } catch (error) {
      this.logger.error('Error handling AI Agent response:', error);
      return {
        status: 'error',
        message: 'Failed to process AI Agent response',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

