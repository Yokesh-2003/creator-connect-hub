-- This script replaces all previous migrations for the submissions table.
-- It creates the table with the correct columns and policies, resolving all conflicts.

-- Drop the submissions table if it exists to ensure a clean slate.
DROP TABLE IF EXISTS public.submissions CASCADE;

-- Create the submissions table with the consolidated schema.
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  post_url TEXT,
  content_platform TEXT CHECK (content_platform IN ('tiktok', 'linkedin')),
  post_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disqualified')),
  rejection_reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Submissions policies
CREATE POLICY "Users can view their own submissions" ON public.submissions FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Campaign owners can view all submissions" ON public.submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND brand_id = auth.uid())
);
CREATE POLICY "Users can create their own submissions" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update their own submissions" ON public.submissions FOR UPDATE USING (auth.uid() = creator_id);

-- Add the updated_at trigger
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
