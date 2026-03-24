'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { YouTubePlayer } from '@/components/player/YouTubePlayer';
import { Button } from '@/components/ui/Button';
import { TipModal } from '@/components/payments/TipModal';
import { ReportModal } from '@/components/content/ReportModal';
import { useUser } from '@/hooks/useUser';
import { useModal } from '@/hooks/useModal';
import { useSound } from '@/components/providers/SoundProvider';
import { createClient } from '@/lib/supabase/client';
import {
  DollarSign,
  Pin,
  Share2,
  Trophy,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  User,
  Film,
  Sparkles,
  Flag,
  Clock,
  Lock,
  ShoppingCart,
  Trash2,
} from 'lucide-react';

// Helper functions for content access
function isReleased(content: Content): boolean {
  return !content.release_date || new Date(content.release_date) <= new Date();
}

function isPreRelease(content: Content): boolean {
  return !!content.release_date && new Date(content.release_date) > new Date();
}

function isFree(content: Content): boolean {
  return (content.price_cents ?? 0) === 0;
}

function formatPrice(cents: number): string {
  if (cents === 0) return 'FREE';
  return `$${(cents / 100).toFixed(2)}`;
}

function getTimeUntilRelease(releaseDate: string): string {
  const now = new Date();
  const release = new Date(releaseDate);
  const diff = release.getTime() - now.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return 'Soon';
}
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Content, Comment, LeaderboardScore } from '@/types/database';

interface ContentPageProps {
  params: Promise<{ id: string }>;
}

