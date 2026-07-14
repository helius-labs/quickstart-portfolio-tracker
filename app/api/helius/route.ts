import { NextRequest, NextResponse } from "next/server";
import { createHelius } from "helius-sdk";

export const runtime = "nodejs";

const helius = createHelius({
  apiKey: process.env.HELIUS_API_KEY!,
  network: "mainnet",
});

export async function POST(req: NextRequest) {
  const { method, params } = await req.json();
  try {
    // The two Helius calls that power this app: the full portfolio and its history.
    const result =
      method === "getAssetsByOwner"
        ? await helius.getAssetsByOwner(params)
        : method === "getTransactionsForAddress"
        ? await helius.getTransactionsForAddress(params)
        : undefined;

    if (result === undefined) {
      return NextResponse.json(
        { error: { message: `Unsupported method: ${method}` } },
        { status: 400 }
      );
    }
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ error: { message: (e as Error).message } });
  }
}
