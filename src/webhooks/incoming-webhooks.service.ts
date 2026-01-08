import { Injectable, Logger } from '@nestjs/common';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { SupabaseService } from '../supabase/supabase.service';
import { GoogleService } from '../google/google.service';
import {
  ReplyWhatsappMessageDto,
  ReplyWhatsappMessageResponse,
  LeadWithPipeline,
  ChangeLeadStageDto,
  ChangeLeadStageResponse,
  CheckAvailabilityForMeetingDto,
  CheckAvailabilityForMeetingResponse,
  BookMeetingDto,
  BookMeetingResponse,
} from './webhooks.types';
import { Tables } from '../supabase/supabase.schema';

@Injectable()
export class IncomingWebhooksService {
  private readonly logger = new Logger(IncomingWebhooksService.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly supabaseService: SupabaseService,
    private readonly googleService: GoogleService,
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

  async changeLeadStage(
    dto: ChangeLeadStageDto,
  ): Promise<ChangeLeadStageResponse> {
    try {
      // Validate input
      if (!dto.leadId || typeof dto.leadId !== 'number') {
        this.logger.warn('Invalid leadId format', dto);
        return {
          status: 'error',
          message: 'Invalid leadId format',
        };
      }

      if (!dto.newPipelineStageId || typeof dto.newPipelineStageId !== 'number') {
        this.logger.warn('Invalid newPipelineStageId format', dto);
        return {
          status: 'error',
          message: 'Invalid newPipelineStageId format',
        };
      }

      this.logger.log(
        `Changing stage for lead ${dto.leadId} to stage ${dto.newPipelineStageId}`,
      );

      // Verify lead exists
      const supabase = this.supabaseService.getClient();
      const { data: existingLead, error: leadCheckError } = await supabase
        .from('pipeline_stage_leads')
        .select('id, pipeline_stage_id')
        .eq('id', dto.leadId)
        .single();

      if (leadCheckError || !existingLead) {
        this.logger.warn(`Lead ${dto.leadId} not found`, leadCheckError);
        return {
          status: 'error',
          message: 'Lead not found',
          error: leadCheckError?.message,
        };
      }

      // Verify new stage exists
      const { data: newStage, error: stageCheckError } = await supabase
        .from('pipeline_stages')
        .select('id')
        .eq('id', dto.newPipelineStageId)
        .single();

      if (stageCheckError || !newStage) {
        this.logger.warn(
          `Stage ${dto.newPipelineStageId} not found`,
          stageCheckError,
        );
        return {
          status: 'error',
          message: 'New pipeline stage not found',
          error: stageCheckError?.message,
        };
      }

      // Check if lead is already in the target stage
      if (existingLead.pipeline_stage_id === dto.newPipelineStageId) {
        this.logger.log(
          `Lead ${dto.leadId} is already in stage ${dto.newPipelineStageId}`,
        );
        return {
          status: 'success',
          message: 'Lead is already in the target stage',
        };
      }

      // Update lead stage
      const { data: updatedLead, error: updateError } = await supabase
        .from('pipeline_stage_leads')
        .update({ pipeline_stage_id: dto.newPipelineStageId })
        .eq('id', dto.leadId)
        .select('id, pipeline_stage_id')
        .single();

      if (updateError || !updatedLead) {
        this.logger.error(
          `Error updating lead ${dto.leadId} stage`,
          updateError,
        );
        return {
          status: 'error',
          message: 'Failed to update lead stage',
          error: updateError?.message,
        };
      }

      this.logger.log(
        `Successfully changed lead ${dto.leadId} from stage ${existingLead.pipeline_stage_id} to stage ${dto.newPipelineStageId}`,
      );

      return {
        status: 'success',
        message: 'Lead stage updated successfully',
      };
    } catch (error) {
      this.logger.error('Error changing lead stage:', error);
      return {
        status: 'error',
        message: 'Failed to change lead stage',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async checkAvailabilityForMeeting(
    dto: CheckAvailabilityForMeetingDto,
  ): Promise<CheckAvailabilityForMeetingResponse> {
    try {
      this.logger.log(
        `Checking availability for lead ${dto.leadId} on ${dto.date} with duration ${dto.duration} mins`,
      );

      // 1. Find the lead
      const { data: lead, error: leadError } = await this.supabaseService
        .getClient()
        .from('pipeline_stage_leads')
        .select('business_employee_id, business_id')
        .eq('id', dto.leadId)
        .single();

      if (leadError || !lead) {
        this.logger.warn(`Lead ${dto.leadId} not found`);
        return { isAvailable: false, message: 'Lead not found' };
      }

      // 2. Find the employee's OAuth connection
      const { data: connection, error: connectionError } = await this.supabaseService
        .getClient()
        .from('business_employee_oauth_connections')
        .select('*')
        .eq('business_employee_id', lead.business_employee_id)
        .eq('business_id', lead.business_id)
        .single();

      if (connectionError || !connection) {
        this.logger.warn(
          `OAuth connection not found for employee ${lead.business_employee_id}`,
        );
        return {
          isAvailable: false,
          message: 'Employee does not have a calendar connected',
        };
      }

      // 3. Get valid access token
      const accessToken = await this.googleService.getValidAccessToken(connection);
      if (!accessToken) {
        return {
          isAvailable: false,
          message: 'Failed to authenticate with Google Calendar',
        };
      }

      // 4. Check availability using Google Service
      return await this.googleService.checkAvailability(
        accessToken,
        dto.date,
        dto.duration,
        dto.timezone,
        dto.minWorkingHour,
        dto.maxWorkingHour,
      );
    } catch (error) {
      this.logger.error('Error checking availability:', error);
      return {
        isAvailable: false,
        message: 'Error checking availability',
      };
    }
  }

  async bookMeeting(dto: BookMeetingDto): Promise<BookMeetingResponse> {
    try {
      this.logger.log(
        `Booking meeting for lead ${dto.leadId} on ${dto.date} with duration ${dto.duration} mins`,
      );

      // 1. Find the lead
      const { data: lead, error: leadError } = await this.supabaseService
        .getClient()
        .from('pipeline_stage_leads')
        .select('business_employee_id, business_id, customer_name, email')
        .eq('id', dto.leadId)
        .single();

      if (leadError || !lead) {
        this.logger.warn(`Lead ${dto.leadId} not found`);
        return { status: 'error', message: 'Lead not found' };
      }

      // 2. Find the employee's OAuth connection
      const { data: connection, error: connectionError } = await this.supabaseService
        .getClient()
        .from('business_employee_oauth_connections')
        .select('*')
        .eq('business_employee_id', lead.business_employee_id)
        .eq('business_id', lead.business_id)
        .single();

      if (connectionError || !connection) {
        this.logger.warn(
          `OAuth connection not found for employee ${lead.business_employee_id}`,
        );
        return {
          status: 'error',
          message: 'Employee does not have a calendar connected',
        };
      }

      // 3. Get valid access token
      const accessToken = await this.googleService.getValidAccessToken(connection);
      if (!accessToken) {
        return {
          status: 'error',
          message: 'Failed to authenticate with Google Calendar',
        };
      }

      // 4. Create meeting using Google Service
      const result = await this.googleService.bookMeeting(accessToken, {
        leadId: dto.leadId,
        date: dto.date,
        duration: dto.duration,
        title: dto.title,
        description: dto.description,
        customerName: lead.customer_name,
        customerEmail: lead.email,
      });

      return {
        status: 'success',
        message: 'Meeting booked successfully',
        meetingUrl: result.meetingUrl,
      };
    } catch (error) {
      this.logger.error('Error booking meeting:', error);
      return {
        status: 'error',
        message: 'Failed to book meeting',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

