# Auteur

A creator-first video platform for independent filmmakers, built on crypto-native payments. Creators upload films, viewers pay with USDC on Base — no middlemen, no gatekeepers.

## What It Does

Auteur lets indie filmmakers publish and monetize their work directly. Authentication is entirely wallet-based using Coinbase Smart Wallets (no email/password), and all payments flow through USDC on the Base L2 chain.

### Key Features

- **Wallet-based identity** — connect a Coinbase Smart Wallet, that's your account
- **Creator publishing** — upload films and series with episodes, seasons, trailers, and pre-release scheduling
- **Three payment flows:**
  - **Tips** — viewers tip creators with preset or custom amounts (98% to creator, 2% platform)
  - **Subscriptions** — $20/month USDC for platform access
  - **Content purchases** — per-content pricing with the same 2% fee
- **Quick Tips** — one-tap tipping via EIP-712 Spend Permissions and a CDP Server Wallet, so viewers don't need to confirm every transaction
- **Fiat on/off ramp** — buy USDC with a card or cash out to your bank via Coinbase Developer Platform
- **Gamification** — leaderboards with points for watching, tipping, commenting, pinning, and referrals
- **DMCA compliance** — full takedown flow with three-strike repeat infringer policy and admin dashboard
- **Referral system** — trackable referral links with conversion attribution

## Architecture

```
Next.js (App Router) + React 19 + TypeScript
├── Auth .............. Coinbase Smart Wallet via wagmi + OnchainKit
├── Database .......... Supabase (Postgres + RLS)
├── Payments .......... USDC on Base (viem + CDP SDK)
├── Video hosting ..... YouTube Data API v3 (unlisted uploads)
├── Fiat ramp ......... Coinbase Developer Platform
├── Email ............. Resend (optional)
├── Styling ........... Tailwind CSS v4 + custom retro design system
└── Deployment ........ Railway (Nixpacks)
```

### Payment Flow (Quick Tips)

The Quick Tips system uses Coinbase's Spend Permissions (EIP-712) to enable one-tap tipping:

1. Viewer signs a spend permission granting the platform's CDP Server Wallet access to their USDC (up to a capped amount)
2. When they tap "Quick Tip", the server wallet pulls USDC from the viewer via the SpendPermissionManager contract
3. The server wallet then transfers 98% to the creator's wallet
4. Platform fee (2%) stays in the server wallet — no second signature needed from the viewer

### Video Upload Flow

Films are hosted as unlisted YouTube videos via the YouTube Data API v3 resumable upload protocol. The player uses a CSS overlay to hide YouTube branding while keeping the underlying player functionality.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4, custom retro/brutalist design system |
| Auth | Coinbase Smart Wallet, wagmi, OnchainKit |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Payments | USDC on Base, viem, Coinbase CDP SDK |
| Video | YouTube Data API v3 (OAuth2 resumable uploads) |
| Fiat Ramp | Coinbase Developer Platform (onramp + offramp) |
| Sound | Web Audio API (synthesized — no audio files) |
| Deployment | Railway (Nixpacks, standalone output) |

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Fill in your keys (see .env.example for details)
# Required: Supabase URL + keys
# Optional: YouTube API, CDP API, Resend

# Run Supabase migrations
# (apply files in supabase/migrations/ in order)

# Start dev server
npm run dev
```

## Database

8 migration files in `supabase/migrations/` set up the full schema:

- Users with wallet-based auth and referral codes
- Content (films + episodes) with series grouping
- Tips, comments, votes, pins
- Leaderboard scoring with composite breakdown
- DMCA reports and user strikes
- Spend permissions for Quick Tips
- Row Level Security policies on all tables

## Design

The UI uses a custom retro/brutalist design system — 3D box shadows, pixel fonts, stepped animations, dot patterns, and synthesized click/success/error sounds via the Web Audio API (zero audio file downloads).

## License

MIT
