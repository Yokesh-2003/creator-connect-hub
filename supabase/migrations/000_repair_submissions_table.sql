BEGIN;

-- 1. ADD MISSING COLUMNS (SAFE, NON-DESTRUCTIVE)
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS creator_id UUID,
  ADD COLUMN IF NOT EXISTS social_account_id UUID,
  ADD COLUMN IF NOT EXISTS post_url TEXT,
  ADD COLUMN IF NOT EXISTS post_id TEXT,
  ADD COLUMN IF NOT EXISTS content_platform TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT now();

-- 2. BACKFILL content_platform FROM legacy platform
UPDATE public.submissions
SET content_platform = platform
WHERE content_platform IS NULL
  AND platform IS NOT NULL;

-- 3. BACKFILL creator_id FROM auth metadata (CRITICAL)
-- This assumes submissions were created by authenticated users
UPDATE public.submissions s
SET creator_id = au.id
FROM auth.users au
WHERE s.creator_id IS NULL
  AND s.created_at IS NOT NULL
  AND au.id IS NOT NULL
  AND s.created_at BETWEEN au.created_at - interval '5 minutes'
                          AND au.created_at + interval '5 minutes';

-- 4. MAKE social_account_id OPTIONAL
ALTER TABLE public.submissions
  ALTER COLUMN social_account_id DROP NOT NULL;

-- 5. CONSTRAINTS (SAFE)
ALTER TABLE public.submissions
  DROP CONSTRAINT IF EXISTS submissions_content_platform_check;

ALTER TABLE public.submissions
  ADD CONSTRAINT submissions_content_platform_check
  CHECK (content_platform IN ('tiktok','linkedin'));

-- 6. ENABLE RLS (NO POLICY DROP)
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

COMMIT;