import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAccessToken } from '@/lib/youtube/client';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, serviceKey);
}

/**
 * Proxy trailer upload to YouTube.
 * Same pattern as the main video proxy, but saves to trailer_youtube_id.
 */
export async function POST(request: NextRequest) {
  try {
    const contentId = request.nextUrl.searchParams.get('contentId');
    const userId = request.nextUrl.searchParams.get('userId');

    if (!contentId || !userId) {
      return NextResponse.json(
        { error: 'Content ID and User ID required' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Verify content exists and belongs to user
    const { data: content, error: contentError } = await supabase
      .from('content')
      .select('id, creator_id')
      .eq('id', contentId)
      .single();

    if (contentError || !content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    if (content.creator_id !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || 'video/mp4';
    const contentLength = request.headers.get('content-length');

    if (!contentLength) {
      return NextResponse.json(
        { error: 'Content-Length header required' },
        { status: 400 }
      );
    }

    const fileSize = parseInt(contentLength, 10);

    const accessToken = await getAccessToken();

    // Initialize YouTube resumable upload for trailer
    const metadata = {
      snippet: {
        title: `auteur-trailer-${contentId}`,
        description: `Trailer for Content ID: ${contentId}`,
        categoryId: '1',
      },
      status: {
        privacyStatus: 'unlisted',
        selfDeclaredMadeForKids: false,
      },
    };

    const initResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Length': fileSize.toString(),
          'X-Upload-Content-Type': contentType,
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!initResponse.ok) {
      const error = await initResponse.text();
      console.error('YouTube trailer init error:', error);
      return NextResponse.json(
        { error: `Failed to initialize trailer upload: ${error}` },
        { status: 500 }
      );
    }

    const uploadUrl = initResponse.headers.get('Location');
    if (!uploadUrl) {
      return NextResponse.json(
        { error: 'No upload URL returned from YouTube' },
        { status: 500 }
      );
    }

    // Stream the trailer to YouTube
    const requestBody = request.body;
    if (!requestBody) {
      return NextResponse.json(
        { error: 'No video data in request' },
        { status: 400 }
      );
    }

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': contentType,
        'Content-Length': fileSize.toString(),
      },
      body: requestBody,
      // @ts-ignore - duplex is needed for streaming request body
      duplex: 'half',
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('YouTube trailer upload error:', errorText);
      return NextResponse.json(
        { error: `Trailer upload failed: ${errorText}` },
        { status: 500 }
      );
    }

    const youtubeResult = await uploadResponse.json();
    const trailerYoutubeId = youtubeResult.id;

    if (!trailerYoutubeId) {
      return NextResponse.json(
        { error: 'No video ID returned from YouTube' },
        { status: 500 }
      );
    }

    // Save trailer YouTube ID to the content record
    await supabase
      .from('content')
      .update({ trailer_youtube_id: trailerYoutubeId })
      .eq('id', contentId);

    return NextResponse.json({
      success: true,
      contentId,
      trailerYoutubeId,
    });
  } catch (error: any) {
    console.error('Trailer upload proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Trailer upload failed' },
      { status: 500 }
    );
  }
}
