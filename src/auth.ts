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
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "",
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


