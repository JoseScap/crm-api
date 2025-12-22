import { Injectable } from '@nestjs/common';

@Injectable()
export class DealsService {
  handleWebhook(body: any, headers: any, query: any, method: string, url: string, path: string) {
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Method:', method);
    console.log('URL:', url);
    console.log('Path:', path);
    console.log('Query Params:', JSON.stringify(query, null, 2));
    console.log('Headers:', JSON.stringify(headers, null, 2));
    console.log('Body:', JSON.stringify(body, null, 2));
    console.log('Raw Body:', body);
    console.log('=== END WEBHOOK DATA ===');
    
    return {
      status: 'success',
      message: 'Webhook received and logged',
      timestamp: new Date().toISOString(),
    };
  }
}

