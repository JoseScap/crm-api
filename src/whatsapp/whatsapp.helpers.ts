import { BadRequestException } from '@nestjs/common';
import { MessageType, RecipientType } from './whatsapp.types';

export function validateMessageType(type: MessageType): void {
  if (type !== MessageType.TEXT) {
    throw new BadRequestException(
      `Message type "${type}" is not supported. Only "text" type is currently supported.`,
    );
  }
}

export function validateRecipientType(recipientType: RecipientType): void {
  if (recipientType !== RecipientType.INDIVIDUAL) {
    throw new BadRequestException(
      `Recipient type "${recipientType}" is not supported. Only "individual" type is currently supported.`,
    );
  }
}

