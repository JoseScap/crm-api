export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  STICKER = 'sticker',
  LOCATION = 'location',
  CONTACTS = 'contacts',
  INTERACTIVE = 'interactive',
  TEMPLATE = 'template',
  REACTION = 'reaction',
}

export enum RecipientType {
  INDIVIDUAL = 'individual',
  GROUP = 'group',
}

export interface TextMessageContent {
  body: string;
  preview_url?: boolean;
}

export interface SendMessagePayload {
  messaging_product: string;
  recipient_type: RecipientType;
  to: string;
  type: MessageType;
  text: TextMessageContent;
}

