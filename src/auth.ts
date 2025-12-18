import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * NextAuth v5 (App Router) configuration.
 *
 * Env vars supported:
 * - AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET (preferred in v5)
 * - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (fallback for convenience)
 * - AUTH_SECRET (required in production)
 */
export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  // IMPORTANT:
  // Do NOT throw at module load time. Vercel runs `next build` and "collects page data" for Route Handlers.
  // If we throw here, deployment fails even if runtime env vars are set correctly.

  const googleClientId =
    process.env.AUTH_GOOGLE_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    process.env.AUTH_GOOGLE_CLIENT_ID ||
    // (common mistakes) if user put these in Vercel by accident
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "";

  const googleClientSecret =
    process.env.AUTH_GOOGLE_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.AUTH_GOOGLE_CLIENT_SECRET ||
    // (common mistakes) if user put these in Vercel by accident
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET ||
    "";

  const providers =
    googleClientId && googleClientSecret
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : [];

  const resolvedSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (process.env.NODE_ENV === "production") {
    // Safe diagnostics (no secrets) to make Vercel logs actionable.
    if (!resolvedSecret) {
      console.error(
        "[auth] Missing AUTH_SECRET (or NEXTAUTH_SECRET). This will cause /api/auth/session to 500."
      );
    }
    if (providers.length === 0) {
      console.error("[auth] Missing Google OAuth env vars at runtime.", {
        has_AUTH_GOOGLE_ID: !!process.env.AUTH_GOOGLE_ID,
        has_AUTH_GOOGLE_SECRET: !!process.env.AUTH_GOOGLE_SECRET,
        has_GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
        has_GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
        has_AUTH_GOOGLE_CLIENT_ID: !!process.env.AUTH_GOOGLE_CLIENT_ID,
        has_AUTH_GOOGLE_CLIENT_SECRET: !!process.env.AUTH_GOOGLE_CLIENT_SECRET,
        has_NEXT_PUBLIC_GOOGLE_CLIENT_ID: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        has_NEXT_PUBLIC_GOOGLE_CLIENT_SECRET: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
        has_AUTH_URL: !!process.env.AUTH_URL,
        has_NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
        vercel_url: process.env.VERCEL_URL ? "(set)" : "(missing)",
      });
    }
  }

  return {
    // Vercel/proxies: avoid "UntrustedHost" style failures when AUTH_URL isn't perfectly set.
    trustHost: true,

    // Support both Auth.js v5 env names and older NextAuth v4 env names.
    secret: resolvedSecret,

    providers,
    session: {
      strategy: "jwt",
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user?.email) {
          token.user_id = `user_${Buffer.from(user.email).toString("base64").substring(0, 20)}`;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user && token.user_id) {
          session.user.id = token.user_id as string;
        }
        return session;
      },
    },
    pages: {
      signIn: "/",
      error: "/",
    },
    debug: process.env.NODE_ENV === "development",
  };
});


