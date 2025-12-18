"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [showMenu, setShowMenu] = useState(false);

  // Loading state
  if (status === "loading") {
    return (
      <div className="w-24 h-10 bg-white/10 rounded-full animate-pulse" />
    );
  }

  // Not signed in
  if (!session) {
    return (
      <button
        onClick={() => signIn("google")}
        className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-medium transition-all transform hover:scale-105"
      >
        Sign In
      </button>
    );
  }

  // Signed in - show user menu
  const userEmail = session.user?.email || "User";
  const userName = session.user?.name || userEmail;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all border border-white/20"
      >
        {userName}
      </button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-48 glass rounded-lg p-3 border border-white/10 z-50 shadow-xl"
          >
            <div className="text-xs text-white/60 px-2 py-2 border-b border-white/10 mb-2">
              {userEmail}
            </div>
            <button
              onClick={() => {
                setShowMenu(false);
                signOut({ callbackUrl: "/" });
              }}
              className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded transition-colors"
            >
              Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
