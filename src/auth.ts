import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const googleClientId =
  process.env.AUTH_GOOGLE_ID ||
  process.env.GOOGLE_CLIENT_ID ||
  process.env.AUTH_GOOGLE_CLIENT_ID ||
  "";

const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET ||
  process.env.GOOGLE_CLIENT_SECRET ||
  process.env.AUTH_GOOGLE_CLIENT_SECRET ||
  "";

// If these are missing in prod, /api/auth/session will 500 and the Sign In button will appear "dead".
// Throwing here gives a clear Vercel function log with exactly what's missing.
if (process.env.NODE_ENV === "production" && (!googleClientId || !googleClientSecret)) {
  throw new Error(
    "[auth] Missing Google OAuth env vars. Set AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET (preferred) or GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET."
  );
}

/**
 * NextAuth v5 (App Router) configuration.
 *
 * Env vars supported:
 * - AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET (preferred in v5)
 * - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET (fallback for convenience)
 * - AUTH_SECRET (required in production)
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Vercel/proxies: avoid "UntrustedHost" style failures when AUTH_URL isn't perfectly set.
  trustHost: true,

  // Support both Auth.js v5 env names and older NextAuth v4 env names.
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,

  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
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
});


