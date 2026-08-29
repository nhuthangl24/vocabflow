export const AIConfig = {
  // Concurrency Limits (p-limit)
  concurrency: {
    openai: Number(process.env.VOCAB_CONCURRENCY_OPENAI) || 5,
    hhtech: Number(process.env.VOCAB_CONCURRENCY_HHTECH) || 5,
    kiraai: Number(process.env.VOCAB_CONCURRENCY_KIRAAI) || 3,
    default: Number(process.env.VOCAB_CONCURRENCY_DEFAULT) || 5,
  },
  
  // Chunking
  chunking: {
    maxCharsPerChunk: Number(process.env.VOCAB_MAX_CHARS_PER_CHUNK) || 12000,
    safeWordsPerChunk: Number(process.env.VOCAB_SAFE_WORDS_PER_CHUNK) || 7,
  },
  
  // Retries & Error Handling
  retry: {
    maxAttempts: Number(process.env.VOCAB_RETRY_COUNT) || 3,
    baseDelayMs: Number(process.env.VOCAB_RETRY_DELAY_MS) || 2000,
    maxDelayMs: Number(process.env.VOCAB_RETRY_MAX_DELAY_MS) || 10000,
  },

  // Timeouts
  timeout: {
    extractionMs: Number(process.env.VOCAB_TIMEOUT_MS) || 180000,
  }
};
