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

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

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

      const result = await signIn("credentials", {
        email: signUpEmail,
        password: signUpPassword,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign in failed. Please try signing in.");
      } else {
        onClose();
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop with enhanced blur */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-2xl z-[99]"
      />

      {/* Centered Modal Container */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto w-full max-w-[420px] max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition z-10"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Tabs */}
          <div className="flex border-b border-zinc-800 flex-shrink-0">
            <button
              onClick={() => { setActiveTab("signin"); setError(null); }}
              className={`flex-1 py-3.5 text-sm font-medium transition border-b-2 ${
                activeTab === "signin" 
                  ? "text-white border-emerald-500" 
                  : "text-zinc-500 border-transparent hover:text-zinc-300"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab("signup"); setError(null); }}
              className={`flex-1 py-3.5 text-sm font-medium transition border-b-2 ${
                activeTab === "signup" 
                  ? "text-white border-emerald-500" 
                  : "text-zinc-500 border-transparent hover:text-zinc-300"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
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
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5 font-medium">Password</label>
                  <input
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            )}

            {/* Sign Up Form */}
            {activeTab === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5 font-medium">Name</label>
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    required
                    placeholder="Your name"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5 font-medium">Email</label>
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
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
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5 font-medium">Confirm Password</label>
                  <input
                    type="password"
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Confirm your password"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="flex items-center my-5">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="px-3 text-xs text-zinc-500 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 border border-zinc-800 hover:bg-zinc-800/50 rounded-lg text-white font-medium transition flex items-center justify-center gap-2 text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
