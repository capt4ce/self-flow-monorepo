-- Create Row Level Security policies for users table
CREATE POLICY "Users can update own profile" ON "users" AS PERMISSIVE FOR
UPDATE
    TO public USING ((auth.uid() = id));

--> statement-breakpoint
CREATE POLICY "Users can view own profile" ON "users" AS PERMISSIVE FOR
SELECT
    TO public;