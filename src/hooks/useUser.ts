'use client';

import { useAccount, useDisconnect } from 'wagmi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types/database';

export function useUser() {
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Get or create user in Supabase
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', address],
    queryFn: async (): Promise<User | null> => {
      if (!address || !supabase) return null;

      // Check if user exists by wallet address
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', address)
        .single();

      if (existingUser) return existingUser;

      // Create new user with wallet address as primary identifier
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          privy_id: address, // Legacy field — stores wallet address
          wallet_address: address,
          display_name: `user_${address.slice(-6)}`,
          is_creator: false,
          subscription_status: 'none',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error);
        return null;
      }

      return newUser;
    },
    enabled: isConnected && !!address && !!supabase,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update user profile
  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      if (!user?.id || !supabase) throw new Error('No user or database');

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', address] });
    },
  });

  // Check if subscription is active
  const hasActiveSubscription = user?.subscription_status === 'active' ||
    user?.subscription_status === 'trial';

  // Check if subscription is expired
  const isSubscriptionExpired = user?.subscription_expires_at
    ? new Date(user.subscription_expires_at) < new Date()
    : false;

  const logout = () => {
    disconnect();
    queryClient.clear();
  };

  return {
    user,
    walletAddress: address,
    isLoading: isConnecting || isLoading,
    isAuthenticated: isConnected,
    isCreator: user?.is_creator || false,
    hasActiveSubscription: hasActiveSubscription && !isSubscriptionExpired,
    updateProfile,
    logout,
    supabaseConfigured: !!supabase,
  };
}
