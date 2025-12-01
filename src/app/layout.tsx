import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import ScrollProgress from "@/components/ScrollProgress";
import SkipToContent from "@/components/SkipToContent";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinIQ – Your Free AI VC",
  description: "Your AI VC Partner. Tells you exactly how much to raise, from whom, and what to fix first — in 30 seconds. No login. 5 free runs. Zero fluff.",
  openGraph: {
    title: "FinIQ – Your Free AI VC",
    description: "Your AI VC Partner. Get your funding strategy in 30 seconds. Built by a 21-year-old who got rejected by every accelerator.",
    type: "website",
    siteName: "FinIQ",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinIQ – Your Free AI VC",
    description: "Your AI VC Partner. Tells you exactly how much to raise, from whom, and what to fix first — in 30 seconds.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
      >
        <ScrollProgress />
        <SkipToContent />
        <Navbar />
        <ErrorBoundary>
          <main id="main">
            {children}
          </main>
        </ErrorBoundary>
        <SiteFooter />
      </body>
    </html>
  );
}
