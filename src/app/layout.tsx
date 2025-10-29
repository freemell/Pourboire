import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PrivyProvider } from "@/components/providers/privy-provider";
import { PrivyErrorBoundary } from "@/components/providers/privy-error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SolTip - Tip anyone on X with Solana",
  description: "Send instant SOL/USDC tips to any X post with @SolTip. Zero fees, instant payments, and auto-pay features powered by x402.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PrivyErrorBoundary>
          <PrivyProvider>
            {children}
          </PrivyProvider>
        </PrivyErrorBoundary>
      </body>
    </html>
  );
}
