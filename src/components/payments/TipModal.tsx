'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { CoinbaseOnramp } from '@/components/payments/CoinbaseOnramp';
import { EnableQuickTips } from '@/components/payments/EnableQuickTips';
import { useWallet } from '@/hooks/useWallet';
import { useSpendPermission } from '@/hooks/useSpendPermission';
import { useSound } from '@/components/providers/SoundProvider';
import { createClient } from '@/lib/supabase/client';
import { TIP_PRESETS, MIN_TIP_AMOUNT, TIP_FEE_PERCENT, QUICK_TIP_MAX_AMOUNT } from '@/lib/constants';
import {
  X,
  DollarSign,
  CreditCard,
  Check,
  AlertCircle,
  Heart,
  Zap,
} from 'lucide-react';
import type { Content, User } from '@/types/database';

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: Content;
  creator: User;
  userId: string;
}

type TipStep = 'amount' | 'fund' | 'confirm' | 'success' | 'enable-quick-tips';

export function TipModal({ isOpen, onClose, content, creator, userId }: TipModalProps) {
  const [step, setStep] = useState<TipStep>('amount');
  const [tipAmount, setTipAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSendingQuickTip, setIsSendingQuickTip] = useState(false);

  const { playClick, playSuccess, playError } = useSound();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const {
    walletAddress,
    balance,
    isLoadingBalance,
    hasSufficientBalance,
    getAmountNeeded,
    sendTip,
    refetchBalance,
  } = useWallet();

  const { hasQuickTips, isCheckingPermission } = useSpendPermission();

  if (!isOpen) return null;

  const finalAmount = customAmount ? Number(customAmount) : tipAmount;
  const creatorAmount = finalAmount * (1 - TIP_FEE_PERCENT / 100);
  const hasFunds = hasSufficientBalance(finalAmount);
  const amountNeeded = getAmountNeeded(finalAmount);

  // Send tip using Quick Tips (server-side execution, no wallet popup)
  const sendQuickTip = async () => {
    setIsSendingQuickTip(true);
    setStep('confirm');
    setError(null);

    try {
      const response = await fetch('/api/tips/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          creatorWallet: creator.wallet_address,
          contentId: content.id,
          amountDollars: finalAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send tip');
      }

      // Invalidate queries to refresh leaderboard immediately
      queryClient.invalidateQueries({ queryKey: ['leaderboard', content.id] });
      queryClient.invalidateQueries({ queryKey: ['content', content.id] });

      playSuccess();
      setStep('success');
    } catch (err: any) {
      console.error('Quick tip error:', err);
      playError();
      setError(err.message || 'Failed to send tip. Please try again.');
      setStep('amount');
    } finally {
      setIsSendingQuickTip(false);
    }
  };

  // Send tip using wallet signature (fallback when Quick Tips not enabled)
  const sendWalletTip = async () => {
    setStep('confirm');
    setError(null);

    try {
      const result = await sendTip.mutateAsync({
        creatorWallet: creator.wallet_address as `0x${string}`,
        amountDollars: finalAmount,
      });

      // Record tip in database
      await supabase!.from('tips').insert({
        from_user_id: userId,
        to_user_id: creator.id,
        content_id: content.id,
        amount_cents: Math.round(finalAmount * 100),
        transaction_hash: result.creatorTxHash,
      });

      // Calculate tip points: 50 base + (tip amount × 10)
      const tipPoints = 50 + Math.round(finalAmount * 10);

      // Get existing leaderboard score or create new one
      const { data: existingScore } = await supabase!
        .from('leaderboard_scores')
        .select('score, breakdown')
        .eq('user_id', userId)
        .eq('content_id', content.id)
        .single();

      if (existingScore) {
        // Update existing score - add tip points
        const currentBreakdown = existingScore.breakdown || { views: 0, tips: 0, pin: 0, comments: 0, referrals: 0 };
        const newTipPoints = (currentBreakdown.tips || 0) + tipPoints;
        await supabase!
          .from('leaderboard_scores')
          .update({
            score: existingScore.score + tipPoints,
            breakdown: { ...currentBreakdown, tips: newTipPoints },
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('content_id', content.id);
      } else {
        // Create new leaderboard entry
        await supabase!.from('leaderboard_scores').insert({
          user_id: userId,
          content_id: content.id,
          score: tipPoints,
          breakdown: { views: 0, tips: tipPoints, pin: 0, comments: 0, referrals: 0 },
        });
      }

      // Invalidate queries to refresh leaderboard immediately
      queryClient.invalidateQueries({ queryKey: ['leaderboard', content.id] });
      queryClient.invalidateQueries({ queryKey: ['content', content.id] });

      playSuccess();
      setStep('success');
    } catch (err: any) {
      console.error('Tip error:', err);
      playError();
      setError(err.message || 'Failed to send tip. Please try again.');
      setStep('amount');
    }
  };

  const handleSendTip = async () => {
    if (finalAmount < MIN_TIP_AMOUNT) {
      playError();
      setError(`Minimum tip is $${MIN_TIP_AMOUNT}`);
      return;
    }

    if (!hasFunds) {
      playClick();
      setStep('fund');
      return;
    }

    if (!creator.wallet_address) {
      playError();
      setError('Creator has not set up their wallet');
      return;
    }

    if (!supabase) {
      playError();
      setError('Database not configured');
      return;
    }

    // If Quick Tips is enabled and amount is within limit, use instant tipping
    if (hasQuickTips && finalAmount <= QUICK_TIP_MAX_AMOUNT) {
      await sendQuickTip();
      return;
    }

    // If Quick Tips not enabled, show the enable prompt first
    if (!hasQuickTips && finalAmount <= QUICK_TIP_MAX_AMOUNT) {
      setStep('enable-quick-tips');
      return;
    }

    // Fallback to wallet signature (for amounts > QUICK_TIP_MAX_AMOUNT or if user skips)
    await sendWalletTip();
  };

  const handleFundingComplete = async () => {
    await refetchBalance();
    setTimeout(() => {
      if (hasSufficientBalance(finalAmount)) {
        handleSendTip();
      } else {
        setStep('amount');
      }
    }, 1000);
  };

  const handleClose = () => {
    setStep('amount');
    setTipAmount(5);
    setCustomAmount('');
    setError(null);
    onClose();
  };

  // Show EnableQuickTips modal instead of TipModal when in that step
  if (step === 'enable-quick-tips') {
    return (
      <EnableQuickTips
        isOpen={true}
        onClose={() => setStep('amount')}
        onEnabled={() => {
          // Quick Tips now enabled, send the tip
          sendQuickTip();
        }}
        onSkip={() => {
          // User skipped, fall back to wallet signature
          sendWalletTip();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white border-4 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a] p-6 max-w-md w-full mx-4 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 border-2 border-[#1a1a1a] hover:bg-[#FF6B6B] hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Success State */}
        {step === 'success' && (
          <div className="text-center py-8">
            <div className="h-20 w-20 bg-[#4ECDC4] border-4 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] flex items-center justify-center mx-auto mb-4">
              <Heart className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold font-[var(--font-pixel)] tracking-wider mb-2">TIP SENT!</h3>
            <p className="text-[#666] mb-4 font-medium">
              ${finalAmount.toFixed(2)} sent to {creator.display_name}
            </p>
            <div className="inline-block px-4 py-2 bg-[#FFE66D] border-3 border-[#1a1a1a] mb-6">
              <p className="text-sm font-bold">
                +{50 + finalAmount * 10} leaderboard points earned!
              </p>
            </div>
            <Button onClick={handleClose} variant="secondary">
              Close
            </Button>
          </div>
        )}

        {/* Confirm State */}
        {step === 'confirm' && (
          <div className="text-center py-8">
            <div className="h-16 w-16 border-4 border-[#FF6B6B] border-t-transparent animate-spin mx-auto mb-4" style={{ animationTimingFunction: 'steps(8)' }} />
            <h3 className="text-lg font-bold mb-2">SENDING TIP</h3>
            <p className="text-[#666]">
              {isSendingQuickTip || hasQuickTips
                ? 'Processing your tip...'
                : 'Please confirm the transaction in your wallet...'}
            </p>
          </div>
        )}


        {/* Fund State */}
        {step === 'fund' && walletAddress && (
          <div>
            <div className="text-center mb-6">
              <div className="h-16 w-16 bg-[#FFE66D] border-3 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center mx-auto mb-3">
                <CreditCard className="h-8 w-8 text-[#1a1a1a]" />
              </div>
              <h3 className="text-xl font-bold font-[var(--font-pixel)] tracking-wider mb-1">ADD CASH TO TIP</h3>
              <p className="text-sm text-[#666] font-medium">
                You need ${amountNeeded.toFixed(2)} more
              </p>
            </div>

            <div className="bg-[#FFF8F0] border-3 border-[#1a1a1a] p-3 mb-4 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-[#666] font-medium">Balance</span>
                <span className="font-bold">${balance?.dollars?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-[#FF6B6B]">
                <span className="font-bold">Needed</span>
                <span className="font-bold">${amountNeeded.toFixed(2)}</span>
              </div>
            </div>

            <CoinbaseOnramp
              walletAddress={walletAddress}
              presetAmount={Math.ceil(amountNeeded) + 5}
              onSuccess={handleFundingComplete}
              buttonText={`Add $${Math.ceil(amountNeeded) + 5}`}
              className="w-full mb-3"
            />

            <button
              onClick={() => {
                playClick();
                setStep('amount');
              }}
              className="w-full text-center text-sm text-[#FF6B6B] hover:underline font-bold"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Amount State */}
        {step === 'amount' && (
          <div>
            <h3 className="text-xl font-bold font-[var(--font-pixel)] tracking-wider mb-1">
              TIP {creator.display_name?.toUpperCase()}
            </h3>
            <p className="text-sm text-[#666] mb-6 font-medium">
              for "{content.title}"
            </p>

            {/* Preset amounts */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {TIP_PRESETS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    playClick();
                    setTipAmount(amount);
                    setCustomAmount('');
                  }}
                  className={`py-3 font-bold border-3 border-[#1a1a1a] transition-all ${
                    tipAmount === amount && !customAmount
                      ? 'bg-[#9B5DE5] text-white shadow-[0_0_0_#1a1a1a] translate-x-[2px] translate-y-[2px]'
                      : 'bg-white shadow-[2px_2px_0_#1a1a1a] hover:shadow-[3px_3px_0_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="mb-4">
              <label className="block text-sm text-[#666] mb-2 font-bold uppercase tracking-wide">
                Custom amount
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[#666] font-bold">$</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder={tipAmount.toString()}
                  min={MIN_TIP_AMOUNT}
                  className="input-retro flex-1"
                />
              </div>
            </div>

            {/* Balance info */}
            <div className="bg-[#FFF8F0] border-3 border-[#1a1a1a] p-3 mb-4 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-[#666] font-medium">Your balance</span>
                {isLoadingBalance ? (
                  <div className="h-4 w-12 bg-[#E8E0D8] animate-pulse" />
                ) : (
                  <span className="font-bold">${balance?.dollars?.toFixed(2) || '0.00'}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-[#666] font-medium">Creator receives</span>
                <span className="text-[#4ECDC4] font-bold">
                  ${creatorAmount.toFixed(2)} ({100 - TIP_FEE_PERCENT}%)
                </span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-[#999]">Platform fee</span>
                <span className="text-[#999]">
                  ${(finalAmount - creatorAmount).toFixed(2)} ({TIP_FEE_PERCENT}%)
                </span>
              </div>
            </div>

            {/* Insufficient balance warning */}
            {!isLoadingBalance && !hasFunds && (
              <div className="flex items-center gap-2 text-sm text-[#FF6B6B] mb-4 font-bold">
                <AlertCircle className="h-4 w-4" />
                Need ${amountNeeded.toFixed(2)} more - you can add cash next
              </div>
            )}

            {error && (
              <div className="bg-[#FF6B6B]/10 border-3 border-[#FF6B6B] text-[#FF6B6B] p-3 mb-4 text-sm font-bold">
                {error}
              </div>
            )}

            {/* Send button */}
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                variant="primary"
                onClick={handleSendTip}
                isLoading={sendTip.isPending || isSendingQuickTip || isCheckingPermission}
              >
                {hasFunds ? (
                  hasQuickTips ? (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Send ${finalAmount.toFixed(2)}
                    </>
                  ) : (
                    <>Send ${finalAmount.toFixed(2)}</>
                  )
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Add Cash & Send
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-[#666] text-center mt-4 font-medium">
              {hasQuickTips ? (
                <>
                  <Zap className="h-3 w-3 inline mr-1" />
                  Quick Tips enabled • One-tap tipping
                </>
              ) : (
<>{100 - TIP_FEE_PERCENT}% goes to creator • {TIP_FEE_PERCENT}% platform fee</>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
