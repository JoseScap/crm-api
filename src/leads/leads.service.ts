import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SupabaseService } from '../supabase/supabase.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { TablesInsert } from '../supabase/supabase.schema';

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

  async testAiAgent() {
    try {
      const baseUrl = this.configService.get<string>('AI_AGENT_BASE_URL');
      
      if (!baseUrl) {
        this.logger.error('AI_AGENT_BASE_URL environment variable is not set');
        return {
          status: 'error',
          message: 'AI_AGENT_BASE_URL environment variable is not configured',
        };
      }

      this.logger.log(`Testing AI Agent connection to: ${baseUrl}`);

      // Dummy body for testing
      const dummyBody = {
        test: true,
        message: 'This is a test request to verify API connection',
        timestamp: new Date().toISOString(),
      };

      this.logger.log(`Sending POST request with body:`, dummyBody);

      const url = baseUrl + "/agent/handle-event";

      const response = await axios.post(url, dummyBody, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 seconds timeout
      });

      this.logger.log(`AI Agent response received - Status: ${response.status}`);
      this.logger.debug(`Response data:`, response.data);

      return {
        status: 'success',
        message: 'AI Agent connection test successful',
        baseUrl,
        response: {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
        },
      };
    } catch (error) {
      this.logger.error('Error testing AI Agent connection:', error);
      
      if (axios.isAxiosError(error)) {
        return {
          status: 'error',
          message: 'Failed to connect to AI Agent',
          baseUrl: this.configService.get<string>('AI_AGENT_BASE_URL'),
          error: {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
          },
        };
      }

      return {
        status: 'error',
        message: 'Unexpected error testing AI Agent connection',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

