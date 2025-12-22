import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { TablesInsert } from '../supabase/supabase.schema';

@Injectable()
export class DealsService {
  private readonly logger = new Logger(DealsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly whatsappService: WhatsappService,
  ) {}

  async handleWebhook(body: any, headers: any, query: any, method: string, url: string, path: string) {
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Method:', method);
    console.log('URL:', url);
    console.log('Path:', path);
    console.log('Query Params:', JSON.stringify(query));
    console.log('Headers:', JSON.stringify(headers));
    console.log('Body:', JSON.stringify(body));
    console.log('Raw Body:', body);
    console.log('=== END WEBHOOK DATA ===');

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

      this.logger.log('Finding input stage for pipeline...');
      // Find stage with is_input = true for this pipeline
      const { data: stage, error: stageError } = await supabase
        .from('pipeline_stages')
        .select('id')
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

      // Check if there's already a closed deal with this phone number
      this.logger.log('Checking if there\'s already a closed deal with this phone number...');
      if (phoneNumber) {
        this.logger.log('Searching for existing closed deals...');
        const { data: existingClosedDeal, error: checkError } = await supabase
          .from('pipeline_stage_deals')
          .select('id, closed_at')
          .eq('phone_number', phoneNumber)
          .not('closed_at', 'is', null)
          .maybeSingle();

        this.logger.log('Checking for existing closed deals...', existingClosedDeal);

        if (checkError) {
          this.logger.error('Error checking for existing closed deal', checkError);
          return {
            status: 'error',
            message: 'Error checking for existing deals',
            error: checkError?.message,
            timestamp: new Date().toISOString(),
          };
        }

        this.logger.log('Checking if existing closed deal exists...', existingClosedDeal);

        if (existingClosedDeal) {
          this.logger.log(`Closed deal already exists for phone number: ${phoneNumber}`);
          return {
            status: 'skipped',
            message: 'Closed deal already exists for this phone number',
            existing_deal_id: existingClosedDeal.id,
            timestamp: new Date().toISOString(),
          };
        }
      }

      this.logger.log('Creating deal...');
      // Create deal
      const dealData: TablesInsert<'pipeline_stage_deals'> = {
        customer_name: customerName,
        phone_number: phoneNumber,
        email: email,
        pipeline_stage_id: stage.id,
        value: 0,
        whatsapp_conversation_id: whatsappConversationId,
      };

      this.logger.log('Inserting deal...', dealData);

      const { data: deal, error: dealError } = await supabase
        .from('pipeline_stage_deals')
        .insert(dealData)
        .select()
        .single();

      if (dealError || !deal) {
        this.logger.error('Error creating deal', dealError);
        return {
          status: 'error',
          message: 'Failed to create deal',
          error: dealError?.message,
          timestamp: new Date().toISOString(),
        };
      }

      this.logger.log(`Deal created successfully: ${deal.id}`);
      return {
        status: 'success',
        message: 'Webhook processed and deal created',
        deal_id: deal.id,
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
    options?: {
      phoneNumber?: string;
      limit?: number;
      before?: string;
      after?: string;
    },
  ) {
    try {
      const limit = options?.limit || 20;
      const logMessage = `Fetching messages for phone_number_id: ${phoneNumberId}${options?.phoneNumber ? `, filtered by phone_number: ${options.phoneNumber}` : ''}, limit: ${limit}`;
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
}

