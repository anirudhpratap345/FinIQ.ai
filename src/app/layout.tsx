import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import AuthProvider from "@/components/AuthProvider";
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
  metadataBase: new URL("https://www.finiq.live"),
  openGraph: {
    title: "FinIQ – Your Free AI VC",
    description: "Your AI VC Partner. Tells you exactly how much to raise, from whom, and what to fix first — in 30 seconds.",
    type: "website",
    siteName: "FinIQ",
    url: "https://www.finiq.live",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "FinIQ – Your Free AI VC",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinIQ – Your Free AI VC",
    description: "Your AI VC Partner. Tells you exactly how much to raise, from whom, and what to fix first — in 30 seconds.",
    images: ["/opengraph-image"],
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
        <AuthProvider>
          <ScrollProgress />
          <SkipToContent />
          <Navbar />
          <ErrorBoundary>
            <main id="main">
              {children}
            </main>
          </ErrorBoundary>
          <SiteFooter />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
