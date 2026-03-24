'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Film, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SubscribePage() {
  const router = useRouter();

  // Redirect to browse after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/browse');
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <Header />

      <main className="pt-24 pb-12 px-4 max-w-xl mx-auto text-center">
        <div className="card-retro-static inline-flex items-center justify-center h-24 w-24 mb-6 bg-[#4ECDC4]">
          <Film className="h-12 w-12 text-white" />
        </div>

        <h1 className="text-2xl font-[var(--font-pixel)] tracking-wider mb-4">
          NO SUBSCRIPTION NEEDED
        </h1>

        <p className="text-[#666] mb-6 font-medium">
          Auteur has moved to a pay-per-content model. Browse our catalog and pay only for the content you want to watch.
        </p>

        <div className="space-y-4 mb-8">
          <div className="card-retro-static p-4 bg-white text-left">
            <h3 className="font-bold mb-2 text-[#4ECDC4]">Free Content</h3>
            <p className="text-sm text-[#666]">
              Watch free films just by signing in - no payment required.
            </p>
          </div>

          <div className="card-retro-static p-4 bg-white text-left">
            <h3 className="font-bold mb-2 text-[#FFE66D]">Paid Content</h3>
            <p className="text-sm text-[#666]">
              Premium films available for one-time purchase from $0.01 to $25.00.
            </p>
          </div>

          <div className="card-retro-static p-4 bg-white text-left">
            <h3 className="font-bold mb-2 text-[#FF6B6B]">Support Creators</h3>
            <p className="text-sm text-[#666]">
              Tip your favorite creators with just 2% platform fee.
            </p>
          </div>
        </div>

        <Link href="/browse">
          <Button variant="primary" size="lg">
            Browse Content
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </Link>

        <p className="text-sm text-[#999] mt-6">
          Redirecting to browse in a few seconds...
        </p>
      </main>
    </div>
  );
}
