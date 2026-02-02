DO $$
BEGIN
    -- Add content_platform if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'submissions'
        AND column_name = 'content_platform'
    ) THEN
        ALTER TABLE public.submissions ADD COLUMN content_platform TEXT CHECK (content_platform IN ('tiktok', 'linkedin'));
    END IF;

    -- Add post_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'submissions'
        AND column_name = 'post_id'
    ) THEN
        ALTER TABLE public.submissions ADD COLUMN post_id TEXT;
    END IF;

    -- Add post_url if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'submissions'
        AND column_name = 'post_url'
    ) THEN
        ALTER TABLE public.submissions ADD COLUMN post_url TEXT;
    END IF;

    -- Make social_account_id nullable if it exists and is not already nullable
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'submissions'
        AND column_name = 'social_account_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.submissions ALTER COLUMN social_account_id DROP NOT NULL;
    END IF;
END;
$$;