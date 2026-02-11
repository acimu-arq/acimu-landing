import type { APIRoute } from 'astro';
import { z } from 'zod';
import { GoogleAuth } from 'google-auth-library';

// Schema Validation
const bookingSchema = z.object({
  type: z.enum(['oficina', 'campo', 'virtual']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  reason: z.string().min(5),
  sector: z.string().optional(),
  office: z.string().optional(),
  turnstileToken: z.string(),
});

// Environment Variables Interface (for Cloudflare)
interface Env {
  GOOGLE_PROJECT_ID: string;
  GOOGLE_CLIENT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  GOOGLE_CALENDAR_ID: string;
  TURNSTILE_SECRET_KEY: string;
}

export const POST: APIRoute = async ({ request, locals }) => {
  // Access env from Cloudflare runtime
  // See: https://docs.astro.build/en/guides/integrations-guide/cloudflare/#environment-variables-and-secrets
  const runtime = (locals as { runtime?: { env?: Env } }).runtime;
  const env = runtime?.env;

  if (!env) {
    console.error('Cloudflare runtime env not available');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500 }
    );
  }

  if (!env.GOOGLE_PRIVATE_KEY || !env.TURNSTILE_SECRET_KEY) {
    console.error('Missing required environment variables');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500 }
    );
  }

  // Fix: Replace escaped newlines with actual newlines in private key
  // Cloudflare stores \n as literal \\n, so we need to convert them back
  const privateKey = env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

  try {
    const data = await request.json();

    // Validate Data
    const validatedData = bookingSchema.parse(data);

    // Verify Turnstile
    const turnstileFormData = new FormData();
    turnstileFormData.append('secret', env.TURNSTILE_SECRET_KEY);
    turnstileFormData.append('response', validatedData.turnstileToken);
    turnstileFormData.append(
      'remoteip',
      request.headers.get('CF-Connecting-IP') || ''
    );

    const turnstileResult = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        body: turnstileFormData,
        method: 'POST',
      }
    );

    const turnstileOutcome = (await turnstileResult.json()) as {
      success: boolean;
    };
    if (!turnstileOutcome.success) {
      return new Response(JSON.stringify({ error: 'Security check failed' }), {
        status: 403,
      });
    }

    // Authenticate Google
    const auth = new GoogleAuth({
      credentials: {
        client_email: env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
        project_id: env.GOOGLE_PROJECT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const client = await auth.getClient();
    const calendarId = env.GOOGLE_CALENDAR_ID;

    // Check Availability (FreeBusy)
    // Ecuador timezone: America/Guayaquil (UTC-5)
    const TIMEZONE = 'America/Guayaquil';

    // Create datetime string in ISO format with timezone offset for Ecuador (UTC-5)
    const startDateTime = `${validatedData.date}T${validatedData.time}:00-05:00`;
    const startTime = new Date(startDateTime);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 hour

    // Format end time with Ecuador timezone offset
    const endDateTime = `${validatedData.date}T${String(parseInt(validatedData.time.split(':')[0]) + 1).padStart(2, '0')}:${validatedData.time.split(':')[1]}:00-05:00`;

    const freeBusyUrl = `https://www.googleapis.com/calendar/v3/freeBusy`;
    const freeBusyRes = await client.request({
      url: freeBusyUrl,
      method: 'POST',
      data: {
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        items: [{ id: calendarId }],
      },
    });

    // Parse response data - it might come as string or object depending on the client
    const responseData =
      typeof freeBusyRes.data === 'string'
        ? JSON.parse(freeBusyRes.data)
        : freeBusyRes.data;

    const calendarsData = responseData.calendars;
    if (!calendarsData || !calendarsData[calendarId]) {
      console.error('Calendar not found in Google response');
      return new Response(
        JSON.stringify({ error: 'Calendar configuration error' }),
        { status: 500 }
      );
    }

    const busySlots = calendarsData[calendarId].busy;
    if (busySlots && busySlots.length > 0) {
      return new Response(JSON.stringify({ error: 'Horario no disponible' }), {
        status: 409,
      });
    }

    // Create Event
    const eventDescription = `
Tipo: ${validatedData.type}
${validatedData.office ? `Oficina: ${validatedData.office}` : ''}
Cliente: ${validatedData.name}
Email: ${validatedData.email}
Teléfono: ${validatedData.phone}
Motivo: ${validatedData.reason}
${validatedData.type === 'campo' ? `Sector: ${validatedData.sector}` : ''}
    `.trim();

    const eventBody = {
      summary: `Cita ACIMU: ${validatedData.name} (${validatedData.type})`,
      description: eventDescription,
      start: {
        dateTime: startDateTime,
        timeZone: TIMEZONE,
      },
      end: {
        dateTime: endDateTime,
        timeZone: TIMEZONE,
      },
    };

    const insertUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
    await client.request({
      url: insertUrl,
      method: 'POST',
      data: eventBody,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Booking Error:', error);
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Datos inválidos', details: error.issues }),
        { status: 400 }
      );
    }
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500 }
    );
  }
};
