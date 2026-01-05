import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SupabaseService } from '../supabase/supabase.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { TablesInsert } from '../supabase/supabase.schema';
import { HandleEventDto, ChatMessage } from './leads.types';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly whatsappService: WhatsappService,
    private readonly configService: ConfigService,
  ) {}

  async handleWebhook(body: any, headers: any, query: any, method: string, url: string, path: string) {
    try {
      this.logger.log('Processing webhook...');

      // Extract data from WhatsApp webhook body
      const phoneNumberId = body.phone_number_id;
      const conversation = body.conversation;
      const customerName = conversation?.contact_name || 'Unknown';
      const phoneNumber = conversation?.phone_number || null;
      const email = conversation?.email || null;
      const whatsappConversationId = conversation?.id || null;

      if (!phoneNumberId) {
        this.logger.warn('Missing phone_number_id in webhook body');
        return {
          status: 'error',
          message: 'Missing phone_number_id',
          timestamp: new Date().toISOString(),
        };
      }

      this.logger.log('Finding pipeline with whatsapp enabled...');

      // Find pipeline with whatsapp enabled
      const supabase = this.supabaseService.getClient();
      const { data: pipeline, error: pipelineError } = await supabase
        .from('pipelines')
        .select('id')
        .eq('whatsapp_is_enabled', true)
        .eq('whatsapp_phone_number_id', phoneNumberId)
        .single();

      if (pipelineError || !pipeline) {
        this.logger.warn(`Pipeline not found for phone_number_id: ${phoneNumberId}`, pipelineError);
        return {
          status: 'error',
          message: 'Pipeline not found or WhatsApp not enabled',
          timestamp: new Date().toISOString(),
        };
      }
      
      this.logger.log('Pipeline found:', pipeline);

      this.logger.log('Finding input stage for pipeline...');
      // Find stage with is_input = true for this pipeline
      const { data: stage, error: stageError } = await supabase
        .from('pipeline_stages')
        .select('id, business_id')
        .eq('pipeline_id', pipeline.id)
        .eq('is_input', true)
        .single();

      if (stageError || !stage) {
        this.logger.warn(`Input stage not found for pipeline: ${pipeline.id}`, stageError);
        return {
          status: 'error',
          message: 'Input stage not found for pipeline',
          timestamp: new Date().toISOString(),
        };
      } 
      
      this.logger.log('Input stage found:', stage);

      // Check if there's already a closed lead with this phone number
      this.logger.log('Searching for opened leads...');

      const { count, error: checkError } = await supabase
        .from('pipeline_stage_leads')
        .select('*', { count: 'exact', head: true })
        .eq('phone_number', phoneNumber)
        .is('closed_at', null);

      this.logger.log('Checking for existing opened leads...', { count });

      if (checkError) {
        this.logger.error('Error checking for existing opened lead', checkError);
        return {
          status: 'error',
          message: 'Error checking for existing leads',
          error: checkError?.message,
          timestamp: new Date().toISOString(),
        };
      }

      if (count && count > 0) {
        this.logger.log(`Existing opened lead found. Count: ${count}`);
        return {
          status: 'skipped',
          message: 'Opened lead already exists for this phone number',
          count,
          timestamp: new Date().toISOString(),
        };
      }

      this.logger.log('Creating new lead...');
      // Create new lead
      const leadData: TablesInsert<'pipeline_stage_leads'> = {
        customer_name: customerName,
        phone_number: phoneNumber,
        email: email,
        pipeline_stage_id: stage.id,
        value: 0,
        whatsapp_conversation_id: whatsappConversationId,
        business_id: stage.business_id,
      };

      this.logger.log('Inserting new lead...', leadData);

      const { data: lead, error: leadError } = await supabase
        .from('pipeline_stage_leads')
        .insert(leadData)
        .select()
        .single();

      if (leadError || !lead) {
        this.logger.error('Error creating lead', leadError);
        return {
          status: 'error',
          message: 'Failed to create lead',
          error: leadError?.message,
          timestamp: new Date().toISOString(),
        };
      }

      this.logger.log(`Lead created successfully: ${lead.id}`);

      // Get last 10 messages from the chat and send to AI Agent
      try {
        await this.sendChatContextToAiAgent(
          phoneNumberId,
          phoneNumber,
          whatsappConversationId,
        );
      } catch (aiError) {
        // Log error but don't fail the webhook processing
        this.logger.error(
          `Error sending chat context to AI Agent for lead ${lead.id}:`,
          aiError,
        );
      }

      return {
        status: 'success',
        message: 'Webhook processed and lead created',
        lead_id: lead.id,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Unexpected error processing webhook', error);
      return {
        status: 'error',
        message: 'Unexpected error processing webhook',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getChatMessages(
    phoneNumberId: string,
    options: {
      phoneNumber: string;
      conversationId: string;
      limit: number;
      before?: string;
      after?: string;
    },
  ) {
    try {
      const limit = options?.limit || 20;
      const logMessage = `Fetching messages for phone_number_id: ${phoneNumberId}${options.conversationId ? `, filtered by whatsapp_conversation_id: ${options.conversationId}` : ''}, limit: ${limit}`;
      this.logger.log(logMessage);
      
      // Get messages using Kapso WhatsApp API
      const response = await this.whatsappService.getMessages(phoneNumberId, options);
      
      this.logger.log(`Messages retrieved successfully for phone_number_id: ${phoneNumberId}`);
      
      return {
        status: 'success',
        data: response.data || [],
        paging: response.paging || null,
      };
    } catch (error) {
      this.logger.error(`Error fetching messages for phone_number_id: ${phoneNumberId}`, error);
      return {
        status: 'error',
        message: 'Failed to fetch messages',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendMessage(
    phoneNumberId: string,
    to: string,
    text: string,
    previewUrl?: boolean,
  ) {
    try {
      this.logger.log(`Sending message to ${to} from phone_number_id: ${phoneNumberId}`);
      
      const response = await this.whatsappService.sendMessage(
        phoneNumberId,
        to,
        {
          body: text,
          preview_url: previewUrl,
        },
      );
      
      this.logger.log(`Message sent successfully to ${to}`);
      
      return {
        status: 'success',
        data: response,
      };
    } catch (error) {
      this.logger.error(`Error sending message to ${to}`, error);
      return {
        status: 'error',
        message: 'Failed to send message',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async sendChatContextToAiAgent(
    phoneNumberId: string,
    phoneNumber: string,
    conversationId: string | null,
  ): Promise<void> {
    const baseUrl = this.configService.get<string>('AI_AGENT_BASE_URL');

    if (!baseUrl) {
      this.logger.warn(
        'AI_AGENT_BASE_URL not configured, skipping AI Agent notification',
      );
      return;
    }

    if (!conversationId) {
      this.logger.warn(
        'No conversation ID available, skipping AI Agent notification',
      );
      return;
    }

    this.logger.log(
      `Fetching last 10 messages for conversation ${conversationId}`,
    );

    // Get last 10 messages from WhatsApp
    const messagesResponse = await this.whatsappService.getMessages(
      phoneNumberId,
      {
        phoneNumber,
        conversationId,
        limit: 10,
      },
    );

    const messages = messagesResponse?.data || [];
    this.logger.log(`Retrieved ${messages.length} messages from WhatsApp`);

    // Transform messages to ChatMessage format
    const chatMessages: ChatMessage[] = messages
      .map((msg: any) => {
        // Determine message type based on from/to fields
        // If message.from matches phoneNumber, it's from customer
        // Otherwise, it's from salesperson
        const isFromCustomer =
          msg.from === phoneNumber || msg.from?.includes(phoneNumber);
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

    if (chatMessages.length === 0) {
      this.logger.warn('No valid messages found to send to AI Agent');
      return;
    }

    this.logger.log(
      `Prepared ${chatMessages.length} chat messages for AI Agent`,
    );

    // Prepare request body
    const requestBody: HandleEventDto = {
      messages: chatMessages,
    };

    const url = `${baseUrl}/agent/handle-event`;
    this.logger.log(`Sending chat context to AI Agent: ${url}`);

    // Send to AI Agent
    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds timeout
    });

    this.logger.log(
      `AI Agent response received - Status: ${response.status}`,
    );
    this.logger.debug(`AI Agent response data:`, response.data);

    // Extract the response message from AI Agent
    const aiResponseMessage = response.data?.response;
    
    if (!aiResponseMessage || typeof aiResponseMessage !== 'string') {
      this.logger.warn(
        'AI Agent did not return a valid response message',
        response.data,
      );
      return;
    }

    this.logger.log(
      `AI Agent generated response message (length: ${aiResponseMessage.length})`,
    );

    // Send the AI Agent response via WhatsApp
    try {
      await this.whatsappService.sendMessage(
        phoneNumberId,
        phoneNumber,
        {
          body: aiResponseMessage,
          preview_url: false,
        },
      );

      this.logger.log(
        `Successfully sent AI Agent response to ${phoneNumber} via WhatsApp`,
      );
    } catch (whatsappError) {
      this.logger.error(
        `Error sending AI Agent response via WhatsApp:`,
        whatsappError,
      );
      // Don't throw, just log the error
    }
  }
}

