import type { Metadata } from "next";
import { Space_Grotesk, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/OnchainProvider";
import { SoundProvider } from "@/components/providers/SoundProvider";
import '@coinbase/onchainkit/styles.css';

// Force dynamic rendering for all pages (required for auth providers)
export const dynamic = 'force-dynamic';

// Main body font - clean, modern, but with character
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Pixel font for headings and accents
const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

// Display font (using Space Grotesk bold for headings too)
const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Auteur.film | The Platform for Next-Gen Filmmakers",
  description: "Own your audience, monetize your films. Built for the next generation of independent storytellers.",
  keywords: ["independent films", "filmmaking", "creator platform", "monetization", "streaming", "next-gen cinema"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`
          ${spaceGrotesk.variable}
          ${pressStart.variable}
          ${displayFont.variable}
          font-sans antialiased
          bg-[#FFF8F0] text-[#1a1a1a]
          min-h-screen
        `}
      >
        <Providers>
          <SoundProvider>
            {children}
          </SoundProvider>
        </Providers>
      </body>
    </html>
  );
}
