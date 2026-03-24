'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useSpendPermission } from '@/hooks/useSpendPermission';
import { useSound } from '@/components/providers/SoundProvider';
import { QUICK_TIP_MAX_AMOUNT, QUICK_TIP_PERIOD_DAYS } from '@/lib/constants';
import { Zap, Shield, X, Check, AlertCircle } from 'lucide-react';

interface EnableQuickTipsProps {
  isOpen: boolean;
  onClose: () => void;
  onEnabled?: () => void;
  onSkip?: () => void;
}

export function EnableQuickTips({ isOpen, onClose, onEnabled, onSkip }: EnableQuickTipsProps) {
  const [error, setError] = useState<string | null>(null);
  const { playClick, playSuccess, playError } = useSound();
  const { requestPermission, isRequesting } = useSpendPermission();

  if (!isOpen) return null;

  const handleEnable = async () => {
    playClick();
    setError(null);

    try {
      await requestPermission();
      playSuccess();
      onEnabled?.();
      onClose();
    } catch (err: any) {
      console.error('Enable quick tips error:', err);
      playError();
      if (err.message?.includes('User rejected') || err.message?.includes('denied')) {
        setError('Signature cancelled. You can enable Quick Tips later in Settings.');
      } else {
        setError(err.message || 'Failed to enable Quick Tips. Please try again.');
      }
    }
  };

  const handleSkip = () => {
    playClick();
    onSkip?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white border-4 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a] p-6 max-w-md w-full mx-4 relative">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 border-2 border-[#1a1a1a] hover:bg-[#FF6B6B] hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="h-20 w-20 bg-[#FFE66D] border-4 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] flex items-center justify-center">
            <Zap className="h-10 w-10 text-[#1a1a1a]" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold font-[var(--font-pixel)] tracking-wider text-center mb-2">
          ENABLE QUICK TIPS
        </h3>

        {/* Description */}
        <p className="text-[#666] text-center mb-6 font-medium">
          Tip creators instantly with one click - no confirmations needed!
        </p>

        {/* Features */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 bg-[#4ECDC4] border-2 border-[#1a1a1a] flex items-center justify-center flex-shrink-0">
              <Check className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">One-tap tipping</p>
              <p className="text-xs text-[#666]">Skip wallet confirmations for every tip</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-6 w-6 bg-[#4ECDC4] border-2 border-[#1a1a1a] flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">Protected limits</p>
              <p className="text-xs text-[#666]">Max ${QUICK_TIP_MAX_AMOUNT} per tip, auto-expires in {QUICK_TIP_PERIOD_DAYS} days</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-6 w-6 bg-[#4ECDC4] border-2 border-[#1a1a1a] flex items-center justify-center flex-shrink-0">
              <X className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">Revoke anytime</p>
              <p className="text-xs text-[#666]">Disable Quick Tips instantly in Settings</p>
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="bg-[#FFF8F0] border-3 border-[#1a1a1a] p-3 mb-6">
          <p className="text-xs text-[#666] font-medium">
            <span className="font-bold text-[#1a1a1a]">Powered by Coinbase:</span> Your funds stay in your wallet.
            You're granting Auteur permission to send tips on your behalf, up to the limit you set.
          </p>
        </div>

        {error && (
          <div className="bg-[#FF6B6B]/10 border-3 border-[#FF6B6B] text-[#FF6B6B] p-3 mb-4 text-sm font-bold flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleSkip}
            disabled={isRequesting}
          >
            Maybe Later
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleEnable}
            isLoading={isRequesting}
          >
            <Zap className="h-4 w-4 mr-2" />
            Enable
          </Button>
        </div>

        <p className="text-xs text-[#666] text-center mt-4 font-medium">
          You'll sign once to authorize Quick Tips
        </p>
      </div>
    </div>
  );
}
