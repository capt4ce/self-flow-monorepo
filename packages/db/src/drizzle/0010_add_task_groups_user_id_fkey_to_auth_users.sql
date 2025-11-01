-- Add foreign key constraint: task_groups.user_id references auth.users(id)
ALTER TABLE
    "task_groups"
ADD
    CONSTRAINT "task_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;