-- Modify submissions table to support manual URL submissions and unify content platform
ALTER TABLE public.submissions
  ADD COLUMN content_platform TEXT CHECK (content_platform IN ('tiktok', 'linkedin')),
  ADD COLUMN post_id TEXT,
  ALTER COLUMN social_account_id DROP NOT NULL;

-- Remove redundant columns
ALTER TABLE public.submissions
  DROP COLUMN content_id,
  DROP COLUMN content_type;
