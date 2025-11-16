"use client";

import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/10 glass-subtle py-14">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div>
            <div className="text-white font-bold text-lg mb-2">FinIQ.ai</div>
            <div className="text-gray-400 text-sm">© {new Date().getFullYear()} FinIQ.ai. All rights reserved.</div>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-6 text-gray-300">
            <Link href="/finance-copilot" className="hover:text-white">Get Strategy</Link>
            <Link href="/#how-it-works" className="hover:text-white">How It Works</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
