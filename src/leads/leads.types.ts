export type MessageType = 'customer' | 'salesperson';

export interface ChatMessage {
  type: MessageType;
  message: string;
}

export interface HandleEventDto {
  messages: ChatMessage[];
}

