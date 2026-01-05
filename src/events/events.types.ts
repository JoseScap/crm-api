export interface EventBody {
  response: string;
  leadId: number;
}

export interface EventResponse {
  status: 'success' | 'error';
  message: string;
  error?: string;
}

