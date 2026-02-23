-- RLS Policies: Restrict anon access; service role bypasses RLS
-- All data access goes through API routes using service role with Privy validation.
-- These policies lock down direct client access via anon key.

-- Users: No direct anon access (API uses service role)
CREATE POLICY "Service role only for users" ON users
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Transactions: No direct anon access
CREATE POLICY "Service role only for transactions" ON transactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Savings ledger: No direct anon access
CREATE POLICY "Service role only for savings_ledger" ON savings_ledger
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
