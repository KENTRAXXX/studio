import { NextResponse } from 'next/server';
import { getLuxuryEmailHtml } from '@/lib/emails/luxury-wrapper';

/**
 * Custom password reset endpoint using Firebase Admin SDK.
 *
 * On Firebase App Hosting, Admin SDK authenticates via Application Default
 * Credentials (ADC) automatically — no service account file is needed.
 *
 * Flow:
 *  1. Generate the actual password reset link (with oobCode) via Admin SDK.
 *  2. Embed that link directly in a luxury branded Resend email.
 *  3. User receives ONE email with a working button — no Firebase spam filter risk.
 */

let adminApp: any = null;

async function getAdminAuth() {
  if (!adminApp) {
    const { initializeApp, getApps, cert, applicationDefault } = await import('firebase-admin/app');
    const { getAuth } = await import('firebase-admin/auth');

    const existingApps = getApps();
    if (existingApps.length > 0) {
      adminApp = existingApps[0];
    } else {
      // On Firebase App Hosting, ADC is provided automatically.
      // Locally, set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path.
      try {
        adminApp = initializeApp({ credential: applicationDefault() });
      } catch {
        // Fallback: try with project ID only (works in some environments)
        adminApp = initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'somads-studio',
        });
      }
    }
    return getAuth(adminApp);
  }

  const { getAuth } = await import('firebase-admin/auth');
  return getAuth(adminApp);
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, message: 'A valid email address is required.' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not set.');
      return NextResponse.json({ success: false, message: 'Email service is not configured.' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.somatoday.com';

    // Step 1: Generate the actual password reset link via Firebase Admin SDK.
    // This returns a URL like: https://somatoday.com/auth/action?mode=resetPassword&oobCode=...
    const adminAuth = await getAdminAuth();
    const resetLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${appUrl}/auth/action`,
      handleCodeInApp: false,
    });

    // Step 2: Embed the real link inside the luxury Resend email.
    const htmlContent = getLuxuryEmailHtml({
      title: 'Password Reset Request',
      heading: 'Security Override Initiated',
      body: `
        <p style="font-size: 16px; color: #CCCCCC; text-align: center;">
          A request has been received to reset the master credentials for this account.
        </p>
        <p style="font-size: 16px; color: #CCCCCC; text-align: center;">
          Click the button below to set a new password. This authorization expires in
          <strong style="color: #D4AF37;">1 hour</strong>.
        </p>
        <p style="color: #666; font-size: 13px; margin-top: 40px; text-align: center;">
          If you did not initiate this request, your credentials remain unchanged.
          Disregard this transmission.
        </p>
      `,
      buttonText: 'Reset Password',
      buttonUrl: resetLink,
      footerText: 'SOMA Security Division. Unauthorized access is monitored and reported.'
    });

    const resendResponse = await fetch('https://api.resend.com/emails', {
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

    if (!resendResponse.ok) {
      const errData = await resendResponse.json().catch(() => ({}));
      throw new Error(`Resend delivery failed: ${errData?.message || resendResponse.statusText}`);
    }

    return NextResponse.json({ success: true, message: 'Reset link dispatched.' });

  } catch (error: any) {
    console.error('Password reset error:', error.code, error.message);

    // auth/user-not-found or auth/invalid-email — return generic message for security
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
      return NextResponse.json({ success: true, message: 'If that account exists, a reset link has been dispatched.' });
    }

    return NextResponse.json(
      { success: false, message: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
