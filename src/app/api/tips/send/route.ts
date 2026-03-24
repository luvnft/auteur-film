import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CdpClient } from '@coinbase/cdp-sdk';
import { createPublicClient, http, parseUnits, encodeFunctionData } from 'viem';
import { base } from 'viem/chains';
import {
  USDC_ADDRESS,
  USDC_DECIMALS,
  SPEND_PERMISSION_MANAGER_ADDRESS,
  MIN_TIP_AMOUNT,
  QUICK_TIP_MAX_AMOUNT,
  TIP_FEE_PERCENT,
  ERC20_ABI,
} from '@/lib/constants';
import {
  SPEND_PERMISSION_MANAGER_ABI,
  type SignedSpendPermission,
} from '@/lib/spend-permissions';

// Server-side Supabase client with service role
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, serviceKey);
}

// Initialize CDP Server Wallet
function getCDPClient() {
  return new CdpClient();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, creatorWallet, contentId, amountDollars } = body;

    // Validate inputs
    if (!userId || !creatorWallet || !contentId || !amountDollars) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, creatorWallet, contentId, amountDollars' },
        { status: 400 }
      );
    }

    if (amountDollars < MIN_TIP_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum tip amount is $${MIN_TIP_AMOUNT}` },
        { status: 400 }
      );
    }

    if (amountDollars > QUICK_TIP_MAX_AMOUNT) {
      return NextResponse.json(
        { error: `Maximum Quick Tip amount is $${QUICK_TIP_MAX_AMOUNT}` },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Get user's active spend permission
    const { data: permission, error: permissionError } = await supabase
      .from('spend_permissions')
      .select('*')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (permissionError || !permission) {
      return NextResponse.json(
        { error: 'No active spend permission found. Please enable Quick Tips first.' },
        { status: 403 }
      );
    }

    // Deserialize the stored permission
    const signedPermission: SignedSpendPermission = {
      ...permission.permission_data,
      allowance: BigInt(permission.permission_data.allowance),
      salt: BigInt(permission.permission_data.salt),
    };

    // Calculate amounts: 98% to creator, 2% platform fee
    const platformFeeAmount = amountDollars * (TIP_FEE_PERCENT / 100);
    const creatorAmount = amountDollars - platformFeeAmount;

    const creatorAmountRaw = parseUnits(creatorAmount.toString(), USDC_DECIMALS);
    const platformFeeRaw = parseUnits(platformFeeAmount.toString(), USDC_DECIMALS);

    // Get CDP Server Wallet account (no private key on our servers)
    const cdp = getCDPClient();
    const account = await cdp.evm.getOrCreateAccount({ name: 'auteur-platform' });
    const baseAccount = await account.useNetwork('base');

    const cdpAddress = account.address;

    // Verify CDP wallet matches the spender in the permission
    if (cdpAddress.toLowerCase() !== signedPermission.spender.toLowerCase()) {
      return NextResponse.json(
        {
          error: `CDP wallet address mismatch. CDP: ${cdpAddress}, Permission spender: ${signedPermission.spender}. User needs to re-enable Quick Tips.`,
        },
        { status: 400 }
      );
    }

    // Build the spend permission tuple for contract calls
    const spendPermissionTuple = {
      account: signedPermission.account,
      spender: signedPermission.spender,
      token: signedPermission.token,
      allowance: signedPermission.allowance,
      period: signedPermission.period,
      start: signedPermission.start,
      end: signedPermission.end,
      salt: signedPermission.salt,
      extraData: signedPermission.extraData,
    } as const;

    const publicClient = createPublicClient({ chain: base, transport: http() });

    // Step 1: Approve the spend permission on-chain (only needed once)
    if (!permission.approved_onchain) {
      try {
        const approveCalldata = encodeFunctionData({
          abi: SPEND_PERMISSION_MANAGER_ABI,
          functionName: 'approveWithSignature',
          args: [spendPermissionTuple, signedPermission.signature],
        });

        // Simulate first to get revert reason
        try {
          await publicClient.call({
            to: SPEND_PERMISSION_MANAGER_ADDRESS,
            data: approveCalldata,
            account: cdpAddress as `0x${string}`,
          });
        } catch (simError: any) {
          console.error('Simulation revert reason:', simError.message || simError);
          console.error('Simulation details:', JSON.stringify({
            spendPermissionTuple: {
              ...spendPermissionTuple,
              allowance: spendPermissionTuple.allowance.toString(),
              salt: spendPermissionTuple.salt.toString(),
            },
            signatureLength: signedPermission.signature.length,
            signaturePrefix: signedPermission.signature.slice(0, 66),
          }));
          // Continue anyway to let CDP SDK try (it may use a paymaster/bundler)
        }

        const approveTx = await baseAccount.sendTransaction({
          transaction: {
            to: SPEND_PERMISSION_MANAGER_ADDRESS,
            data: approveCalldata,
            value: 0n,
          },
        });

        await baseAccount.waitForTransactionReceipt(approveTx);

        // Mark as approved in database so we skip this next time
        await supabase
          .from('spend_permissions')
          .update({ approved_onchain: true })
          .eq('id', permission.id);
      } catch (approveError: any) {
        console.error('approveWithSignature failed:', approveError);
        return NextResponse.json(
          { error: `Approval failed: ${approveError.message}` },
          { status: 500 }
        );
      }
    }

    // Step 2: Pull total amount (creator + platform fee) from user to CDP wallet via spend()
    // spend() always transfers tokens to the spender (CDP wallet), not an arbitrary recipient
    const totalAmountRaw = creatorAmountRaw + platformFeeRaw;
    let spendTxHash: string;
    try {
      const spendCalldata = encodeFunctionData({
        abi: SPEND_PERMISSION_MANAGER_ABI,
        functionName: 'spend',
        args: [spendPermissionTuple, totalAmountRaw],
      });

      // Simulate spend to get revert reason if it fails
      try {
        await publicClient.call({
          to: SPEND_PERMISSION_MANAGER_ADDRESS,
          data: spendCalldata,
          account: cdpAddress as `0x${string}`,
        });
      } catch (simError: any) {
        console.error('Spend simulation revert:', simError.message || simError);
      }

      const spendTx = await baseAccount.sendTransaction({
        transaction: {
          to: SPEND_PERMISSION_MANAGER_ADDRESS,
          data: spendCalldata,
          value: 0n,
        },
      });

      await baseAccount.waitForTransactionReceipt(spendTx);
      spendTxHash = spendTx.transactionHash;
    } catch (spendError: any) {
      console.error('Spend failed:', spendError);
      return NextResponse.json(
        { error: `Spend failed: ${spendError.message}` },
        { status: 500 }
      );
    }

    // Step 3: Transfer creator's share from CDP wallet to creator via ERC-20 transfer
    let creatorTxHash: string;
    try {
      const transferCalldata = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [creatorWallet as `0x${string}`, creatorAmountRaw],
      });

      const transferTx = await baseAccount.sendTransaction({
        transaction: {
          to: USDC_ADDRESS,
          data: transferCalldata,
          value: 0n,
        },
      });

      await baseAccount.waitForTransactionReceipt(transferTx);
      creatorTxHash = transferTx.transactionHash;
    } catch (transferError: any) {
      console.error('Creator transfer failed (funds in CDP wallet):', transferError);
      // Funds are in the CDP wallet — they can be recovered manually
      creatorTxHash = 'transfer_failed';
    }

    // Platform fee stays in CDP wallet — no additional transfer needed
    const platformTxHash = spendTxHash; // same tx pulled both amounts

    // Get creator's user ID
    const { data: creator } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', creatorWallet)
      .single();

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Record tip in database (use creator tx hash as primary)
    const { error: tipError } = await supabase.from('tips').insert({
      from_user_id: userId,
      to_user_id: creator.id,
      content_id: contentId,
      amount_cents: Math.round(amountDollars * 100),
      transaction_hash: creatorTxHash,
    });

    if (tipError) {
      console.error('Failed to record tip:', tipError);
    }

    // Calculate and update leaderboard points
    const tipPoints = 50 + Math.round(amountDollars * 10);

    const { data: existingScore } = await supabase
      .from('leaderboard_scores')
      .select('score, breakdown')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .single();

    if (existingScore) {
      const currentBreakdown = existingScore.breakdown || { views: 0, tips: 0, pin: 0, comments: 0, referrals: 0 };
      const newTipPoints = (currentBreakdown.tips || 0) + tipPoints;
      await supabase
        .from('leaderboard_scores')
        .update({
          score: existingScore.score + tipPoints,
          breakdown: { ...currentBreakdown, tips: newTipPoints },
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('content_id', contentId);
    } else {
      await supabase.from('leaderboard_scores').insert({
        user_id: userId,
        content_id: contentId,
        score: tipPoints,
        breakdown: { views: 0, tips: tipPoints, pin: 0, comments: 0, referrals: 0 },
      });
    }

    return NextResponse.json({
      success: true,
      creatorTxHash,
      platformTxHash,
      creatorAmount,
      platformFee: platformFeeAmount,
      pointsEarned: tipPoints,
    });
  } catch (error: any) {
    console.error('Quick tip error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send tip' },
      { status: 500 }
    );
  }
}
