'use client';

import Link from 'next/link';
import { Play, Eye, DollarSign, Clock, Sparkles, Calendar } from 'lucide-react';
import { useSound } from '@/components/providers/SoundProvider';
import type { Content } from '@/types/database';

interface ContentCardProps {
  content: Content;
  showCreator?: boolean;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

function formatPrice(cents: number): string {
  if (cents === 0) return 'FREE';
  return `$${(cents / 100).toFixed(2)}`;
}

function isPreRelease(content: Content): boolean {
  return !!content.release_date && new Date(content.release_date) > new Date();
}

function formatReleaseDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Fun color rotation for cards
const cardColors = [
  { bg: '#FF6B6B', accent: '#E55555' },
  { bg: '#4ECDC4', accent: '#3DB8B0' },
  { bg: '#FFE66D', accent: '#F5D93A' },
  { bg: '#9B5DE5', accent: '#7B3DC5' },
];

export function ContentCard({ content, showCreator = true }: ContentCardProps) {
  const { playClick, playHover } = useSound();

  // Deterministic color based on content ID
  const colorIndex = content.id.charCodeAt(0) % cardColors.length;
  const colors = cardColors[colorIndex];

  // Resolve the best available thumbnail
  const thumbnailSrc =
    content.thumbnail_url ||
    (content.youtube_video_id
      ? `https://img.youtube.com/vi/${content.youtube_video_id}/hqdefault.jpg`
      : content.trailer_youtube_id
        ? `https://img.youtube.com/vi/${content.trailer_youtube_id}/hqdefault.jpg`
        : null);

  return (
    <Link
      href={`/content/${content.id}`}
      className="group block"
      onClick={playClick}
      onMouseEnter={playHover}
    >
      {/* Card container with 3D effect */}
      <div className="card-retro transition-all duration-150 overflow-hidden">
        {/* Thumbnail area */}
        <div className="relative aspect-video bg-[#1a1a1a] overflow-hidden">
          {/* Thumbnail */}
          {thumbnailSrc ? (
            <img
              src={thumbnailSrc}
              alt={content.title}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: colors.bg }}
            >
              <Play className="h-12 w-12 text-white opacity-50" />
            </div>
          )}

          {/* Play button overlay on hover */}
          <div className="absolute inset-0 bg-[#1a1a1a]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div
              className="h-16 w-16 border-3 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center group-hover:animate-bounce-retro"
              style={{ background: colors.bg }}
            >
              <Play className="h-7 w-7 text-white ml-1" />
            </div>
          </div>

          {/* Duration badge */}
          {content.duration_seconds && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-white border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] text-xs font-bold flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(content.duration_seconds)}
            </div>
          )}

          {/* Top-left badge: Episode info */}
          {content.type === 'episode' && (
            <div
              className="absolute top-2 left-2 px-2 py-1 border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] text-xs font-bold text-[#1a1a1a]"
              style={{ background: colors.bg }}
            >
              S{content.season_number} E{content.episode_number}
            </div>
          )}

          {/* Coming soon badge with release date */}
          {isPreRelease(content) && (
            <div className={`absolute ${content.type === 'episode' ? 'top-10' : 'top-2'} left-2 px-2 py-1 bg-[#9B5DE5] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] text-xs font-bold text-white flex items-center gap-1`}>
              <Calendar className="h-3 w-3" />
              {formatReleaseDate(content.release_date!)}
            </div>
          )}

          {/* Price badge - top right */}
          <div
            className={`absolute top-2 right-2 px-2 py-1 border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] text-xs font-bold ${
              (content.price_cents ?? 0) === 0
                ? 'bg-[#4ECDC4] text-white'
                : 'bg-[#FFE66D] text-[#1a1a1a]'
            }`}
          >
            {formatPrice(content.price_cents ?? 0)}
          </div>
        </div>

        {/* Content info */}
        <div className="p-4 bg-white">
          <h3 className="font-bold text-[#1a1a1a] group-hover:text-[#FF6B6B] transition-colors line-clamp-2 text-base">
            {content.title}
          </h3>

          {showCreator && content.creator && (
            <p className="text-sm text-[#666] mt-1 font-medium">
              by{' '}
              {(content.creator as any).username ? (
                <Link
                  href={`/profile/${(content.creator as any).username}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-[#FF6B6B] hover:underline transition-colors"
                >
                  {content.creator.display_name}
                </Link>
              ) : (
                content.creator.display_name
              )}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-xs font-bold">
            <div className="flex items-center gap-1 text-[#666]">
              <Eye className="h-3 w-3" />
              {formatNumber(content.view_count)} views
            </div>
            {content.tip_total_cents > 0 && (
              <div className="flex items-center gap-1 text-[#4ECDC4]">
                <Sparkles className="h-3 w-3" />
                ${(content.tip_total_cents / 100).toFixed(0)} tipped
              </div>
            )}
          </div>

          {/* Tags */}
          {content.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {content.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 border-2 border-[#1a1a1a] text-xs font-bold uppercase tracking-wide"
                  style={{
                    background: cardColors[(colorIndex + index) % cardColors.length].bg,
                    color: index === 0 || index === 2 ? 'white' : '#1a1a1a',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
