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
  const env = (locals as any).runtime?.env as Env;

  // 1. Check Env Vars
  if (!env?.GOOGLE_PRIVATE_KEY || !env?.TURNSTILE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500 }
    );
  }

  try {
    const data = await request.json();

    // 2. Validate Data
    const validatedData = bookingSchema.parse(data);

    // 3. Verify Turnstile
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

    const turnstileOutcome = (await turnstileResult.json()) as any;
    if (!turnstileOutcome.success) {
      return new Response(JSON.stringify({ error: 'Security check failed' }), {
        status: 403,
      });
    }

    // 4. Authenticate Google
    const auth = new GoogleAuth({
      credentials: {
        client_email: env.GOOGLE_CLIENT_EMAIL,
        private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Fix Cloudflare newline issue
        project_id: env.GOOGLE_PROJECT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const client = await auth.getClient();
    const calendarId = env.GOOGLE_CALENDAR_ID;

    // 5. Check Availability (FreeBusy)
    const startTime = new Date(
      `${validatedData.date}T${validatedData.time}:00`
    );
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // +1 hour

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

    const busySlots = (freeBusyRes.data as any).calendars[calendarId].busy;
    if (busySlots && busySlots.length > 0) {
      return new Response(JSON.stringify({ error: 'Horario no disponible' }), {
        status: 409,
      });
    }

    // 6. Create Event
    const eventDescription = `
      Tipo: ${validatedData.type}
      ${validatedData.office ? `Oficina: ${validatedData.office}` : ''}
      Cliente: ${validatedData.name}
      Email: ${validatedData.email}
      Teléfono: ${validatedData.phone}
      Motivo: ${validatedData.reason}
      ${validatedData.type === 'campo' ? `Sector: ${validatedData.sector}` : ''}
    `.trim();

    const eventBody: any = {
      summary: `Cita ACIMU: ${validatedData.name} (${validatedData.type})`,
      description: eventDescription,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      // attendees: [{ email: validatedData.email }], // Service accounts cannot invite attendees without Domain-Wide Delegation
    };

    // Add Google Meet link if virtual
    // Note: Service accounts often cannot create Google Meets without G Suite/Workspace licensing and delegation.
    // We are disabling this to prevent "Invalid conference type value" errors.
    /*
    if (validatedData.type === 'virtual') {
      eventBody.conferenceData = {
        createRequest: {
          requestId: Math.random().toString(36).substring(7),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }
    */

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
