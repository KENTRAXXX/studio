import { NextResponse } from 'next/server';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    // Generate secure secret
    const secret = speakeasy.generateSecret({
      name: `SOMA Gateway (${email || 'Executive'})`,
      length: 20
    });

    // Generate QR code data URI
    const qrcodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    return NextResponse.json({
      success: true,
      secret: secret.base32,
      qrcodeUrl
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
