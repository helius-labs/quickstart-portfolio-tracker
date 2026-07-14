import { NextRequest } from "next/server";
import WebSocket from "ws";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) return new Response("Missing address", { status: 400 });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      const ws = new WebSocket(
        `wss://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
      );

      ws.on("open", () => {
        ws.send(
          JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "transactionSubscribe",
            params: [
              // tokenAccounts: "balanceChanged" also matches the wallet's token accounts,
              // so incoming SPL transfers (which touch an ATA, not the wallet pubkey) show up.
              { accountInclude: [address], tokenAccounts: "balanceChanged" },
              {
                commitment: "confirmed",
                encoding: "jsonParsed",
                transactionDetails: "signatures",
                maxSupportedTransactionVersion: 0,
              },
            ],
          })
        );
      });

      ws.on("message", (raw) => {
        const msg = JSON.parse(raw.toString());
        const sig = msg?.params?.result?.signature;
        if (sig) send({ signature: sig, at: Date.now() });
      });

      // Tear down the upstream socket when the client disconnects.
      req.signal.addEventListener("abort", () => {
        ws.close();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
