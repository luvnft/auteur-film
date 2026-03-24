'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { ContentCard } from '@/components/content/ContentCard';
import { useUser } from '@/hooks/useUser';
import { useSound } from '@/components/providers/SoundProvider';
import { createClient } from '@/lib/supabase/client';
import { ShoppingBag, Heart, Film, Lock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import type { Content } from '@/types/database';

type TabOption = 'purchased' | 'supported';

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<TabOption>('purchased');
  const { user, isAuthenticated, isLoading: userLoading } = useUser();
  const { playClick } = useSound();
  const supabase = createClient();

  // Fetch purchased content
  const { data: purchasedContent, isLoading: purchasedLoading } = useQuery({
    queryKey: ['library-purchased', user?.id],
    queryFn: async () => {
      if (!user?.id || !supabase) return [];

      const { data, error } = await supabase
        .from('content_purchases')
        .select(`
          id,
          created_at,
          amount_cents,
          content:content!content_purchases_content_id_fkey(
            *,
            creator:users!content_creator_id_fkey(id, display_name, avatar_url, username)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Extract content from the join
      return (data || [])
        .map((purchase: any) => purchase.content)
        .filter(Boolean) as (Content & { creator: NonNullable<Content['creator']> })[];
    },
    enabled: !!user?.id && !!supabase,
  });

  // Fetch supported (tipped) content
  const { data: supportedContent, isLoading: supportedLoading } = useQuery({
    queryKey: ['library-supported', user?.id],
    queryFn: async () => {
      if (!user?.id || !supabase) return [];

      const { data, error } = await supabase
        .from('tips')
        .select(`
          id,
          created_at,
          amount_cents,
          content:content!tips_content_id_fkey(
            *,
            creator:users!content_creator_id_fkey(id, display_name, avatar_url, username)
          )
        `)
        .eq('from_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Extract unique content from tips (user might tip same content multiple times)
      const contentMap = new Map();
      (data || []).forEach((tip: any) => {
        if (tip.content && !contentMap.has(tip.content.id)) {
          contentMap.set(tip.content.id, tip.content);
        }
      });
      return Array.from(contentMap.values()) as (Content & { creator: NonNullable<Content['creator']> })[];
    },
    enabled: !!user?.id && !!supabase,
  });

  const isLoading = activeTab === 'purchased' ? purchasedLoading : supportedLoading;
  const content = activeTab === 'purchased' ? purchasedContent : supportedContent;

  // Not authenticated
  if (!userLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FFF8F0]">
        <Header />
        <main className="pt-24 pb-12 px-4 max-w-xl mx-auto text-center">
          <div className="card-retro-static inline-flex items-center justify-center h-24 w-24 mb-6 bg-[#9B5DE5]">
            <Lock className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-2xl font-[var(--font-pixel)] tracking-wider mb-4">SIGN IN TO VIEW LIBRARY</h1>
          <p className="text-[#666] mb-8 font-medium">
            Sign in to see your purchased and supported content.
          </p>
          <Link href="/">
            <Button variant="primary">Go Home</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <Header />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold font-[var(--font-pixel)] text-[#1a1a1a] tracking-wider">
            MY LIBRARY
          </h1>
          <div className="h-1 w-32 bg-[#9B5DE5] mt-2" />
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => {
              playClick();
              setActiveTab('purchased');
            }}
            className={`flex items-center gap-2 px-5 py-3 border-3 border-[#1a1a1a] font-bold text-sm uppercase tracking-wide transition-all ${
              activeTab === 'purchased'
                ? 'bg-[#FFE66D] text-[#1a1a1a] shadow-[0_0_0_#1a1a1a] translate-x-[3px] translate-y-[3px]'
                : 'bg-white shadow-[3px_3px_0_#1a1a1a] hover:shadow-[4px_4px_0_#1a1a1a]'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            Purchased
            {purchasedContent && purchasedContent.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-[#1a1a1a] text-white text-xs">
                {purchasedContent.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              playClick();
              setActiveTab('supported');
            }}
            className={`flex items-center gap-2 px-5 py-3 border-3 border-[#1a1a1a] font-bold text-sm uppercase tracking-wide transition-all ${
              activeTab === 'supported'
                ? 'bg-[#FF6B6B] text-white shadow-[0_0_0_#1a1a1a] translate-x-[3px] translate-y-[3px]'
                : 'bg-white shadow-[3px_3px_0_#1a1a1a] hover:shadow-[4px_4px_0_#1a1a1a]'
            }`}
          >
            <Heart className="h-4 w-4" />
            Supported
            {supportedContent && supportedContent.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-[#1a1a1a] text-white text-xs">
                {supportedContent.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Description */}
        <p className="text-[#666] mb-6 font-medium">
          {activeTab === 'purchased'
            ? 'Content you\'ve purchased for one-time access.'
            : 'Content you\'ve supported with tips.'}
        </p>

        {/* Content Grid */}
        {userLoading || isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
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
            <div
              className="card-retro-static inline-flex items-center justify-center h-24 w-24 mb-6"
              style={{ background: activeTab === 'purchased' ? '#FFE66D' : '#FF6B6B' }}
            >
              {activeTab === 'purchased' ? (
                <ShoppingBag className="h-12 w-12 text-[#1a1a1a]" />
              ) : (
                <Heart className="h-12 w-12 text-white" />
              )}
            </div>
            <h3 className="text-2xl font-bold mb-2 font-[var(--font-pixel)] tracking-wider">
              {activeTab === 'purchased' ? 'NO PURCHASES YET' : 'NO TIPS YET'}
            </h3>
            <p className="text-[#666] max-w-md mx-auto mb-8">
              {activeTab === 'purchased'
                ? 'When you purchase content, it will appear here for easy access.'
                : 'Support creators by tipping their work. Tipped content will appear here.'}
            </p>
            <Link href="/browse">
              <Button variant="primary">Browse Content</Button>
            </Link>
          </div>
        )}
      </main>

      {/* Decorative element */}
      <div className="fixed bottom-4 right-4 opacity-20 pointer-events-none">
        <div className="text-[120px] font-[var(--font-pixel)] text-[#9B5DE5]">*</div>
      </div>
    </div>
  );
}
