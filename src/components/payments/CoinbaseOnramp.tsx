'use client';

import { useState, useCallback } from 'react';
import { getOnrampBuyUrl } from '@coinbase/onchainkit/fund';
import { Button } from '@/components/ui/Button';
import { Wallet, CreditCard, AlertCircle, Send, ExternalLink } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

interface CoinbaseOnrampProps {
  walletAddress: string;
  presetAmount?: number; // Amount in USD to prefill
  onSuccess?: () => void;
  onExit?: () => void;
  buttonText?: string;
  buttonVariant?: 'primary' | 'secondary' | 'ghost';
  buttonSize?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export function CoinbaseOnramp({
  walletAddress,
  presetAmount,
  onSuccess,
  onExit,
  buttonText = 'Add Funds',
  buttonVariant = 'primary',
  buttonSize = 'md',
  className = '',
  disabled = false,
}: CoinbaseOnrampProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (!walletAddress) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get session token from our API
      const tokenResponse = await fetch('/api/onramp/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to get session token');
      }

      const { token: sessionToken } = await tokenResponse.json();
      console.log('Session token obtained, length:', sessionToken?.length);

      // Generate the onramp URL using OnchainKit
      // Note: addresses and assets are already baked into the session token
      const onrampUrl = getOnrampBuyUrl({
        sessionToken,
        presetFiatAmount: presetAmount || 50,
        defaultAsset: 'USDC',
        defaultNetwork: 'base',
      });

      console.log('Opening onramp URL');

      // Open in popup
      const popup = window.open(
        onrampUrl,
        'coinbase-onramp',
        'width=460,height=700,left=100,top=100'
      );

      // Monitor popup for close
      if (popup) {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            setIsLoading(false);
            // We can't know if it was success or exit, so call both
            onExit?.();
          }
        }, 500);
      } else {
        // Popup blocked, open in new tab instead
        window.open(onrampUrl, '_blank');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Onramp error:', err);
      setError(err instanceof Error ? err.message : 'Failed to open onramp');
      setIsLoading(false);
    }
  }, [walletAddress, presetAmount, onSuccess, onExit]);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#ef4444]">
        <AlertCircle className="h-4 w-4" />
        {error}
      </div>
    );
  }

  return (
    <Button
      variant={buttonVariant}
      size={buttonSize}
      onClick={handleClick}
      disabled={disabled || isLoading || !walletAddress}
      isLoading={isLoading}
      className={className}
    >
      {!isLoading && <CreditCard className="h-4 w-4 mr-2" />}
      {buttonText}
    </Button>
  );
}

// Offramp component for withdrawing to bank
interface CoinbaseOfframpProps {
  walletAddress: string;
  balance?: { formatted: string } | null;
  presetAmount?: number;
  onSuccess?: () => void;
  className?: string;
}

