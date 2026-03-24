-- Spend Permissions table for Quick Tips
-- Stores signed EIP-712 permissions that allow the platform to execute tips on behalf of users

CREATE TABLE IF NOT EXISTS spend_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  wallet_address text NOT NULL,
  permission_data jsonb NOT NULL, -- Serialized SignedSpendPermission
  expires_at timestamp with time zone NOT NULL,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,

  -- Ensure one active permission per user
  CONSTRAINT unique_active_permission UNIQUE (user_id, revoked_at)
);

-- Index for quick lookups
CREATE INDEX idx_spend_permissions_user ON spend_permissions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_spend_permissions_wallet ON spend_permissions(wallet_address) WHERE revoked_at IS NULL;

-- Add quick_tips_enabled flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS quick_tips_enabled boolean DEFAULT false;

-- Function to get active permission for a user
CREATE OR REPLACE FUNCTION get_active_spend_permission(p_user_id uuid)
RETURNS spend_permissions AS $$
BEGIN
  RETURN (
    SELECT *
    FROM spend_permissions
    WHERE user_id = p_user_id
      AND revoked_at IS NULL
      AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies
ALTER TABLE spend_permissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own permissions
CREATE POLICY "Users can view own permissions"
  ON spend_permissions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own permissions
CREATE POLICY "Users can insert own permissions"
  ON spend_permissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update (revoke) their own permissions
CREATE POLICY "Users can revoke own permissions"
  ON spend_permissions FOR UPDATE
  USING (auth.uid() = user_id);
