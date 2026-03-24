'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';
import { useState, type ReactNode } from 'react';

// Configure wagmi with Coinbase Smart Wallet
const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'Auteur',
      preference: 'smartWalletOnly', // Use Smart Wallet for best UX
    }),
  ],
  transports: {
    [base.id]: http(),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const cdpApiKey = process.env.NEXT_PUBLIC_CDP_API_KEY;

  // OnchainKit works without API key but some features are limited
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={cdpApiKey}
          chain={base}
          config={{
            appearance: {
              name: 'Auteur',
              logo: '/logo.svg',
              mode: 'dark',
              theme: 'cyberpunk',
            },
          }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Export wagmi config for use in hooks
export { wagmiConfig };
