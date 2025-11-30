# flipit

A Next.js 14 + wagmi memory game that runs entirely on the Celo stack (MiniPay friendly) and uses cUSD for entry fees, power‑ups, faucets, and daily on-chain payouts.

---

## Overview

`flipit` letsa MiniPay and Celo wallet users pay 0.1 cUSD to enter a timed memory flip challenge, purchase in-game power-ups, and climb a daily leaderboard. The app auto-detects MiniPay, keeps balances synced with wagmi/viem, stores gameplay via Prisma/Postgres, exposes a cUSD faucet, and pays the top 3 players from a treasury account once per day through a Vercel cron job.

---

## Gameplay & Flow

1. **Connect a wallet** – MiniPay is auto-connected; other wallets can use Injected or WalletConnect.
2. **Claim test cUSD** – the in-app faucet sends 10 cUSD (configurable) if your balance is low.
3. **Pay the entry fee** – send 0.1 cUSD to the treasury before the first flip; MiniPay transactions include `feeCurrency` so users stay in stablecoins.
4. **Play** – the board timer starts on first flip; penalties are added when power-ups are used.
5. **Use power-ups** – buy “Peek” or “Auto-Match” for 0.1 cUSD each or use inventory you saved earlier.
6. **Submit automatically** – when all pairs are matched the client posts results to `/api/game/submit`, which records the score and updates the leaderboard.
7. **Earn payouts** – a scheduled job aggregates the day’s fees, sends 80% back to the top 3 wallets, and clears the daily leaderboard.

---

## Feature Highlights

- **MiniPay-ready UX** – detects `window.ethereum.isMiniPay`, auto-connects, and forces legacy tx with `feeCurrency = cUSD`.
- **Multi-network Celo support** – switch between Celo mainnet, Alfajores, or Celo Sepolia through `NEXT_PUBLIC_CELO_NETWORK`.
- **cUSD faucet** – `/api/faucet` checks balances before letting a keyed server wallet send 10 cUSD to a user.
- **Power-up store & inventory** – purchases log in Prisma, can be saved for later, and sync automatically with `/api/users/inventory`.
- **Daily leaderboard & payouts** – `/api/leaderboard` serves the fastest times; `/api/payouts/daily` is triggered by `vercel.json` cron to distribute funds.
- **Username & profile handling** – `/api/users/upsert` seeds a record on first connect, players can rename themselves, and usernames are baked into score submissions.
- **React Query driven UI** – low-latency updates for the leaderboard and store state without manual refreshes.

---

## Architecture Snapshot

- **UI**: Next.js App Router (`src/app/page.tsx`) with Tailwind UI components in `src/components`.
- **Wallets**: `src/wagmi.ts` configures wagmi with Injected + WalletConnect connectors against the selected Celo chain.
- **Blockchain helpers**: viem handles encoding ERC20 transfers, cUSD addresses live in `src/lib/usdc.ts`, shared constants in `src/lib/constants.ts`.
- **Data layer**: Prisma schema (`prisma/schema.prisma`) stores users, plays, and scores in Postgres/Supabase.
- **APIs**: REST endpoints under `src/app/api/*` cover faucet, users, game lifecycle, power-up purchases, leaderboard, Farcaster feed proxy, and daily payouts.
- **Automation**: `vercel.json` wires a midnight UTC cron to `/api/payouts/daily`.

```
src/
├── app/
│   ├── api/
│   │   ├── faucet               # cUSD faucet (requires FAUCET_PRIVATE_KEY)
│   │   ├── game/*               # start, mark-start, submit, buy-powerup
│   │   ├── leaderboard          # fastest times
│   │   ├── payouts/daily        # cron-triggered payout job
│   │   ├── posts                # Neynar-powered Farcaster feed (optional)
│   │   └── users/*              # upsert, get, inventory mutations
│   ├── leaderboard/page.tsx     # public leaderboard view
│   └── page.tsx                 # primary MiniPay-focused experience
├── components/flip              # Board, Timer, Tabs, PowerUps, Leaderboard UI
├── hooks                        # faucet, flip state, power-up purchases, etc.
├── lib                          # constants, prisma, faucet helpers, store config
└── wagmi.ts                     # chain + connector configuration
```

---

## Local Development

### Prerequisites

- Node.js 18+
- pnpm 9+
- A Postgres database (Supabase works great)
- A Celo wallet for testing (MiniPay, Valora, MetaMask with Celo RPC, etc.)

### Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `.env.local` (see the next section for every variable). Example for Celo Sepolia:

   ```bash
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/db_name"
   DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/db_name?pgbouncer=true"

   NEXT_PUBLIC_CELO_NETWORK="sepolia"
   NEXT_PUBLIC_CELO_SEPOLIA_RPC="https://forno.celo-sepolia.celo-testnet.org"
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=""

   FAUCET_PRIVATE_KEY="0xabc123..."      # dev-only hot wallet with test cUSD
   TREASURY_PRIVATE_KEY="0xdef456..."    # wallet that receives entry fees & pays winners
   NEXT_NEYNAR_API_KEY=""                # optional Farcaster feed
   ```

   > For Supabase, use the “Connection string” (not the pooler) for `DATABASE_URL` and the pooler for `DIRECT_URL`.

3. Run migrations & generate the Prisma client:

   ```bash
   pnpm dlx prisma migrate deploy   # or `prisma migrate dev` for local DBs
   pnpm dlx prisma generate
   ```

4. Start the dev server:

   ```bash
   pnpm dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) and open the page inside the MiniPay browser or any Celo-compatible wallet.

---

## Environment Variables

| Name | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Postgres connection string used by Prisma. |
| `DIRECT_URL` | ⚠️ | Optional Postgres direct connection (recommended for Supabase/introspection). |
| `NEXT_PUBLIC_CELO_NETWORK` | ✅ | `mainnet`, `alfajores`, or `sepolia` (default) to pick the chain + cUSD contract. |
| `NEXT_PUBLIC_CELO_SEPOLIA_RPC` | ⚠️ | Custom RPC endpoint for Celo Sepolia; defaults to Forno if omitted. |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | ⚠️ | Enables WalletConnect; leave blank to disable QR modal. |
| `FAUCET_PRIVATE_KEY` | ✅ for faucet | Hot wallet that sends cUSD in `/api/faucet`. Should hold test funds only. |
| `TREASURY_PRIVATE_KEY` | ✅ for payouts | Wallet that receives entry fees and pays winners inside `/api/payouts/daily`. |
| `NEXT_NEYNAR_API_KEY` | ⚠️ | Needed if you surface the Farcaster feed proxy (`/api/posts`). |

> Production deployments should keep `FAUCET_PRIVATE_KEY` and `TREASURY_PRIVATE_KEY` in secure secrets managers. Never commit these values.

---

## Wallet & Network Behavior

- MiniPay is detected via `window.ethereum.isMiniPay`; the app auto-connects and forces cUSD-fee legacy transactions.
- Injected wallets (MetaMask, Valora browser) require the user to click “Connect”.
- WalletConnect works when `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is provided; kiosk QR codes are great for mobile testing.
- Change `NEXT_PUBLIC_CELO_NETWORK` to `mainnet` or `alfajores` to target production networks. cUSD contract addresses are picked automatically (`src/lib/usdc.ts`).

---

## Daily Payouts

- `vercel.json` schedules `/api/payouts/daily` for midnight UTC (`0 0 * * *`).
- The handler counts plays, calculates the pool (`ENTRY_FEE_CUSD * plays * PAYOUT_POOL_PERCENT`), sends ERC20 transfers via the treasury wallet, and wipes the day’s scores/plays.
- Trigger it manually during development with:

  ```bash
  curl -X POST http://localhost:3000/api/payouts/daily
  ```

  Make sure `TREASURY_PRIVATE_KEY` has enough cUSD on your chosen network.

---

## Useful Scripts

- `pnpm dev` – run Next.js locally.
- `pnpm build` – generate Prisma client then build Next.js for production.
- `pnpm start` – start the compiled app.
- `pnpm lint` – run Next.js lint rules.
- `pnpm apply-cascade` – helper to re-apply the username cascade migration script.

---

## Additional Docs

- `FAUCET_SETUP.md` – wiring the faucet wallet and eligibility rules.
- `FEE_AND_PAYOUT_SYSTEM.md` – deep dive into entry-fee math and prize distribution.
- `SUPABASE_SETUP.md` – provisioning a hosted Postgres database.
- `USERNAME_CASCADE_SETUP.md`, `MIGRATION_GUIDE.md`, `BUG_FIXES.md`, `FIXES_APPLIED.md` – historical context and troubleshooting notes.

---

## License

MIT

