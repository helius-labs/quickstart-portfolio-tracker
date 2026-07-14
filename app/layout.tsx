import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Helius Portfolio Tracker",
  description:
    "A Solana portfolio tracker built on Helius: tokens, NFTs, and SOL via DAS, history, and a live WebSocket feed.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
