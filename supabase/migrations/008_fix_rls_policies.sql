-- Fix RLS policies: auth.uid() is always null because app uses Coinbase Smart Wallet (wagmi),
-- not Supabase Auth. All authentication is handled at the application level via wallet signatures.
-- RLS policies need to be permissive since there is no Supabase Auth session.

-- Fix spend_permissions (previously used auth.uid() = user_id which was always null)
DROP POLICY IF EXISTS "Users can view own permissions" ON spend_permissions;
DROP POLICY IF EXISTS "Users can insert own permissions" ON spend_permissions;
DROP POLICY IF EXISTS "Users can revoke own permissions" ON spend_permissions;

CREATE POLICY "Permissions viewable by all" ON spend_permissions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert permissions" ON spend_permissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update permissions" ON spend_permissions FOR UPDATE USING (true);

-- Fix comments (previously used auth.uid()::text in FOR ALL policy)
DROP POLICY IF EXISTS "Users can manage own comments" ON comments;
CREATE POLICY "Anyone can insert comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update comments" ON comments FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete comments" ON comments FOR DELETE USING (true);

-- Fix comment_votes (previously used auth.uid()::text in FOR ALL policy)
DROP POLICY IF EXISTS "Users can manage own votes" ON comment_votes;
CREATE POLICY "Votes viewable by all" ON comment_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert votes" ON comment_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update votes" ON comment_votes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete votes" ON comment_votes FOR DELETE USING (true);

-- Fix content_views (previously used auth.uid()::text in FOR ALL policy)
DROP POLICY IF EXISTS "Users can manage own views" ON content_views;
CREATE POLICY "Views viewable by all" ON content_views FOR SELECT USING (true);
CREATE POLICY "Anyone can insert views" ON content_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update views" ON content_views FOR UPDATE USING (true);

-- Fix user_pins (previously used auth.uid()::text in FOR ALL policy)
DROP POLICY IF EXISTS "Users can manage own pins" ON user_pins;
CREATE POLICY "Anyone can insert pins" ON user_pins FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete pins" ON user_pins FOR DELETE USING (true);
