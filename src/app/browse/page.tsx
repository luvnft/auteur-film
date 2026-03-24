'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { ContentCard } from '@/components/content/ContentCard';
import { useSound } from '@/components/providers/SoundProvider';
import { createClient } from '@/lib/supabase/client';
import { Search, TrendingUp, Clock, Sparkles, Film, DollarSign, Calendar } from 'lucide-react';
import type { Content } from '@/types/database';

type SortOption = 'trending' | 'newest' | 'top_tipped';
type PricingFilter = 'all' | 'free' | 'paid';
type ReleaseFilter = 'all' | 'available' | 'coming_soon';

const GENRES = [
  'All',
  'AI-Generated',
  'Sci-Fi',
  'Drama',
  'Horror',
  'Comedy',
  'Documentary',
  'Experimental',
  'Animation',
];

// Fun colors for genre tags
const genreColors: Record<string, string> = {
  'All': '#FF6B6B',
  'AI-Generated': '#9B5DE5',
  'Sci-Fi': '#4ECDC4',
  'Drama': '#FF6B6B',
  'Horror': '#1a1a1a',
  'Comedy': '#FFE66D',
  'Documentary': '#4ECDC4',
  'Experimental': '#9B5DE5',
  'Animation': '#FFE66D',
};

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  const [contentType, setContentType] = useState<'all' | 'film' | 'episode'>('all');
  const [pricingFilter, setPricingFilter] = useState<PricingFilter>('all');
  const [releaseFilter, setReleaseFilter] = useState<ReleaseFilter>('all');
  const { playClick } = useSound();

  const supabase = createClient();

  const { data: content, isLoading } = useQuery({
    queryKey: ['browse-content', selectedGenre, sortBy, contentType, searchQuery, pricingFilter, releaseFilter],
    queryFn: async () => {
      if (!supabase) return [];

      let query = supabase
        .from('content')
        .select('*, creator:users!content_creator_id_fkey(id, display_name, avatar_url, username)')
        .not('published_at', 'is', null);

      // Filter by type
      if (contentType !== 'all') {
        query = query.eq('type', contentType);
      }

      // Filter by genre
      if (selectedGenre !== 'All') {
        query = query.contains('tags', [selectedGenre]);
      }

      // Search
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      // Filter by pricing
      if (pricingFilter === 'free') {
        query = query.eq('price_cents', 0);
      } else if (pricingFilter === 'paid') {
        query = query.gt('price_cents', 0);
      }

      // Filter by release status
      const now = new Date().toISOString();
      if (releaseFilter === 'available') {
        // Available now: no release_date OR release_date <= now
        query = query.or(`release_date.is.null,release_date.lte.${now}`);
      } else if (releaseFilter === 'coming_soon') {
        // Coming soon: release_date > now
        query = query.gt('release_date', now);
      }

      // Sort
      switch (sortBy) {
        case 'trending':
          query = query.order('view_count', { ascending: false });
          break;
        case 'newest':
          query = query.order('published_at', { ascending: false });
          break;
        case 'top_tipped':
          query = query.order('tip_total_cents', { ascending: false });
          break;
      }

      query = query.limit(50);

      const { data, error } = await query;
      if (error) throw error;
      return data as (Content & { creator: NonNullable<Content['creator']> })[];
    },
  });

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <Header />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold font-[var(--font-pixel)] text-[#1a1a1a] tracking-wider">
            BROWSE
          </h1>
          <div className="h-1 w-32 bg-[#FF6B6B] mt-2" />
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#666] z-10" />
            <input
              type="text"
              placeholder="Search films and series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-retro w-full pr-4 py-3 text-[#1a1a1a] placeholder-[#999]"
              style={{ paddingLeft: '3rem' }}
            />
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Sort */}
            <div className="flex items-center gap-1 p-1 bg-white border-3 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a]">
              {[
                { value: 'trending', icon: TrendingUp, label: 'Trending', color: '#FF6B6B' },
                { value: 'newest', icon: Clock, label: 'Newest', color: '#4ECDC4' },
                { value: 'top_tipped', icon: Sparkles, label: 'Top Tipped', color: '#FFE66D' },
              ].map(({ value, icon: Icon, label, color }) => (
                <button
                  key={value}
                  onClick={() => {
                    playClick();
                    setSortBy(value as SortOption);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-bold uppercase tracking-wide transition-all ${
                    sortBy === value
                      ? 'text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]'
                      : 'text-[#666] hover:text-[#1a1a1a] border-2 border-transparent'
                  }`}
                  style={{
                    background: sortBy === value ? color : 'transparent',
                  }}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Content type */}
            <div className="flex items-center gap-1 p-1 bg-white border-3 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a]">
              {[
                { value: 'all', label: 'All' },
                { value: 'film', label: 'Films' },
                { value: 'episode', label: 'Series' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    playClick();
                    setContentType(value as typeof contentType);
                  }}
                  className={`px-3 py-2 text-sm font-bold uppercase tracking-wide transition-all ${
                    contentType === value
                      ? 'bg-[#9B5DE5] text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]'
                      : 'text-[#666] hover:text-[#1a1a1a] border-2 border-transparent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Pricing filter */}
            <div className="flex items-center gap-1 p-1 bg-white border-3 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a]">
              {[
                { value: 'all', label: 'All', color: '#666' },
                { value: 'free', label: 'Free', color: '#4ECDC4' },
                { value: 'paid', label: 'Paid', color: '#FFE66D' },
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => {
                    playClick();
                    setPricingFilter(value as PricingFilter);
                  }}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-bold uppercase tracking-wide transition-all ${
                    pricingFilter === value
                      ? 'text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]'
                      : 'text-[#666] hover:text-[#1a1a1a] border-2 border-transparent'
                  }`}
                  style={{
                    background: pricingFilter === value ? color : 'transparent',
                  }}
                >
                  <DollarSign className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Release status filter */}
            <div className="flex items-center gap-1 p-1 bg-white border-3 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a]">
              {[
                { value: 'all', label: 'All', color: '#666' },
                { value: 'available', label: 'Available', color: '#4ECDC4' },
                { value: 'coming_soon', label: 'Coming Soon', color: '#9B5DE5' },
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => {
                    playClick();
                    setReleaseFilter(value as ReleaseFilter);
                  }}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-bold uppercase tracking-wide transition-all ${
                    releaseFilter === value
                      ? `border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] ${value === 'coming_soon' ? 'text-white' : 'text-[#1a1a1a]'}`
                      : 'text-[#666] hover:text-[#1a1a1a] border-2 border-transparent'
                  }`}
                  style={{
                    background: releaseFilter === value ? color : 'transparent',
                  }}
                >
                  <Calendar className="h-3 w-3" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Genre tags */}
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => {
                  playClick();
                  setSelectedGenre(genre);
                }}
                className={`px-4 py-2 text-sm font-bold uppercase tracking-wide transition-all border-3 border-[#1a1a1a] ${
                  selectedGenre === genre
                    ? 'shadow-[0_0_0_#1a1a1a] translate-x-[3px] translate-y-[3px]'
                    : 'shadow-[3px_3px_0_#1a1a1a] hover:shadow-[4px_4px_0_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                }`}
                style={{
                  background: selectedGenre === genre ? genreColors[genre] : 'white',
                  color: selectedGenre === genre && genre !== 'Horror' ? (genre === 'Comedy' || genre === 'Animation' ? '#1a1a1a' : 'white') : '#1a1a1a',
                }}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card-retro-static overflow-hidden">
                <div className="aspect-video bg-[#E8E0D8] animate-pulse" />
                <div className="p-4 bg-white">
                  <div className="h-4 bg-[#E8E0D8] w-3/4 mb-2 animate-pulse" />
                  <div className="h-3 bg-[#E8E0D8] w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : content && content.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {content.map((item) => (
              <ContentCard key={item.id} content={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="card-retro-static inline-flex items-center justify-center h-24 w-24 mb-6 bg-[#FFE66D]">
              <Film className="h-12 w-12 text-[#1a1a1a]" />
            </div>
            <h3 className="text-2xl font-bold mb-2 font-[var(--font-pixel)] tracking-wider">
              {searchQuery ? 'NO RESULTS' : 'COMING SOON'}
            </h3>
            <p className="text-[#666] max-w-md mx-auto">
              {searchQuery
                ? `No films found for "${searchQuery}". Try a different search!`
                : 'Be the first creator to publish content and get discovered!'}
            </p>
          </div>
        )}
      </main>

      {/* Fun decorative elements */}
      <div className="fixed bottom-4 right-4 opacity-20 pointer-events-none">
        <div className="text-[120px] font-[var(--font-pixel)] text-[#FF6B6B]">*</div>
      </div>
    </div>
  );
}
