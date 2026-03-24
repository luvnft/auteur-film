'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/hooks/useUser';
import { useModal } from '@/hooks/useModal';
import { useSound } from '@/components/providers/SoundProvider';
import { createClient } from '@/lib/supabase/client';
import {
  Upload,
  Film,
  Tv,
  X,
  Plus,
  Check,
  AlertCircle,
  ArrowLeft,
  DollarSign,
  Calendar,
  Info,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import type { Series, UploadStatus } from '@/types/database';

type ContentType = 'film' | 'episode';
type UploadStep = 'type' | 'details' | 'uploading' | 'processing' | 'complete' | 'error';

const GENRES = [
  'AI-Generated',
  'Sci-Fi',
  'Drama',
  'Horror',
  'Comedy',
  'Documentary',
  'Experimental',
  'Animation',
  'Action',
  'Thriller',
  'Romance',
  'Fantasy',
];

const GENRE_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#9B5DE5', '#FF6B6B', '#4ECDC4', '#FFE66D', '#9B5DE5', '#FF6B6B', '#4ECDC4', '#FFE66D', '#9B5DE5'];

// Get user's timezone abbreviation (e.g., "EST", "PST", "GMT")
function getUserTimezone(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' });
    const parts = formatter.formatToParts(new Date());
    const tz = parts.find(p => p.type === 'timeZoneName');
    return tz?.value || Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'local time';
  }
}

const UPLOAD_STATUS_LABELS: Record<UploadStatus, string> = {
  draft: 'Preparing...',
  uploading_youtube: 'Uploading to Auteur...',
  processing: 'Processing video...',
  ready: 'Complete!',
  failed: 'Upload failed',
};

