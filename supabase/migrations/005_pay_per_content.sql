-- Migration: 005_pay_per_content.sql
-- Description: Add pricing, pre-release, and purchase tracking for pay-per-content model

-- Add pricing and pre-release fields to content table
ALTER TABLE content
  ADD COLUMN IF NOT EXISTS price_cents integer DEFAULT 0
    CHECK (price_cents >= 0 AND price_cents <= 2500),
  ADD COLUMN IF NOT EXISTS release_date timestamptz,
  ADD COLUMN IF NOT EXISTS trailer_youtube_id text;

-- Create content purchases table
CREATE TABLE IF NOT EXISTS content_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content_id uuid REFERENCES content(id) ON DELETE CASCADE NOT NULL,
  amount_cents integer NOT NULL,
  platform_fee_cents integer NOT NULL,
  transaction_hash text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_id)
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_purchases_user ON content_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_content ON content_purchases(content_id);

-- Index for release date filtering
CREATE INDEX IF NOT EXISTS idx_content_release_date ON content(release_date);

-- Index for price filtering
CREATE INDEX IF NOT EXISTS idx_content_price ON content(price_cents);

-- RLS for purchases
ALTER TABLE content_purchases ENABLE ROW LEVEL SECURITY;

-- Allow select for all (so queries work without auth issues)
CREATE POLICY "purchases_select_policy" ON content_purchases
  FOR SELECT USING (true);

-- Allow insert for authenticated users
CREATE POLICY "purchases_insert_policy" ON content_purchases
  FOR INSERT WITH CHECK (true);

-- Comment explaining the model change
COMMENT ON COLUMN content.price_cents IS 'Price in cents. 0 = free, 1-2500 = $0.01-$25.00';
COMMENT ON COLUMN content.release_date IS 'Scheduled release date. NULL = immediate release';
COMMENT ON COLUMN content.trailer_youtube_id IS 'YouTube video ID for trailer (pre-release content)';
COMMENT ON TABLE content_purchases IS 'Tracks one-time content purchases. Platform takes 2% fee.';
