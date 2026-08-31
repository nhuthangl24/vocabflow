ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS max_flashcards INTEGER DEFAULT 0;

-- Set default values for existing plans
UPDATE public.plans SET max_flashcards = 500 WHERE name ILIKE 'free';
UPDATE public.plans SET max_flashcards = 1000 WHERE name ILIKE 'basic';
UPDATE public.plans SET max_flashcards = 0 WHERE name ILIKE 'pro';
UPDATE public.plans SET max_flashcards = 0 WHERE name ILIKE 'lifetime';
