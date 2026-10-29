/**
 * Dependency-free sliding-window rate limiter.
 *
 * Shared by the Vercel serverless function, the Vite dev-plugin API and the
 * optional Express server so all three enforce the same policy.
 *
 * Note: on serverless platforms each cold-started instance gets its own copy
 * of this state, so the limit is *per instance* (best-effort abuse guard, not
 * a hard global cap). By default Vercel routes most traffic through one
 * instance until concurrency rises; for a strict global cap use Vercel WAF
 * rate-limit rules on top of this.
 */

export interface RateLimitOptions {
  /** Limit window in milliseconds. */
  windowMs: number;
  /** Maximum hits allowed per window, per key. */
  max: number;
  /**
   * Safety valve for memory: at most this many distinct keys are tracked at
   * once. Oldest keys are evicted first (Map keeps insertion order).
   */
  maxTrackedKeys?: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** How many requests remain in the current window. */
  remaining: number;
  /** Seconds until the window resets (present when ok === false). */
  retryAfterSeconds?: number;
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, maxTrackedKeys = 10_000 } = options;
  /** key -> hit timestamps inside the current window */
  const hits = new Map<string, number[]>();

  function sweep(now: number): void {
    for (const [key, times] of hits) {
      const alive = times.filter((t) => now - t < windowMs);
      if (alive.length === 0) {
        hits.delete(key);
      } else {
        hits.set(key, alive);
      }
    }
    // Bound memory under key-flood attacks: evict oldest keys.
    if (hits.size > maxTrackedKeys) {
      for (const key of hits.keys()) {
        hits.delete(key);
        if (hits.size <= maxTrackedKeys) break;
      }
    }
  }

  return function check(key: string): RateLimitResult {
    const now = Date.now();
    sweep(now);

    const times = hits.get(key) ?? [];
    const alive = times.filter((t) => now - t < windowMs);

    if (alive.length >= max) {
      hits.set(key, alive);
      const oldest = Math.min(...alive);
      return {
        ok: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
      };
    }

    alive.push(now);
    hits.set(key, alive);
    return { ok: true, remaining: max - alive.length };
  };
}

/**
 * Resolve the sortable client IP from a Node-style request, preferring the
 * platform-set X-Forwarded-For header (Vercel edge) and falling back to the
 * direct socket address (local dev / self-host).
 */
export function clientIpFromHeaders(headers: Record<string, string | string[] | undefined>, socketAddress?: string | null): string {
  const forwarded = headers['x-forwarded-for'];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (typeof first === 'string' && first.trim()) {
    return first.split(',')[0].trim();
  }
  return socketAddress || 'unknown';
}
