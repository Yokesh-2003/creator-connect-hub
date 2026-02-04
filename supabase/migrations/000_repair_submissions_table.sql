
-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure submissions.user_id has a foreign key to profiles.id
-- First, drop the existing FK if it exists to avoid errors
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'submissions_user_id_fkey' AND conrelid = 'public.submissions'::regclass) THEN
    ALTER TABLE public.submissions DROP CONSTRAINT submissions_user_id_fkey;
  END IF;
END;
$$;

-- Add the correct foreign key constraint, referencing profiles(id)
ALTER TABLE public.submissions 
ADD CONSTRAINT submissions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Previous attempts to fix this might have left incorrect FKs. This ensures correctness.
-- This script is idempotent and can be re-run.
