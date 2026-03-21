import { NextResponse } from 'next/server';
import speakeasy from 'speakeasy';

export async function POST(req: Request) {
  try {
    const { secret, token } = await req.json();

    if (!secret || !token) {
        return NextResponse.json({ success: false, message: "Missing token or secret" }, { status: 400 });
    }

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token.trim(),
    });

    return NextResponse.json({ success: verified });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