export default function PublishPage() {
  const router = useRouter();
  const { user, isCreator, isAuthenticated, isLoading } = useUser();
  const { playClick, playSuccess, playError } = useSound();
  const { showAlert, ModalComponent } = useModal();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<UploadStep>('type');
  const [contentType, setContentType] = useState<ContentType>('film');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('draft');
  const [createdContentId, setCreatedContentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [newSeriesTitle, setNewSeriesTitle] = useState('');
  const [showNewSeriesForm, setShowNewSeriesForm] = useState(false);

  // Pay-per-content fields
  const [priceCents, setPriceCents] = useState(0); // 0 = free
  const [isPaid, setIsPaid] = useState(false);
  const [priceInput, setPriceInput] = useState(''); // User-entered price string
  const [releaseDate, setReleaseDate] = useState<string>(''); // YYYY-MM-DD format
  const [releaseTime, setReleaseTime] = useState<string>('14:00'); // HH:MM format, default 2PM
  const [isScheduled, setIsScheduled] = useState(false);
  const [trailerFile, setTrailerFile] = useState<File | null>(null);
  const [trailerUploading, setTrailerUploading] = useState(false);
  const [trailerYoutubeId, setTrailerYoutubeId] = useState<string | null>(null);

  // Poll for processing status
  const pollStatus = useCallback(async (contentId: string) => {
    try {
      const response = await fetch(`/api/upload/status?contentId=${contentId}`);
      const data = await response.json();

      if (data.error) {
        setErrorMessage(data.error);
        setStep('error');
        playError();
        return;
      }

      setUploadStatus(data.status);

      if (data.status === 'ready') {
        setStep('complete');
        playSuccess();
      } else if (data.status === 'failed') {
        setErrorMessage(data.error || 'Upload failed');
        setStep('error');
        playError();
      } else {
        setTimeout(() => pollStatus(contentId), 3000);
      }
    } catch (error) {
      console.error('Status poll error:', error);
      setTimeout(() => pollStatus(contentId), 5000);
    }
  }, [playError, playSuccess]);

  // Fetch user's series
  const { data: userSeries } = useQuery({
    queryKey: ['user-series', user?.id],
    queryFn: async () => {
      if (!user?.id || !supabase) return [];
      const { data } = await supabase
        .from('series')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      return data as Series[];
    },
    enabled: !!user?.id && !!supabase && contentType === 'episode',
  });

  // Create new series
  const createSeries = useMutation({
    mutationFn: async () => {
      if (!user?.id || !newSeriesTitle.trim() || !supabase) return null;
      const { data, error } = await supabase
        .from('series')
        .insert({
          creator_id: user.id,
          title: newSeriesTitle.trim(),
          tags: selectedTags,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        playSuccess();
        setSelectedSeriesId(data.id);
        setShowNewSeriesForm(false);
        setNewSeriesTitle('');
        queryClient.invalidateQueries({ queryKey: ['user-series', user?.id] });
      }
    },
  });

  // Real upload flow - uploads through server proxy to YouTube
  const publishContent = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!supabase) throw new Error('Database not configured');
      // Video is only required for immediate release (not scheduled)
      if (!isScheduled && !videoFile) throw new Error('Video file required for immediate release');

      setStep('uploading');
      setUploadProgress(0);
      setUploadStatus('draft');
      setErrorMessage(null);

      let contentId: string;
      let youtubeVideoId: string | null = null;

      // If we have a video file, upload it through our server proxy
      if (videoFile) {
        // Step 1: Initialize upload - creates content record and prepares for upload
        const initiateResponse = await fetch('/api/upload/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            fileName: videoFile.name,
            fileSize: videoFile.size,
            contentType: videoFile.type,
          }),
        });

        const initiateData = await initiateResponse.json();
        if (initiateData.error) {
          throw new Error(initiateData.error);
        }

        contentId = initiateData.contentId;
        setCreatedContentId(contentId);
        setUploadStatus('uploading_youtube');
        setUploadProgress(5);

        // Step 2: Upload through server proxy (avoids CORS issues with YouTube)
        const uploadResponse = await fetch(
          `/api/upload/proxy?contentId=${contentId}&userId=${user.id}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': videoFile.type || 'video/mp4',
              'Content-Length': videoFile.size.toString(),
            },
            body: videoFile,
          }
        );

        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok || uploadResult.error) {
          throw new Error(uploadResult.error || 'Upload failed');
        }

        youtubeVideoId = uploadResult.youtubeVideoId;

        if (!youtubeVideoId) {
          throw new Error('Upload failed: no video ID returned');
        }

        setUploadProgress(70);
      } else {
        // Scheduled release without video - create content record directly
        const { data: newContent, error: createError } = await supabase
          .from('content')
          .insert({
            creator_id: user.id,
            type: contentType,
            title: title.trim(),
            series_id: contentType === 'episode' ? selectedSeriesId : null,
            upload_status: 'draft',
          })
          .select()
          .single();

        if (createError || !newContent) {
          throw new Error('Failed to create content record');
        }

        contentId = newContent.id;
        setCreatedContentId(contentId);
        setUploadProgress(50);
      }

      // Step 3: Upload thumbnail (still uses Supabase for images - small files)
      let thumbnailUrl = null;
      if (thumbnailFile) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('thumbnails')
          .upload(`${user.id}/${Date.now()}-${thumbnailFile.name}`, thumbnailFile);

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('thumbnails')
            .getPublicUrl(uploadData.path);
          thumbnailUrl = urlData.publicUrl;
        }
      }

      // Step 4: Handle trailer upload if we have one
      let trailerYoutubeIdToSave: string | null = null;
      if (trailerFile && contentId) {
        setTrailerUploading(true);
        try {
          const trailerResponse = await fetch(
            `/api/upload/trailer?contentId=${contentId}&userId=${user.id}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': trailerFile.type || 'video/mp4',
                'Content-Length': trailerFile.size.toString(),
              },
              body: trailerFile,
            }
          );

          const trailerResult = await trailerResponse.json();
          if (trailerResponse.ok && trailerResult.trailerYoutubeId) {
            trailerYoutubeIdToSave = trailerResult.trailerYoutubeId;
          } else {
            console.error('Trailer upload failed:', trailerResult.error);
          }
        } catch (err) {
          console.error('Trailer upload error:', err);
        }
        setTrailerUploading(false);
      }

      // Step 5: Update content metadata
      await supabase
        .from('content')
        .update({
          type: contentType,
          series_id: contentType === 'episode' ? selectedSeriesId : null,
          title: title.trim(),
          description: description.trim() || null,
          thumbnail_url: thumbnailUrl,
          release_notes: releaseNotes.trim() || null,
          tags: selectedTags,
          season_number: contentType === 'episode' ? seasonNumber : null,
          episode_number: contentType === 'episode' ? episodeNumber : null,
          // Pay-per-content fields
          price_cents: isPaid ? priceCents : 0,
          release_date: isScheduled && releaseDate ? new Date(`${releaseDate}T${releaseTime}`).toISOString() : null,
          trailer_youtube_id: trailerYoutubeIdToSave,
          // If no video file, mark as ready (nothing to process); otherwise continue with normal flow
          upload_status: !videoFile ? 'ready' : undefined,
          // Always set published_at so content appears in browse; release_date controls availability
          published_at: !videoFile ? new Date().toISOString() : undefined,
        })
        .eq('id', contentId);

      setUploadProgress(80);

      // If we uploaded a video, start polling for YouTube processing status
      if (videoFile && youtubeVideoId) {
        // The proxy route already updated the content record with the YouTube video ID
        // and set status to 'processing' - just poll for completion
        setUploadProgress(90);
        setUploadStatus('processing');
        setStep('processing');
        pollStatus(contentId);
      } else {
        // Scheduled without video - go directly to complete
        setUploadProgress(100);
        setStep('complete');
        playSuccess();
      }

      return { contentId };
    },
    onError: (error: Error) => {
      console.error('Publish error:', error);
      playError();
      setErrorMessage(error.message || 'Upload failed');
      setStep('error');
    },
  });

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024 * 1024) {
        showAlert('File Too Large', 'Video file must be under 10GB.');
        return;
      }
      const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        showAlert('Invalid Format', 'Please upload an MP4, MOV, AVI, or WebM file.');
        return;
      }
      playSuccess();
      setVideoFile(file);
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTag = (tag: string) => {
    playClick();
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handlePriceChange = (value: string) => {
    // Only allow numbers and one decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    let formatted = parts[0];
    if (parts.length > 1) {
      formatted += '.' + parts[1].slice(0, 2); // Max 2 decimal places
    }
    setPriceInput(formatted);

    // Convert to cents
    const dollars = parseFloat(formatted) || 0;
    const cents = Math.round(dollars * 100);
    // Clamp to valid range: $0.01 - $25.00
    setPriceCents(Math.min(Math.max(cents, 0), 2500));
  };

  const handleTrailerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) { // 500MB max for trailers
        showAlert('File Too Large', 'Trailer must be under 500MB.');
        return;
      }
      const validTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        showAlert('Invalid Format', 'Please upload an MP4, MOV, or WebM file.');
        return;
      }
      playSuccess();
      setTrailerFile(file);
    }
  };

  const handleRetry = () => {
    playClick();
    setStep('details');
    setErrorMessage(null);
    setUploadProgress(0);
    setUploadStatus('draft');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0]">
        <Header />
        <div className="pt-20 flex items-center justify-center h-[60vh]">
          <div className="h-16 w-16 border-4 border-[#FF6B6B] border-t-transparent animate-spin" style={{ animationTimingFunction: 'steps(8)' }} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FFF8F0]">
        <Header />
        <div className="pt-20 max-w-xl mx-auto px-4 py-20 text-center">
          <div className="card-retro-static inline-flex items-center justify-center h-20 w-20 mb-6 bg-[#FFE66D]">
            <Film className="h-10 w-10 text-[#1a1a1a]" />
          </div>
          <h1 className="text-2xl font-[var(--font-pixel)] tracking-wider mb-4">SIGN IN TO PUBLISH</h1>
          <p className="text-[#666] mb-8 font-medium">
            Sign in to start publishing your films and series.
          </p>
          <Link href="/">
            <Button variant="primary">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="min-h-screen bg-[#FFF8F0]">
        <Header />
        <div className="pt-20 max-w-xl mx-auto px-4 py-20 text-center">
          <div className="card-retro-static inline-flex items-center justify-center h-20 w-20 mb-6 bg-[#9B5DE5]">
            <Film className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-[var(--font-pixel)] tracking-wider mb-4">BECOME A CREATOR</h1>
          <p className="text-[#666] mb-8 font-medium">
            You need to register as a creator before publishing content.
          </p>
          <Link href="/become-creator">
            <Button variant="primary">Become a Creator</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <Header />

      <main className="pt-24 pb-12 px-4 max-w-3xl mx-auto">
        {/* Step 1: Select Content Type */}
        {step === 'type' && (
          <div>
            <h1 className="text-3xl font-[var(--font-pixel)] tracking-wider mb-2">PUBLISH</h1>
            <div className="h-1 w-20 bg-[#FF6B6B] mb-4" />
            <p className="text-[#666] mb-8 font-medium">
              What type of content are you publishing?
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => {
                  playClick();
                  setContentType('film');
                }}
                className={`p-6 border-3 border-[#1a1a1a] text-left transition-all ${
                  contentType === 'film'
                    ? 'bg-[#FF6B6B] text-white shadow-[0_0_0_#1a1a1a] translate-x-[4px] translate-y-[4px]'
                    : 'bg-white shadow-[4px_4px_0_#1a1a1a] hover:shadow-[6px_6px_0_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px]'
                }`}
              >
                <Film className={`h-10 w-10 mb-4 ${contentType === 'film' ? 'text-white' : 'text-[#FF6B6B]'}`} />
                <h3 className="text-lg font-bold mb-1">FILM</h3>
                <p className={`text-sm ${contentType === 'film' ? 'text-white/80' : 'text-[#666]'}`}>
                  A standalone short film or feature
                </p>
              </button>

              <button
                onClick={() => {
                  playClick();
                  setContentType('episode');
                }}
                className={`p-6 border-3 border-[#1a1a1a] text-left transition-all ${
                  contentType === 'episode'
                    ? 'bg-[#4ECDC4] text-[#1a1a1a] shadow-[0_0_0_#1a1a1a] translate-x-[4px] translate-y-[4px]'
                    : 'bg-white shadow-[4px_4px_0_#1a1a1a] hover:shadow-[6px_6px_0_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px]'
                }`}
              >
                <Tv className={`h-10 w-10 mb-4 ${contentType === 'episode' ? 'text-[#1a1a1a]' : 'text-[#4ECDC4]'}`} />
                <h3 className="text-lg font-bold mb-1">SERIES EPISODE</h3>
                <p className={`text-sm ${contentType === 'episode' ? 'text-[#1a1a1a]/70' : 'text-[#666]'}`}>
                  An episode of an ongoing series
                </p>
              </button>
            </div>

            <Button variant="primary" onClick={() => { playClick(); setStep('details'); }}>
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Content Details */}
        {step === 'details' && (
          <div>
            <button
              onClick={() => { playClick(); setStep('type'); }}
              className="flex items-center text-[#666] hover:text-[#1a1a1a] mb-4 text-sm font-bold"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>

            <h1 className="text-3xl font-[var(--font-pixel)] tracking-wider mb-2">
              {contentType === 'film' ? 'FILM' : 'EPISODE'} DETAILS
            </h1>
            <div className="h-1 w-20 bg-[#4ECDC4] mb-8" />

            <div className="space-y-6">
              {/* Pricing - MOVED TO TOP */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-3">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Pricing
                </label>
                <div className="flex gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setIsPaid(false);
                      setPriceCents(0);
                      setPriceInput('');
                    }}
                    className={`flex-1 py-3 px-4 border-3 border-[#1a1a1a] font-bold text-sm uppercase transition-all ${
                      !isPaid
                        ? 'bg-[#4ECDC4] text-white shadow-[0_0_0_#1a1a1a] translate-x-[3px] translate-y-[3px]'
                        : 'bg-white shadow-[3px_3px_0_#1a1a1a] hover:shadow-[4px_4px_0_#1a1a1a]'
                    }`}
                  >
                    FREE
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setIsPaid(true);
                      if (!priceInput) {
                        setPriceInput('4.99');
                        setPriceCents(499);
                      }
                    }}
                    className={`flex-1 py-3 px-4 border-3 border-[#1a1a1a] font-bold text-sm uppercase transition-all ${
                      isPaid
                        ? 'bg-[#FFE66D] text-[#1a1a1a] shadow-[0_0_0_#1a1a1a] translate-x-[3px] translate-y-[3px]'
                        : 'bg-white shadow-[3px_3px_0_#1a1a1a] hover:shadow-[4px_4px_0_#1a1a1a]'
                    }`}
                  >
                    PAID
                  </button>
                </div>
                {isPaid && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold">$</span>
                      <input
                        type="text"
                        value={priceInput}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        placeholder="4.99"
                        className="input-retro w-32 text-center text-lg font-bold"
                      />
                      <span className="text-sm text-[#666]">one-time purchase</span>
                    </div>
                    <p className="text-xs text-[#999]">
                      Price range: $0.01 - $25.00 • 2% platform fee on purchases
                    </p>
                  </div>
                )}
              </div>

              {/* Release - MOVED TO TOP */}
              <div className="border-t-3 border-[#1a1a1a] pt-6">
                <label className="block text-sm font-bold uppercase tracking-wide mb-3">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Release
                </label>
                <div className="flex gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setIsScheduled(false);
                      setReleaseDate('');
                      setReleaseTime('14:00');
                    }}
                    className={`flex-1 py-3 px-4 border-3 border-[#1a1a1a] font-bold text-sm uppercase transition-all ${
                      !isScheduled
                        ? 'bg-[#4ECDC4] text-white shadow-[0_0_0_#1a1a1a] translate-x-[3px] translate-y-[3px]'
                        : 'bg-white shadow-[3px_3px_0_#1a1a1a] hover:shadow-[4px_4px_0_#1a1a1a]'
                    }`}
                  >
                    RELEASE NOW
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setIsScheduled(true);
                      // Default to 7 days from now at 2PM local time
                      const defaultDate = new Date();
                      defaultDate.setDate(defaultDate.getDate() + 7);
                      setReleaseDate(defaultDate.toISOString().split('T')[0]);
                      setReleaseTime('14:00'); // 2PM default
                    }}
                    className={`flex-1 py-3 px-4 border-3 border-[#1a1a1a] font-bold text-sm uppercase transition-all ${
                      isScheduled
                        ? 'bg-[#9B5DE5] text-white shadow-[0_0_0_#1a1a1a] translate-x-[3px] translate-y-[3px]'
                        : 'bg-white shadow-[3px_3px_0_#1a1a1a] hover:shadow-[4px_4px_0_#1a1a1a]'
                    }`}
                  >
                    SCHEDULE
                  </button>
                </div>
                {isScheduled && (
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-bold uppercase tracking-wide mb-1 text-[#666]">
                        Date
                      </label>
                      <input
                        type="date"
                        value={releaseDate}
                        onChange={(e) => setReleaseDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="input-retro w-full"
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-bold uppercase tracking-wide mb-1 text-[#666]">
                        <Clock className="inline h-3 w-3 mr-1" />
                        Time
                      </label>
                      <input
                        type="time"
                        value={releaseTime}
                        onChange={(e) => setReleaseTime(e.target.value)}
                        className="input-retro w-full"
                      />
                    </div>
                    <div className="pb-3">
                      <span className="text-sm font-bold text-[#9B5DE5]">{getUserTimezone()}</span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-[#999] mt-2">
                  {isScheduled
                    ? 'Content will be visible as "Coming Soon" until the release date. Video file is optional for scheduled releases.'
                    : 'Content will be published immediately after processing.'}
                </p>
              </div>

              {/* Video Upload */}
              <div className="border-t-3 border-[#1a1a1a] pt-6">
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">
                  Video File {!isScheduled && '*'}
                  {isScheduled && <span className="text-[#666] font-normal ml-1">(optional for scheduled)</span>}
                </label>
                {videoFile ? (
                  <div className="flex items-center gap-4 p-4 card-retro-static bg-white">
                    <div className="h-12 w-12 bg-[#4ECDC4] border-2 border-[#1a1a1a] flex items-center justify-center">
                      <Film className="h-6 w-6 text-[#1a1a1a]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{videoFile.name}</p>
                      <p className="text-sm text-[#666]">
                        {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => { playClick(); setVideoFile(null); }}
                      className="p-2 border-2 border-[#1a1a1a] hover:bg-[#FF6B6B] hover:text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 border-3 border-dashed border-[#1a1a1a] cursor-pointer hover:bg-[#FFF1E6] transition-colors bg-white">
                    <Upload className="h-10 w-10 text-[#666] mb-2" />
                    <span className="text-sm text-[#666] font-bold">
                      Click to upload video (max 10GB)
                    </span>
                    <span className="text-xs text-[#999] mt-1">
                      MP4, MOV, AVI, or WebM
                    </span>
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                      className="hidden"
                      onChange={handleVideoSelect}
                    />
                  </label>
                )}
              </div>

              {/* Trailer - NOW BELOW VIDEO FILE */}
              <div className="p-4 bg-[#FFF1E6] border-3 border-[#1a1a1a]">
                <div className="flex items-start gap-2 mb-3">
                  <Info className="h-5 w-5 text-[#9B5DE5] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">
                      Add a trailer {isScheduled && '(recommended for scheduled releases)'}
                    </p>
                    <p className="text-xs text-[#666]">
                      A trailer lets fans preview your content and builds anticipation
                    </p>
                  </div>
                </div>
                {trailerFile ? (
                  <div className="flex items-center gap-3 p-3 bg-white border-2 border-[#1a1a1a]">
                    <Film className="h-5 w-5 text-[#9B5DE5]" />
                    <span className="flex-1 truncate text-sm font-medium">{trailerFile.name}</span>
                    <button
                      onClick={() => {
                        playClick();
                        setTrailerFile(null);
                      }}
                      className="p-1 hover:bg-[#FF6B6B] hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-[#1a1a1a] cursor-pointer hover:bg-white transition-colors">
                    <Upload className="h-4 w-4 text-[#666]" />
                    <span className="text-sm font-bold text-[#666]">Upload trailer (max 500MB)</span>
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm"
                      className="hidden"
                      onChange={handleTrailerSelect}
                    />
                  </label>
                )}
              </div>

              {/* Title */}
              <div className="border-t-3 border-[#1a1a1a] pt-6">
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title"
                  className="input-retro w-full"
                />
              </div>

              {/* Series Selection (for episodes) */}
              {contentType === 'episode' && (
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wide mb-2">Series *</label>
                  {showNewSeriesForm ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSeriesTitle}
                        onChange={(e) => setNewSeriesTitle(e.target.value)}
                        placeholder="New series title"
                        className="input-retro flex-1"
                      />
                      <Button
                        variant="primary"
                        onClick={() => createSeries.mutate()}
                        isLoading={createSeries.isPending}
                      >
                        Create
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => { playClick(); setShowNewSeriesForm(false); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={selectedSeriesId || ''}
                        onChange={(e) => setSelectedSeriesId(e.target.value || null)}
                        className="input-retro w-full"
                      >
                        <option value="">Select a series</option>
                        {userSeries?.map((series) => (
                          <option key={series.id} value={series.id}>
                            {series.title}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => { playClick(); setShowNewSeriesForm(true); }}
                        className="flex items-center gap-2 text-sm text-[#FF6B6B] hover:underline font-bold"
                      >
                        <Plus className="h-4 w-4" />
                        Create new series
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-wide mb-2">Season</label>
                      <input
                        type="number"
                        min={1}
                        value={seasonNumber}
                        onChange={(e) => setSeasonNumber(Number(e.target.value))}
                        className="input-retro w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-wide mb-2">Episode</label>
                      <input
                        type="number"
                        min={1}
                        value={episodeNumber}
                        onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                        className="input-retro w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Thumbnail */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Thumbnail</label>
                <div className="flex gap-4">
                  {thumbnailPreview ? (
                    <div className="relative w-40 aspect-video border-3 border-[#1a1a1a] overflow-hidden">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => {
                          playClick();
                          setThumbnailFile(null);
                          setThumbnailPreview(null);
                        }}
                        className="absolute top-1 right-1 p-1 bg-[#FF6B6B] border-2 border-[#1a1a1a]"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center w-40 aspect-video border-3 border-dashed border-[#1a1a1a] cursor-pointer hover:bg-[#FFF1E6] transition-colors bg-white">
                      <Plus className="h-8 w-8 text-[#666]" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleThumbnailSelect}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers about your content..."
                  rows={4}
                  className="input-retro w-full resize-none"
                />
              </div>

              {/* Director's Notes */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Director's Notes</label>
                <textarea
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  placeholder="Share your creative process, inspiration, behind-the-scenes..."
                  rows={4}
                  className="input-retro w-full resize-none"
                />
              </div>

              {/* Tags */}
              <div className="border-t-3 border-[#1a1a1a] pt-6">
                <label className="block text-sm font-bold uppercase tracking-wide mb-2">Tags (up to 5)</label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((tag, index) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 text-sm font-bold uppercase tracking-wide border-3 border-[#1a1a1a] transition-all ${
                        selectedTags.includes(tag)
                          ? 'shadow-[0_0_0_#1a1a1a] translate-x-[2px] translate-y-[2px] text-white'
                          : 'shadow-[2px_2px_0_#1a1a1a] hover:shadow-[3px_3px_0_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] bg-white'
                      }`}
                      style={{
                        background: selectedTags.includes(tag) ? GENRE_COLORS[index % GENRE_COLORS.length] : undefined
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="primary"
                  onClick={() => publishContent.mutate()}
                  disabled={
                    // Video required only if Release Now (not scheduled)
                    (!isScheduled && !videoFile) ||
                    !title.trim() ||
                    (contentType === 'episode' && !selectedSeriesId) ||
                    // If scheduled, must have a release date
                    (isScheduled && !releaseDate)
                  }
                  isLoading={publishContent.isPending}
                  className="flex-1"
                >
                  {isScheduled ? 'Schedule' : 'Publish'} {contentType === 'film' ? 'Film' : 'Episode'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Uploading */}
        {step === 'uploading' && (
          <div className="text-center py-20">
            <div className="h-20 w-20 border-4 border-[#FF6B6B] border-t-transparent mx-auto mb-6 animate-spin" style={{ animationTimingFunction: 'steps(8)' }} />
            <h2 className="text-2xl font-[var(--font-pixel)] tracking-wider mb-2">UPLOADING</h2>
            <p className="text-[#666] mb-2 font-medium">
              {UPLOAD_STATUS_LABELS[uploadStatus]}
            </p>
            <p className="text-sm text-[#999] mb-6">
              Please keep this page open. Large files may take several minutes.
            </p>
            <div className="max-w-md mx-auto">
              <div className="h-4 bg-white border-3 border-[#1a1a1a] overflow-hidden">
                <div
                  className="h-full bg-[#4ECDC4] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-[#666] mt-2 font-bold">{uploadProgress}% complete</p>
            </div>
          </div>
        )}

        {/* Step 4: Processing */}
        {step === 'processing' && (
          <div className="text-center py-20">
            <div className="h-20 w-20 border-4 border-[#9B5DE5] border-t-transparent mx-auto mb-6 animate-spin" style={{ animationTimingFunction: 'steps(8)' }} />
            <h2 className="text-2xl font-[var(--font-pixel)] tracking-wider mb-2">PROCESSING</h2>
            <p className="text-[#666] mb-2 font-medium">
              Your video is being processed for streaming.
            </p>
            <p className="text-sm text-[#999] mb-6">
              This can take a few minutes. You can leave this page.
            </p>
            <div className="max-w-md mx-auto card-retro-static bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 border-2 border-[#9B5DE5] border-t-transparent animate-spin" style={{ animationTimingFunction: 'steps(8)' }} />
                <span className="text-sm font-medium">{UPLOAD_STATUS_LABELS[uploadStatus]}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === 'complete' && (
          <div className="text-center py-20">
            <div className="h-24 w-24 bg-[#4ECDC4] border-4 border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a] flex items-center justify-center mx-auto mb-6 animate-bounce-retro">
              <Check className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-[var(--font-pixel)] tracking-wider mb-2">PUBLISHED!</h2>
            <p className="text-[#666] mb-8 font-medium">
              Your content is now live on Auteur.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {createdContentId && (
                <Link href={`/content/${createdContentId}`}>
                  <Button variant="primary">View Content</Button>
                </Link>
              )}
              <Link href="/profile">
                <Button variant="outline">My Profile</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Error State */}
        {step === 'error' && (
          <div className="text-center py-20">
            <div className="h-24 w-24 bg-[#FF6B6B] border-4 border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a] flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-[var(--font-pixel)] tracking-wider mb-2">UPLOAD FAILED</h2>
            <p className="text-[#666] mb-4 font-medium">
              {errorMessage || 'Something went wrong during the upload.'}
            </p>
            <p className="text-sm text-[#999] mb-8">
              Please try again. If the problem persists, contact support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" onClick={handleRetry}>Try Again</Button>
              <Link href="/profile">
                <Button variant="outline">My Profile</Button>
              </Link>
            </div>
          </div>
        )}
      </main>

      <ModalComponent />
    </div>
  );
}
