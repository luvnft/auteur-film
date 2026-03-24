-- Create RPC functions for updating comment vote counts

-- Increment upvotes
CREATE OR REPLACE FUNCTION increment_comment_upvotes(comment_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE comments
  SET upvotes = COALESCE(upvotes, 0) + 1
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement upvotes
CREATE OR REPLACE FUNCTION decrement_comment_upvotes(comment_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE comments
  SET upvotes = GREATEST(COALESCE(upvotes, 0) - 1, 0)
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment downvotes
CREATE OR REPLACE FUNCTION increment_comment_downvotes(comment_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE comments
  SET downvotes = COALESCE(downvotes, 0) + 1
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement downvotes
CREATE OR REPLACE FUNCTION decrement_comment_downvotes(comment_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE comments
  SET downvotes = GREATEST(COALESCE(downvotes, 0) - 1, 0)
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure upvotes and downvotes columns have default values
ALTER TABLE comments ALTER COLUMN upvotes SET DEFAULT 0;
ALTER TABLE comments ALTER COLUMN downvotes SET DEFAULT 0;

-- Update any null values to 0
UPDATE comments SET upvotes = 0 WHERE upvotes IS NULL;
UPDATE comments SET downvotes = 0 WHERE downvotes IS NULL;
