import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

function makeLimiter(
  requests: number,
  window: `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}`,
): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: false,
  });
}

export const rateLimiters = {
  // 5 attempts per 15 minutes, keyed by IP + email
  login: makeLimiter(5, '15 m'),
  // 3 attempts per hour, keyed by IP
  register: makeLimiter(3, '1 h'),
  // 3 attempts per hour, keyed by IP
  forgotPassword: makeLimiter(3, '1 h'),
  // 5 attempts per 15 minutes, keyed by IP
  resetPassword: makeLimiter(5, '15 m'),
  // 3 attempts per 15 minutes, keyed by IP + email
  resendVerification: makeLimiter(3, '15 m'),
} as const;

export interface RateLimitResult {
  limited: boolean;
  retryAfterMinutes: number;
}

export async function checkRateLimit(
  limiter: Ratelimit | null,
  key: string,
): Promise<RateLimitResult> {
  if (!limiter) return { limited: false, retryAfterMinutes: 0 };

  try {
    const { success, reset } = await limiter.limit(key);
    const retryAfterMinutes = Math.ceil((reset - Date.now()) / 1000 / 60);
    return { limited: !success, retryAfterMinutes };
  } catch {
    // Fail open — allow request if Upstash is unavailable
    return { limited: false, retryAfterMinutes: 0 };
  }
}

export function getIp(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
}
