'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount, useSignTypedData } from 'wagmi';
import { createClient } from '@/lib/supabase/client';
import { useUser } from './useUser';
import {
  createQuickTipPermission,
  serializePermission,
  SPEND_PERMISSION_DOMAIN,
  SPEND_PERMISSION_TYPES,
  type SignedSpendPermission,
} from '@/lib/spend-permissions';
import { PLATFORM_WALLET } from '@/lib/constants';

export function useSpendPermission() {
  const { address: walletAddress } = useAccount();
  const { user } = useUser();
  const { signTypedDataAsync } = useSignTypedData();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [isRequesting, setIsRequesting] = useState(false);

  // Check if user has an active spend permission
  const { data: hasQuickTips, isLoading: isCheckingPermission } = useQuery({
    queryKey: ['spend-permission', user?.id],
    queryFn: async () => {
      if (!user?.id || !supabase) return false;

      const { data } = await supabase
        .from('spend_permissions')
        .select('id, expires_at')
        .eq('user_id', user.id)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return !!data;
    },
    enabled: !!user?.id && !!supabase,
  });

  // Request a new spend permission (user signs once)
  const requestPermission = useCallback(async () => {
    if (!walletAddress || !user?.id || !supabase) {
      throw new Error('Wallet not connected or user not logged in');
    }

    setIsRequesting(true);

    try {
      // Create the permission structure
      const permission = createQuickTipPermission(walletAddress, PLATFORM_WALLET);

      // Request user signature via EIP-712
      const signature = await signTypedDataAsync({
        domain: SPEND_PERMISSION_DOMAIN,
        types: SPEND_PERMISSION_TYPES,
        primaryType: 'SpendPermission',
        message: {
          account: permission.account,
          spender: permission.spender,
          token: permission.token,
          allowance: permission.allowance,
          period: permission.period,
          start: permission.start,
          end: permission.end,
          salt: permission.salt,
          extraData: permission.extraData,
        },
      });

      const signedPermission: SignedSpendPermission = {
        ...permission,
        signature,
      };

      // Store in database
      const { error } = await supabase.from('spend_permissions').insert({
        user_id: user.id,
        wallet_address: walletAddress,
        permission_data: JSON.parse(serializePermission(signedPermission)),
        expires_at: new Date(permission.end * 1000).toISOString(),
      });

      if (error) throw error;

      // Update user's quick_tips_enabled flag
      await supabase
        .from('users')
        .update({ quick_tips_enabled: true })
        .eq('id', user.id);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['spend-permission', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user'] });

      return signedPermission;
    } finally {
      setIsRequesting(false);
    }
  }, [walletAddress, user?.id, supabase, signTypedDataAsync, queryClient]);

  // Revoke spend permission
  const revokePermission = useMutation({
    mutationFn: async () => {
      if (!user?.id || !supabase) {
        throw new Error('User not logged in');
      }

      // Mark permission as revoked
      const { error } = await supabase
        .from('spend_permissions')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('revoked_at', null);

      if (error) throw error;

      // Update user's quick_tips_enabled flag
      await supabase
        .from('users')
        .update({ quick_tips_enabled: false })
        .eq('id', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spend-permission', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  return {
    hasQuickTips: hasQuickTips ?? false,
    isCheckingPermission,
    isRequesting,
    requestPermission,
    revokePermission,
  };
}
