import { parseUnits } from 'viem';
import {
  USDC_ADDRESS,
  USDC_DECIMALS,
  BASE_CHAIN_ID,
  QUICK_TIP_MAX_AMOUNT,
  QUICK_TIP_PERIOD_DAYS,
  SPEND_PERMISSION_MANAGER_ADDRESS,
} from './constants';

// Types for spend permissions
export interface SpendPermission {
  account: `0x${string}`;
  spender: `0x${string}`;
  token: `0x${string}`;
  allowance: bigint;
  period: number; // seconds
  start: number; // unix timestamp
  end: number; // unix timestamp
  salt: bigint;
  extraData: `0x${string}`;
}

export interface SignedSpendPermission extends SpendPermission {
  signature: `0x${string}`;
}

// SpendPermissionManager ABI (subset for our needs)
export const SPEND_PERMISSION_MANAGER_ABI = [
  {
    name: 'spend',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'spendPermission',
        type: 'tuple',
        components: [
          { name: 'account', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'allowance', type: 'uint160' },
          { name: 'period', type: 'uint48' },
          { name: 'start', type: 'uint48' },
          { name: 'end', type: 'uint48' },
          { name: 'salt', type: 'uint256' },
          { name: 'extraData', type: 'bytes' },
        ],
      },
      { name: 'value', type: 'uint160' },
    ],
    outputs: [],
  },
  {
    name: 'approveWithSignature',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'spendPermission',
        type: 'tuple',
        components: [
          { name: 'account', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'allowance', type: 'uint160' },
          { name: 'period', type: 'uint48' },
          { name: 'start', type: 'uint48' },
          { name: 'end', type: 'uint48' },
          { name: 'salt', type: 'uint256' },
          { name: 'extraData', type: 'bytes' },
        ],
      },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    name: 'revoke',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'spendPermission',
        type: 'tuple',
        components: [
          { name: 'account', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'allowance', type: 'uint160' },
          { name: 'period', type: 'uint48' },
          { name: 'start', type: 'uint48' },
          { name: 'end', type: 'uint48' },
          { name: 'salt', type: 'uint256' },
          { name: 'extraData', type: 'bytes' },
        ],
      },
    ],
    outputs: [],
  },
  {
    name: 'isApproved',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      {
        name: 'spendPermission',
        type: 'tuple',
        components: [
          { name: 'account', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'allowance', type: 'uint160' },
          { name: 'period', type: 'uint48' },
          { name: 'start', type: 'uint48' },
          { name: 'end', type: 'uint48' },
          { name: 'salt', type: 'uint256' },
          { name: 'extraData', type: 'bytes' },
        ],
      },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// EIP-712 domain for spend permissions
export const SPEND_PERMISSION_DOMAIN = {
  name: 'Spend Permission Manager',
  version: '1',
  chainId: BASE_CHAIN_ID,
  verifyingContract: SPEND_PERMISSION_MANAGER_ADDRESS,
} as const;

// EIP-712 types for spend permission
export const SPEND_PERMISSION_TYPES = {
  SpendPermission: [
    { name: 'account', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'allowance', type: 'uint160' },
    { name: 'period', type: 'uint48' },
    { name: 'start', type: 'uint48' },
    { name: 'end', type: 'uint48' },
    { name: 'salt', type: 'uint256' },
    { name: 'extraData', type: 'bytes' },
  ],
} as const;

// Create a spend permission for quick tips
export function createQuickTipPermission(
  userWallet: `0x${string}`,
  spenderWallet: `0x${string}`
): SpendPermission {
  const now = Math.floor(Date.now() / 1000);
  const oneYear = QUICK_TIP_PERIOD_DAYS * 24 * 60 * 60;

  return {
    account: userWallet,
    spender: spenderWallet,
    token: USDC_ADDRESS,
    allowance: parseUnits(QUICK_TIP_MAX_AMOUNT.toString(), USDC_DECIMALS),
    period: 86400, // 24 hours - allowance resets daily
    start: now,
    end: now + oneYear,
    salt: BigInt(now), // Use timestamp as salt for uniqueness
    extraData: '0x' as `0x${string}`,
  };
}

// Serialize permission for database storage
export function serializePermission(permission: SignedSpendPermission): string {
  return JSON.stringify({
    ...permission,
    allowance: permission.allowance.toString(),
    salt: permission.salt.toString(),
  });
}

// Deserialize permission from database
export function deserializePermission(json: string): SignedSpendPermission {
  const parsed = JSON.parse(json);
  return {
    ...parsed,
    allowance: BigInt(parsed.allowance),
    salt: BigInt(parsed.salt),
  };
}
