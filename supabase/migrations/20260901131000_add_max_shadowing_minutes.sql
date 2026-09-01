-- Add max_shadowing_minutes to plans
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_shadowing_minutes INTEGER DEFAULT 30;

-- Update defaults for existing plans
UPDATE plans SET max_shadowing_minutes = 25 WHERE name = 'FREE';
UPDATE plans SET max_shadowing_minutes = 50 WHERE name = 'BASIC';
UPDATE plans SET max_shadowing_minutes = 120 WHERE name = 'PRO';
UPDATE plans SET max_shadowing_minutes = 9999 WHERE name = 'ADMIN';
NhuThang123@