-- Disable Row Level Security on tables that need foreign key changes
ALTER TABLE
    "assign_history" DISABLE ROW LEVEL SECURITY;

--> statement-breakpoint
ALTER TABLE
    "system" DISABLE ROW LEVEL SECURITY;

--> statement-breakpoint
ALTER TABLE
    "system_users" DISABLE ROW LEVEL SECURITY;

--> statement-breakpoint
ALTER TABLE
    "users" DISABLE ROW LEVEL SECURITY;