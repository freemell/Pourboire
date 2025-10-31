import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PrivyProvider } from "@/components/providers/privy-provider";
import { WalletProvider } from "@/components/providers/wallet-provider";
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
  title: "Pourboire - Tip anyone on X with Solana",
  description: "Send instant SOL/USDC tips to any X post with @Pourboireonsol. Zero fees, instant payments, and auto-pay features powered by x402.",
  openGraph: {
    title: "Pourboire - Tip anyone on X with Solana",
    description: "Send instant SOL/USDC tips to any X post with @Pourboireonsol. Zero fees, instant payments, and auto-pay features powered by x402.",
    url: "https://pourboire.tips/",
    siteName: "Pourboire",
    images: [],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pourboire - Tip anyone on X with Solana",
    description: "Send instant SOL/USDC tips to any X post with @Pourboireonsol. Zero fees, instant payments, and auto-pay features powered by x402.",
  },
  icons: {
    icon: "/pour%20(1).png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Pourboire",
              "description": "Send instant SOL/USDC tips to any X post with @Pourboireonsol. Zero fees, instant payments, and auto-pay features powered by x402.",
              "url": "https://pourboire.tips/",
              "sameAs": ["https://x.com/Pourboireonsol"]
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PrivyErrorBoundary>
          <PrivyProvider>
            <WalletProvider>
              {children}
            </WalletProvider>
          </PrivyProvider>
        </PrivyErrorBoundary>
      </body>
    </html>
  );
}
