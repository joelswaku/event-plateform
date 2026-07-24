-- Make joelswaku@gmail.com a super admin
UPDATE users
SET is_super_admin = true
WHERE email = 'joelswaku@gmail.com';

-- Verify the change
SELECT id, email, full_name, is_super_admin
FROM users
WHERE email = 'joelswaku@gmail.com';
