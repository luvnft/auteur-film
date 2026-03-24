'use client';

import { useConnect, useAccount } from 'wagmi';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useSound } from '@/components/providers/SoundProvider';
import { Film, Sparkles, Trophy, DollarSign, ArrowRight, Star, Zap, Heart } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { connectors, connect, isPending } = useConnect();
  const { isConnected } = useAccount();
  const { playClick, playSuccess } = useSound();

  // Get the Coinbase Wallet connector
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

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Fun decorative background */}
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />

        {/* Floating decorative elements */}
        <div className="absolute top-40 left-10 animate-float opacity-40">
          <Star className="h-8 w-8 text-[#FFE66D]" fill="#FFE66D" />
        </div>
        <div className="absolute top-60 right-20 animate-float opacity-40" style={{ animationDelay: '1s' }}>
          <Zap className="h-6 w-6 text-[#FF6B6B]" fill="#FF6B6B" />
        </div>
        <div className="absolute bottom-20 left-1/4 animate-float opacity-40" style={{ animationDelay: '0.5s' }}>
          <Heart className="h-7 w-7 text-[#9B5DE5]" fill="#9B5DE5" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFE66D] border-3 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] text-sm font-bold text-[#1a1a1a] mb-8 hover-wiggle">
            <Sparkles className="h-4 w-4" />
            THE NEXT GENERATION OF FILMMAKING
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-[var(--font-pixel)] tracking-wider mb-6 leading-tight">
            <span className="text-[#1a1a1a]">OWN YOUR</span>
            <br />
            <span className="text-[#FF6B6B]">AUDIENCE.</span>
          </h1>

          <p className="text-lg sm:text-xl text-[#666] max-w-2xl mx-auto mb-10 font-medium">
            The platform where next-gen filmmakers publish, grow, and earn.
            Built for artists, outsiders, and independent storytellers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isConnected ? (
              <Link href="/browse">
                <Button size="lg" variant="primary">
                  Start Watching
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            ) : (
              <Button size="lg" variant="primary" onClick={handleConnect} disabled={isPending}>
                {isPending ? 'Signing in...' : 'Sign Up Free'}
                {!isPending && <ArrowRight className="h-5 w-5 ml-2" />}
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

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t-4 border-[#1a1a1a] bg-white">
        <div className="max-w-6xl mx-auto">
          <Link href="/why" onClick={playClick}>
            <h2 className="text-3xl font-[var(--font-pixel)] text-center mb-4 tracking-wider hover:text-[#FF6B6B] transition-colors">
              WHY AUTEUR?
            </h2>
          </Link>
          <div className="h-1 w-24 bg-[#4ECDC4] mx-auto mb-6" />
          <p className="text-[#666] text-center mb-16 max-w-2xl mx-auto font-medium">
            We're building the home for independent cinema. For creators and fans alike.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* For Creators */}
            <div className="card-retro-static p-8 bg-[#FFF8F0]">
              <div className="h-14 w-14 bg-[#FF6B6B] border-3 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center mb-6">
                <Film className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 uppercase tracking-wide">Publish Freely</h3>
              <p className="text-[#666]">
                No gatekeepers. Upload your films and series instantly.
                Keep 99% of every tip. No subscription fees for creators.
              </p>
            </div>

            {/* Earn */}
            <div className="card-retro-static p-8 bg-[#FFF8F0]">
              <div className="h-14 w-14 bg-[#4ECDC4] border-3 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center mb-6">
                <DollarSign className="h-7 w-7 text-[#1a1a1a]" />
              </div>
              <h3 className="text-xl font-bold mb-3 uppercase tracking-wide">Earn Cash</h3>
              <p className="text-[#666]">
                Creators earn from tips and subscriber views.
                Fans earn rewards by climbing content leaderboards.
                Withdraw anytime via Coinbase.
              </p>
            </div>

            {/* Gamified */}
            <div className="card-retro-static p-8 bg-[#FFF8F0]">
              <div className="h-14 w-14 bg-[#FFE66D] border-3 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center mb-6">
                <Trophy className="h-7 w-7 text-[#1a1a1a]" />
              </div>
              <h3 className="text-xl font-bold mb-3 uppercase tracking-wide">Compete & Earn</h3>
              <p className="text-[#666]">
                Every film has a leaderboard. Watch, tip, comment, and
                refer friends to climb the ranks and earn platform rewards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t-4 border-[#1a1a1a] bg-[#FFF8F0]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-[var(--font-pixel)] text-center mb-4 tracking-wider">
            LEADERBOARD POINTS
          </h2>
          <div className="h-1 w-24 bg-[#9B5DE5] mx-auto mb-16" />

          <div className="space-y-4">
            {[
              { action: 'Watch 75%+ of a film', points: '100', icon: '👀', color: '#4ECDC4' },
              { action: 'Tip the creator', points: '50 + tip × 10', icon: '💜', color: '#9B5DE5' },
              { action: 'Pin to your Top 5', points: '200', icon: '📌', color: '#FF6B6B' },
              { action: 'Get upvotes on comments', points: '10 / upvote', icon: '💬', color: '#FFE66D' },
              { action: 'Refer a friend', points: '500', icon: '🔗', color: '#4ECDC4' },
            ].map((item, index) => (
              <button
                key={index}
                onClick={playClick}
                className="w-full flex items-center gap-6 p-5 bg-white border-3 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] hover:shadow-[6px_6px_0_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all cursor-pointer text-left"
              >
                <div
                  className="text-3xl h-14 w-14 border-3 border-[#1a1a1a] flex items-center justify-center"
                  style={{ background: item.color }}
                >
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">{item.action}</p>
                </div>
                <div
                  className="px-4 py-2 border-3 border-[#1a1a1a] font-bold text-lg"
                  style={{ background: item.color }}
                >
                  +{item.points}
                </div>
              </button>
            ))}
          </div>

          <p className="text-center text-[#666] mt-8 text-sm font-medium">
            Top leaderboard positions may be eligible for platform rewards
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t-4 border-[#1a1a1a] bg-[#FF6B6B]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-[var(--font-pixel)] mb-4 text-white tracking-wider">
            READY TO DIVE IN?
          </h2>
          <p className="text-white/90 mb-8 text-lg font-medium">
            Join the platform built for the next generation of filmmakers.
            Creators publish free. Fans get a 1-day free trial.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isConnected ? (
              <Link href="/browse">
                <Button size="lg" variant="accent">
                  Browse Content
                </Button>
              </Link>
            ) : (
              <Button size="lg" variant="accent" onClick={handleConnect} disabled={isPending}>
                {isPending ? 'Connecting...' : 'Get Started'}
              </Button>
            )}
          </div>

          <p className="text-white/70 text-sm mt-6 font-bold uppercase tracking-wide">
            Free for creators • Free for fans
          </p>
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
            <Link
              href="/terms"
              onClick={playClick}
              className="hover:text-[#FF6B6B] transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              onClick={playClick}
              className="hover:text-[#FF6B6B] transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/dmca"
              onClick={playClick}
              className="hover:text-[#FF6B6B] transition-colors"
            >
              DMCA
            </Link>
            <Link
              href="/why"
              onClick={playClick}
              className="hover:text-[#FF6B6B] transition-colors"
            >
              Why Auteur
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
