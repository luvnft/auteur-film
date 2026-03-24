// Base Chain (Coinbase L2)
export const BASE_CHAIN_ID = 8453;

// USDC on Base
export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
export const USDC_DECIMALS = 6;

// Platform wallet for receiving subscription payments and tip fees
export const PLATFORM_WALLET = (process.env.NEXT_PUBLIC_PLATFORM_WALLET || '0x0000000000000000000000000000000000000000') as `0x${string}`;

// Coinbase Pay Project ID (CDP = Coinbase Developer Platform)
export const COINBASE_PROJECT_ID = process.env.NEXT_PUBLIC_CDP_PROJECT_ID || '';

// Pricing (in USDC cents, i.e., 1 = $0.01)
export const SUBSCRIPTION_PRICE_CENTS = 2000; // $20.00
export const SUBSCRIPTION_PRICE_USDC = BigInt(SUBSCRIPTION_PRICE_CENTS) * BigInt(10 ** (USDC_DECIMALS - 2)); // 20_000_000

// Platform fee percentage (2% on all transactions: tips + purchases)
export const PLATFORM_FEE_PERCENT = 2;
export const TIP_FEE_PERCENT = PLATFORM_FEE_PERCENT; // Alias for backwards compatibility

// Preset tip amounts in dollars
export const TIP_PRESETS = [1, 5, 10, 25];

// Minimum tip amount in dollars
export const MIN_TIP_AMOUNT = 0.01;

// Quick Tips (Spend Permissions) settings
export const QUICK_TIP_MAX_AMOUNT = 25; // Max $25 per tip
export const QUICK_TIP_PERIOD_DAYS = 365; // 1 year validity
export const SPEND_PERMISSION_MANAGER_ADDRESS = '0xf85210B21cC50302F477BA56686d2019dC9b67Ad' as const;

// ERC20 ABI for USDC operations
export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;
