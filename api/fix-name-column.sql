-- Make name column nullable since full_name is the primary field
ALTER TABLE users ALTER COLUMN name DROP NOT NULL;

-- Set default for existing rows
UPDATE users SET name = full_name WHERE name IS NULL OR name = '';

SELECT 'name column fixed' as result;
