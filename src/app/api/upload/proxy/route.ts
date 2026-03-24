import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAccessToken } from '@/lib/youtube/client';

// Server-side Supabase client with service role
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, serviceKey);
}

// Note: For large files (>4.5MB on Vercel), consider using a different approach:
// - Upload to Supabase Storage first, then transfer to YouTube via background job
// - Or use a dedicated server/container for large file uploads
// This streaming approach works well for smaller files and local development

/**
 * Proxy upload to YouTube
 * This route receives the video file from the browser and uploads it to YouTube server-side,
 * bypassing CORS restrictions.
 *
 * For large files, we use streaming to avoid memory issues.
 */
export async function POST(request: NextRequest) {
  try {
    // Get contentId from URL params
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
      .select('id, creator_id, upload_status')
      .eq('id', contentId)
      .single();

    if (contentError || !content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    if (content.creator_id !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get the video file from the request
    const contentType = request.headers.get('content-type') || 'video/mp4';
    const contentLength = request.headers.get('content-length');

    if (!contentLength) {
      return NextResponse.json(
        { error: 'Content-Length header required' },
        { status: 400 }
      );
    }

    const fileSize = parseInt(contentLength, 10);

    // Get a fresh YouTube access token
    const accessToken = await getAccessToken();

    // Initialize YouTube resumable upload
    const metadata = {
      snippet: {
        title: `auteur-${contentId}`,
        description: `Content ID: ${contentId}`,
        categoryId: '1', // Film & Animation
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
      console.error('YouTube init error:', error);
      return NextResponse.json(
        { error: `Failed to initialize YouTube upload: ${error}` },
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

    // Update content status
    await supabase
      .from('content')
      .update({ upload_status: 'uploading_youtube' })
      .eq('id', contentId);

    // Stream the video to YouTube
    // We need to get the request body as a stream
    const requestBody = request.body;
    if (!requestBody) {
      return NextResponse.json(
        { error: 'No video data in request' },
        { status: 400 }
      );
    }

    // Upload to YouTube using the resumable upload URL
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
      console.error('YouTube upload error:', errorText);

      // Mark as failed
      await supabase
        .from('content')
        .update({
          upload_status: 'failed',
          upload_error: errorText,
        })
        .eq('id', contentId);

      return NextResponse.json(
        { error: `YouTube upload failed: ${errorText}` },
        { status: 500 }
      );
    }

    // Parse the YouTube response
    const youtubeResult = await uploadResponse.json();
    const youtubeVideoId = youtubeResult.id;

    if (!youtubeVideoId) {
      await supabase
        .from('content')
        .update({
          upload_status: 'failed',
          upload_error: 'No video ID returned from YouTube',
        })
        .eq('id', contentId);

      return NextResponse.json(
        { error: 'No video ID returned from YouTube' },
        { status: 500 }
      );
    }

    // Update content with YouTube video ID
    await supabase
      .from('content')
      .update({
        youtube_video_id: youtubeVideoId,
        upload_status: 'processing',
      })
      .eq('id', contentId);

    return NextResponse.json({
      success: true,
      contentId,
      youtubeVideoId,
      status: 'processing',
    });

  } catch (error: any) {
    console.error('Upload proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
