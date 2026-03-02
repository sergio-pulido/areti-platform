const attemptsByKey = new Map<string, number[]>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function assertWithinRateLimit(key: string): void {
  const now = Date.now();
  const current = attemptsByKey.get(key) ?? [];
  const recent = current.filter((timestamp) => now - timestamp <= WINDOW_MS);

  if (recent.length >= MAX_ATTEMPTS) {
    throw new Error("Too many attempts. Please wait 15 minutes and try again.");
  }

  recent.push(now);
  attemptsByKey.set(key, recent);
}
