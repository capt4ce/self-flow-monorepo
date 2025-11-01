-- Add missing columns to users table
ALTER TABLE
    "users"
ADD
    COLUMN "email" text;

--> statement-breakpoint
ALTER TABLE
    "users"
ADD
    COLUMN "created_at" timestamp with time zone DEFAULT now();

--> statement-breakpoint
ALTER TABLE
    "users"
ADD
    COLUMN "updated_at" timestamp with time zone DEFAULT now();