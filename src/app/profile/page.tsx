'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { ContentCard } from '@/components/content/ContentCard';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/hooks/useUser';
import { useSound } from '@/components/providers/SoundProvider';
import { createClient } from '@/lib/supabase/client';
import {
  User,
  Edit2,
  Pin,
  Trophy,
  Eye,
  Copy,
  Check,
  Calendar,
  Film,
  Sparkles,
  Settings,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import type { Content, UserPin, LeaderboardScore } from '@/types/database';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useUser();
  const { playClick, playSuccess } = useSound();
  const supabase = createClient();

  const [copied, setCopied] = useState(false);

  // Fetch user's Top 5 pins
  const { data: pins } = useQuery({
    queryKey: ['user-pins', user?.id],
    queryFn: async () => {
      if (!user?.id || !supabase) return [];
      const { data } = await supabase
        .from('user_pins')
        .select('*, content:content(*, creator:users!content_creator_id_fkey(id, display_name))')
        .eq('user_id', user.id)
        .order('position');
      return data as (UserPin & { content: Content & { creator: NonNullable<Content['creator']> } })[];
    },
    enabled: !!user?.id,
  });

  // Fetch user's leaderboard positions
  const { data: leaderboardPositions } = useQuery({
    queryKey: ['user-leaderboard', user?.id],
    queryFn: async () => {
      if (!user?.id || !supabase) return [];
      const { data } = await supabase
        .from('leaderboard_scores')
        .select('*, content:content(id, title, thumbnail_url)')
        .eq('user_id', user.id)
        .order('score', { ascending: false })
        .limit(10);
      return data as (LeaderboardScore & { content: Pick<Content, 'id' | 'title' | 'thumbnail_url'> })[];
    },
    enabled: !!user?.id,
  });

  // Fetch watch stats
  const { data: watchStats } = useQuery({
    queryKey: ['user-watch-stats', user?.id],
    queryFn: async () => {
      if (!user?.id || !supabase) return { totalWatched: 0, totalWatchTime: 0 };
      const { data } = await supabase
        .from('content_views')
        .select('watch_time_seconds')
        .eq('user_id', user.id)
        .eq('completed', true);

      const totalWatched = data?.length || 0;
      const totalWatchTime = data?.reduce((acc: number, v: { watch_time_seconds: number | null }) => acc + (v.watch_time_seconds || 0), 0) || 0;

      return { totalWatched, totalWatchTime };
    },
    enabled: !!user?.id,
  });

  // Fetch user's published content (if creator)
  const { data: publishedContent } = useQuery({
    queryKey: ['user-published-content', user?.id],
    queryFn: async () => {
      if (!user?.id || !supabase) return [];
      const { data } = await supabase
        .from('content')
        .select('*')
        .eq('creator_id', user.id)
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false });
      return data as Content[];
    },
    enabled: !!user?.id && user?.is_creator,
  });

  const copyProfileLink = () => {
    if (!user?.username) return;
    const link = `${window.location.origin}/profile/${user.username}`;
    navigator.clipboard.writeText(link);
    playSuccess();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatWatchTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#FFF8F0]">
        <Header />
        <div className="pt-20 max-w-xl mx-auto px-4 py-20 text-center">
          <div className="card-retro-static inline-flex items-center justify-center h-20 w-20 mb-6 bg-[#FFE66D]">
            <User className="h-10 w-10 text-[#1a1a1a]" />
          </div>
          <h1 className="text-2xl font-[var(--font-pixel)] tracking-wider mb-4">SIGN IN REQUIRED</h1>
          <p className="text-[#666] mb-8 font-medium">
            Sign in to view your profile.
          </p>
          <Link href="/">
            <Button variant="primary">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <Header />

      <main className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="card-retro-static p-6 mb-8 bg-white">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Avatar */}
            <div className="h-28 w-28 bg-[#FF6B6B] border-4 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.display_name || ''}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-14 w-14 text-white" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">
                {user.display_name || 'Anonymous'}
              </h1>
              {user.username && (
                <p className="text-[#9B5DE5] font-bold mb-2">@{user.username}</p>
              )}
              {user.bio && (
                <p className="text-[#666] mb-3 font-medium">{user.bio}</p>
              )}
              <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-[#666] font-medium">
                <Calendar className="h-4 w-4" />
                Joined {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Link href="/profile/edit" onClick={playClick}>
                <Button variant="secondary" size="sm" className="w-full">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
              <Link href="/wallet" onClick={playClick}>
                <Button variant="outline" size="sm" className="w-full">
                  <Wallet className="h-4 w-4 mr-2" />
                  Wallet
                </Button>
              </Link>
            </div>
          </div>

          {/* Referral Link */}
          <div className="mt-6 pt-6 border-t-3 border-[#1a1a1a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide mb-1">Your Profile Link</p>
                <p className="text-[#666] text-sm font-mono">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/profile/{user.username || 'set-username'}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={copyProfileLink}
                disabled={!user.username}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card-retro-static p-4 text-center bg-[#4ECDC4]">
            <Eye className="h-6 w-6 text-[#1a1a1a] mx-auto mb-2" />
            <p className="text-3xl font-bold">{watchStats?.totalWatched || 0}</p>
            <p className="text-sm font-bold uppercase tracking-wide">Films Watched</p>
          </div>
          <div className="card-retro-static p-4 text-center bg-[#9B5DE5]">
            <Film className="h-6 w-6 text-white mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">
              {formatWatchTime(watchStats?.totalWatchTime || 0)}
            </p>
            <p className="text-sm font-bold uppercase tracking-wide text-white">Watch Time</p>
          </div>
          <div className="card-retro-static p-4 text-center bg-[#FFE66D]">
            <Trophy className="h-6 w-6 text-[#1a1a1a] mx-auto mb-2" />
            <p className="text-3xl font-bold">
              {leaderboardPositions?.reduce((acc, l) => acc + l.score, 0) || 0}
            </p>
            <p className="text-sm font-bold uppercase tracking-wide">Total Points</p>
          </div>
        </div>

        {/* My Published Content (Creators only) */}
        {user.is_creator && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-[#9B5DE5] border-2 border-[#1a1a1a] flex items-center justify-center">
                  <Film className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-xl font-bold uppercase tracking-wide">My Published Content</h2>
              </div>
              <Link href="/publish" onClick={playClick}>
                <Button variant="primary" size="sm">
                  + New
                </Button>
              </Link>
            </div>

            {publishedContent && publishedContent.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {publishedContent.map((content) => (
                  <ContentCard key={content.id} content={content} showCreator={false} />
                ))}
              </div>
            ) : (
              <div className="card-retro-static p-8 text-center bg-white">
                <div className="h-16 w-16 bg-[#E8E0D8] border-3 border-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
                  <Film className="h-8 w-8 text-[#666]" />
                </div>
                <p className="text-[#666] mb-4 font-medium">
                  You haven't published any content yet
                </p>
                <Link href="/publish">
                  <Button variant="primary" size="sm">
                    Publish Your First Film
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Top 5 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 bg-[#FF6B6B] border-2 border-[#1a1a1a] flex items-center justify-center">
              <Pin className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-wide">My Top 5</h2>
          </div>

          {pins && pins.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pins.map((pin) => (
                <div key={pin.content_id} className="relative">
                  <div className="absolute -top-3 -left-3 h-8 w-8 bg-[#FFE66D] border-3 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] flex items-center justify-center text-sm font-bold z-10">
                    #{pin.position}
                  </div>
                  <ContentCard content={pin.content} />
                </div>
              ))}
            </div>
          ) : (
            <div className="card-retro-static p-8 text-center bg-white">
              <div className="h-16 w-16 bg-[#E8E0D8] border-3 border-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
                <Pin className="h-8 w-8 text-[#666]" />
              </div>
              <p className="text-[#666] mb-4 font-medium">
                You haven't pinned any content yet
              </p>
              <Link href="/browse">
                <Button variant="secondary" size="sm">
                  Browse Content
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Leaderboard Positions */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 bg-[#FFE66D] border-2 border-[#1a1a1a] flex items-center justify-center">
              <Trophy className="h-4 w-4 text-[#1a1a1a]" />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-wide">My Leaderboard Rankings</h2>
          </div>

          {leaderboardPositions && leaderboardPositions.length > 0 ? (
            <div className="space-y-3">
              {leaderboardPositions.map((entry, index) => (
                <Link
                  key={entry.content_id}
                  href={`/content/${entry.content_id}`}
                  onClick={playClick}
                  className="flex items-center gap-4 p-4 bg-white border-3 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] hover:shadow-[6px_6px_0_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                >
                  <div
                    className="h-10 w-10 border-2 border-[#1a1a1a] flex items-center justify-center font-bold"
                    style={{
                      background: index === 0 ? '#FFE66D' : index === 1 ? '#E8E0D8' : index === 2 ? '#D4A574' : 'white'
                    }}
                  >
                    #{index + 1}
                  </div>
                  {entry.content.thumbnail_url ? (
                    <img
                      src={entry.content.thumbnail_url}
                      alt=""
                      className="w-16 aspect-video border-2 border-[#1a1a1a] object-cover"
                    />
                  ) : (
                    <div className="w-16 aspect-video bg-[#E8E0D8] border-2 border-[#1a1a1a]" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{entry.content.title}</p>
                    <p className="text-sm text-[#666] font-medium">{entry.score} points</p>
                  </div>
                  <div className="hidden sm:block text-right">
                    <div className="text-xs text-[#666] font-bold uppercase tracking-wide">Breakdown</div>
                    <div className="text-xs text-[#666]">
                      {Object.entries(entry.breakdown)
                        .filter(([_, v]) => v > 0)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' | ')}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card-retro-static p-8 text-center bg-white">
              <div className="h-16 w-16 bg-[#E8E0D8] border-3 border-[#1a1a1a] flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-[#666]" />
              </div>
              <p className="text-[#666] mb-4 font-medium">
                Start watching and engaging to climb the leaderboards
              </p>
              <Link href="/browse">
                <Button variant="accent" size="sm">
                  Start Watching
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
