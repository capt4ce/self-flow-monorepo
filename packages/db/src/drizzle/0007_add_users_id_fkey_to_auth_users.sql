-- Add foreign key constraint: users.id references auth.users(id)
ALTER TABLE
    "users"
ADD
    CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;