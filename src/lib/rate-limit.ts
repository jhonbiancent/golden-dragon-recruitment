// Simple in-memory rate limiter for serverless (per-instance)
// Note: In production, use a Redis-based solution like Upstash for global rate limiting.

type RateLimitRecord = {
    count: number;
    resetTime: number;
};

const store = new Map<string, RateLimitRecord>();

export async function rateLimit(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const record = store.get(key);

    if (!record || now > record.resetTime) {
        store.set(key, { count: 1, resetTime: now + windowMs });
        return { success: true, remaining: limit - 1 };
    }

    if (record.count >= limit) {
        return { success: false, remaining: 0 };
    }

    record.count += 1;
    return { success: true, remaining: limit - record.count };
}
