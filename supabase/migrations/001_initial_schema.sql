-- Auteur.film Database Schema
-- Initial migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (wallet-based auth via Coinbase Smart Wallet)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  privy_id TEXT UNIQUE NOT NULL,
  wallet_address TEXT,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_creator BOOLEAN DEFAULT FALSE,
  subscription_status TEXT DEFAULT 'none' CHECK (subscription_status IN ('trial', 'active', 'expired', 'none')),
  subscription_expires_at TIMESTAMPTZ,
  referral_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  referred_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Series table
CREATE TABLE series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content table (films and episodes)
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('film', 'episode')),
  series_id UUID REFERENCES series(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  youtube_video_id TEXT,
  release_notes TEXT,
  duration_seconds INTEGER,
  season_number INTEGER,
  episode_number INTEGER,
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  tip_total_cents INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Episodes must have series_id, films must not
  CONSTRAINT content_type_check CHECK (
    (type = 'episode' AND series_id IS NOT NULL) OR
    (type = 'film' AND series_id IS NULL)
  )
);

-- Content views (tracking 75%+ completion)
CREATE TABLE content_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  watch_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

-- Tips
CREATE TABLE tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  transaction_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment votes
CREATE TABLE comment_votes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  vote INTEGER NOT NULL CHECK (vote IN (-1, 1)),
  PRIMARY KEY (user_id, comment_id)
);

-- User pins (Top 5)
CREATE TABLE user_pins (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 1 AND position <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, content_id),
  UNIQUE(user_id, position)
);

-- Leaderboard scores (materialized/cached)
CREATE TABLE leaderboard_scores (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  breakdown JSONB DEFAULT '{"views": 0, "tips": 0, "pin": 0, "comments": 0, "referrals": 0}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, content_id)
);

-- Referral tracking
CREATE TABLE referral_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE SET NULL,
  visitor_fingerprint TEXT,
  converted_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_content_creator ON content(creator_id);
