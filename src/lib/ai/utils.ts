export class RateLimiter {
  private concurrency: number;
  private running: number = 0;
  private queue: Array<() => void> = [];

  constructor(concurrency: number) {
    this.concurrency = concurrency;
  }

  async acquire(): Promise<void> {
    if (this.running < this.concurrency) {
      this.running++;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.running--;
    }
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts: number; baseDelayMs: number; maxDelayMs: number; onRetry?: (error: any, attempt: number) => void }
): Promise<T> {
  let attempt = 1;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt >= options.maxAttempts) {
        throw error;
      }
      
      if (options.onRetry) {
        options.onRetry(error, attempt);
      }

      // Exponential backoff with jitter
      const backoff = Math.min(options.baseDelayMs * Math.pow(2, attempt - 1), options.maxDelayMs);
      const jitter = backoff * 0.2 * Math.random();
      const delay = backoff + jitter;

      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }
}

// Timeout wrapper
export function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage = "Timeout"): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, ms);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
}
