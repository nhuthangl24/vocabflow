import { fsrs, generatorParameters, Rating, State, createEmptyCard } from 'ts-fsrs';
import type { Card, RecordLogItem, Grade } from 'ts-fsrs';

// Initialize FSRS with default parameters
const params = generatorParameters({ maximum_interval: 36500 });
export const fsrsEngine = fsrs(params);

export type { Card, RecordLogItem, Grade };
export { Rating, State };

// Helper to convert DB flashcard to ts-fsrs Card
export function mapToFSRSCard(dbCard: any): Card {
  const empty = createEmptyCard();
  return {
    ...empty,
    due: dbCard.next_review_at ? new Date(dbCard.next_review_at) : new Date(),
    stability: dbCard.stability || 0,
    difficulty: dbCard.fsrs_difficulty || 0,
    elapsed_days: dbCard.elapsed_days || 0,
    scheduled_days: dbCard.scheduled_days || 0,
    reps: dbCard.reps || 0,
    lapses: dbCard.lapses || 0,
    state: dbCard.state !== undefined ? dbCard.state : State.New,
    last_review: dbCard.last_review ? new Date(dbCard.last_review) : undefined,
  };
}

// Helper to calculate next review based on rating
export function calculateNextReview(card: Card, rating: Grade, now: Date = new Date()): RecordLogItem {
  return fsrsEngine.next(card, now, rating);
}
