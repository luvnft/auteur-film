import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, serviceKey);
}

/**
 * Initialize upload - creates a content record for the upload
 * The actual YouTube upload happens through /api/upload/proxy
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, fileName, fileSize, contentType } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (!fileName || !fileSize) {
      return NextResponse.json({ error: 'File name and size required' }, { status: 400 });
    }

    // Validate file size (max 10GB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10GB
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10GB)' }, { status: 400 });
    }

    // Validate content type
    const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    const mimeType = contentType && ALLOWED_TYPES.includes(contentType) ? contentType : 'video/mp4';

    const supabase = getServiceClient();

    // Verify user exists and is a creator
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, is_creator')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.is_creator) {
      return NextResponse.json({ error: 'User is not a creator' }, { status: 403 });
    }

    // Generate unique content ID
    const contentId = crypto.randomUUID();

    // Create content record with draft status
    const { error: insertError } = await supabase.from('content').insert({
      id: contentId,
      creator_id: userId,
      type: 'film',
      title: 'Untitled',
      upload_status: 'draft',
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('Failed to create content record:', insertError);
      return NextResponse.json({ error: 'Failed to create content' }, { status: 500 });
    }

    return NextResponse.json({
      contentId,
      fileSize,
      mimeType,
    });
  } catch (error: any) {
    console.error('Upload initiation error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
