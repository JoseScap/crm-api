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

