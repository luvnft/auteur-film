-- Migration 004: DMCA Compliance
-- Adds DMCA reports system, user strikes, and content status for takedowns

-- Add strike_count and account status to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS strike_count int DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Add content status for DMCA takedowns
ALTER TABLE content ADD COLUMN IF NOT EXISTS content_status text DEFAULT 'published';
-- Values: 'published', 'removed_dmca', 'removed_creator', 'under_review'

-- DMCA Reports table
CREATE TABLE IF NOT EXISTS dmca_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  content_type text NOT NULL, -- 'film' or 'series'
  reporter_email text NOT NULL,
  reason text NOT NULL, -- 'copyright', 'publicity', 'other'
  description text NOT NULL,
  original_work_url text, -- URL of allegedly infringed work
  status text DEFAULT 'pending', -- 'pending', 'reviewed', 'actioned', 'dismissed'
  admin_notes text,
  actioned_at timestamp with time zone,
  actioned_by uuid REFERENCES users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- User strikes history table
CREATE TABLE IF NOT EXISTS user_strikes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id uuid REFERENCES content(id) ON DELETE SET NULL,
  dmca_report_id uuid REFERENCES dmca_reports(id) ON DELETE SET NULL,
  reason text NOT NULL,
  strike_number int NOT NULL, -- 1, 2, or 3
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dmca_reports_content_id ON dmca_reports(content_id);
CREATE INDEX IF NOT EXISTS idx_dmca_reports_status ON dmca_reports(status);
CREATE INDEX IF NOT EXISTS idx_dmca_reports_created_at ON dmca_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_strikes_user_id ON user_strikes(user_id);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(content_status);

-- Function to increment strike count and check for suspension
CREATE OR REPLACE FUNCTION increment_user_strike()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment the user's strike count
  UPDATE users
  SET strike_count = strike_count + 1
  WHERE id = NEW.user_id;

  -- Check if user has reached 3 strikes
  IF (SELECT strike_count FROM users WHERE id = NEW.user_id) >= 3 THEN
    UPDATE users
    SET account_status = 'suspended'
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment strikes
DROP TRIGGER IF EXISTS trigger_increment_strike ON user_strikes;
CREATE TRIGGER trigger_increment_strike
  AFTER INSERT ON user_strikes
  FOR EACH ROW
  EXECUTE FUNCTION increment_user_strike();

-- RLS Policies

-- Enable RLS
ALTER TABLE dmca_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_strikes ENABLE ROW LEVEL SECURITY;

-- DMCA Reports policies
-- Anyone authenticated can create a report
CREATE POLICY "Authenticated users can create reports"
  ON dmca_reports FOR INSERT
  WITH CHECK (true);

-- Only admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON dmca_reports FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE privy_id = auth.uid()::text AND is_admin = true)
  );

-- Content creators can view reports on their own content
CREATE POLICY "Creators can view reports on own content"
  ON dmca_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM content c
      JOIN users u ON c.creator_id = u.id
      WHERE c.id = dmca_reports.content_id
      AND u.privy_id = auth.uid()::text
    )
  );

-- Only admins can update reports
CREATE POLICY "Admins can update reports"
  ON dmca_reports FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE privy_id = auth.uid()::text AND is_admin = true)
  );

-- User strikes policies
-- Users can view their own strikes
CREATE POLICY "Users can view own strikes"
  ON user_strikes FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.uid()::text)
  );

-- Admins can view all strikes
CREATE POLICY "Admins can view all strikes"
  ON user_strikes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE privy_id = auth.uid()::text AND is_admin = true)
  );

-- Only admins can create strikes
CREATE POLICY "Admins can create strikes"
  ON user_strikes FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE privy_id = auth.uid()::text AND is_admin = true)
  );

-- Comment to document the migration
COMMENT ON TABLE dmca_reports IS 'DMCA takedown requests and copyright infringement reports';
COMMENT ON TABLE user_strikes IS 'User strike history for repeat infringer policy (3 strikes = suspension)';
COMMENT ON COLUMN users.strike_count IS 'Number of DMCA strikes against this user';
COMMENT ON COLUMN users.account_status IS 'Account status: active, suspended, banned';
COMMENT ON COLUMN users.is_admin IS 'Whether user has admin privileges for DMCA moderation';
COMMENT ON COLUMN content.content_status IS 'Content publication status including DMCA takedowns';
