import { createClient } from '@supabase/supabase-js';
import { getVideoStatus, isVideoReady, getVideoDuration, deleteVideo } from './client';

// Server-side Supabase client with service role
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, serviceKey);
}

export type UploadStatus =
  | 'draft'
  | 'uploading_youtube'
  | 'processing'
  | 'ready'
  | 'failed';

export interface UploadProgress {
  contentId: string;
  status: UploadStatus;
  youtubeVideoId?: string;
  error?: string;
  durationSeconds?: number;
}

/**
 * Check YouTube processing status and update database
 */
export async function checkProcessingStatus(
  contentId: string,
  youtubeVideoId: string
): Promise<UploadProgress> {
  const supabase = getServiceClient();

  try {
    const ready = await isVideoReady(youtubeVideoId);

    if (ready) {
      // Get video duration
      const durationSeconds = await getVideoDuration(youtubeVideoId);

      // Update to ready status and publish
      await supabase
        .from('content')
        .update({
          upload_status: 'ready',
          duration_seconds: durationSeconds,
          published_at: new Date().toISOString(),
        })
        .eq('id', contentId);

      return {
        contentId,
        status: 'ready',
        youtubeVideoId,
        durationSeconds,
      };
    }

    // Still processing
    const status = await getVideoStatus(youtubeVideoId);

    // Check for failures
    if (status.uploadStatus === 'failed' || status.uploadStatus === 'rejected') {
      const errorMessage = status.failureReason || status.rejectionReason || 'Processing failed';

      await supabase
        .from('content')
        .update({
          upload_status: 'failed',
          upload_error: errorMessage,
        })
        .eq('id', contentId);

      return {
        contentId,
        status: 'failed',
        error: errorMessage,
      };
    }

    return {
      contentId,
      status: 'processing',
      youtubeVideoId,
    };
  } catch (error: any) {
    return {
      contentId,
      status: 'processing',
      youtubeVideoId,
      error: error.message,
    };
  }
}

/**
 * Delete video from YouTube and cleanup database
 * No longer needs to cleanup video storage since videos stream directly to YouTube
 */
export async function deleteContent(
  contentId: string,
  youtubeVideoId: string | null,
  thumbnailUrl: string | null
): Promise<void> {
  const supabase = getServiceClient();

  // Delete from YouTube if uploaded
  if (youtubeVideoId) {
    try {
      await deleteVideo(youtubeVideoId);
    } catch (error) {
      console.error('Failed to delete from YouTube:', error);
      // Continue with other cleanup
    }
  }

  // Delete thumbnail if exists (thumbnails still use Supabase storage)
  if (thumbnailUrl) {
    try {
      // Extract path from URL
      const urlParts = thumbnailUrl.split('/storage/v1/object/public/');
      if (urlParts.length > 1) {
        const pathParts = urlParts[1].split('/');
        const bucket = pathParts[0];
        const path = pathParts.slice(1).join('/');
        await supabase.storage.from(bucket).remove([path]);
      }
    } catch (error) {
      console.error('Failed to delete thumbnail:', error);
    }
  }

  // Delete content record
  await supabase.from('content').delete().eq('id', contentId);
}
