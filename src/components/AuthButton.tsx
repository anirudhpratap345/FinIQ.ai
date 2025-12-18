"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();
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
    return (
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="px-4 py-2 rounded-lg text-sm text-zinc-200 border border-white/10 bg-white/5 hover:bg-white/10 transition"
        aria-label="Sign out"
        title={session?.user?.email || "Signed in"}
      >
        Sign out
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signIn("google")}
      className="px-4 py-2 rounded-lg text-sm font-medium text-black bg-emerald-400 hover:bg-emerald-300 transition"
      aria-label="Sign in with Google"
    >
      Sign in
    </button>
  );
}


