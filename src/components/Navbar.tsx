"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useScrollSpy } from "@/hooks/useScrollSpy";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const sectionIds = ["features", "how-it-works"];
  const active = useScrollSpy(sectionIds);
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className={`fixed top-0 inset-x-0 z-40 transition-all ${scrolled ? "glass-subtle border-b border-white/10 backdrop-blur" : "bg-transparent"}`}>
      <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-center">
        <div className={`nav-pill ${scrolled ? "nav-pill--scrolled" : ""} flex items-center justify-between gap-4 md:gap-8 px-4 md:px-6 py-2 w-[min(100%,1000px)] mx-auto`}>
          <Link href="/" className="text-white font-semibold text-base md:text-lg tracking-tight">
            FinIQ.ai
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm">
            <a href="#features" aria-current={isHome && active==="features"?"page":undefined}
               className={`underline-soft nav-link transition-colors ${active==="features"?"text-white":"text-gray-300 hover:text-white"}`}>Features</a>
            <a href="#how-it-works" aria-current={isHome && active==="how-it-works"?"page":undefined}
               className={`underline-soft nav-link transition-colors ${active==="how-it-works"?"text-white":"text-gray-300 hover:text-white"}`}>How it works</a>
            <Link href="/finance-copilot" className="underline-soft nav-link text-gray-300 hover:text-white transition-colors">Get Strategy</Link>
        </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/auth/signin" className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-white hover:bg-white hover:text-black transition">
              Sign In
            </Link>
          </div>

          <button aria-label="Menu" className="lg:hidden text-white ml-auto md:ml-0" onClick={() => setOpen(v => !v)}>
            {open ? <X className="h-6 w-6"/> : <Menu className="h-6 w-6"/>}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden px-4 md:px-6 pb-6"
          >
            <div className="glass rounded-xl p-4 space-y-3 border border-white/10">
              <a href="#features" className="block text-gray-200" onClick={() => setOpen(false)}>Features</a>
              <Link href="/finance-copilot" className="block text-gray-200" onClick={() => setOpen(false)}>Get Strategy</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}


