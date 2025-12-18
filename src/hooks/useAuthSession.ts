/**
 * Hook to manage user session for API calls.
 * Extracts user_id from NextAuth session and provides helper functions.
 */

import { useSession } from "next-auth/react";
import { useCallback } from "react";

export function useAuthSession() {
  const { data: session, status } = useSession();

  const isAuthenticated = status === "authenticated" && !!session?.user?.id;
  const userId = session?.user?.id || "";

  /**
   * Get user ID for API calls.
   * Returns empty string if not authenticated.
   */
  const getUserId = useCallback(() => {
    return userId;
  }, [userId]);

  /**
   * Get auth headers for API requests.
   * Includes user_id in the request body or as Bearer token.
   */
  const getAuthHeaders = useCallback(() => {
    return {
      "Content-Type": "application/json",
      ...(userId && { "Authorization": `Bearer ${userId}` }),
    };
  }, [userId]);

  return {
    session,
    status,
    isAuthenticated,
    userId,
    getUserId,
    getAuthHeaders,
  };
}
