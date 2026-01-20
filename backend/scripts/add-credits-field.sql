-- Add credits field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 5;

-- Update existing users to have 5 free trial credits if they don't have any
UPDATE users SET credits = 5 WHERE credits IS NULL OR credits = 0;

-- Create a function to add credits to a user
CREATE OR REPLACE FUNCTION add_credits_to_user(user_email TEXT, credit_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET credits = COALESCE(credits, 0) + credit_amount
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT add_credits_to_user('user@example.com', 10);

-- Check credits for a specific user:
-- SELECT email, credits FROM users WHERE email = 'user@example.com';
