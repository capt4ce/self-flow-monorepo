-- Add foreign key constraint: tasks.assignee_id references auth.users(id)

ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_assignee_id_fkey"
FOREIGN KEY ("assignee_id") REFERENCES "auth"."users"("id")
ON DELETE no action
ON UPDATE no action;

