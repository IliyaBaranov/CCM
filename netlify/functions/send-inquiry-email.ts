const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

const jsonResponse = (statusCode: number, payload: Record<string, unknown>) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(payload),
});

type SendInquiryPayload = {
  inquiryId?: string;
  teamSlug?: string;
  toEmail?: string | null;
  fields?: Record<string, unknown>;
};

export const handler = async (request: { httpMethod: string; body?: string | null }) => {
  if (request.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const resendApiKey = required('RESEND_API_KEY');
    const body = JSON.parse(request.body || '{}') as SendInquiryPayload;
    if (!body.inquiryId) return jsonResponse(400, { error: 'Missing inquiryId' });
    if (!body.fields || typeof body.fields !== 'object' || Array.isArray(body.fields)) {
      return jsonResponse(400, { error: 'Missing or invalid fields' });
    }

    const teamSlug = body.teamSlug || process.env.TEAM_SLUG || 'default';
    const notifyEmailTo = body.toEmail || process.env.NOTIFY_EMAIL_TO;
    if (!notifyEmailTo) return jsonResponse(500, { error: 'Missing NOTIFY_EMAIL_TO and toEmail payload' });

    const subject = `[AI-WEB-2026] ${teamSlug} New Contact Inquiry`;
    const fieldLines = Object.entries(body.fields).map(([key, value]) => `${key}: ${String(value)}`);
    const emailBody = [
      `Inquiry ID: ${body.inquiryId}`,
      `Team slug: ${teamSlug}`,
      '',
      'Submitted fields:',
      ...fieldLines,
    ].join('\n');

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ClearContent CMS <onboarding@resend.dev>',
        to: [notifyEmailTo],
        subject,
        text: emailBody,
      }),
    });

    if (!resendResponse.ok) {
      const text = await resendResponse.text();
      return jsonResponse(500, { error: `Resend error: ${text}` });
    }

    return jsonResponse(200, { ok: true });
  } catch (error) {
    return jsonResponse(500, { error: error instanceof Error ? error.message : 'Unknown error' });
  }
};
