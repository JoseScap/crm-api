export type MessageType = 'customer' | 'salesperson';

export interface ChatMessage {
  type: MessageType;
  message: string;
}

export interface ReplyWhatsappMessageDto {
  leadId: number;
  text: string;
}

export interface ReplyWhatsappMessageResponse {
  status: 'success' | 'error';
  message: string;
  error?: string;
}

export interface LeadWithPipeline {
  phone_number: string;
  pipeline_stages: {
    pipelines: {
      whatsapp_phone_number_id: string;
    };
  };
}

export interface ChangeLeadStageDto {
  leadId: number;
  newPipelineStageId: number;
}

export interface ChangeLeadStageResponse {
  status: 'success' | 'error';
  message: string;
  error?: string;
}

export interface CheckAvailabilityForMeetingDto {
  leadId: number;
  date: string;
  duration: number;
  timezone: string;
  minWorkingHour: number;
  maxWorkingHour: number;
}

export interface CheckAvailabilityForMeetingResponse {
  isAvailable: boolean;
  message: string;
  suggestedSlots?: string[];
}

export interface BookMeetingDto {
  leadId: number;
  date: string;
  duration: number;
  title: string;
  description?: string;
}

export interface BookMeetingResponse {
  status: 'success' | 'error';
  message: string;
  meetingUrl?: string;
  error?: string;
}

export interface UpdateLeadInformationDto {
  leadId: number;
  email?: string;
  customerName?: string;
}

export interface UpdateLeadInformationResponse {
  status: 'success' | 'error';
  message: string;
  error?: string;
}
