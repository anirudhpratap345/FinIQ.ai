import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { redirect } from "next/navigation";

// Generate a random session ID
function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    // Extend JWT to include user_id for Redis session tracking
    async jwt({ token, user }) {
      if (user) {
        // Store a unique user_id based on email hash for consistent session tracking
        token.user_id = `user_${Buffer.from(user.email || "").toString("base64").substring(0, 20)}`;
      }
      return token;
    },
    // Add user_id to session
    async session({ session, token }) {
      if (session.user && token.user_id) {
        session.user.id = token.user_id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // Redirect to home on sign in
    error: "/", // Redirect to home on error
  },
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },
  debug: process.env.NODE_ENV === "development",
};
