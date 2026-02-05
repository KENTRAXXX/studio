import { jwtVerify, createRemoteJWKSet } from 'jose';

/**
 * Cloudflare Access Configuration
 */
const CERTS_URL = 'https://somads.cloudflareaccess.com/cdn-cgi/access/certs';
const ALLOWED_AUDIENCES = [
  '4756df285caad468627ea81a5f172a6d7316d35f2a0c06fa4935501beb1b57e6',
  '45bb3133de9b6ef7269eaf2712a0691423286452383fe0a5140e09e0393ee9a7'
];

/**
 * Remotely fetched JWKs for Cloudflare Access
 */
const JWKS = createRemoteJWKSet(new URL(CERTS_URL));

/**
 * Interface for Cloudflare Access JWT Payload
 */
export interface CfAccessPayload {
  email: string;
  common_name: string;
  aud: string;
  [key: string]: any;
}

/**
 * Verifies a Cloudflare Access JWT (assertion).
 * @param token The JWT string from the Cf-Access-Jwt-Assertion header.
 * @returns The verified payload or null if invalid.
 */
export async function verifyCfAccessJwt(token: string): Promise<CfAccessPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      audience: ALLOWED_AUDIENCES,
    });

    return payload as unknown as CfAccessPayload;
  } catch (error) {
    console.error('Cloudflare Access JWT verification failed:', error);
    return null;
  }
}
