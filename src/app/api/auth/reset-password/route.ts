import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { getLuxuryEmailHtml } from '@/lib/emails/luxury-wrapper';

/**
 * Custom password reset endpoint.
 * Triggers Firebase to generate the reset link, then re-sends it
 * via Resend with luxury SOMA branding so it lands in the inbox.
 */

function getClientAuth() {
  const apps = getApps();
  const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
  return getAuth(app);
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, message: 'A valid email address is required.' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ success: false, message: 'Email service is not configured.' }, { status: 500 });
    }

    // Step 1: Use Firebase to send the official reset email.
    // We also send our branded version, but Firebase's link is the one that works.
    // We configure Firebase's action URL to point to our /auth/action handler.
    const auth = getClientAuth();
    await sendPasswordResetEmail(auth, email, {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.somatoday.com'}/auth/action`,
      handleCodeInApp: false,
    });

    // Step 2: Send an additional branded notification email via Resend so the
    // user gets a luxury-styled heads-up (the actual clickable link comes from Firebase).
    const htmlContent = getLuxuryEmailHtml({
      title: 'Password Reset Request',
      heading: 'Security Override Initiated',
      body: `
        <p style="font-size: 16px; color: #CCCCCC; text-align: center;">
          A request has been received to reset the credentials for this account.
        </p>
        <p style="font-size: 16px; color: #CCCCCC; text-align: center;">
          A secure reset link has been dispatched to <strong style="color: #D4AF37;">${email}</strong>.
          Check your primary inbox — the link expires in <strong style="color: #D4AF37;">1 hour</strong>.
        </p>
        <p style="color: #666; font-size: 13px; margin-top: 40px; text-align: center;">
          If you did not initiate this request, your account credentials remain unchanged.
          Contact support if you believe this was unauthorized.
        </p>
      `,
      footerText: 'SOMA Security Division. Unauthorized access is monitored and reported.'
    });

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SOMA Gatekeeper <noreply@somatoday.com>',
        to: email,
        subject: 'Password Reset — Action Required',
        html: htmlContent,
      }),
    });

    return NextResponse.json({ success: true, message: 'Reset link dispatched.' });
  } catch (error: any) {
    // Firebase throws auth/user-not-found — we return a generic message for security
    console.error('Password reset error:', error.code, error.message);
    // Return success even if user not found to prevent user enumeration
    return NextResponse.json({ success: true, message: 'If that account exists, a reset link has been dispatched.' });
  }
}
