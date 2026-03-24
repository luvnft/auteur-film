import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, importPKCS8, importJWK } from 'jose';
import crypto from 'crypto';

const CDP_API_KEY = process.env.CDP_API_KEY || process.env.CDP_API_KEY_NAME;
const CDP_API_SECRET = process.env.CDP_API_SECRET || process.env.CDP_API_KEY_PRIVATE_KEY;

async function generateJWT(): Promise<string> {
  if (!CDP_API_KEY || !CDP_API_SECRET) {
    throw new Error('CDP API credentials not configured. Need CDP_API_KEY and CDP_API_SECRET');
  }

  let privateKey;
  let alg: 'EdDSA' | 'ES256' = 'EdDSA';

  const keyString = CDP_API_SECRET.replace(/\\n/g, '\n').trim();

  if (keyString.startsWith('-----BEGIN EC PRIVATE KEY')) {
    alg = 'ES256';
    privateKey = await importPKCS8(keyString, 'ES256');
  } else if (keyString.startsWith('-----BEGIN PRIVATE KEY')) {
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

  const jwt = await new SignJWT({
    sub: CDP_API_KEY,
    iss: 'cdp',
    aud: ['cdp_service'],
    nbf: now,
    exp: now + 120,
    uri: 'POST api.developer.coinbase.com/onramp/v1/sell/quote',
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
    const { walletAddress, amount } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!CDP_API_KEY || !CDP_API_SECRET) {
      return NextResponse.json(
        { error: 'CDP API not configured' },
        { status: 500 }
      );
    }

    const jwt = await generateJWT();

    // Get offramp quote which includes the offramp URL
    // Parameters must be camelCase per Coinbase API docs
    const requestBody = {
      sellCurrency: 'USDC',
      sellNetwork: 'base',
      sellAmount: amount?.toString() || '10', // Amount in USDC
      cashoutCurrency: 'USD',
      country: 'US',
      paymentMethod: 'ACH_BANK_ACCOUNT', // Required for US
      sourceAddress: walletAddress,
      redirectUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://auteur.film/wallet',
    };

    const response = await fetch(
      'https://api.developer.coinbase.com/onramp/v1/sell/quote',
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
      console.error('Coinbase offramp quote error:', response.status, errorText);
      return NextResponse.json(
        { error: `Failed to get offramp quote: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    // The quote response includes offrampUrl for one-click-sell
    // Try both camelCase and snake_case since docs are inconsistent
    const offrampUrl = data.offrampUrl || data.offramp_url;
    return NextResponse.json({
      offrampUrl,
      quote: data
    });
  } catch (error) {
    console.error('Offramp error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}
