import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { OutgoingWebhooksService } from '../webhooks/outgoing-webhooks.service';
import { TablesInsert, Tables } from '../supabase/supabase.schema';
import { WhatsappWebhookRequest } from './leads.types';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly whatsappService: WhatsappService,
    private readonly outgoingWebhooksService: OutgoingWebhooksService,
  ) {}

  async handleWhatsappWebhook(request: WhatsappWebhookRequest) {
    try {
      this.logger.log('Processing webhook...');

      // Extract and validate conversation info
      const conversationInfo = this.extractConversationInfo(request.body);
      if (!conversationInfo) {
        return {
          status: 'error',
          message: 'Missing phone_number_id',
          timestamp: new Date().toISOString(),
        };
      }

      // Find pipeline configuration
      const pipeline = await this.findPipeline(conversationInfo.phoneNumberId);
      if (!pipeline) {
        return {
          status: 'error',
          message: 'Pipeline not found or WhatsApp not enabled',
          timestamp: new Date().toISOString(),
        };
      }

      // Fetch business and stage in parallel (both depend on pipeline)
      const [business, stage] = await Promise.all([
        this.findBusiness(pipeline.business_id),
        this.findInputStage(pipeline.id),
      ]);

      if (!business) {
        return {
          status: 'error',
          message: 'Business not found',
          timestamp: new Date().toISOString(),
        };
      }

      if (!stage) {
        return {
          status: 'error',
          message: 'Input stage not found for pipeline',
          timestamp: new Date().toISOString(),
        };
      }

      // Get or create lead
      const { leadId, isNewLead, existingCount, lead } = await this.getOrCreateLead(
        conversationInfo,
        stage,
      );

      // Get related stages (previous and next)
      const { previousStages, nextStages } = await this.getRelatedStages(
        pipeline.id,
        stage.position,
      );

      // Send webhook data if webhook_url is configured (fire and forget)
      this.outgoingWebhooksService
        .executeStageWebhook(stage, {
          lead,
          business,
          pipeline,
          previousStages,
          nextStages,
        })
        .catch((webhookError) => {
          this.logger.error(
            `Error sending webhook data for lead ${leadId}:`,
            webhookError,
          );
        });

      // Return response
      return {
        status: isNewLead ? 'success' : 'skipped',
        message: isNewLead
          ? 'Webhook processed and lead created'
          : 'Opened lead already exists for this phone number',
        lead_id: leadId,
        ...(existingCount && { count: existingCount }),
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

  private extractConversationInfo(body: any) {
    const phoneNumberId = body.phone_number_id;
    if (!phoneNumberId) {
      this.logger.warn('Missing phone_number_id in webhook body');
      return null;
    }

    return {
      phoneNumberId,
      customerName: body.conversation?.contact_name || 'Unknown',
      phoneNumber: body.conversation?.phone_number || null,
      email: body.conversation?.email || null,
      whatsappConversationId: body.conversation?.id || null,
    };
  }

  private async findPipeline(phoneNumberId: string) {
    this.logger.log('Finding pipeline with whatsapp enabled...');
    const supabase = this.supabaseService.getClient();

    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('*')
      .eq('whatsapp_is_enabled', true)
      .eq('whatsapp_phone_number_id', phoneNumberId)
      .single();

    if (pipelineError || !pipeline) {
      this.logger.warn(
        `Pipeline not found for phone_number_id: ${phoneNumberId}`,
        pipelineError,
      );
      return null;
    }

    this.logger.log('Pipeline found:', pipeline);
    return pipeline;
  }

  private async findBusiness(businessId: number) {
    this.logger.log('Finding business...');
    const supabase = this.supabaseService.getClient();

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      this.logger.warn(`Business not found for id: ${businessId}`, businessError);
      return null;
    }

    this.logger.log('Business found:', business);
    return business;
  }

  private async findInputStage(pipelineId: number) {
    this.logger.log('Finding input stage for pipeline...');
    const supabase = this.supabaseService.getClient();

    const { data: stage, error: stageError } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .eq('is_input', true)
      .single();

    if (stageError || !stage) {
      this.logger.warn(
        `Input stage not found for pipeline: ${pipelineId}`,
        stageError,
      );
      return null;
    }

    this.logger.log('Input stage found:', stage);
    return stage;
  }

  private async getOrCreateLead(
    conversationInfo: {
      customerName: string;
      phoneNumber: string | null;
      email: string | null;
      whatsappConversationId: string | null;
    },
    stage: { id: number; business_id: number },
  ): Promise<{ leadId: number; isNewLead: boolean; existingCount?: number; lead: any }> {
    const supabase = this.supabaseService.getClient();

    if (!conversationInfo.phoneNumber) {
      throw new Error('Phone number is required to get or create lead');
    }

    // Check for existing opened leads
    this.logger.log('Searching for opened leads...');
    const { count, error: checkError } = await supabase
      .from('pipeline_stage_leads')
      .select('*', { count: 'exact', head: true })
      .eq('phone_number', conversationInfo.phoneNumber)
      .is('closed_at', null);

    if (checkError) {
      this.logger.error('Error checking for existing opened lead', checkError);
      throw new Error(`Error checking for existing leads: ${checkError.message}`);
    }

    this.logger.log('Checking for existing opened leads...', { count });

    // If lead exists, get its complete data
    if (count && count > 0) {
      this.logger.log(`Existing opened lead found. Count: ${count}`);
      const { data: existingLead } = await supabase
        .from('pipeline_stage_leads')
        .select('*')
        .eq('phone_number', conversationInfo.phoneNumber)
        .is('closed_at', null)
        .limit(1)
        .single();

      return {
        leadId: existingLead?.id || 0,
        isNewLead: false,
        existingCount: count,
        lead: existingLead,
      };
    }

    // Create new lead
    this.logger.log('Creating new lead...');
    const leadData: TablesInsert<'pipeline_stage_leads'> = {
      customer_name: conversationInfo.customerName,
      phone_number: conversationInfo.phoneNumber,
      email: conversationInfo.email,
      pipeline_stage_id: stage.id,
      value: 0,
      whatsapp_conversation_id: conversationInfo.whatsappConversationId,
      business_id: stage.business_id,
    };

    this.logger.log('Inserting new lead...', leadData);

    const { data: lead, error: leadError } = await supabase
      .from('pipeline_stage_leads')
      .insert(leadData)
      .select('*')
      .single();

    if (leadError || !lead) {
      this.logger.error('Error creating lead', leadError);
      throw new Error(
        `Failed to create lead: ${leadError?.message || 'Unknown error'}`,
      );
    }

    this.logger.log(`Lead created successfully: ${lead.id}`);
    return {
      leadId: lead.id,
      isNewLead: true,
      lead: lead,
    };
  }

  private async getRelatedStages(
    pipelineId: number,
    currentPosition: number,
  ): Promise<{
    previousStages: Tables<'pipeline_stages'>[];
    nextStages: Tables<'pipeline_stages'>[];
  }> {
    this.logger.log(
      `Getting related stages for pipeline ${pipelineId} with position ${currentPosition}`,
    );
    const supabase = this.supabaseService.getClient();

    // Get previous and next stages in parallel
    const [previousResult, nextResult] = await Promise.all([
      // Previous stages: position < currentPosition
      supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .lt('position', currentPosition)
        .order('position', { ascending: false }),
      // Next stages: position > currentPosition
      supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .gt('position', currentPosition)
        .order('position', { ascending: true }),
    ]);

    const previousStages = previousResult.data || [];
    const nextStages = nextResult.data || [];

    if (previousResult.error) {
      this.logger.warn(
        `Error fetching previous stages: ${previousResult.error.message}`,
      );
    }
    if (nextResult.error) {
      this.logger.warn(`Error fetching next stages: ${nextResult.error.message}`);
    }

    this.logger.log(
      `Found ${previousStages.length} previous stages and ${nextStages.length} next stages`,
    );

    return {
      previousStages,
      nextStages,
    };
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

}

