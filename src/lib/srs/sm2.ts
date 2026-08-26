// Simplified SuperMemo-2 (SM-2) algorithm

export interface SM2State {
  repetitions: number;
  interval_days: number;
  ease_factor: number; // usually 2.5
}

// Rating: 
// 0: Again (Complete blackout)
// 1: Hard (Incorrect, but remembered)
// 2: Hard (Correct, but very difficult)
// 3: Good (Correct, with some difficulty)
// 4: Good (Correct, after a hesitation)
// 5: Easy (Perfect response)
// We will map simple UI (Again, Hard, Good, Easy) -> (0, 2, 4, 5)

export function calculateNextReview(
  rating: number, // 0-5
  currentState: SM2State
): SM2State {
  let { repetitions, interval_days, ease_factor } = currentState;

  if (rating >= 3) {
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    repetitions++;
  } else {
    repetitions = 0;
    interval_days = 1;
  }

  ease_factor = ease_factor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
  if (ease_factor < 1.3) ease_factor = 1.3;

  return {
    repetitions,
    interval_days,
    ease_factor
  };
}
