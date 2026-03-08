/**
 * Normalize API errors for professional user-facing messages
 * Never expose raw JSON or internal error details
 */

const QUOTA_MESSAGE =
  "API quota exceeded. Switch to GPT or Claude in the provider dropdown — add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env.local if needed.";

const RATE_LIMIT_MESSAGE =
  "Service temporarily busy. Please try again in a moment or switch providers.";

export function normalizeApiError(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (typeof msg === "string" && msg.length > 500) {
      // Likely raw JSON - check for known patterns
      if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
        return QUOTA_MESSAGE;
      }
      if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand")) {
        return RATE_LIMIT_MESSAGE;
      }
      return fallback;
    }
    if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
      return QUOTA_MESSAGE;
    }
    if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand")) {
      return RATE_LIMIT_MESSAGE;
    }
    // Keep short, safe messages; truncate long technical ones
    if (msg.length > 200) return fallback;
    return msg;
  }

  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    const code = obj.code ?? obj.status;
    const message = obj.message;
    if (code === 429 || (typeof message === "string" && message.includes("quota"))) {
      return QUOTA_MESSAGE;
    }
    if (code === 503 || (typeof message === "string" && message.includes("503"))) {
      return RATE_LIMIT_MESSAGE;
    }
    if (typeof message === "string" && message.length < 200) return message;
  }

  return fallback;
}

/** Extract clean error string from API response body */
export function parseApiErrorBody(data: unknown): string {
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return parseApiErrorBody(parsed);
    } catch {
      return data.length < 200 ? data : "Something went wrong";
    }
  }
  if (typeof data === "object" && data !== null) {
    const obj = data as Record<string, unknown>;
    const err = obj.error;
    if (typeof err === "string") {
      if (err.length > 500 || err.includes('"code":429')) return QUOTA_MESSAGE;
      if (err.includes("503")) return RATE_LIMIT_MESSAGE;
      return err;
    }
    if (typeof err === "object" && err !== null) {
      const errObj = err as Record<string, unknown>;
      if (errObj.code === 429 || errObj.status === "RESOURCE_EXHAUSTED") {
        return QUOTA_MESSAGE;
      }
      const msg = errObj.message;
      if (typeof msg === "string" && msg.length < 200) return msg;
    }
  }
  return "Something went wrong";
}
