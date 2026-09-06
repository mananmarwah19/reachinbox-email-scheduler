import Redis from "ioredis";

const redis = new Redis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379"
);


export async function consumeHourlyLimit(
  senderId: string,
  maxEmailsPerHour: number
)
  : Promise<{
  allowed: boolean;
  count: number;
  limit: number;
  nextAvailableAt: Date;
}> {
  const now = new Date();

  const hourWindow = new Date(now);
  hourWindow.setMinutes(0, 0, 0);

  const windowKey = hourWindow.toISOString();
  const redisKey = `email-rate:${senderId}:${windowKey}`;

  /*
   * Atomic Redis operation:
   * - increment the sender's current-hour counter
   * - set expiry on the first increment
   *
   * This is safe when multiple workers/instances
   * process jobs concurrently.
   */
  const count = await redis.incr(redisKey);

  if (count === 1) {
    await redis.expire(redisKey, 60 * 60 * 2);
  }

  const nextHour = new Date(hourWindow);
  nextHour.setHours(nextHour.getHours() + 1);

  if (count > maxEmailsPerHour) {
    await redis.decr(redisKey);

    return {
      allowed: false,
      count: maxEmailsPerHour,
      limit: maxEmailsPerHour,
      nextAvailableAt: nextHour,
    };
  }

  return {
    allowed: true,
    count,
    limit: maxEmailsPerHour,
    nextAvailableAt: nextHour,
  };
}

export function getHourlyLimit() {
  return Number(
    process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || 200
  );
}

export async function closeRateLimitRedis() {
  await redis.quit();
}