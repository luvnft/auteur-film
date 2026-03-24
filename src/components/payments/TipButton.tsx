'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useWallet } from '@/hooks/useWallet';
import { useSound } from '@/components/providers/SoundProvider';
import { Heart, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { TIP_PRESETS } from '@/lib/constants';

interface TipButtonProps {
  creatorWallet: string;
  creatorName?: string;
  contentId?: string; // Optional - for tipping on specific content
  onSuccess?: (amount: number, txHash: string) => void;
  className?: string;
  variant?: 'inline' | 'expanded';
}

export function TipButton({
  creatorWallet,
  creatorName = 'creator',
  contentId,
  onSuccess,
  className = '',
  variant = 'inline',
}: TipButtonProps) {
  const { sendTip, balance, walletAddress, hasSufficientBalance } = useWallet();
  const { playSuccess, playClick } = useSound();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTip = async (amount: number) => {
    if (!walletAddress) {
      setError('Sign in to tip');
      return;
    }

    if (!hasSufficientBalance(amount)) {
      setError(`Insufficient balance. You have $${balance?.dollars.toFixed(2) || '0.00'}`);
      return;
    }

    setError(null);
    setSelectedAmount(amount);

    try {
      const result = await sendTip.mutateAsync({
        creatorWallet: creatorWallet as `0x${string}`,
        amountDollars: amount,
      });

      playSuccess();
      setShowSuccess(true);
      setLastTxHash(result.creatorTxHash);
      onSuccess?.(amount, result.creatorTxHash);

      // Reset after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedAmount(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tip failed');
      setSelectedAmount(null);
    }
  };

  const handleCustomTip = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < 1) {
      setError('Minimum tip is $1');
      return;
    }
    handleTip(amount);
  };

  if (showSuccess) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 text-[#4ECDC4] font-bold">
          <Check className="h-5 w-5" />
          <span>Tipped ${selectedAmount}!</span>
        </div>
        {lastTxHash && (
          <a
            href={`https://basescan.org/tx/${lastTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#666] hover:underline flex items-center gap-1 mt-1"
          >
            View transaction <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    // Compact inline version - just quick tip buttons
    return (
      <div className={`${className}`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-[#666]">Tip:</span>
          {TIP_PRESETS.map((amount) => (
            <button
              key={amount}
              onClick={() => {
                playClick();
                handleTip(amount);
              }}
              disabled={sendTip.isPending}
              className={`px-3 py-1.5 text-sm font-bold border-2 border-[#1a1a1a] transition-all ${
                sendTip.isPending && selectedAmount === amount
                  ? 'bg-[#FFE66D] animate-pulse'
                  : 'bg-white hover:bg-[#FF6B6B] hover:text-white shadow-[2px_2px_0_#1a1a1a] hover:shadow-[3px_3px_0_#1a1a1a]'
              }`}
            >
              ${amount}
            </button>
          ))}
        </div>
        {error && (
          <div className="flex items-center gap-1 text-xs text-[#ef4444] mt-2">
            <AlertCircle className="h-3 w-3" />
            {error}
          </div>
        )}
      </div>
    );
  }

  // Expanded version with custom amount
  return (
    <div className={`card-retro-static p-4 bg-white ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Heart className="h-5 w-5 text-[#FF6B6B]" />
        <span className="font-bold">Tip {creatorName}</span>
      </div>

      {/* Preset amounts */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {TIP_PRESETS.map((amount) => (
          <button
            key={amount}
            onClick={() => {
              playClick();
              handleTip(amount);
            }}
            disabled={sendTip.isPending}
            className={`py-2 text-sm font-bold border-2 border-[#1a1a1a] transition-all ${
              sendTip.isPending && selectedAmount === amount
                ? 'bg-[#FFE66D] animate-pulse'
                : 'bg-white hover:bg-[#FF6B6B] hover:text-white shadow-[2px_2px_0_#1a1a1a]'
            }`}
          >
            ${amount}
          </button>
        ))}
      </div>

      {/* Custom amount */}
      <div className="flex items-center gap-2">
        <span className="font-bold">$</span>
        <input
          type="number"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          placeholder="Custom"
          min={1}
          className="input-retro flex-1 text-sm"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={handleCustomTip}
          disabled={sendTip.isPending || !customAmount}
          isLoading={sendTip.isPending && selectedAmount === parseFloat(customAmount)}
        >
          Tip
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-1 text-xs text-[#ef4444] mt-3">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}

      <p className="text-xs text-[#666] mt-3">
        100% goes directly to {creatorName}
      </p>
    </div>
  );
}
