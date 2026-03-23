import { NextResponse } from 'next/server';
import { getLuxuryEmailHtml } from '@/lib/emails/luxury-wrapper';

/**
 * Custom password reset endpoint.
 *
 * Auth strategy (in order):
 *  1. FIREBASE_SERVICE_ACCOUNT_JSON env var (a JSON string of your service account key).
 *  2. Application Default Credentials (automatic on Firebase App Hosting, if the
 *     App Hosting service account has the "Firebase Authentication Admin" IAM role).
 *  3. Fallback: calls Firebase client sendPasswordResetEmail and notifies user to check inbox.
 *
 * To set up option 1 (recommended):
 *  - Firebase Console → Project Settings → Service Accounts → Generate new private key
 *  - Copy the JSON contents and store as a secret named FIREBASE_SERVICE_ACCOUNT_JSON
 *    in Firebase Secret Manager, then reference it in apphosting.yaml:
 *
 *    secrets:
 *      - variable: FIREBASE_SERVICE_ACCOUNT_JSON
 *        secret: firebase-service-account
 */

// Singleton admin app per cold-start
let adminAuthInstance: any = null;

async function getAdminAuth() {
  if (adminAuthInstance) return adminAuthInstance;

  const { initializeApp, getApps, cert, applicationDefault } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');

  // Avoid re-initializing if another route already did
  const existing = getApps().find(a => a.name === 'admin-auth');

  if (existing) {
    adminAuthInstance = getAuth(existing);
    return adminAuthInstance;
  }

  let app;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    // Option 1: explicit service account JSON secret
    const serviceAccount = JSON.parse(serviceAccountJson);
    app = initializeApp({ credential: cert(serviceAccount) }, 'admin-auth');
  } else {
    // Option 2: Application Default Credentials (works on Firebase App Hosting
    // if the service account has Firebase Authentication Admin role in IAM)
    app = initializeApp({ credential: applicationDefault() }, 'admin-auth');
  }

  adminAuthInstance = getAuth(app);
  return adminAuthInstance;
}

async function sendViaResend(email: string, htmlContent: string, resendApiKey: string) {
  const response = await fetch('https://api.resend.com/emails', {
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

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Resend error: ${err?.message || response.statusText}`);
  }
}

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));

  if (!email || !email.includes('@')) {
    return NextResponse.json({ success: false, message: 'A valid email address is required.' }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('[reset-password] RESEND_API_KEY is not set.');
    return NextResponse.json({ success: false, message: 'Email service is not configured.' }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.somatoday.com';

  // ── STRATEGY 1: Admin SDK generates link → embed in Resend email ──────────
  try {
    const adminAuth = await getAdminAuth();
    const resetLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${appUrl}/auth/action`,
      handleCodeInApp: false,
    });

    const htmlContent = getLuxuryEmailHtml({
      title: 'Password Reset Request',
      heading: 'Security Override Initiated',
      body: `
        <p style="font-size: 16px; color: #CCCCCC; text-align: center;">
          A request has been received to reset the credentials for this account.
        </p>
        <p style="font-size: 16px; color: #CCCCCC; text-align: center;">
          Click the button below to set a new password. This authorization expires in
          <strong style="color: #D4AF37;">1 hour</strong>.
        </p>
        <p style="color: #666; font-size: 13px; margin-top: 40px; text-align: center;">
          If you did not initiate this request, your credentials remain unchanged.
        </p>
      `,
      buttonText: 'Reset Password',
      buttonUrl: resetLink,
      footerText: 'SOMA Security Division. Unauthorized access is monitored and reported.'
    });

    await sendViaResend(email, htmlContent, resendApiKey);

    return NextResponse.json({ success: true });

  } catch (adminError: any) {
    // auth/user-not-found → silently succeed (security: don't reveal if email exists)
    if (adminError.code === 'auth/user-not-found' || adminError.code === 'auth/invalid-email') {
      return NextResponse.json({ success: true });
    }

    // Admin SDK unavailable — log and fall through to Firebase client fallback
    console.error('[reset-password] Admin SDK failed, falling back to client SDK:', adminError.code, adminError.message);
  }

  // ── STRATEGY 2: Firebase client SDK fallback ──────────────────────────────
  // Firebase sends its own email with the reset link. We send a Resend notification
  // telling the user the link is on its way (check spam if not seen within a minute).
  try {
    const { initializeApp: initClientApp, getApps: getClientApps } = await import('firebase/app');
    const { getAuth: getClientAuth, sendPasswordResetEmail } = await import('firebase/auth');
    const { firebaseConfig } = await import('@/firebase/config');

    const clientApps = getClientApps();
    const clientApp = clientApps.length > 0 ? clientApps[0] : initClientApp(firebaseConfig);
    const clientAuth = getClientAuth(clientApp);

    await sendPasswordResetEmail(clientAuth, email, {
      url: `${appUrl}/auth/action`,
      handleCodeInApp: false,
    });

    // Notify the user via Resend that the Firebase email is on its way
    const htmlContent = getLuxuryEmailHtml({
      title: 'Password Reset In Progress',
      heading: 'Reset Link Dispatched',
      body: `
        <p style="font-size: 16px; color: #CCCCCC; text-align: center;">
          Your password reset has been initiated for <strong style="color: #D4AF37;">${email}</strong>.
        </p>
        <p style="font-size: 16px; color: #CCCCCC; text-align: center;">
          A separate email with a reset link has been sent to your inbox. 
          If you don't see it within 2 minutes, please check your <strong style="color: #D4AF37;">Spam</strong> or <strong style="color: #D4AF37;">Junk</strong> folder.
        </p>
        <p style="color: #666; font-size: 13px; margin-top: 40px; text-align: center;">
          If you did not initiate this request, your credentials remain unchanged.
        </p>
      `,
      footerText: 'SOMA Security Division. Unauthorized access is monitored and reported.'
    });

    await sendViaResend(email, htmlContent, resendApiKey);

    return NextResponse.json({ success: true });

  } catch (fallbackError: any) {
    if (fallbackError.code === 'auth/user-not-found' || fallbackError.code === 'auth/invalid-email') {
      return NextResponse.json({ success: true });
    }

    console.error('[reset-password] Fallback also failed:', fallbackError.code, fallbackError.message);
    return NextResponse.json(
      { success: false, message: `Reset failed: ${fallbackError.message}` },
      { status: 500 }
    );
  }
}
