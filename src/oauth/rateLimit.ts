/**
 * A small fixed-window rate limiter for the registration and token endpoints.
 *
 * State lives in process memory, which is right for the single Railway instance this template
 * deploys to. Running several replicas multiplies the effective limit by the replica count; move
 * the counters to Postgres or Redis if that ever matters.
 */

type Bucket = { count: number; resetAt: number }
type Limit = { limit: number; windowMs: number }

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000
let lastPrune = 0

const prune = (now: number) => {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
  // A flood of distinct keys must not grow memory without bound
  if (buckets.size > MAX_BUCKETS) buckets.clear()
}

export const checkRateLimit = (
  key: string,
  { limit, windowMs }: Limit,
  now = Date.now(),
): { allowed: boolean; retryAfterSeconds: number } => {
  if (now - lastPrune > 60_000) {
    prune(now)
    lastPrune = now
  }

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  bucket.count += 1
  if (bucket.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) }
  }
  return { allowed: true, retryAfterSeconds: 0 }
}

/** The caller's address as seen through Railway's proxy, or "unknown" */
export const getClientIP = (headers: Headers): string => {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || headers.get('x-real-ip')?.trim() || 'unknown'
}
