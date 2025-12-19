"use client";

import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { signIn } from "next-auth/react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "signin" | "signup";

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign In form state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up form state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: signInEmail,
        password: signInPassword,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        onClose();
        // Reset form
        setSignInEmail("");
        setSignInPassword("");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (signUpPassword !== signUpConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (signUpPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signUpEmail,
          password: signUpPassword,
          name: signUpName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account");
        return;
      }

      // Auto sign in after signup
      const result = await signIn("credentials", {
        email: signUpEmail,
        password: signUpPassword,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign in failed. Please try signing in.");
      } else {
        onClose();
        // Reset form
        setSignUpName("");
        setSignUpEmail("");
        setSignUpPassword("");
        setSignUpConfirmPassword("");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: window.location.href });
  };

  // Close on escape key and lock body scroll
  useEffect(() => {
    if (!isOpen) {
      // Restore scroll when modal closes
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      return;
    }

    // Lock body scroll when modal is open
    // Preserve scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="auth-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99]"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
          />

          {/* Modal - compact and centered */}
          <motion.div
            key="auth-modal-content"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 30
            }}
            onClick={(e) => e.stopPropagation()}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-[100] flex flex-col"
            style={{
              maxHeight: '90vh'
            }}
          >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 text-zinc-400 hover:text-white transition p-1.5 hover:bg-white/5 rounded-lg"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Tabs */}
          <div className="flex border-b border-zinc-800 flex-shrink-0 relative px-6 pt-4">
            <button
              onClick={() => {
                setActiveTab("signin");
                setError(null);
              }}
              className={`flex-1 py-3 text-sm font-medium transition relative ${
                activeTab === "signin"
                  ? "text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sign In
              {activeTab === "signin" && (
                <motion.span 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("signup");
                setError(null);
              }}
              className={`flex-1 py-3 text-sm font-medium transition relative ${
                activeTab === "signup"
                  ? "text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sign Up
              {activeTab === "signup" && (
                <motion.span 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          </div>

          {/* Content */}
          <div 
            className="p-6 overflow-y-auto flex-1"
            style={{
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Sign In Form */}
            {activeTab === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5 font-medium">Email</label>
                  <input
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5 font-medium">Password</label>
                  <input
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-zinc-400 hover:text-zinc-300 transition cursor-not-allowed disabled:opacity-50"
                    disabled
                    title="Coming soon"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            )}

            {/* Sign Up Form */}
            {activeTab === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5 font-medium">Name</label>
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5 font-medium">Email</label>
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5 font-medium">Password</label>
                  <input
                    type="password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
                    placeholder="At least 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5 font-medium">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
                    placeholder="Confirm your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                >
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="my-5 flex items-center">
              <div className="flex-1 border-t border-zinc-800"></div>
              <span className="px-3 text-xs text-zinc-500 uppercase tracking-wider">or</span>
              <div className="flex-1 border-t border-zinc-800"></div>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 border border-zinc-800 hover:bg-zinc-800/50 rounded-lg text-white font-medium transition flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

