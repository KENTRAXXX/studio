import { NextResponse } from 'next/server';
import { getLuxuryEmailHtml } from '@/lib/emails/luxury-wrapper';

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));

  if (!email || !email.includes('@')) {
    return NextResponse.json({ success: false, message: 'A valid email address is required.' }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json({ success: false, message: 'RESEND_API_KEY is not set.' }, { status: 500 });
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    return NextResponse.json({ success: false, message: 'FIREBASE_SERVICE_ACCOUNT_JSON is not set.' }, { status: 500 });
  }

  // Parse service account — fix Vercel's \\n encoding in private_key
  let serviceAccount: any;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, message: `JSON parse failed: ${e.message}` }, { status: 500 });
  }

  // Initialize Firebase Admin SDK
  let adminAuth: any;
  try {
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getAuth } = await import('firebase-admin/auth');
    const existing = getApps().find(a => a.name === 'admin-reset');
    const app = existing ?? initializeApp({ credential: cert(serviceAccount) }, 'admin-reset');
    adminAuth = getAuth(app);
  } catch (e: any) {
    return NextResponse.json({ success: false, message: `Admin SDK init failed: ${e.message}` }, { status: 500 });
  }

  // Generate password reset link
  let resetLink: string;
  try {
    resetLink = await adminAuth.generatePasswordResetLink(email);
  } catch (e: any) {
    return NextResponse.json({ success: false, message: `generatePasswordResetLink failed: [${e.code}] ${e.message}` }, { status: 500 });
  }

  // Send luxury email via Resend
  try {
    const html = getLuxuryEmailHtml({
      title: 'Password Reset',
      heading: 'Security Override Initiated',
      body: `
        <p style="font-size:16px;color:#CCCCCC;text-align:center;">
          Click the button below to set a new password. Expires in <strong style="color:#D4AF37;">1 hour</strong>.
        </p>
        <p style="color:#666;font-size:13px;margin-top:40px;text-align:center;">
          If you did not request this, your credentials remain unchanged.
        </p>
      `,
      buttonText: 'Reset Password',
      buttonUrl: resetLink,
      footerText: 'SOMA Security Division.',
    });

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'SOMA Gatekeeper <noreply@somatoday.com>',
        to: email,
        subject: 'Password Reset — Action Required',
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ success: false, message: `Resend failed: ${err?.message || res.statusText}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: `Resend error: ${e.message}` }, { status: 500 });
  }
}
