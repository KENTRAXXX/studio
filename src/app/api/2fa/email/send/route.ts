import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!email || !code) {
        return NextResponse.json({ success: false, message: "Missing email or code" }, { status: 400 });
    }

    if (!resendApiKey) {
      return NextResponse.json({ success: false, message: "Server misconfiguration: Resend API Key missing." }, { status: 500 });
    }

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #000; color: #fff; text-align: center; border: 1px solid #D4AF37;">
        <h1 style="color: #D4AF37; margin-bottom: 20px; letter-spacing: 2px;">SOMA SECURITY</h1>
        <p style="font-size: 16px;">A secure terminal login was requested for your account.</p>
        <p style="font-size: 16px;">Your one-time authentication code is:</p>
        <div style="margin: 30px auto; padding: 20px; background-color: rgba(212, 175, 55, 0.1); border-radius: 8px; width: fit-content;">
            <h2 style="font-size: 42px; letter-spacing: 10px; color: #D4AF37; margin: 0;">${code}</h2>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 40px;">If you did not request this authorization, please secure your account immediately.</p>
      </div>
    `;

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'SOMA Gatekeeper <noreply@somatoday.com>',
            to: email,
            subject: `${code} is your SOMA verification code`,
            html: htmlContent
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to dispatch secure email via Resend');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
