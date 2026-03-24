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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, userId, youtubeVideoId } = body;

    if (!contentId || !userId) {
      return NextResponse.json(
        { error: 'Content ID and User ID required' },
        { status: 400 }
      );
    }

    if (!youtubeVideoId) {
      return NextResponse.json(
        { error: 'YouTube Video ID required' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Verify content exists and belongs to user
    const { data: content, error: contentError } = await supabase
      .from('content')
      .select('id, creator_id, upload_status')
      .eq('id', contentId)
      .single();

    if (contentError || !content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    if (content.creator_id !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Verify content is in correct state
    if (content.upload_status !== 'uploading_youtube' && content.upload_status !== 'draft') {
      return NextResponse.json(
        { error: `Invalid upload status: ${content.upload_status}` },
        { status: 400 }
      );
    }

    // Update content with YouTube video ID and set to processing
    const { error: updateError } = await supabase
      .from('content')
      .update({
        youtube_video_id: youtubeVideoId,
        upload_status: 'processing',
      })
      .eq('id', contentId);

    if (updateError) {
      console.error('Failed to update content:', updateError);
      return NextResponse.json(
        { error: 'Failed to update content record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      contentId,
      youtubeVideoId,
      status: 'processing',
    });
  } catch (error: any) {
    console.error('Upload complete error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
