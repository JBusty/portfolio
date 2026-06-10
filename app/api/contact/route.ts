import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
};

function getTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ContactPayload | null;

  const name = getTrimmedString(body?.name);
  const email = getTrimmedString(body?.email);
  const message = getTrimmedString(body?.message);

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'Please fill out your name, email, and message.' },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  if (message.length > 5000) {
    return NextResponse.json(
      { error: 'Please keep your message under 5000 characters.' },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL ?? 'jbusseywork@gmail.com';
  const from = process.env.CONTACT_FROM_EMAIL ?? 'Portfolio Contact <onboarding@resend.dev>';

  if (!apiKey) {
    console.error('Missing RESEND_API_KEY for contact form.');
    return NextResponse.json(
      {
        error:
          'Contact form is not configured yet. Please email me directly at jbusseywork@gmail.com.',
      },
      { status: 500 }
    );
  }

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: `Portfolio inquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    }),
  });

  if (!resendResponse.ok) {
    const details = await resendResponse.text();
    console.error('Resend contact form request failed:', details);

    return NextResponse.json(
      {
        error:
          'Sorry, your message could not be sent right now. Please try again or email me directly.',
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
