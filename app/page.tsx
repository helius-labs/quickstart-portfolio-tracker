"use client";

import { useEffect, useState } from "react";

const rpc = async (method: string, params: unknown) => {
  const res = await fetch("/api/helius", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "1", method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
};

export default function Home() {
  const [address, setAddress] = useState(
    "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY"
  );
  const [portfolio, setPortfolio] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [live, setLive] = useState<any[]>([]);
  const [streamAddress, setStreamAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    setLive([]);
    setStreamAddress(address); // point the live feed at the wallet you just loaded
    try {
      const [assets, txns] = await Promise.all([
        rpc("getAssetsByOwner", {
          ownerAddress: address,
          page: 1,
          limit: 20,
          displayOptions: { showFungible: true, showNativeBalance: true },
        }),
        rpc("getTransactionsForAddress", [
          address,
          { transactionDetails: "signatures", sortOrder: "desc", limit: 10, filters: { tokenAccounts: "balanceChanged" } },
        ]),
      ]);
      const items = assets.items ?? [];
      setPortfolio({
        sol: (assets.nativeBalance?.lamports ?? 0) / 1e9,
        tokens: items.filter((i: any) => `${i.interface}`.includes("Fungible")),
        nfts: items.filter((i: any) => !`${i.interface}`.includes("Fungible")),
      });
      setHistory(txns.data ?? []);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Open the live feed only after Load runs, and reopen only when the loaded wallet changes
  // (not on every keystroke in the input).
  useEffect(() => {
    if (!streamAddress) return;
    const source = new EventSource(`/api/stream?address=${streamAddress}`);
    source.onmessage = (e) =>
      setLive((prev) => [JSON.parse(e.data), ...prev].slice(0, 10));
    return () => source.close();
  }, [streamAddress]);

  return (
    <main className="max-w-2xl mx-auto p-8 space-y-6">
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded p-2"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <button className="px-4 rounded bg-black text-white" onClick={load}>
          Load
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {portfolio && (
        <section className="space-y-6">
          <Stat label="SOL balance" value={portfolio.sol.toFixed(3)} />

          {portfolio.tokens.length > 0 && (
            <div>
              <h2 className="font-semibold mb-2">Tokens ({portfolio.tokens.length})</h2>
              <ul className="space-y-2">
                {portfolio.tokens.map((t: any) => {
                  const info = t.token_info ?? {};
                  const amount = (info.balance ?? 0) / 10 ** (info.decimals ?? 0);
                  return (
                    <li key={t.id} className="flex items-center gap-3">
                      <img
                        src={t.content?.links?.image ?? ""}
                        alt=""
                        className="w-8 h-8 rounded-full bg-zinc-200"
                      />
                      <span className="flex-1 truncate">
                        {t.content?.metadata?.name ?? info.symbol ?? "Unknown token"}
                      </span>
                      <span className="font-mono text-sm">
                        {amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {portfolio.nfts.length > 0 && (
            <div>
              <h2 className="font-semibold mb-2">NFTs ({portfolio.nfts.length})</h2>
              <div className="grid grid-cols-3 gap-3">
                {portfolio.nfts.map((n: any) => (
                  <img
                    key={n.id}
                    src={n.content?.files?.[0]?.uri ?? n.content?.links?.image ?? ""}
                    alt={n.content?.metadata?.name ?? "NFT"}
                    className="rounded-lg aspect-square object-cover border"
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {history.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">History</h2>
          <ul className="font-mono text-sm space-y-1">
            {history.map((tx) => (
              <li key={tx.signature}>
                {tx.err ? "❌" : "✅"} {tx.signature.slice(0, 16)}…
              </li>
            ))}
          </ul>
        </section>
      )}

      {live.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">Live ⚡</h2>
          <ul className="font-mono text-sm space-y-1">
            {live.map((e, i) => (
              <li key={i}>{e.signature.slice(0, 16)}…</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}
