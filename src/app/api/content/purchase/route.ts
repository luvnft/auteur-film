import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PLATFORM_FEE_PERCENT } from '@/lib/constants';

// Server-side Supabase client with service role
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, serviceKey);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, userId, transactionHash, amountCents } = body;

    if (!contentId || !userId || !amountCents) {
      return NextResponse.json(
        { error: 'Content ID, User ID, and amount required' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Verify content exists and is paid
    const { data: content, error: contentError } = await supabase
      .from('content')
      .select('id, price_cents, creator_id')
      .eq('id', contentId)
      .single();

    if (contentError || !content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    if (content.price_cents === 0) {
      return NextResponse.json(
        { error: 'This content is free - no purchase needed' },
        { status: 400 }
      );
    }

    // Verify amount matches content price
    if (amountCents !== content.price_cents) {
      return NextResponse.json(
        { error: 'Amount does not match content price' },
        { status: 400 }
      );
    }

    // Check if already purchased
    const { data: existingPurchase } = await supabase
      .from('content_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .single();

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'Content already purchased' },
        { status: 400 }
      );
    }

    // Calculate platform fee (2%)
    const platformFeeCents = Math.ceil(amountCents * (PLATFORM_FEE_PERCENT / 100));

    // Create purchase record
    const { error: insertError } = await supabase.from('content_purchases').insert({
      user_id: userId,
      content_id: contentId,
      amount_cents: amountCents,
      platform_fee_cents: platformFeeCents,
      transaction_hash: transactionHash || null,
    });

    if (insertError) {
      console.error('Failed to create purchase record:', insertError);
      return NextResponse.json(
        { error: 'Failed to record purchase' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      purchase: {
        contentId,
        amountCents,
        platformFeeCents,
        creatorAmountCents: amountCents - platformFeeCents,
      },
    });
  } catch (error: any) {
    console.error('Purchase error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
