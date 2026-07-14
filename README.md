# Helius Quickstart: Portfolio Tracker

A Solana portfolio tracker built on [Helius](https://www.helius.dev/docs). It shows what any wallet holds and what it's doing right now:

- **Full portfolio** — tokens, NFTs, and SOL in a single [DAS](https://www.helius.dev/docs/api-reference/das/getassetsbyowner) `getAssetsByOwner` call.
- **Transaction history** — the Helius-exclusive [`getTransactionsForAddress`](https://www.helius.dev/docs/rpc/gettransactionsforaddress).
- **Live activity feed** — new transactions streamed over [`transactionSubscribe`](https://www.helius.dev/docs/rpc/websocket/transaction-subscribe).

This is the finished app from the [**Build a Portfolio Tracker**](https://www.helius.dev/docs/quickstart/portfolio-tracker) quickstart. It uses the [Helius TypeScript SDK](https://github.com/helius-labs/helius-sdk) for the RPC calls, with Next.js route handlers keeping your API key on the server so it never reaches the browser.

## Prerequisites

- Node.js 20+
- A free [Helius API key](https://dashboard.helius.dev/api-keys)

## Getting started

```bash
git clone https://github.com/helius-labs/quickstart-portfolio-tracker.git
cd quickstart-portfolio-tracker
npm install
```

Add your key to `.env.local`:

```bash
cp .env.example .env.local
# then edit .env.local and set HELIUS_API_KEY=your_key
```

Run it:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste a wallet address, and hit **Load**. The portfolio and history render immediately, and the live feed fills in as new transactions touch the wallet.

## How it works

| Piece | File | Helius API |
|-------|------|------------|
| RPC proxy | `app/api/helius/route.ts` | `helius.getAssetsByOwner` + `helius.getTransactionsForAddress` via the SDK |
| Live feed relay | `app/api/stream/route.ts` | `transactionSubscribe` over WebSocket, relayed to the browser as Server-Sent Events |
| Dashboard | `app/page.tsx` | Calls the two route handlers and renders the result |

### Why route handlers?

Calling Helius directly from the browser would expose your API key. Both route handlers run server-side (`runtime = "nodejs"`) and hold the key in `HELIUS_API_KEY`, so the client only ever talks to your own `/api/*` endpoints.

### One DAS call for the whole portfolio

`getAssetsByOwner` with `showFungible: true` and `showNativeBalance: true` returns fungible tokens, NFTs (standard **and** compressed), and the native SOL balance in a single response. Split `items` by `interface` to group tokens versus NFTs.

### The live feed uses `transactionSubscribe`

`transactionSubscribe` pushes a message every time a transaction touches the wallet. Adding `tokenAccounts: "balanceChanged"` to the filter also matches the wallet's token accounts, so incoming SPL transfers appear in the feed. The subscription runs on the server and is relayed to the browser as SSE.

## Learn more

- [Build a Portfolio Tracker (full walkthrough)](https://www.helius.dev/docs/quickstart/portfolio-tracker)
- [Helius TypeScript SDK](https://github.com/helius-labs/helius-sdk)
- [DAS API reference](https://www.helius.dev/docs/api-reference/das/getassetsbyowner)
- [`getTransactionsForAddress`](https://www.helius.dev/docs/rpc/gettransactionsforaddress)

## License

[MIT](./LICENSE)
