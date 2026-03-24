'use client';

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPublicClient, http, formatUnits, parseUnits } from 'viem';
import { base } from 'viem/chains';
import { useState } from 'react';
import {
  USDC_ADDRESS,
  USDC_DECIMALS,
  ERC20_ABI,
  PLATFORM_WALLET,
  TIP_FEE_PERCENT,
} from '@/lib/constants';

// Public client for reading blockchain state
const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export function useWallet() {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isWaitingForTx } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  });

  const walletAddress = address as `0x${string}` | undefined;

  // Fetch USDC balance
  const {
    data: balance,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ['usdc-balance', walletAddress],
    queryFn: async () => {
      if (!walletAddress) return null;

      const balanceRaw = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress],
      });

      return {
        raw: balanceRaw,
        formatted: formatUnits(balanceRaw, USDC_DECIMALS),
        dollars: Number(formatUnits(balanceRaw, USDC_DECIMALS)),
      };
    },
    enabled: !!walletAddress && isConnected,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000,
  });

  // Transfer USDC
  const transferUSDC = useMutation({
    mutationFn: async ({
      to,
      amountDollars,
    }: {
      to: `0x${string}`;
      amountDollars: number;
    }) => {
      if (!walletAddress) throw new Error('No wallet connected');

      const amount = parseUnits(amountDollars.toString(), USDC_DECIMALS);

      const txHash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [to, amount],
      });

      setPendingTxHash(txHash);

      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      setPendingTxHash(undefined);
      return txHash;
    },
    onSuccess: () => {
      // Refresh balance after transfer
      queryClient.invalidateQueries({ queryKey: ['usdc-balance', walletAddress] });
    },
  });

  // Send tip - two transactions: 98% to creator, 2% platform fee
  const sendTip = useMutation({
    mutationFn: async ({
      creatorWallet,
      amountDollars,
    }: {
      creatorWallet: `0x${string}`;
      amountDollars: number;
    }) => {
      if (!walletAddress) throw new Error('No wallet connected');

      // Calculate amounts: 98% to creator, 2% platform fee
      const platformFee = amountDollars * (TIP_FEE_PERCENT / 100);
      const creatorAmount = amountDollars - platformFee;

      const creatorAmountRaw = parseUnits(creatorAmount.toString(), USDC_DECIMALS);
      const platformFeeRaw = parseUnits(platformFee.toString(), USDC_DECIMALS);

      // Transaction 1: Send 98% to creator
      const creatorTxHash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [creatorWallet, creatorAmountRaw],
      });

      setPendingTxHash(creatorTxHash);
      await publicClient.waitForTransactionReceipt({ hash: creatorTxHash });

      // Transaction 2: Send 2% platform fee
      const platformTxHash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [PLATFORM_WALLET, platformFeeRaw],
      });

      setPendingTxHash(platformTxHash);
      await publicClient.waitForTransactionReceipt({ hash: platformTxHash });
      setPendingTxHash(undefined);

      return {
        creatorTxHash,
        platformTxHash,
        creatorAmount,
        platformFee,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usdc-balance', walletAddress] });
    },
  });

  // Pay subscription
  const paySubscription = useMutation({
    mutationFn: async ({ amountDollars }: { amountDollars: number }) => {
      if (!walletAddress) throw new Error('No wallet connected');

      const amount = parseUnits(amountDollars.toString(), USDC_DECIMALS);

      const txHash = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [PLATFORM_WALLET, amount],
      });

      setPendingTxHash(txHash);
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      setPendingTxHash(undefined);

      return txHash;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usdc-balance', walletAddress] });
    },
  });

  // Check if user has sufficient balance
  const hasSufficientBalance = (amountDollars: number): boolean => {
    if (!balance) return false;
    return balance.dollars >= amountDollars;
  };

  // Get amount needed to fund for a purchase
  const getAmountNeeded = (amountDollars: number): number => {
    if (!balance) return amountDollars;
    const needed = amountDollars - balance.dollars;
    return needed > 0 ? Math.ceil(needed) : 0;
  };

  return {
    walletAddress,
    isConnected,
    balance,
    isLoadingBalance,
    isWaitingForTx,
    refetchBalance,
    transferUSDC,
    sendTip,
    paySubscription,
    hasSufficientBalance,
    getAmountNeeded,
  };
}
