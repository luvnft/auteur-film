import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, importPKCS8, importJWK } from 'jose';
import crypto from 'crypto';

// CDP uses two env vars: CDP_API_KEY (the key ID) and CDP_API_SECRET (base64 Ed25519 key)
// Also support legacy naming CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY
const CDP_API_KEY = process.env.CDP_API_KEY || process.env.CDP_API_KEY_NAME;
const CDP_API_SECRET = process.env.CDP_API_SECRET || process.env.CDP_API_KEY_PRIVATE_KEY;

async function generateJWT(): Promise<string> {
  if (!CDP_API_KEY || !CDP_API_SECRET) {
    throw new Error('CDP API credentials not configured. Need CDP_API_KEY and CDP_API_SECRET');
  }

  let privateKey;
  let alg: 'EdDSA' | 'ES256' = 'EdDSA';

  // Handle different key formats from CDP
  const keyString = CDP_API_SECRET.replace(/\\n/g, '\n').trim();

  if (keyString.startsWith('-----BEGIN EC PRIVATE KEY')) {
    // EC PEM format - use ES256
    alg = 'ES256';
    privateKey = await importPKCS8(keyString, 'ES256');
  } else if (keyString.startsWith('-----BEGIN PRIVATE KEY')) {
    // Generic PKCS8 PEM - try EdDSA first, then ES256
    try {
      privateKey = await importPKCS8(keyString, 'EdDSA');
      alg = 'EdDSA';
    } catch {
      privateKey = await importPKCS8(keyString, 'ES256');
      alg = 'ES256';
    }
  } else {
    // Raw base64-encoded Ed25519 key (64 bytes: 32 seed + 32 public)
    const keyBytes = Buffer.from(keyString, 'base64');

    if (keyBytes.length !== 64) {
      throw new Error(`Invalid Ed25519 key length: ${keyBytes.length} (expected 64)`);
    }

    // Ed25519: first 32 bytes = seed (d), last 32 bytes = public key (x)
    privateKey = await importJWK({
      kty: 'OKP',
      crv: 'Ed25519',
      d: keyBytes.slice(0, 32).toString('base64url'),
      x: keyBytes.slice(32).toString('base64url'),
    }, 'EdDSA');
    alg = 'EdDSA';
  }

  const now = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString('hex');


  // JWT claims must follow exact CDP format
  // See: https://docs.cdp.coinbase.com/get-started/authentication/jwt-authentication
  const jwt = await new SignJWT({
    sub: CDP_API_KEY,
    iss: 'cdp',
    aud: ['cdp_service'],
    nbf: now,
    exp: now + 120, // 2 minutes
    uri: 'POST api.developer.coinbase.com/onramp/v1/token',
  })
    .setProtectedHeader({
      alg,
      typ: 'JWT',
      kid: CDP_API_KEY,
      nonce
    })
    .sign(privateKey);

  return jwt;
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!CDP_API_KEY || !CDP_API_SECRET) {
      return NextResponse.json(
        { error: 'CDP API not configured. Set CDP_API_KEY and CDP_API_SECRET' },
        { status: 500 }
      );
    }

    // Generate JWT for authentication
    const jwt = await generateJWT();

    // Generate session token from Coinbase
    const requestBody = {
      destination_wallets: [
        {
          address: walletAddress,
          blockchains: ['base'],
        },
      ],
    };

    const response = await fetch(
      'https://api.developer.coinbase.com/onramp/v1/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
        body: JSON.stringify(requestBody),
      }
    );


    if (!response.ok) {
      const errorText = await response.text();
      console.error('Coinbase token error:', response.status, errorText);
      return NextResponse.json(
        { error: `Failed to generate session token: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ token: data.token });
  } catch (error) {
    console.error('Onramp token error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}
