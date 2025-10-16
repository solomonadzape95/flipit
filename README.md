# flipit

A Next.js demo application and memory-flip game built to showcase how to integrate [Base Account Sub Accounts](https://docs.base.org/base-account/improve-ux/sub-accounts) with [wagmi](https://wagmi.sh/) and the Base Account SDK.

---

## What is this?

`flipit` is a single-player memory card game that uses Base Account Sub Accounts as your in-app wallet. It demo's frictionless, app-embedded wallets with seamless “spend permission” top-ups and lets you experience sub accounts in a real dapp flow:

- **Sign in with Base** (universal account)
- **Sub Account auto-created** for this game
- **Pay to play** (with USDC)
- **Spend permission** (top up your sub account budget, zero signature)
- **Onchain high scores** (score auto-submits to API)
- **Faucet** (get USDC from in-app testnet faucet)

---

## Features

- **Memory-flip game**: Pay $1 in USDC to play. Your best time is submitted to the onchain leaderboard.
- **Embedded Sub Account wallet**: No need to sign every transaction.
- **Top-up & spend permission**: Approve a budget for repeated spends (demo's auto spend-permission workflow).
- **USDC Sepolia faucet**: Get testnet tokens to your universal account.
- **Works on Base Sepolia**: All test transactions.

---

## How It Works (At a Glance)

1. **Wallet connects via wagmi baseAccount connector**
    - On connect, a sub account is automatically created
    - The app stores both your **universal account** (main wallet) and **sub account** (this game)
2. **You get a faucet/USDC balance** for the universal account
3. **To play, pay $1** in USDC — the transaction is sent from the sub account (draws funds from your universal account using spend permission)
4. **Optional**: Set up spend permission for seamless future spends (no extra signature)
5. **Play the game**. When finished, your score is submitted via the sub account.

---

## Quickstart

### Prerequisites

- Node.js 18+ and pnpm (or yarn, npm)
- **Base Sepolia** wallet address, ideally with [Coinbase Wallet](https://www.coinbase.com/wallet) or [account.base.app](https://account.base.app/)
- [Optional] [Base Sepolia Faucet](https://sepoliafaucet.com/) for native ETH

### Install & Run

```bash
pnpm install
cp .env.local.example .env.local  # (see below)
pnpm dev
```

The app runs at [localhost:3000](http://localhost:3000).

---

### Environment Variables

**(Optional, for paymaster/gas sponsorship)**

Create `.env.local`:

```bash
NEXT_PUBLIC_PAYMASTER_SERVICE_URL=https://api.developer.coinbase.com/rpc/v1/base-sepolia/...
```

If `NEXT_PUBLIC_PAYMASTER_SERVICE_URL` is set, the app uses a paymaster to sponsor gas for sub account transactions.

Read [FAUCET_SETUP.md](./FAUCET_SETUP.md) for fully automated faucet/token setup.

---

## In-App Flow (User Experience)

1. **Sign in with Base**: Creates a sub account just for this app.
2. **Fund universal account** if needed—use in-app "Get USDC on Base Sepolia" button (testnet only).
3. **See Your Balances**:
    - Universal (main) USDC
    - Sub account USDC (starts at zero unless funded)
4. **Set Up Spend Permission**: Approve a spending budget for seamless, signature-less spends for a session.
5. **Pay $1 to play**: This debits your sub account (if it has allowance/balance) or seamlessly fetches it from universal with spend permission.
6. **Gameplay**: Flip all cards with matching pairs. Timer/score shown.
7. **Submit Score**: On game finish, score auto-submitted via an onchain API.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── faucet/         # USDC faucet for dev/testing
│   │   └── users/          # User API for inventory/score storage
│   │   └── game/           # Game (start/submit) API
│   ├── layout.tsx          # App providers/root
│   └── page.tsx            # Main demo/game page
├── components/
│   ├── flip/               # Gameboard, Timer, RightTabs, etc.
│   ├── ui/                 # Button, Dialog, Sheet, other UI
│   └── StorePanel.tsx      # Inventory/powerup panel
├── hooks/                  # Wagmi/data hooks
├── lib/
├── wagmi.ts                # ⭐ Wagmi config using sub accounts!
└── ...
```

---

## How Sub Accounts Are Used

### 1. Wagmi Configuration

In [`src/wagmi.ts`](src/wagmi.ts):

```ts
import { baseAccount } from "wagmi/connectors";

export function getConfig() {
  return createConfig({
    chains: [baseSepolia],
    connectors: [
      baseAccount({
        appName: "flipit",
        subAccounts: {
          creation: "on-connect",   // auto-create on connect
          defaultAccount: "sub",    // use sub account for all app txs
        },
        paymasterUrls: {
          [baseSepolia.id]: process.env.NEXT_PUBLIC_PAYMASTER_SERVICE_URL,
        },
      }),
    ],
    // ...
  });
}
```

- On connect, a sub account is created, and all txns use the sub account unless you specify the universal account as `from`.
- Spend permissions (allowance/budget) are handled under the hood—if sub account lacks balance, funds/top ups are auto-requested.
- All standard wagmi hooks (`useAccount`, `useSendTransaction`, etc) use the sub account by default.

### 2. Access Both Accounts

In the app (see `src/app/page.tsx`):

```ts
import { useAccount, useConnections } from "wagmi";
const account = useAccount(); // sub account
const conns = useConnections();
const universalAddress = conns.flatMap((c) => c.accounts)[0]; // main
```

### 3. Sending Transactions

- All major actions (`Pay & Start`, sending funds, buying items, etc) are one-click, using your sub account and spend permission.
- Approving a spend budget is a *single signature*, after which you can play, make purchases, etc. frictionlessly for the session.

---

## Cheatsheet: Code Snippets

### Get Addresses

```tsx
const { address: subAccount } = useAccount();
const connections = useConnections();
const universal = connections.flatMap(a => a.accounts)[0];
```

### Send Transaction

```tsx
const { sendTransaction } = useSendTransaction();
sendTransaction({
  to: USDC.address,
  data: <calldata>,
})
```

### Top Up Permission

```tsx
const { requestBudget } = useSpendPermission();
requestBudget(20) // approves budget = $20
```

---

## Testnet Setup and USDC

- All balances/interactions are on **Base Sepolia** (testnet). You need USDC and ETH for gas. Use the in-app faucet or [Base Sepolia Faucet](https://sepoliafaucet.com/).
- Faucet: The app provides a button to mint testnet USDC directly.

---

## Resources

- **Base Account Sub Accounts**: [docs.base.org](https://docs.base.org/base-account/improve-ux/sub-accounts)
- **Live Demo**: [sub-accounts-fc.vercel.app](https://sub-accounts-fc.vercel.app) (official sample)
- **wagmi Docs**: [wagmi.sh](https://wagmi.sh)
- **Base Dashboard**: [account.base.app](https://account.base.app)
- **Spend Permissions**: [Base Account Spend Permissions](https://docs.base.org/base-account/improve-ux/spend-permissions)
- **Paymaster Docs**: [Coinbase Paymaster](https://docs.cdp.coinbase.com/paymaster/introduction/welcome)

---

## Best Practices

- **Sponsor gas fees** for the best UX (`NEXT_PUBLIC_PAYMASTER_SERVICE_URL`)
- **Let users see both addresses** (universal & sub) for transparency
- **Prompt for budgets not signatures**: Top up with a $ amount—future transactions use allowance.
- **Test UX on mobile** (passkeys, device switching)

---

## Support

- [Base Account Documentation](https://docs.base.org/base-account)
- [Base Discord](https://discord.gg/buildonbase)
- Open an issue in this repo

---

## License

MIT
