/**
 * API client utility with authentication support.
 * Automatically includes user_id from session when available.
 */

export interface ApiRequestOptions extends RequestInit {
  includeUserId?: boolean;
}

export interface GenerateStrategyResponse {
  response: Record<string, any>;
  tokens_used: number;
  remaining_trials: number;
  user_metrics?: {
    generation_count: number;
    average_rating: number;
    last_active: string | null;
  };
}

export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}

/**
 * Make an authenticated API request to the backend.
 * Automatically includes user_id from session if available.
 */
export async function apiCall<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    headers: customHeaders = {},
    includeUserId = true,
    ...restOptions
  } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Merge custom headers
  if (customHeaders && typeof customHeaders === "object") {
    Object.assign(headers, customHeaders);
  }

  // Get user_id from session if needed
  if (includeUserId && typeof window !== "undefined") {
    try {
      // Call the NextAuth session endpoint
      const sessionResponse = await fetch("/api/auth/session");
      if (sessionResponse.ok) {
        const session = await sessionResponse.json();
        if (session?.user?.id) {
          headers["Authorization"] = `Bearer ${session.user.id}`;
        }
      }
    } catch (error) {
      console.warn("[API] Failed to get session:", error);
    }
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers,
    ...restOptions,
  });

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status}`;
    let detail: string | undefined;

    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
      detail = errorData.detail;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    const error: ApiError = {
      status: response.status,
      message: errorMessage,
      detail,
    };

    throw error;
  }

  return response.json() as Promise<T>;
}

/**
 * Generate a funding strategy.
 * Automatically sends user_id from session.
 */
export async function generateStrategy(
  prompt: string,
  userId: string,
  inputOverrides?: Record<string, any>
): Promise<GenerateStrategyResponse> {
  return apiCall<GenerateStrategyResponse>("/api/generate", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      prompt,
      input_overrides: inputOverrides,
    }),
  });
}

/**
 * Submit feedback/rating for a strategy.
 */
export async function submitFeedback(
  userId: string,
  strategyId: string,
  rating: number
): Promise<{
  success: boolean;
  message: string;
  metrics: Record<string, any>;
}> {
  return apiCall("/api/feedback", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      strategy_id: strategyId,
      rating,
    }),
  });
}

// (Auth disabled) User-specific metrics removed for now.
