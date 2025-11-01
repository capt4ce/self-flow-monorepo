-- Add foreign key constraint: system.creator_id references auth.users(id)
ALTER TABLE
    "system"
ADD
    CONSTRAINT "system_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;