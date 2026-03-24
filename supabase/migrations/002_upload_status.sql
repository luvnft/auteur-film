-- Add upload status tracking to content table
-- This enables automated YouTube upload pipeline

-- Add upload_status column with constraint
ALTER TABLE content ADD COLUMN upload_status TEXT DEFAULT 'draft'
  CHECK (upload_status IN ('draft', 'uploading_temp', 'uploading_youtube', 'processing', 'ready', 'failed'));

-- Add upload error tracking
ALTER TABLE content ADD COLUMN upload_error TEXT;

-- Add temp storage path for cleanup after YouTube upload
ALTER TABLE content ADD COLUMN temp_storage_path TEXT;

-- Create index for efficient status queries
CREATE INDEX idx_content_upload_status ON content(upload_status);

-- Create index for creator's content by status (useful for dashboard)
CREATE INDEX idx_content_creator_status ON content(creator_id, upload_status);

-- Update RLS policy to allow creators to see their draft/processing content
-- (existing policies may need adjustment)
DROP POLICY IF EXISTS "Creators can view their own content" ON content;
CREATE POLICY "Creators can view their own content"
  ON content FOR SELECT
  USING (
    creator_id = auth.uid() OR
    (upload_status = 'ready' AND published_at IS NOT NULL)
  );

-- Policy for creators to update their own content (including upload status)
DROP POLICY IF EXISTS "Creators can update their own content" ON content;
CREATE POLICY "Creators can update their own content"
  ON content FOR UPDATE
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Policy for creators to delete their own content
DROP POLICY IF EXISTS "Creators can delete their own content" ON content;
CREATE POLICY "Creators can delete their own content"
  ON content FOR DELETE
  USING (creator_id = auth.uid());

-- Policy for creators to insert new content
DROP POLICY IF EXISTS "Creators can insert content" ON content;
CREATE POLICY "Creators can insert content"
  ON content FOR INSERT
  WITH CHECK (creator_id = auth.uid());

-- Create storage bucket for temp video uploads if not exists
-- Note: This should be run in Supabase dashboard or via API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', false)
-- ON CONFLICT (id) DO NOTHING;

COMMENT ON COLUMN content.upload_status IS 'Video upload pipeline status: draft → uploading_temp → uploading_youtube → processing → ready/failed';
COMMENT ON COLUMN content.upload_error IS 'Error message if upload_status is failed';
COMMENT ON COLUMN content.temp_storage_path IS 'Supabase storage path for temp video file (cleaned up after YouTube upload)';
