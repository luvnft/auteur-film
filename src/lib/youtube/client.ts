import { google, youtube_v3 } from 'googleapis';
import { Readable } from 'stream';

// YouTube API client configuration
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const YOUTUBE_REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN;

// Create OAuth2 client
function getOAuth2Client() {
  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
    throw new Error('YouTube API credentials not configured');
  }

  const oauth2Client = new google.auth.OAuth2(
    YOUTUBE_CLIENT_ID,
    YOUTUBE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: YOUTUBE_REFRESH_TOKEN,
  });

  return oauth2Client;
}

// Get authenticated YouTube client
export function getYouTubeClient(): youtube_v3.Youtube {
  const auth = getOAuth2Client();
  return google.youtube({ version: 'v3', auth });
}

/**
 * Get a fresh access token for YouTube API
 * Used for resumable uploads
 */
export async function getAccessToken(): Promise<string> {
  const oauth2Client = getOAuth2Client();
  const { token } = await oauth2Client.getAccessToken();
  if (!token) {
    throw new Error('Failed to get YouTube access token');
  }
  return token;
}

/**
 * Initialize a YouTube resumable upload session
 * Returns the upload URI that can accept video data
 */
export async function initializeResumableUpload(
  contentId: string,
  fileSize: number,
  mimeType: string = 'video/mp4'
): Promise<string> {
  const accessToken = await getAccessToken();

  // Create the video metadata
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

  // Initialize resumable upload session
  const response = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Length': fileSize.toString(),
        'X-Upload-Content-Type': mimeType,
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to initialize YouTube upload: ${error}`);
  }

  // The resumable upload URI is in the Location header
  const uploadUri = response.headers.get('Location');
  if (!uploadUri) {
    throw new Error('No upload URI returned from YouTube');
  }

  return uploadUri;
}

export interface UploadVideoParams {
  title: string;
  description?: string;
  videoStream: Readable;
  mimeType?: string;
}

export interface UploadVideoResult {
  videoId: string;
  status: string;
}

/**
 * Upload a video to YouTube as unlisted
 * Returns the video ID once upload is complete
 */
export async function uploadVideo({
  title,
  description = '',
  videoStream,
  mimeType = 'video/mp4',
}: UploadVideoParams): Promise<UploadVideoResult> {
  const youtube = getYouTubeClient();

  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title,
        description,
        // Generic category for "Film & Animation"
        categoryId: '1',
      },
      status: {
        privacyStatus: 'unlisted',
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      mimeType,
      body: videoStream,
    },
  });

  if (!response.data.id) {
    throw new Error('YouTube upload failed: no video ID returned');
  }

  return {
    videoId: response.data.id,
    status: response.data.status?.uploadStatus || 'unknown',
  };
}

export interface VideoStatus {
  uploadStatus: string;
  processingStatus?: string;
  privacyStatus?: string;
  failureReason?: string;
  rejectionReason?: string;
}

/**
 * Get the processing status of a YouTube video
 */
export async function getVideoStatus(videoId: string): Promise<VideoStatus> {
  const youtube = getYouTubeClient();

  const response = await youtube.videos.list({
    part: ['status', 'processingDetails'],
    id: [videoId],
  });

  const video = response.data.items?.[0];
  if (!video) {
    throw new Error(`Video not found: ${videoId}`);
  }

  return {
    uploadStatus: video.status?.uploadStatus || 'unknown',
    processingStatus: video.processingDetails?.processingStatus || undefined,
    privacyStatus: video.status?.privacyStatus || undefined,
    failureReason: video.status?.failureReason || undefined,
    rejectionReason: video.status?.rejectionReason || undefined,
  };
}

/**
 * Check if a video has finished processing and is ready to play
 */
export async function isVideoReady(videoId: string): Promise<boolean> {
  const status = await getVideoStatus(videoId);

  // Video is ready when upload is complete and processing succeeded
  return (
    status.uploadStatus === 'processed' ||
    status.processingStatus === 'succeeded'
  );
}

/**
 * Delete a video from YouTube
 */
export async function deleteVideo(videoId: string): Promise<void> {
  const youtube = getYouTubeClient();

  await youtube.videos.delete({
    id: videoId,
  });
}

/**
 * Update video metadata (title, description)
 */
export async function updateVideoMetadata(
  videoId: string,
  title: string,
  description?: string
): Promise<void> {
  const youtube = getYouTubeClient();

  await youtube.videos.update({
    part: ['snippet'],
    requestBody: {
      id: videoId,
      snippet: {
        title,
        description: description || '',
        categoryId: '1',
      },
    },
  });
}

/**
 * Get video duration in seconds
 */
export async function getVideoDuration(videoId: string): Promise<number> {
  const youtube = getYouTubeClient();

  const response = await youtube.videos.list({
    part: ['contentDetails'],
    id: [videoId],
  });

  const video = response.data.items?.[0];
  if (!video?.contentDetails?.duration) {
    return 0;
  }

  // Parse ISO 8601 duration (e.g., "PT1H30M45S")
  const duration = video.contentDetails.duration;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}
