# VocabFlow AI & Queue System

## AI Pipeline
The AI Pipeline is designed with cost and reliability in mind.

### 1. FallbackProvider & Circuit Breaker
- **Location:** `src/lib/ai/provider.ts`
- **Logic:** If `KiraAI` fails (e.g. rate limit), it automatically fails over to `HHTech`, then `Anthropic`.
- **Circuit Breaker:** If a provider fails 3 times within 1 minute, it enters an `OPEN` state and is skipped entirely for 60 seconds. This prevents "Retry Storms" that consume bandwidth and delay user feedback.

### 2. True Action Engine
- Unlike traditional AI prompts that force the LLM to rewrite entire subtitles (causing Hallucination and huge token usage), VocabFlow only asks the LLM to output a JSON array of `merges` and `deletes`.
- The system uses a **Union-Find** graph algorithm to execute these merges safely without exceeding 200-character limits per subtitle block.

## Queue Management (Postgres)
- **Table:** `transcript_jobs`
- **Locking:** The `locked_at` column ensures that if multiple workers poll the DB, only one process claims the job (Anti-Race Condition).
- **Dead Letter Queue (DLQ):** The `retry_count` column increments on failure. After 3 retries, the job is marked as `dead_letter` for manual admin review.