export default function ContentPage({ params }: ContentPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, hasActiveSubscription, isAuthenticated } = useUser();
  const { playClick, playSuccess, playError } = useSound();
  const { showAlert, showConfirm, ModalComponent } = useModal();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [showTipModal, setShowTipModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch content
  const { data: content, isLoading } = useQuery({
    queryKey: ['content', id],
    queryFn: async () => {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('content')
        .select('*, creator:users!content_creator_id_fkey(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Content & { creator: NonNullable<Content['creator']> };
    },
    enabled: !!supabase,
  });

  // Fetch leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard', id],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('leaderboard_scores')
        .select('*, user:users(id, display_name, avatar_url)')
        .eq('content_id', id)
        .order('score', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as (LeaderboardScore & { user: NonNullable<LeaderboardScore['user']> })[];
    },
    enabled: !!id && !!supabase,
  });

  // Fetch comments
  const { data: comments } = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('comments')
        .select('*, user:users!comments_user_id_fkey(id, display_name, avatar_url)')
        .eq('content_id', id)
        .is('parent_id', null)
        .order('upvotes', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as (Comment & { user: NonNullable<Comment['user']> })[];
    },
    enabled: !!id && !!supabase,
  });

  // Check if user has pinned this content
  const { data: isPinned } = useQuery({
    queryKey: ['user-pin', id, user?.id],
    queryFn: async () => {
      if (!user?.id || !supabase) return false;
      const { data } = await supabase
        .from('user_pins')
        .select('content_id')
        .eq('user_id', user.id)
        .eq('content_id', id)
        .single();
      return !!data;
    },
    enabled: !!user?.id && !!supabase,
  });

  // Check if user has purchased this content
  const { data: hasPurchased } = useQuery({
    queryKey: ['user-purchase', id, user?.id],
    queryFn: async () => {
      if (!user?.id || !supabase) return false;
      const { data } = await supabase
        .from('content_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_id', id)
        .single();
      return !!data;
    },
    enabled: !!user?.id && !!supabase,
  });

  // Track view completion
  const trackView = useMutation({
    mutationFn: async () => {
      if (!user?.id || !supabase) return;
      await supabase.from('content_views').upsert({
        user_id: user.id,
        content_id: id,
        completed: true,
        watch_time_seconds: content?.duration_seconds || 0,
      });
    },
    onSuccess: () => {
      playSuccess();
      queryClient.invalidateQueries({ queryKey: ['leaderboard', id] });
    },
  });

  // Pin content
  const togglePin = useMutation({
    mutationFn: async () => {
      if (!user?.id || !supabase) return;

      if (isPinned) {
        await supabase
          .from('user_pins')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', id);
      } else {
        // Find next available position
        const { data: pins } = await supabase
          .from('user_pins')
          .select('position')
          .eq('user_id', user.id)
          .order('position');

        const usedPositions = new Set(pins?.map((p: { position: number }) => p.position) || []);
        let nextPosition = 1;
        while (usedPositions.has(nextPosition) && nextPosition <= 5) {
          nextPosition++;
        }

        if (nextPosition > 5) {
          throw new Error('Top 5 is full. Remove one to add another.');
        }

        await supabase.from('user_pins').insert({
          user_id: user.id,
          content_id: id,
          position: nextPosition,
        });
      }
    },
    onSuccess: () => {
      playSuccess();
      queryClient.invalidateQueries({ queryKey: ['user-pin', id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard', id] });
    },
  });

  // Post comment
  const postComment = useMutation({
    mutationFn: async () => {
      if (!user?.id || !commentText.trim() || !supabase) return;
      await supabase.from('comments').insert({
        content_id: id,
        user_id: user.id,
        body: commentText.trim(),
        is_pinned: false,
      });
    },
    onSuccess: () => {
      playSuccess();
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
    },
  });

  // Vote on comment
  const voteComment = useMutation({
    mutationFn: async ({ commentId, vote }: { commentId: string; vote: 1 | -1 }) => {
      if (!user?.id || !supabase) return;

      // Get existing vote if any
      const { data: existingVote } = await supabase
        .from('comment_votes')
        .select('vote')
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
        .single();

      const previousVote = existingVote?.vote || 0;

      // If clicking the same vote, remove it (toggle off)
      if (previousVote === vote) {
        await supabase
          .from('comment_votes')
          .delete()
          .eq('user_id', user.id)
          .eq('comment_id', commentId);

      } else {
        // Upsert the vote
        await supabase.from('comment_votes').upsert({
          user_id: user.id,
          comment_id: commentId,
          vote,
        });
      }
      // Note: comment upvotes/downvotes counts are updated automatically
      // by the trigger_comment_votes database trigger on comment_votes table
    },
    onSuccess: () => {
      playClick();
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
    },
  });

  // Delete comment
  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      if (!user?.id || !supabase || !content) return;

      // Get the comment to verify ownership
      const { data: comment } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (!comment) throw new Error('Comment not found');

      // Can delete if: comment owner OR content owner
      const canDelete = comment.user_id === user.id || content.creator_id === user.id;
      if (!canDelete) throw new Error('Not authorized to delete this comment');

      // Delete associated votes first
      await supabase
        .from('comment_votes')
        .delete()
        .eq('comment_id', commentId);

      // Delete the comment
      await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
    },
    onSuccess: () => {
      playSuccess();
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
    },
  });

  // Delete content (for creators only)
  const handleDeleteContent = () => {
    if (!user?.id || !content) return;

    showConfirm({
      title: `Delete "${content.title}"?`,
      description: 'This will permanently remove the video and all associated data. This action cannot be undone.',
      variant: 'destructive',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          const response = await fetch('/api/content/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contentId: content.id,
              userId: user.id,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to delete content');
          }

          playSuccess();
          router.push('/profile');
        } catch (error: any) {
          console.error('Delete content error:', error);
          playError();
          showAlert('Delete Failed', error.message || 'Failed to delete content');
          setIsDeleting(false);
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0]">
        <Header />
        <div className="pt-20 flex items-center justify-center h-[60vh]">
          <div className="h-14 w-14 border-4 border-[#1a1a1a] border-t-[#FF6B6B] shadow-[4px_4px_0_#1a1a1a] animate-spin" />
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-[#FFF8F0]">
        <Header />
        <div className="pt-20 max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="card-retro-static inline-flex items-center justify-center h-20 w-20 mb-6 bg-[#FFE66D]">
            <Film className="h-10 w-10 text-[#1a1a1a]" />
          </div>
          <h1 className="text-2xl font-bold font-[var(--font-pixel)] tracking-wider mb-4">
            CONTENT NOT FOUND
          </h1>
          <p className="text-[#666] mb-8 font-medium">
            This content may have been removed or is not available.
          </p>
          <Link href="/browse">
            <Button variant="primary">Browse Content</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Access control logic
  const isCreator = user?.id === content.creator_id;
  const released = isReleased(content);
  const preRelease = isPreRelease(content);
  const free = isFree(content);
  const priceCents = content.price_cents ?? 0;

  // Can watch full video if:
  // - Creator (always)
  // - OR content is released AND (free + logged in OR purchased)
  const canWatch = isCreator || (released && (free ? isAuthenticated : hasPurchased));

  // Show trailer when:
  // - No main video exists yet (scheduled release) and trailer is available, OR
  // - User can't watch the full video but trailer exists
  const hasMainVideo = !!content.youtube_video_id;
  const showTrailer = content.trailer_youtube_id && (!hasMainVideo || !canWatch);

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <Header />

      <main className="pt-20 pb-12">
        {/* Video Player */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="border-4 border-[#1a1a1a] shadow-[6px_6px_0_#1a1a1a] overflow-hidden bg-[#1a1a1a]">
            {canWatch && hasMainVideo ? (
              // Full video for authorized users
              <YouTubePlayer
                videoId={content.youtube_video_id!}
                onComplete={() => trackView.mutate()}
              />
            ) : showTrailer ? (
              // Trailer (for pre-release content or non-authorized users)
              <div className="relative">
                <YouTubePlayer
                  videoId={content.trailer_youtube_id!}
                  onComplete={() => {}}
                />
                <div className="absolute top-4 left-4 px-3 py-1 bg-[#9B5DE5] border-2 border-[#1a1a1a] text-white text-sm font-bold">
                  TRAILER
                </div>
              </div>
            ) : (
              // Access gate overlay
              <div className="aspect-video bg-gradient-to-br from-[#1a1a1a] to-[#333] flex flex-col items-center justify-center text-white relative">
                {content.thumbnail_url && (
                  <img
                    src={content.thumbnail_url}
                    alt={content.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                  />
                )}
                <div className="relative z-10 text-center p-8">
                  {preRelease ? (
                    // Pre-release content
                    <>
                      <div className="h-16 w-16 bg-[#9B5DE5] border-3 border-white mx-auto mb-4 flex items-center justify-center">
                        <Clock className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-bold font-[var(--font-pixel)] tracking-wider mb-2">
                        COMING SOON
                      </h3>
                      <p className="text-white/80 mb-4">
                        Releases in {getTimeUntilRelease(content.release_date!)}
                      </p>
                      <p className="text-sm text-white/60">
                        Tip now to get on the leaderboard early!
                      </p>
                    </>
                  ) : !isAuthenticated ? (
                    // Not logged in
                    <>
                      <div className="h-16 w-16 bg-[#FF6B6B] border-3 border-white mx-auto mb-4 flex items-center justify-center">
                        <Lock className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-bold font-[var(--font-pixel)] tracking-wider mb-2">
                        {free ? 'LOGIN TO WATCH' : `LOGIN TO PURCHASE`}
                      </h3>
                      <p className="text-white/80 mb-4">
                        {free ? 'This content is free! Just sign in to watch.' : `Purchase for ${formatPrice(priceCents)}`}
                      </p>
                    </>
                  ) : !hasPurchased && !free ? (
                    // Logged in but needs to purchase
                    <>
                      <div className="h-16 w-16 bg-[#FFE66D] border-3 border-white mx-auto mb-4 flex items-center justify-center">
                        <ShoppingCart className="h-8 w-8 text-[#1a1a1a]" />
                      </div>
                      <h3 className="text-xl font-bold font-[var(--font-pixel)] tracking-wider mb-2">
                        PURCHASE TO WATCH
                      </h3>
                      <p className="text-white/80 mb-4">
                        One-time purchase: {formatPrice(priceCents)}
                      </p>
                      <Button
                        variant="accent"
                        onClick={() => {
                          playClick();
                          showAlert('Coming Soon', 'Purchase flow is coming soon!');
                        }}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Buy Now - {formatPrice(priceCents)}
                      </Button>
                    </>
                  ) : (
                    // Video not available
                    <p className="text-[#666] font-medium">Video not available</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Release date banner for pre-release content */}
        {preRelease && (
          <div className="max-w-6xl mx-auto px-4 mt-4">
            <div className="flex items-center gap-3 px-5 py-3 bg-[#9B5DE5] border-4 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] text-white">
              <Clock className="h-5 w-5 shrink-0" />
              <span className="font-bold text-sm uppercase tracking-wide">
                Releases {new Date(content.release_date!).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-white/70 text-sm ml-auto font-medium">
                {getTimeUntilRelease(content.release_date!)} away
              </span>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 mt-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title & Actions */}
              <div className="card-retro-static p-6 bg-white">
                <h1 className="text-2xl font-bold font-[var(--font-pixel)] tracking-wider mb-4">
                  {content.title}
                </h1>

                {/* Creator info */}
                <Link
                  href={`/creator/${content.creator.id}`}
                  className="flex items-center gap-3 py-3 px-4 border-3 border-[#1a1a1a] bg-[#FFF8F0] hover:bg-[#FFE66D] transition-colors"
                  onClick={playClick}
                >
                  {content.creator.avatar_url ? (
                    <img
                      src={content.creator.avatar_url}
                      alt={content.creator.display_name || ''}
                      className="h-12 w-12 border-2 border-[#1a1a1a] object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-[#9B5DE5] border-2 border-[#1a1a1a] flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold">{content.creator.display_name}</p>
                    <p className="text-sm text-[#666] font-medium">
                      {content.view_count.toLocaleString()} views
                    </p>
                  </div>
                </Link>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 mt-6">
                  <Button
                    variant="primary"
                    onClick={() => {
                      playClick();
                      setShowTipModal(true);
                    }}
                    disabled={!isAuthenticated}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Tip Creator
                  </Button>

                  <Button
                    variant={isPinned ? 'primary' : 'secondary'}
                    onClick={() => {
                      playClick();
                      togglePin.mutate();
                    }}
                    disabled={!isAuthenticated}
                  >
                    <Pin className="h-4 w-4 mr-2" />
                    {isPinned ? 'Pinned' : 'Add to Top 5'}
                  </Button>

                  <Button
                    variant={copied ? 'primary' : 'secondary'}
                    onClick={() => {
                      playClick();
                      const url = `${window.location.origin}/content/${id}`;
                      navigator.clipboard.writeText(url).then(() => {
                        playSuccess();
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      });
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    {copied ? 'Copied!' : 'Share'}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      playClick();
                      setShowReportModal(true);
                    }}
                    disabled={!isAuthenticated}
                    className="text-[#666] hover:text-[#FF6B6B]"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </Button>

                  {/* Delete button for creators only */}
                  {isCreator && (
                    <Button
                      variant="ghost"
                      onClick={handleDeleteContent}
                      disabled={isDeleting}
                      className="text-[#FF6B6B] hover:bg-[#FF6B6B] hover:text-white ml-auto"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Description */}
              {content.description && (
                <div className="card-retro-static p-6 bg-white">
                  <h3 className="font-bold uppercase tracking-wide mb-3">Description</h3>
                  <p className="text-[#666] whitespace-pre-wrap">
                    {content.description}
                  </p>
                </div>
              )}

              {/* Director's Release Notes */}
              {content.release_notes && (
                <div className="card-retro-static overflow-hidden bg-white">
                  <button
                    className="w-full flex items-center justify-between p-6 hover:bg-[#FFF8F0] transition-colors"
                    onClick={() => {
                      playClick();
                      setShowReleaseNotes(!showReleaseNotes);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-[#FFE66D] border-2 border-[#1a1a1a] flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-[#1a1a1a]" />
                      </div>
                      <span className="font-bold uppercase tracking-wide">Director's Notes</span>
                    </div>
                    {showReleaseNotes ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                  {showReleaseNotes && (
                    <div className="p-6 pt-0 border-t-3 border-[#1a1a1a]">
                      <p className="text-[#666] whitespace-pre-wrap">
                        {content.release_notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Comments */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold uppercase tracking-wide">Comments</h2>

                {isAuthenticated && (
                  <div className="card-retro-static p-4 bg-white">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="input-retro w-full p-3 text-sm resize-none mb-3"
                      rows={3}
                    />
                    <Button
                      onClick={() => {
                        playClick();
                        postComment.mutate();
                      }}
                      disabled={!commentText.trim()}
                      isLoading={postComment.isPending}
                    >
                      Post Comment
                    </Button>
                  </div>
                )}

                <div className="space-y-4">
                  {comments?.map((comment) => {
                    const canDeleteComment = user && (comment.user_id === user.id || content.creator_id === user.id);
                    return (
                      <div
                        key={comment.id}
                        className="card-retro-static p-4 bg-white"
                      >
                        <div className="flex items-start gap-3">
                          {comment.user.avatar_url ? (
                            <img
                              src={comment.user.avatar_url}
                              alt=""
                              className="h-10 w-10 border-2 border-[#1a1a1a] object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-[#4ECDC4] border-2 border-[#1a1a1a] flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">
                                  {comment.user.display_name}
                                </span>
                                {comment.user_id === content.creator_id && (
                                  <span className="px-2 py-0.5 bg-[#9B5DE5] text-white text-xs font-bold">
                                    CREATOR
                                  </span>
                                )}
                                <span className="text-xs text-[#666] font-medium">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              {canDeleteComment && (
                                <button
                                  className="p-1 text-[#666] hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 transition-colors"
                                  onClick={() => {
                                    showConfirm({
                                      title: 'Delete Comment?',
                                      description: 'This comment will be permanently removed.',
                                      variant: 'destructive',
                                      confirmLabel: 'Delete',
                                      onConfirm: () => deleteComment.mutate(comment.id),
                                    });
                                  }}
                                  title="Delete comment"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-[#666]">{comment.body}</p>
                            <div className="flex items-center gap-4 mt-3">
                              <button
                                className="flex items-center gap-1 text-xs font-bold text-[#666] hover:text-[#4ECDC4] transition-colors disabled:opacity-50"
                                onClick={() =>
                                  voteComment.mutate({ commentId: comment.id, vote: 1 })
                                }
                                disabled={!isAuthenticated || voteComment.isPending}
                              >
                                <ThumbsUp className="h-4 w-4" />
                                {comment.upvotes || 0}
                              </button>
                              <button
                                className="flex items-center gap-1 text-xs font-bold text-[#666] hover:text-[#FF6B6B] transition-colors disabled:opacity-50"
                                onClick={() =>
                                  voteComment.mutate({ commentId: comment.id, vote: -1 })
                                }
                                disabled={!isAuthenticated || voteComment.isPending}
                              >
                                <ThumbsDown className="h-4 w-4" />
                                {comment.downvotes || 0}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {(!comments || comments.length === 0) && (
                    <div className="card-retro-static p-8 bg-white text-center">
                      <p className="text-[#666] font-medium">
                        No comments yet. Be the first to share your thoughts!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - Leaderboard */}
            <div>
              <div className="card-retro-static p-6 bg-white sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-[#FFE66D] border-2 border-[#1a1a1a] flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-[#1a1a1a]" />
                  </div>
                  <h2 className="font-bold uppercase tracking-wide">Leaderboard</h2>
                </div>

                <div className="space-y-3">
                  {leaderboard?.map((entry, index) => (
                    <div
                      key={entry.user_id}
                      className="flex items-center gap-3 p-3 border-2 border-[#1a1a1a] hover:bg-[#FFF8F0] transition-colors"
                      style={{
                        background: index === 0 ? '#FFE66D' : index === 1 ? '#E8E0D8' : index === 2 ? '#FFDAB9' : 'white',
                      }}
                    >
                      <div
                        className="h-8 w-8 border-2 border-[#1a1a1a] flex items-center justify-center text-sm font-bold"
                        style={{
                          background: index === 0 ? '#FF6B6B' : index === 1 ? '#4ECDC4' : index === 2 ? '#9B5DE5' : 'white',
                          color: index < 3 ? 'white' : '#1a1a1a',
                        }}
                      >
                        {index + 1}
                      </div>
                      {entry.user?.avatar_url ? (
                        <img
                          src={entry.user.avatar_url}
                          alt=""
                          className="h-10 w-10 border-2 border-[#1a1a1a] object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-[#9B5DE5] border-2 border-[#1a1a1a] flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">
                          {entry.user?.display_name}
                        </p>
                        <p className="text-xs text-[#666] font-medium">{entry.score} pts</p>
                      </div>
                    </div>
                  ))}

                  {(!leaderboard || leaderboard.length === 0) && (
                    <p className="text-center text-[#666] py-6 text-sm font-medium">
                      Be the first on the leaderboard!
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t-3 border-[#1a1a1a]">
                  <p className="text-xs text-[#666] text-center font-bold uppercase tracking-wide">
                    Earn points by watching, tipping, pinning & engaging
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Tip Modal */}
      {user && (
        <TipModal
          isOpen={showTipModal}
          onClose={() => setShowTipModal(false)}
          content={content}
          creator={content.creator}
          userId={user.id}
        />
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        content={content}
        userEmail={user?.email}
      />

      {/* Confirm/Alert Modal */}
      <ModalComponent />
    </div>
  );
}
