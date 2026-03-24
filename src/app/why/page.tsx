'use client';

import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useConnect, useAccount } from 'wagmi';
import { useSound } from '@/components/providers/SoundProvider';
import { Film, Sparkles, Trophy, Clapperboard, Users, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function WhyAuteurPage() {
  const { connectors, connect, isPending } = useConnect();
  const { isConnected } = useAccount();
  const { playClick, playSuccess } = useSound();

  const coinbaseConnector = connectors.find(c => c.id === 'coinbaseWalletSDK');

  const handleConnect = () => {
    if (coinbaseConnector) {
      playSuccess();
      connect({ connector: coinbaseConnector });
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />

        <div className="max-w-3xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFE66D] border-3 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] text-sm font-bold text-[#1a1a1a] mb-8 hover-wiggle">
            <Sparkles className="h-4 w-4" />
            WHY AUTEUR
          </div>

          <h1 className="text-4xl sm:text-5xl font-[var(--font-pixel)] tracking-wider mb-6 leading-tight text-[#1a1a1a]">
            A NEW ERA OF
            <br />
            <span className="text-[#FF6B6B]">FILMMAKING</span>
            <br />
            IS HERE.
          </h1>

          <p className="text-lg sm:text-xl text-[#666] max-w-2xl font-medium leading-relaxed">
            Something massive is happening. The tools to make professional-quality films and series are now in the hands of individuals and small teams everywhere. What was once a $100M studio production can now be made on a laptop. This isn't a trend — it's a permanent shift. And the content it produces needs a platform built for it.
          </p>
        </div>
      </section>

      {/* The Shift */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t-4 border-[#1a1a1a] bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 bg-[#FF6B6B] border-3 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center shrink-0">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-[var(--font-pixel)] tracking-wider">
              THE EXPLOSION
            </h2>
          </div>
          <div className="h-1 w-20 bg-[#FF6B6B] mb-8" />

          <div className="space-y-6 text-[#666] text-lg leading-relaxed font-medium">
            <p>
              AI-powered filmmaking tools, affordable cinema cameras, and desktop-grade VFX are converging right now. The result is an exponential spike in movies and series created by individuals and small teams. We're talking about a fundamentally new kind of user-generated content — not short clips or vlogs, but real narrative films, animated series, and episodic storytelling.
            </p>
            <p>
              This content doesn't belong on platforms designed for 15-second videos or algorithm-driven feeds. It needs a dedicated home where it can be discovered, watched, and supported on its own terms.
            </p>
            <p className="text-[#1a1a1a] font-bold text-xl">
              Auteur is that home.
            </p>
          </div>
        </div>
      </section>

      {/* For Fans */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t-4 border-[#1a1a1a] bg-[#FFF8F0]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 bg-[#4ECDC4] border-3 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center shrink-0">
              <Trophy className="h-7 w-7 text-[#1a1a1a]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-[var(--font-pixel)] tracking-wider">
              FOR FANS
            </h2>
          </div>
          <div className="h-1 w-20 bg-[#4ECDC4] mb-8" />

          <div className="space-y-6 text-[#666] text-lg leading-relaxed font-medium">
            <p>
              On every other platform, fans are passive consumers. You watch, you scroll, you leave. On Auteur, your support actually matters — and you're rewarded for it.
            </p>
            <p>
              Every piece of content on Auteur has a <strong className="text-[#1a1a1a]">Leaderboard</strong>. When you watch a film, tip the creator, leave a comment, pin it to your favorites, or refer a friend — you earn points and climb the ranks. Top supporters get recognized and can earn platform rewards.
            </p>
          </div>

          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            {[
              { action: 'Watch a film', desc: 'Just showing up counts' },
              { action: 'Tip the creator', desc: 'Direct support, no middleman' },
              { action: 'Comment & get upvoted', desc: 'Great takes get rewarded' },
              { action: 'Refer a friend', desc: 'Grow the community, earn big' },
            ].map((item, i) => (
              <div
                key={i}
                className="p-5 bg-white border-3 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a]"
              >
                <p className="font-bold text-[#1a1a1a] text-lg">{item.action}</p>
                <p className="text-[#666] text-sm mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-[#1a1a1a] font-bold text-lg">
            Being a fan isn't passive anymore. It's a way to participate.
          </p>
        </div>
      </section>

      {/* For Creators */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t-4 border-[#1a1a1a] bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 bg-[#9B5DE5] border-3 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center shrink-0">
              <Clapperboard className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-[var(--font-pixel)] tracking-wider">
              FOR CREATORS
            </h2>
          </div>
          <div className="h-1 w-20 bg-[#9B5DE5] mb-8" />

          <div className="space-y-6 text-[#666] text-lg leading-relaxed font-medium">
            <p>
              You made something. Now what? YouTube buries it. Film festivals take months and a submission fee. Distribution deals don't exist for indie creators making their first series.
            </p>
            <p>
              Auteur gives you a simple, direct path: <strong className="text-[#1a1a1a]">upload your film, set your price (or make it free), and start earning immediately</strong>. Tips go straight to your wallet. Fans engage through comments and leaderboards. You own the relationship with your audience.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {[
              { label: 'No gatekeepers', desc: 'Publish instantly. No approval process, no waiting.' },
              { label: 'Direct monetization', desc: 'Earn from tips and paid content. Keep 98% of every dollar.' },
              { label: 'Built-in fan engagement', desc: 'Leaderboards, comments, and tipping create a community around your work.' },
              { label: 'Series support', desc: 'Launch episodic content with proper series and episode structure.' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-5 bg-[#FFF8F0] border-3 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a]"
              >
                <div className="h-8 w-8 bg-[#9B5DE5] border-2 border-[#1a1a1a] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white font-bold text-sm">{i + 1}</span>
                </div>
                <div>
                  <p className="font-bold text-[#1a1a1a] text-lg">{item.label}</p>
                  <p className="text-[#666] mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Vision */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t-4 border-[#1a1a1a] bg-[#FFF8F0]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 bg-[#FFE66D] border-3 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center shrink-0">
              <Film className="h-7 w-7 text-[#1a1a1a]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-[var(--font-pixel)] tracking-wider">
              THE VISION
            </h2>
          </div>
          <div className="h-1 w-20 bg-[#FFE66D] mb-8" />

          <div className="space-y-6 text-[#666] text-lg leading-relaxed font-medium">
            <p>
              YouTube was built for vlogs and how-to videos. Netflix was built for Hollywood. TikTok was built for clips. None of them were built for the wave of independent films and series that's about to hit.
            </p>
            <p>
              We believe the next great filmmakers won't come from film school or studio lots. They'll come from bedrooms, garages, and coffee shops — armed with AI tools, a vision, and zero budget. They need a platform that takes their work seriously, gives them a real audience, and lets them earn from day one.
            </p>
            <p className="text-[#1a1a1a] font-bold text-xl">
              That's Auteur. The home for independent cinema.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t-4 border-[#1a1a1a] bg-[#FF6B6B]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-[var(--font-pixel)] mb-4 text-white tracking-wider">
            JOIN THE MOVEMENT
          </h2>
          <p className="text-white/90 mb-8 text-lg font-medium">
            Whether you're making films or watching them, Auteur is built for you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isConnected ? (
              <Link href="/browse">
                <Button size="lg" variant="accent">
                  Start Watching
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            ) : (
              <Button size="lg" variant="accent" onClick={handleConnect} disabled={isPending}>
                {isPending ? 'Connecting...' : 'Get Started'}
              </Button>
            )}
            <Link href="/browse">
              <Button variant="outline" size="lg">
                Explore Films
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t-4 border-[#1a1a1a] bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-bold">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-[#FF6B6B] border-2 border-[#1a1a1a] flex items-center justify-center">
              <Film className="h-4 w-4 text-white" />
            </div>
            <span className="font-[var(--font-pixel)] text-xs tracking-wider">AUTEUR.FILM</span>
          </div>
          <div className="flex items-center gap-6 uppercase tracking-wide text-xs">
            <Link href="/terms" className="hover:text-[#FF6B6B] transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-[#FF6B6B] transition-colors">Privacy</Link>
            <Link href="/dmca" className="hover:text-[#FF6B6B] transition-colors">DMCA</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