CREATE INDEX idx_content_series ON content(series_id);
CREATE INDEX idx_content_published ON content(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_content_views_user ON content_views(user_id);
CREATE INDEX idx_content_views_content ON content_views(content_id);
CREATE INDEX idx_comments_content ON comments(content_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_leaderboard_content ON leaderboard_scores(content_id, score DESC);
CREATE INDEX idx_leaderboard_user ON leaderboard_scores(user_id);
CREATE INDEX idx_tips_to_user ON tips(to_user_id);
CREATE INDEX idx_tips_content ON tips(content_id);
CREATE INDEX idx_users_referral_code ON users(referral_code);

-- Function to update leaderboard score
CREATE OR REPLACE FUNCTION update_leaderboard_score(
  p_user_id UUID,
  p_content_id UUID
) RETURNS void AS $$
DECLARE
  v_view_points INTEGER := 0;
  v_tip_points INTEGER := 0;
  v_pin_points INTEGER := 0;
  v_comment_points INTEGER := 0;
  v_referral_points INTEGER := 0;
  v_total INTEGER := 0;
BEGIN
  -- View points (100 for 75%+ completion)
  SELECT CASE WHEN completed THEN 100 ELSE 0 END INTO v_view_points
  FROM content_views
  WHERE user_id = p_user_id AND content_id = p_content_id;
  v_view_points := COALESCE(v_view_points, 0);

  -- Tip points (50 + tip amount * 10)
  SELECT COALESCE(SUM(50 + (amount_cents / 100) * 10), 0) INTO v_tip_points
  FROM tips
  WHERE from_user_id = p_user_id AND content_id = p_content_id;

  -- Pin points (200 if pinned)
  SELECT CASE WHEN EXISTS(
    SELECT 1 FROM user_pins WHERE user_id = p_user_id AND content_id = p_content_id
  ) THEN 200 ELSE 0 END INTO v_pin_points;

  -- Comment points (10 per net upvote)
  SELECT COALESCE(SUM(GREATEST(upvotes - downvotes, 0) * 10), 0) INTO v_comment_points
  FROM comments
  WHERE user_id = p_user_id AND content_id = p_content_id;

  -- Referral points (500 per conversion)
  SELECT COUNT(*) * 500 INTO v_referral_points
  FROM referral_clicks
  WHERE referrer_id = p_user_id
    AND content_id = p_content_id
    AND converted_user_id IS NOT NULL;

  -- Calculate total
  v_total := v_view_points + v_tip_points + v_pin_points + v_comment_points + v_referral_points;

  -- Upsert leaderboard score
  INSERT INTO leaderboard_scores (user_id, content_id, score, breakdown, updated_at)
  VALUES (
    p_user_id,
    p_content_id,
    v_total,
    jsonb_build_object(
      'views', v_view_points,
      'tips', v_tip_points,
      'pin', v_pin_points,
      'comments', v_comment_points,
      'referrals', v_referral_points
    ),
    NOW()
  )
  ON CONFLICT (user_id, content_id) DO UPDATE SET
    score = EXCLUDED.score,
    breakdown = EXCLUDED.breakdown,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update content view count
CREATE OR REPLACE FUNCTION update_content_view_count() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed AND (OLD IS NULL OR NOT OLD.completed) THEN
    UPDATE content SET view_count = view_count + 1 WHERE id = NEW.content_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_content_view_count
AFTER INSERT OR UPDATE ON content_views
FOR EACH ROW EXECUTE FUNCTION update_content_view_count();

-- Trigger to update content tip total
CREATE OR REPLACE FUNCTION update_content_tip_total() RETURNS TRIGGER AS $$
BEGIN
  UPDATE content SET tip_total_cents = tip_total_cents + NEW.amount_cents WHERE id = NEW.content_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_content_tip_total
AFTER INSERT ON tips
FOR EACH ROW EXECUTE FUNCTION update_content_tip_total();

-- Trigger to update comment vote counts
CREATE OR REPLACE FUNCTION update_comment_votes() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote = 1 THEN
      UPDATE comments SET upvotes = upvotes + 1 WHERE id = NEW.comment_id;
    ELSE
      UPDATE comments SET downvotes = downvotes + 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote = 1 THEN
      UPDATE comments SET upvotes = upvotes - 1 WHERE id = OLD.comment_id;
    ELSE
      UPDATE comments SET downvotes = downvotes - 1 WHERE id = OLD.comment_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.vote != NEW.vote THEN
    IF NEW.vote = 1 THEN
      UPDATE comments SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = NEW.comment_id;
    ELSE
      UPDATE comments SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = NEW.comment_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_votes
AFTER INSERT OR UPDATE OR DELETE ON comment_votes
FOR EACH ROW EXECUTE FUNCTION update_comment_votes();

-- Row Level Security Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;

-- Users: Anyone can read, users can update their own
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = privy_id);

-- Content: Published content viewable by subscribers, creators can manage their own
CREATE POLICY "Published content viewable by all" ON content FOR SELECT USING (published_at IS NOT NULL);
CREATE POLICY "Creators can manage own content" ON content FOR ALL USING (creator_id IN (SELECT id FROM users WHERE privy_id = auth.uid()::text));

-- Series: Same as content
CREATE POLICY "Series viewable by all" ON series FOR SELECT USING (true);
CREATE POLICY "Creators can manage own series" ON series FOR ALL USING (creator_id IN (SELECT id FROM users WHERE privy_id = auth.uid()::text));

-- Content views: Users can read/write their own
CREATE POLICY "Users can manage own views" ON content_views FOR ALL USING (user_id IN (SELECT id FROM users WHERE privy_id = auth.uid()::text));

-- Tips: Users can read all, write their own
CREATE POLICY "Tips are viewable by all" ON tips FOR SELECT USING (true);
CREATE POLICY "Users can create tips" ON tips FOR INSERT WITH CHECK (from_user_id IN (SELECT id FROM users WHERE privy_id = auth.uid()::text));

-- Comments: Viewable by all, users can manage their own
CREATE POLICY "Comments viewable by all" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can manage own comments" ON comments FOR ALL USING (user_id IN (SELECT id FROM users WHERE privy_id = auth.uid()::text));

-- Comment votes: Users can manage their own
CREATE POLICY "Users can manage own votes" ON comment_votes FOR ALL USING (user_id IN (SELECT id FROM users WHERE privy_id = auth.uid()::text));

-- User pins: Users can manage their own, viewable by all
CREATE POLICY "Pins viewable by all" ON user_pins FOR SELECT USING (true);
CREATE POLICY "Users can manage own pins" ON user_pins FOR ALL USING (user_id IN (SELECT id FROM users WHERE privy_id = auth.uid()::text));

-- Leaderboard: Viewable by all
CREATE POLICY "Leaderboard viewable by all" ON leaderboard_scores FOR SELECT USING (true);

-- Referrals: Users can read their own referrals
CREATE POLICY "Users can view own referrals" ON referral_clicks FOR SELECT USING (referrer_id IN (SELECT id FROM users WHERE privy_id = auth.uid()::text));
CREATE POLICY "Anyone can create referral click" ON referral_clicks FOR INSERT WITH CHECK (true);
