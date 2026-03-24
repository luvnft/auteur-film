-- Add username field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS username text;

-- Create unique index for username (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (UPPER(username)) WHERE username IS NOT NULL;

-- Add comment
COMMENT ON COLUMN users.username IS 'Unique username for profile URL (case-insensitive)';
