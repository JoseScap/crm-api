import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Tables } from '../supabase/supabase.schema';
import { ChatMessage } from './webhooks.types';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class OutgoingWebhooksService {
  private readonly logger = new Logger(OutgoingWebhooksService.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  async executeStageWebhook(
    stage: Tables<'pipeline_stages'>,
    data: {
      lead: Tables<'pipeline_stage_leads'>;
      business: Tables<'businesses'>;
      pipeline: Tables<'pipelines'>;
      previousStages: Tables<'pipeline_stages'>[];
      nextStages: Tables<'pipeline_stages'>[];
      assignedBusinessEmployee: Tables<'business_employees'>;
    },
  ): Promise<void> {
    if (!stage.webhook_url) {
      this.logger.warn(
        `No webhook_url configured for stage ${stage.id}, skipping webhook call`,
      );
      return;
    }

    const webhookUrl = stage.webhook_url;
    this.logger.log(`Sending webhook data to: ${webhookUrl}`);

    // Get last 10 messages if lead has whatsapp_conversation_id
    let messages: ChatMessage[] = [];
    if (data.lead.whatsapp_conversation_id && data.lead.phone_number && data.pipeline.whatsapp_phone_number_id) {
      try {
        this.logger.log(
          `Fetching last 10 messages for conversation ${data.lead.whatsapp_conversation_id}`,
        );

        const messagesResponse = await this.whatsappService.getMessages(
          data.pipeline.whatsapp_phone_number_id,
          {
            phoneNumber: data.lead.phone_number,
            conversationId: data.lead.whatsapp_conversation_id,
            limit: 10,
          },
        );

        const rawMessages = messagesResponse?.data || [];
        this.logger.log(`Retrieved ${rawMessages.length} messages from WhatsApp`);

        // Transform messages to ChatMessage format
        messages = rawMessages
          .map((msg: any) => {
            // Determine message type based on from/to fields
            // If message.from matches phone_number, it's from customer
            // Otherwise, it's from salesperson
            const isFromCustomer =
              msg.from === data.lead.phone_number ||
              msg.from?.includes(data.lead.phone_number);
            const messageType: 'customer' | 'salesperson' = isFromCustomer
              ? 'customer'
              : 'salesperson';

            // Extract message text (could be in different fields depending on API)
            const messageText =
              msg.text?.body || msg.body || msg.message || JSON.stringify(msg);

            return {
              type: messageType,
              message: messageText,
            };
          })
          .filter((msg: ChatMessage) => msg.message); // Filter out empty messages

        this.logger.log(
          `Prepared ${messages.length} chat messages for webhook`,
        );
      } catch (error) {
        this.logger.error(
          `Error fetching messages for conversation ${data.lead.whatsapp_conversation_id}:`,
          error,
        );
        // Continue with empty messages array
      }
    } else {
      this.logger.debug(
        `Lead ${data.lead.id} has no whatsapp_conversation_id or phone_number, sending empty messages array`,
      );
    }

    const requestBody = {
      lead: data.lead,
      business: data.business,
      stage: stage,
      pipeline: data.pipeline,
      previousStages: data.previousStages,
      nextStages: data.nextStages,
      assignedBusinessEmployee: data.assignedBusinessEmployee,
      messages: messages,
    };

    this.logger.log('Webhook payload:', JSON.stringify(requestBody, null, 2));
    this.logger.log('Webhook URL:', webhookUrl);

    try {
      await axios.post(webhookUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 seconds timeout
      });

      this.logger.log(`Webhook data sent successfully to ${webhookUrl}`);
    } catch (error) {
      this.logger.error(`Error sending webhook data to ${webhookUrl}:`, error);
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `Webhook response error: Status ${error.response?.status}, Data: ${JSON.stringify(error.response?.data)}`,
        );
      }
      // Don't throw, just log the error
    }
  }
}

