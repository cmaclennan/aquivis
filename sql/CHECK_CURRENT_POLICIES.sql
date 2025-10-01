-- Check what RLS policies are currently active on companies table
-- Run this in Supabase SQL Editor

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as "USING clause",
    with_check as "WITH CHECK clause"
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY policyname;

