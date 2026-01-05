import { Injectable, Logger } from '@nestjs/common';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { SupabaseService } from '../supabase/supabase.service';
import {
  ReplyWhatsappMessageDto,
  ReplyWhatsappMessageResponse,
  LeadWithPipeline,
} from './webhooks.types';

@Injectable()
export class IncomingWebhooksService {
  private readonly logger = new Logger(IncomingWebhooksService.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async replyWhatsappMessage(
    dto: ReplyWhatsappMessageDto,
  ): Promise<ReplyWhatsappMessageResponse> {
    try {
      // Validate input
      const validationError = this.validateReplyRequest(dto);
      if (validationError) {
        return validationError;
      }

      this.logger.log(
        `Processing WhatsApp reply request for lead ${dto.leadId} (message length: ${dto.text.length})`,
      );

      // Get lead with pipeline information
      const leadResult = await this.getLeadWithPipeline(dto.leadId);
      if (leadResult.error) {
        return leadResult.error;
      }

      const { phoneNumberId, phoneNumber } = leadResult.data!;

      // Send WhatsApp message
      return await this.sendWhatsappMessage(phoneNumberId, phoneNumber, dto.text);
    } catch (error) {
      this.logger.error('Error processing WhatsApp reply request:', error);
      return {
        status: 'error',
        message: 'Failed to process WhatsApp reply request',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private validateReplyRequest(
    dto: ReplyWhatsappMessageDto,
  ): ReplyWhatsappMessageResponse | null {
    if (!dto.text || typeof dto.text !== 'string') {
      this.logger.warn(
        'Invalid message text format - missing or invalid text field',
        dto,
      );
      return {
        status: 'error',
        message: 'Invalid text format',
      };
    }

    if (!dto.leadId || typeof dto.leadId !== 'number') {
      this.logger.warn('Invalid leadId format', dto);
      return {
        status: 'error',
        message: 'Invalid leadId format',
      };
    }

    return null;
  }

  private async getLeadWithPipeline(leadId: number): Promise<{
    data?: { phoneNumberId: string; phoneNumber: string };
    error?: ReplyWhatsappMessageResponse;
  }> {
    try {
      const { data: lead, error: leadError } = await this.supabaseService
        .getClient()
        .from('pipeline_stage_leads')
        .select('phone_number, pipeline_stages(pipelines(whatsapp_phone_number_id))')
        .eq('id', leadId)
        .single();

      if (leadError) {
        this.logger.error('Error getting lead:', leadError);
        return {
          error: {
            status: 'error',
            message: 'Error getting lead',
            error: leadError.message,
          },
        };
      }

      if (!lead) {
        this.logger.warn(`Lead ${leadId} not found`);
        return {
          error: {
            status: 'error',
            message: 'Lead not found',
          },
        };
      }

      const typedLead = lead as unknown as LeadWithPipeline;

      if (
        !typedLead?.pipeline_stages?.pipelines?.whatsapp_phone_number_id ||
        !typedLead?.phone_number
      ) {
        this.logger.error(
          'Missing phoneNumberId or phoneNumber in lead',
          typedLead,
        );
        return {
          error: {
            status: 'error',
            message: 'Missing phoneNumberId or phoneNumber in lead',
          },
        };
      }

      return {
        data: {
          phoneNumberId:
            typedLead.pipeline_stages.pipelines.whatsapp_phone_number_id,
          phoneNumber: typedLead.phone_number,
        },
      };
    } catch (error) {
      this.logger.error(`Error fetching lead ${leadId}:`, error);
      return {
        error: {
          status: 'error',
          message: 'Failed to fetch lead information',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  private async sendWhatsappMessage(
    phoneNumberId: string,
    phoneNumber: string,
    text: string,
  ): Promise<ReplyWhatsappMessageResponse> {
    try {
      this.logger.log(
        `Sending WhatsApp message to ${phoneNumber} from phone_number_id: ${phoneNumberId}`,
      );

      await this.whatsappService.sendMessage(phoneNumberId, phoneNumber, {
        body: text,
        preview_url: false,
      });

      this.logger.log(
        `Successfully sent WhatsApp message to ${phoneNumber}`,
      );

      return {
        status: 'success',
        message: 'WhatsApp message sent successfully',
      };
    } catch (whatsappError) {
      this.logger.error(`Error sending WhatsApp message:`, whatsappError);
      return {
        status: 'error',
        message: 'Failed to send message via WhatsApp',
        error:
          whatsappError instanceof Error
            ? whatsappError.message
            : 'Unknown error',
      };
    }
  }
}

