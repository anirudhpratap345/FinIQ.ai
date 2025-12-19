"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { ChevronDown, User } from "lucide-react";
import AuthModal from "./AuthModal";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isAuthed = status === "authenticated";

  if (status === "loading") {
    return (
      <button
        type="button"
        className="px-4 py-2 rounded-lg text-sm text-zinc-300 border border-white/10 bg-white/5"
        disabled
      >
        Loading…
      </button>
    );
  }

  if (isAuthed) {
    const userInitials = session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || session?.user?.email?.[0].toUpperCase() || "U";

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-200 border border-white/10 bg-white/5 hover:bg-white/10 transition"
          aria-label="User menu"
        >
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-emerald-400/20 flex items-center justify-center text-emerald-400 text-xs font-medium">
              {userInitials}
            </div>
          )}
          <span className="hidden md:inline max-w-[120px] truncate">
            {session?.user?.name || session?.user?.email}
          </span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {isDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-[#111111] border border-white/10 rounded-lg shadow-xl z-[60] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-medium text-white truncate">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-xs text-zinc-400 truncate">
                  {session?.user?.email}
                </p>
              </div>
              <button
                onClick={() => {
                  signOut({ callbackUrl: "/" });
                  setIsDropdownOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-white/5 transition"
              >
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 rounded-lg text-sm font-medium text-black bg-emerald-400 hover:bg-emerald-300 transition"
        aria-label="Sign in"
      >
        Sign in
      </button>
      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}


