import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkProcessingStatus } from '@/lib/youtube/upload';

// Server-side Supabase client with service role
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, serviceKey);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json({ error: 'Content ID required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Get content record
    const { data: content, error: contentError } = await supabase
      .from('content')
      .select('*')
      .eq('id', contentId)
      .single();

    if (contentError || !content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // If already ready or failed, return current status
    if (content.upload_status === 'ready' || content.upload_status === 'failed') {
      return NextResponse.json({
        contentId,
        status: content.upload_status,
        youtubeVideoId: content.youtube_video_id,
        durationSeconds: content.duration_seconds,
        error: content.upload_error,
      });
    }

    // If processing, check YouTube status
    if (content.upload_status === 'processing' && content.youtube_video_id) {
      const result = await checkProcessingStatus(contentId, content.youtube_video_id);
      return NextResponse.json(result);
    }

    // Return current status for other states (draft, uploading_youtube)
    return NextResponse.json({
      contentId,
      status: content.upload_status,
      youtubeVideoId: content.youtube_video_id,
    });
  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
