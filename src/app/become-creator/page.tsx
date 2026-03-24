'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/hooks/useUser';
import { useSound } from '@/components/providers/SoundProvider';
import { createClient } from '@/lib/supabase/client';
import { Film, DollarSign, Users, Check, FileText, Sparkles } from 'lucide-react';
import Link from 'next/link';

const BENEFITS = [
  {
    icon: Film,
    title: 'Unlimited Publishing',
    description: 'Upload as many films and series as you want, completely free.',
    color: '#FF6B6B',
  },
  {
    icon: DollarSign,
    title: '98% of Tips',
    description: 'Keep 98% of every tip you receive. We only take 2%.',
    color: '#4ECDC4',
  },
  {
    icon: Users,
    title: 'Build Your Audience',
    description: 'Grow your fanbase with leaderboards and engagement tools.',
    color: '#FFE66D',
  },
];

const AGREEMENT_POINTS = [
  'You grant Auteur a non-exclusive license to distribute your content',
  'You retain full ownership and copyright of your work',
  'Either party can terminate with 30 days written notice',
  'Auteur may monetize content in the future (no current plans, but reserved for tasteful implementation)',
  'You agree to community guidelines and content policies',
];

export default function BecomeCreatorPage() {
  const router = useRouter();
  const { user, isAuthenticated, isCreator } = useUser();
  const { playClick, playSuccess } = useSound();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();

  // Already a creator
  if (isCreator) {
    router.push('/publish');
    return null;
  }

  const handleBecomeCreator = async () => {
    if (!user || !agreedToTerms || !supabase) return;

    setIsSubmitting(true);
    try {
      await supabase
        .from('users')
        .update({ is_creator: true })
        .eq('id', user.id);

      playSuccess();
      router.push('/publish');
    } catch (error) {
      console.error('Error becoming creator:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <Header />

      <main className="pt-24 pb-12 px-4 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#9B5DE5] border-3 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] text-sm font-bold text-white mb-6">
            <Sparkles className="h-4 w-4" />
            FREE FOREVER
          </div>
          <h1 className="text-3xl sm:text-4xl font-[var(--font-pixel)] tracking-wider mb-4">
            BECOME A CREATOR
          </h1>
          <div className="h-1 w-24 bg-[#FF6B6B] mx-auto mb-4" />
          <p className="text-[#666] text-lg font-medium">
            Join the platform built for next-gen filmmakers. Publishing is always free.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          {BENEFITS.map(({ icon: Icon, title, description, color }) => (
            <div
              key={title}
              className="card-retro-static p-6 text-center bg-white"
            >
              <div
                className="h-14 w-14 border-3 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center mx-auto mb-4"
                style={{ background: color }}
              >
                <Icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-bold uppercase tracking-wide mb-2">{title}</h3>
              <p className="text-sm text-[#666]">{description}</p>
            </div>
          ))}
        </div>

        {/* Distribution Agreement */}
        <div className="card-retro-static p-6 mb-8 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-[#FFE66D] border-2 border-[#1a1a1a] flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#1a1a1a]" />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-wide">Distribution Agreement</h2>
          </div>

          <p className="text-sm text-[#666] mb-6 font-medium">
            By becoming a creator, you agree to the following terms:
          </p>

          <ul className="space-y-3 mb-6">
            {AGREEMENT_POINTS.map((point, index) => (
              <li key={index} className="flex items-start gap-3 text-sm">
                <div
                  className="h-6 w-6 border-2 border-[#1a1a1a] flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#9B5DE5', '#FF6B6B'][index] }}
                >
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-[#666]">{point}</span>
              </li>
            ))}
          </ul>

          <label
            className="flex items-start gap-3 cursor-pointer group p-4 border-3 border-[#1a1a1a] bg-[#FFF8F0] hover:bg-[#FFE66D] transition-colors"
            onClick={playClick}
          >
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-5 w-5 border-2 border-[#1a1a1a] bg-white appearance-none checked:bg-[#4ECDC4] cursor-pointer"
            />
            <span className="text-sm font-medium">
              I have read and agree to the{' '}
              <Link href="/terms" className="text-[#FF6B6B] hover:underline font-bold">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/creator-agreement" className="text-[#FF6B6B] hover:underline font-bold">
                Creator Distribution Agreement
              </Link>
            </span>
          </label>
        </div>

        {/* CTA */}
        {!isAuthenticated ? (
          <div className="text-center">
            <p className="text-[#666] mb-4 font-medium">
              Sign in to become a creator
            </p>
            <Link href="/">
              <Button variant="primary">Sign In</Button>
            </Link>
          </div>
        ) : (
          <Button
            size="lg"
            variant="primary"
            className="w-full"
            onClick={handleBecomeCreator}
            disabled={!agreedToTerms}
            isLoading={isSubmitting}
          >
            <Film className="h-5 w-5 mr-2" />
            Become a Creator
          </Button>
        )}

        <p className="text-center text-sm text-[#666] mt-6 font-bold uppercase tracking-wide">
          Creating content is always free. You only earn, never pay.
        </p>
      </main>
    </div>
  );
}
