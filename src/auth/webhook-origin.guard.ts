import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class WebhookOriginGuard implements CanActivate {
  private readonly logger = new Logger(WebhookOriginGuard.name);

  constructor(private supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const path = request.path;

    this.logger.log(
      `=== WEBHOOK ORIGIN GUARD - Starting validation ===`,
    );
    this.logger.log(`Method: ${method}, Path: ${path}, IP: ${request.ip}`);

    // Get leadId from request body
    const leadId = request.body?.leadId;

    if (!leadId) {
      this.logger.warn(
        `Missing leadId in request body - ${method} ${path} from ${request.ip}`,
      );
      throw new UnauthorizedException('Missing leadId in request body');
    }

    this.logger.log(`LeadId found in request: ${leadId}`);

    // Get lead with stage information
    const supabase = this.supabaseService.getClient();
    const { data: lead, error: leadError } = await supabase
      .from('pipeline_stage_leads')
      .select('pipeline_stage_id, pipeline_stages(webhook_url)')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      this.logger.warn(
        `Lead ${leadId} not found or error fetching - ${method} ${path} from ${request.ip}`,
        leadError,
      );
      throw new UnauthorizedException('Lead not found');
    }

    const stage = (lead as any).pipeline_stages;

    if (!stage || !stage.webhook_url) {
      this.logger.warn(
        `Stage not found or webhook_url not configured for lead ${leadId} - ${method} ${path} from ${request.ip}`,
      );
      throw new UnauthorizedException(
        'Stage not found or webhook_url not configured',
      );
    }

    const stageWebhookUrl = stage.webhook_url;
    this.logger.log(`Stage webhook_url: ${stageWebhookUrl}`);

    // Extract base URL from stage webhook_url
    let stageBaseUrl: string;
    try {
      const stageUrl = new URL(stageWebhookUrl);
      stageBaseUrl = `${stageUrl.protocol}//${stageUrl.host}`;
      this.logger.log(`Stage base URL: ${stageBaseUrl}`);
    } catch (error) {
      this.logger.error(
        `Invalid webhook_url format for lead ${leadId}: ${stageWebhookUrl}`,
        error,
      );
      throw new UnauthorizedException('Invalid webhook_url format in stage');
    }

    // Get request origin/base URL
    const requestOrigin = this.getRequestOrigin(request);
    this.logger.log(`Request origin: ${requestOrigin}`);

    if (!requestOrigin) {
      this.logger.warn(
        `Could not determine request origin - ${method} ${path} from ${request.ip}`,
      );
      throw new UnauthorizedException('Could not determine request origin');
    }

    // Compare base URLs
    if (requestOrigin !== stageBaseUrl) {
      this.logger.warn(
        `Origin mismatch - Expected: ${stageBaseUrl}, Got: ${requestOrigin} - ${method} ${path} from ${request.ip}`,
      );
      throw new UnauthorizedException('Request origin does not match stage webhook URL');
    }

    this.logger.log(
      `Origin validation successful - ${requestOrigin} matches stage webhook URL`,
    );
    this.logger.log(`=== WEBHOOK ORIGIN GUARD - Validation complete ===`);

    return true;
  }

  private getRequestOrigin(request: any): string | null {
    // Try to get origin from headers
    const origin = request.headers['origin'];
    if (origin) {
      try {
        const originUrl = new URL(origin);
        return `${originUrl.protocol}//${originUrl.host}`;
      } catch (error) {
        this.logger.debug(`Invalid origin header format: ${origin}`);
      }
    }

    // Try to get from referer header
    const referer = request.headers['referer'];
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        return `${refererUrl.protocol}//${refererUrl.host}`;
      } catch (error) {
        this.logger.debug(`Invalid referer header format: ${referer}`);
      }
    }

    // Try to construct from request host
    const host = request.get?.('host') || request.headers['host'];
    const protocol = request.protocol || (request.secure ? 'https' : 'http');

    if (host) {
      return `${protocol}://${host}`;
    }

    return null;
  }
}

