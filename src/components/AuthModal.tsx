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
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(4px)",
          zIndex: 99,
        }}
      />

      {/* Modal */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90vw",
          maxWidth: "420px",
          maxHeight: "90vh",
          backgroundColor: "#18181b",
          border: "1px solid #27272a",
          borderRadius: "12px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            padding: "6px",
            color: "#a1a1aa",
            background: "transparent",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            zIndex: 10,
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseOut={(e) => (e.currentTarget.style.color = "#a1a1aa")}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #27272a", flexShrink: 0 }}>
          <button
            onClick={() => { setActiveTab("signin"); setError(null); }}
            style={{
              flex: 1,
              padding: "14px 16px",
              fontSize: "14px",
              fontWeight: 500,
              color: activeTab === "signin" ? "#fff" : "#71717a",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "signin" ? "2px solid #10b981" : "2px solid transparent",
              cursor: "pointer",
              transition: "color 0.15s",
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab("signup"); setError(null); }}
            style={{
              flex: 1,
              padding: "14px 16px",
              fontSize: "14px",
              fontWeight: 500,
              color: activeTab === "signup" ? "#fff" : "#71717a",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "signup" ? "2px solid #10b981" : "2px solid transparent",
              cursor: "pointer",
              transition: "color 0.15s",
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          {error && (
            <div style={{
              marginBottom: "16px",
              padding: "12px",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              fontSize: "14px",
              color: "#f87171",
            }}>
              {error}
            </div>
          )}

          {/* Sign In Form */}
          {activeTab === "signin" && (
            <form onSubmit={handleSignIn}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", color: "#a1a1aa", marginBottom: "6px", fontWeight: 500 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    backgroundColor: "#09090b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", color: "#a1a1aa", marginBottom: "6px", fontWeight: 500 }}>
                  Password
                </label>
                <input
                  type="password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    backgroundColor: "#09090b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  backgroundColor: "#10b981",
                  color: "#fff",
                  fontWeight: 500,
                  fontSize: "14px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1,
                  marginTop: "8px",
                }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          {/* Sign Up Form */}
          {activeTab === "signup" && (
            <form onSubmit={handleSignUp}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "14px", color: "#a1a1aa", marginBottom: "6px", fontWeight: 500 }}>
                  Name
                </label>
                <input
                  type="text"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  required
                  placeholder="Your name"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    backgroundColor: "#09090b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "14px", color: "#a1a1aa", marginBottom: "6px", fontWeight: 500 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    backgroundColor: "#09090b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "14px", color: "#a1a1aa", marginBottom: "6px", fontWeight: 500 }}>
                  Password
                </label>
                <input
                  type="password"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    backgroundColor: "#09090b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", color: "#a1a1aa", marginBottom: "6px", fontWeight: 500 }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Confirm your password"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    backgroundColor: "#09090b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  backgroundColor: "#10b981",
                  color: "#fff",
                  fontWeight: 500,
                  fontSize: "14px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", margin: "20px 0" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#27272a" }} />
            <span style={{ padding: "0 12px", fontSize: "12px", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.05em" }}>or</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#27272a" }} />
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            style={{
              width: "100%",
              padding: "10px 16px",
              backgroundColor: "transparent",
              border: "1px solid #27272a",
              borderRadius: "8px",
              color: "#fff",
              fontWeight: 500,
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
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
    </AnimatePresence>
  );
}
