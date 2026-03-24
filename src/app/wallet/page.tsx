'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { CoinbaseOnramp, CoinbaseOfframp } from '@/components/payments/CoinbaseOnramp';
import { useUser } from '@/hooks/useUser';
import { useWallet } from '@/hooks/useWallet';
import { useSound } from '@/components/providers/SoundProvider';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function WalletPage() {
  const { isAuthenticated, isLoading } = useUser();
  const { walletAddress, balance, isLoadingBalance, refetchBalance } = useWallet();
  const { playClick, playSuccess } = useSound();

  const [copied, setCopied] = useState(false);
  const [fundAmount, setFundAmount] = useState(50);

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    playSuccess();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <Wallet className="h-10 w-10 text-[#1a1a1a]" />
          </div>
          <h1 className="text-2xl font-[var(--font-pixel)] tracking-wider mb-4">SIGN IN</h1>
          <p className="text-[#666] mb-8 font-medium">
            Sign in to access your wallet and manage your funds.
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

      <main className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
        <h1 className="text-3xl font-[var(--font-pixel)] tracking-wider mb-2">WALLET</h1>
        <div className="h-1 w-20 bg-[#4ECDC4] mb-8" />

        {/* Balance Card */}
        <div className="card-retro-static p-6 mb-8 !bg-[#9B5DE5] text-white">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white text-sm font-bold uppercase tracking-wide">Cash Balance</span>
            <button
              onClick={() => {
                playClick();
                refetchBalance();
              }}
              className="p-2 border-2 border-white hover:bg-white/20 transition-colors"
              disabled={isLoadingBalance}
            >
              <RefreshCw
                className={`h-4 w-4 text-white ${isLoadingBalance ? 'animate-spin' : ''}`}
                style={{ animationTimingFunction: isLoadingBalance ? 'steps(8)' : 'linear' }}
              />
            </button>
          </div>

          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-5xl font-bold text-white">
              ${balance?.formatted ? Number(balance.formatted).toFixed(2) : '0.00'}
            </span>
          </div>

          {/* Wallet Address */}
          <div className="bg-[#1a1a1a]/30 border-2 border-white/40 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80 mb-1 font-bold uppercase tracking-wide">Wallet Address (Base)</p>
                <p className="text-sm font-mono text-white">
                  {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                </p>
              </div>
              <button
                onClick={copyAddress}
                className="p-2 border-2 border-white hover:bg-white/20 transition-colors"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-[#4ECDC4]" />
                ) : (
                  <Copy className="h-4 w-4 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Subtle USDC note */}
          <p className="text-xs text-white/70 mt-3 text-center">
            Cash is stored in USDC on the Base network.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Add Funds */}
          <div className="card-retro-static p-6 bg-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 bg-[#4ECDC4] border-2 border-[#1a1a1a] flex items-center justify-center">
                <ArrowDownLeft className="h-6 w-6 text-[#1a1a1a]" />
              </div>
              <div>
                <h3 className="font-bold uppercase tracking-wide">Add Cash</h3>
                <p className="text-xs text-[#666] font-medium">Buy with card</p>
              </div>
            </div>

            {walletAddress && (
              <CoinbaseOnramp
                walletAddress={walletAddress}
                presetAmount={fundAmount}
                onSuccess={() => refetchBalance()}
                buttonText="Add Cash"
                className="w-full"
              />
            )}
            <p className="text-xs text-[#666] mt-3 font-medium">
              Coinbase charges ~2.5% processing fee.
            </p>
          </div>

          {/* Withdraw */}
          <div className="card-retro-static p-6 bg-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 bg-[#FFE66D] border-2 border-[#1a1a1a] flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-[#1a1a1a]" />
              </div>
              <div>
                <h3 className="font-bold uppercase tracking-wide">Withdraw</h3>
                <p className="text-xs text-[#666] font-medium">Cash out to bank</p>
              </div>
            </div>

            {walletAddress && (
              <CoinbaseOfframp
                walletAddress={walletAddress}
                balance={balance}
                onSuccess={() => refetchBalance()}
              />
            )}
          </div>
        </div>

        {/* Fund Amount Presets */}
        <div className="card-retro-static p-6 mb-8 bg-white">
          <h3 className="font-bold uppercase tracking-wide mb-4">Quick Add Amounts</h3>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[25, 50, 100, 250].map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  playClick();
                  setFundAmount(amount);
                }}
                className={`py-3 font-bold border-3 border-[#1a1a1a] transition-all ${
                  fundAmount === amount
                    ? 'bg-[#FF6B6B] text-white shadow-[0_0_0_#1a1a1a] translate-x-[3px] translate-y-[3px]'
                    : 'bg-white text-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] hover:shadow-[4px_4px_0_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                }`}
              >
                ${amount}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#666] font-bold">Custom:</span>
            <div className="flex items-center gap-2 flex-1">
              <span className="text-[#666] font-bold">$</span>
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(Number(e.target.value))}
                min={5}
                className="input-retro flex-1"
              />
            </div>
          </div>

          {walletAddress && (
            <CoinbaseOnramp
              walletAddress={walletAddress}
              presetAmount={fundAmount}
              onSuccess={() => refetchBalance()}
              buttonText={`Add $${fundAmount}`}
              className="w-full mt-4"
            />
          )}
        </div>

        {/* How It Works */}
        <div className="card-retro-static p-6 mb-8 bg-white">
          <h3 className="font-bold uppercase tracking-wide mb-4">How Payments Work</h3>
          <div className="space-y-4 text-sm">
            {[
              {
                num: 1,
                title: 'Add cash to your wallet',
                desc: 'Use card, Apple Pay, or bank transfer via Coinbase. 0% fees.',
                color: '#FF6B6B',
              },
              {
                num: 2,
                title: 'Tip creators & access content',
                desc: 'Tip creators directly. Pay only for the content you want to watch.',
                color: '#4ECDC4',
              },
              {
                num: 3,
                title: 'Withdraw anytime',
                desc: 'Transfer to Coinbase and cash out to your bank. 0% fees.',
                color: '#FFE66D',
              },
            ].map(({ num, title, desc, color }) => (
              <div key={num} className="flex items-start gap-3">
                <div
                  className="h-8 w-8 border-2 border-[#1a1a1a] flex items-center justify-center text-sm font-bold"
                  style={{ background: color }}
                >
                  {num}
                </div>
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="text-[#666]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Network Info */}
        <div className="card-retro-static p-6 bg-white">
          <h3 className="font-bold uppercase tracking-wide mb-4">Network Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#666] font-medium">Network</span>
              <span className="flex items-center gap-2 font-bold">
                <div className="h-3 w-3 bg-blue-500 border border-[#1a1a1a]" />
                Base (Coinbase L2)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#666] font-medium">Transaction fees</span>
              <span className="text-[#4ECDC4] font-bold">~$0.001</span>
            </div>
          </div>

          <a
            href={`https://basescan.org/address/${walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={playClick}
            className="flex items-center gap-2 text-sm text-[#FF6B6B] hover:underline mt-4 font-bold"
          >
            View on BaseScan
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </main>
    </div>
  );
}
