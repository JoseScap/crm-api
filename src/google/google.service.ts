import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import axios from 'axios';
import { Tables } from '../supabase/supabase.schema';

@Injectable()
export class GoogleService {
  private readonly logger = new Logger(GoogleService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async getValidAccessToken(
    connection: Tables<'business_employee_oauth_connections'>,
  ): Promise<string | null> {
    const now = new Date();
    const expiresAt = connection.token_expires_at
      ? new Date(connection.token_expires_at)
      : new Date(0);

    // If token is still valid (with 5 min buffer)
    if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
      return connection.access_token;
    }

    // Otherwise, refresh token
    if (!connection.refresh_token) {
      this.logger.error('No refresh token available');
      return null;
    }

    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        this.logger.error('Missing Google OAuth credentials in config');
        return null;
      }

      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refresh_token,
        grant_type: 'refresh_token',
      });

      const { access_token, expires_in } = response.data;
      const newTokenExpiresAt = new Date(now.getTime() + expires_in * 1000);

      // Update in database
      const { error: updateError } = await this.supabaseService
        .getClient()
        .from('business_employee_oauth_connections')
        .update({
          access_token: access_token,
          token_expires_at: newTokenExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);

      if (updateError) {
        this.logger.error('Error updating refreshed token:', updateError);
      }

      return access_token;
    } catch (error) {
      this.logger.error('Error refreshing Google token:', error);
      return null;
    }
  }

  async checkAvailability(
    accessToken: string,
    date: string,
    duration: number,
    timezone: string,
    minWorkingHour: number,
    maxWorkingHour: number,
  ): Promise<{
    isAvailable: boolean;
    message: string;
    suggestedSlots?: string[];
  }> {
    try {
      const timeMin = new Date(date);
      const timeMax = new Date(timeMin.getTime() + duration * 60000);

      this.logger.log(`Checking availability for date: ${timeMin.toISOString()} in timezone: ${timezone}`);

      const response = await axios.post(
        'https://www.googleapis.com/calendar/v3/freeBusy',
        {
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          items: [{ id: 'primary' }],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const busy = response.data.calendars.primary.busy;
      const isAvailable = busy.length === 0;

      let suggestedSlots: string[] = [];
      if (!isAvailable) {
        suggestedSlots = await this.findAvailableSlots(
          accessToken,
          timeMin,
          duration,
          timezone,
          minWorkingHour,
          maxWorkingHour,
        );
      }

      return {
        isAvailable,
        message: isAvailable
          ? 'Time slot is available'
          : 'Time slot is already occupied',
        suggestedSlots: suggestedSlots.length > 0 ? suggestedSlots : undefined,
      };
    } catch (error) {
      this.logger.error('Error checking availability in Google Calendar:', error);
      throw error;
    }
  }

  private async findAvailableSlots(
    accessToken: string,
    requestedDate: Date,
    duration: number,
    timezone: string,
    minWorkingHour: number,
    maxWorkingHour: number,
  ): Promise<string[]> {
    try {
      // 1. Calculate the start and end of the day in the provided timezone
      // We use Intl to get the date parts in the specific timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      
      const parts = formatter.formatToParts(requestedDate);
      const year = parts.find(p => p.type === 'year')!.value;
      const month = parts.find(p => p.type === 'month')!.value;
      const day = parts.find(p => p.type === 'day')!.value;

      // Construct ISO strings for the start and end of that specific day in that timezone
      // We use the format: YYYY-MM-DDTHH:mm:ss[Offset]
      // To get the offset, we can use a trick with Intl
      const offsetFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'longOffset',
      });
      const offsetPart = offsetFormatter.formatToParts(requestedDate).find(p => p.type === 'timeZoneName')!.value;
      // offsetPart is something like "GMT-03:00" or "GMT+05:30"
      const offset = offsetPart === 'GMT' ? 'Z' : offsetPart.replace('GMT', '');

      const dayStartStr = `${year}-${month}-${day}T00:00:00${offset}`;
      const dayEndStr = `${year}-${month}-${day}T23:59:59${offset}`;

      const searchStart = new Date(dayStartStr);
      const searchEnd = new Date(dayEndStr);

      this.logger.log(`Searching slots between ${searchStart.toISOString()} and ${searchEnd.toISOString()} (${timezone})`);

      // Query busy times for the whole day
      const response = await axios.post(
        'https://www.googleapis.com/calendar/v3/freeBusy',
        {
          timeMin: searchStart.toISOString(),
          timeMax: searchEnd.toISOString(),
          items: [{ id: 'primary' }],
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      const busyIntervals = (response.data.calendars.primary.busy || []) as {
        start: string;
        end: string;
      }[];

      const suggested: string[] = [];
      const slotDurationMs = duration * 60000;

      // 2. Define "working hours" in the local timezone (using parameters)
      const workingStartStr = `${year}-${month}-${day}T${minWorkingHour.toString().padStart(2, '0')}:00:00${offset}`;
      const workingEndStr = `${year}-${month}-${day}T${maxWorkingHour.toString().padStart(2, '0')}:00:00${offset}`;

      let currentSlot = new Date(workingStartStr);
      const endOfWorkingDay = new Date(workingEndStr);

      while (
        currentSlot.getTime() + slotDurationMs <=
        endOfWorkingDay.getTime()
      ) {
        const slotStart = currentSlot.getTime();
        const slotEnd = slotStart + slotDurationMs;

        // Check if this slot overlaps with any busy interval
        const isBusy = busyIntervals.some((busy) => {
          const bStart = new Date(busy.start).getTime();
          const bEnd = new Date(busy.end).getTime();
          return slotStart < bEnd && slotEnd > bStart;
        });

        // Also don't suggest slots in the past
        const isPast = slotStart < Date.now();

        if (!isBusy && !isPast) {
          suggested.push(currentSlot.toISOString());
        }

        if (suggested.length >= 5) break; // Return max 5 suggestions

        // Move to next potential slot (every 30 mins)
        currentSlot = new Date(currentSlot.getTime() + 30 * 60000);
      }

      return suggested;
    } catch (error) {
      this.logger.error('Error finding available slots:', error);
      return [];
    }
  }

  async bookMeeting(
    accessToken: string,
    data: {
      leadId: number;
      date: string;
      duration: number;
      title: string;
      description?: string;
      customerName: string;
      customerEmail: string | null;
    },
  ): Promise<{ meetingUrl?: string }> {
    try {
      const startTime = new Date(data.date);
      const endTime = new Date(startTime.getTime() + data.duration * 60000);

      const response = await axios.post(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          summary: data.title,
          description: data.description || `Meeting with ${data.customerName}`,
          start: {
            dateTime: startTime.toISOString(),
          },
          end: {
            dateTime: endTime.toISOString(),
          },
          attendees: data.customerEmail ? [{ email: data.customerEmail }] : [],
          conferenceData: {
            createRequest: {
              requestId: `meet-${data.leadId}-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            conferenceDataVersion: 1,
          },
        },
      );

      return {
        meetingUrl: response.data.hangoutLink || response.data.htmlLink,
      };
    } catch (error) {
      this.logger.error('Error booking meeting in Google Calendar:', error);
      throw error;
    }
  }
}

