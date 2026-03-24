import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { deleteContent } from '@/lib/youtube/upload';

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
    const { contentId, userId } = body;

    if (!contentId || !userId) {
      return NextResponse.json({ error: 'Content ID and User ID required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Get content record and verify ownership
    const { data: content, error: contentError } = await supabase
      .from('content')
      .select('*')
      .eq('id', contentId)
      .single();

    if (contentError || !content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    if (content.creator_id !== userId) {
      return NextResponse.json({ error: 'Not authorized to delete this content' }, { status: 403 });
    }

    // Delete content (YouTube video, thumbnail, and DB record)
    await deleteContent(
      contentId,
      content.youtube_video_id,
      content.thumbnail_url
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete content error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
