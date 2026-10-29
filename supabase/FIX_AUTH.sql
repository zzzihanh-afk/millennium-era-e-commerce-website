-- ============================================================
-- MILLENNIUM ERA — FIX SUPABASE AUTH 500 SCAN ERROR
-- ============================================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vcgkejjnkudffbthvpwx/sql/new
-- ============================================================
-- Why this is needed:
-- Supabase GoTrue Auth backend crashes with "converting NULL to string is unsupported"
-- if confirmation_token, recovery_token, or email_change are NULL.
-- Setting them to empty string '' resolves the 500 error immediately.
-- ============================================================

UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone = COALESCE(phone, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE 
  confirmation_token IS NULL 
  OR recovery_token IS NULL 
  OR email_change IS NULL 
  OR email_change_token_new IS NULL
  OR email_change_token_current IS NULL
  OR phone IS NULL
  OR phone_change IS NULL
  OR phone_change_token IS NULL
  OR reauthentication_token IS NULL;

-- Ensure default constraint on auth.users for future safety
ALTER TABLE auth.users ALTER COLUMN confirmation_token SET DEFAULT '';
ALTER TABLE auth.users ALTER COLUMN recovery_token SET DEFAULT '';
ALTER TABLE auth.users ALTER COLUMN email_change SET DEFAULT '';
ALTER TABLE auth.users ALTER COLUMN email_change_token_new SET DEFAULT '';
ALTER TABLE auth.users ALTER COLUMN email_change_token_current SET DEFAULT '';