export function CoinbaseOfframp({
  walletAddress,
  balance,
  presetAmount,
  onSuccess,
  className = '',
}: CoinbaseOfframpProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState(presetAmount || 0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customAddress, setCustomAddress] = useState('');
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const { transferUSDC } = useWallet();

  const maxAmount = balance ? Number(balance.formatted) : 0;

  const MIN_WITHDRAW_AMOUNT = 10; // Coinbase ACH minimum

  const handleWithdrawToBank = useCallback(async () => {
    if (!walletAddress) {
      setError('Wallet not connected');
      return;
    }

    if (amount <= 0) {
      setError('Enter an amount to withdraw');
      return;
    }

    if (amount < MIN_WITHDRAW_AMOUNT) {
      setError(`Minimum withdrawal is $${MIN_WITHDRAW_AMOUNT} for bank transfers`);
      return;
    }

    if (amount > maxAmount) {
      setError(`Insufficient balance. Max: $${maxAmount.toFixed(2)}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get offramp quote with URL from our API
      const quoteResponse = await fetch('/api/offramp/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, amount }),
      });

      if (!quoteResponse.ok) {
        const errorData = await quoteResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to get offramp quote');
      }

      const { offrampUrl } = await quoteResponse.json();

      if (!offrampUrl) {
        throw new Error('No offramp URL returned');
      }

      // Open in popup
      const popup = window.open(
        offrampUrl,
        'coinbase-offramp',
        'width=460,height=700,left=100,top=100'
      );

      if (popup) {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            setIsLoading(false);
            onSuccess?.();
          }
        }, 500);
      } else {
        window.open(offrampUrl, '_blank');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Offramp error:', err);
      setError(err instanceof Error ? err.message : 'Failed to open offramp');
      setIsLoading(false);
    }
  }, [walletAddress, amount, maxAmount, onSuccess]);

  return (
    <div className={className}>
      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm font-bold mb-2">Amount to Withdraw</label>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">$</span>
          <input
            type="number"
            value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value))}
            max={maxAmount}
            min={0}
            step="0.01"
            placeholder="0.00"
            className="input-retro flex-1"
          />
        </div>
        {maxAmount > 0 && (
          <button
            onClick={() => setAmount(maxAmount)}
            className="text-xs text-[#FF6B6B] hover:underline mt-1 font-medium"
          >
            Withdraw all (${maxAmount.toFixed(2)})
          </button>
        )}
      </div>

      {/* Quick amounts */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[10, 25, 50, 100].map((preset) => (
          <button
            key={preset}
            onClick={() => setAmount(Math.min(preset, maxAmount))}
            disabled={preset > maxAmount}
            className={`py-2 text-sm font-bold border-2 border-[#1a1a1a] transition-all ${
              amount === preset
                ? 'bg-[#FF6B6B] text-white shadow-none translate-x-[2px] translate-y-[2px]'
                : preset > maxAmount
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white hover:bg-gray-50 shadow-[2px_2px_0_#1a1a1a]'
            }`}
          >
            ${preset}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-[#ef4444] mb-4">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Primary withdraw button */}
      <Button
        variant="primary"
        onClick={handleWithdrawToBank}
        disabled={isLoading || !walletAddress || amount <= 0}
        isLoading={isLoading}
        className="w-full mb-3"
      >
        {!isLoading && <Wallet className="h-4 w-4 mr-2" />}
        Withdraw ${amount > 0 ? amount.toFixed(2) : '0.00'} to Bank
      </Button>

      <p className="text-xs text-[#666] mb-4 font-medium">
        Withdraw to your bank via Coinbase. Requires a Coinbase account. $10 minimum. 0% fees for USDC.
      </p>

      {/* Advanced option - hidden by default */}
      <div className="border-t border-gray-200 pt-3">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-[#666] hover:text-[#1a1a1a] font-medium flex items-center gap-1"
        >
          {showAdvanced ? '- Hide' : '+ Show'} advanced options
        </button>

        {showAdvanced && (
          <div className="mt-3 p-3 bg-gray-50 border-2 border-gray-200">
            <label className="block text-xs font-bold mb-2 text-[#666]">
              Send to External Wallet
            </label>
            <input
              type="text"
              value={customAddress}
              onChange={(e) => {
                setCustomAddress(e.target.value);
                setTransferSuccess(null);
              }}
              placeholder="0x... wallet address"
              className="input-retro w-full text-sm mb-2"
            />
            <p className="text-xs text-[#999] mb-2">
              Transfer USDC directly to another wallet on Base network.
            </p>
            {transferSuccess && (
              <div className="mb-2 p-2 bg-green-50 border border-green-200 text-green-700 text-xs">
                Transfer complete!{' '}
                <a
                  href={`https://basescan.org/tx/${transferSuccess}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline inline-flex items-center gap-1"
                >
                  View on BaseScan <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              disabled={
                !customAddress ||
                !customAddress.startsWith('0x') ||
                customAddress.length !== 42 ||
                amount <= 0 ||
                transferUSDC.isPending
              }
              isLoading={transferUSDC.isPending}
              className="w-full"
              onClick={async () => {
                setError(null);
                setTransferSuccess(null);
                try {
                  const txHash = await transferUSDC.mutateAsync({
                    to: customAddress as `0x${string}`,
                    amountDollars: amount,
                  });
                  setTransferSuccess(txHash);
                  setAmount(0);
                  onSuccess?.();
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Transfer failed');
                }
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              Send ${amount > 0 ? amount.toFixed(2) : '0.00'} USDC
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Legacy link component (kept for backwards compatibility)
export function CoinbaseOfframpLink({ className = '' }: { className?: string }) {
  return (
    <a
      href="https://www.coinbase.com/settings/linked-accounts"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 text-[#7c3aed] hover:underline ${className}`}
    >
      <Wallet className="h-4 w-4" />
      Withdraw to Bank via Coinbase
    </a>
  );
}
