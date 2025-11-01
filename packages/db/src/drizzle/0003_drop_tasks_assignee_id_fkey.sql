-- Drop tasks_assignee_id_fkey to prepare for updating foreign key reference
ALTER TABLE
    "tasks" DROP CONSTRAINT "tasks_assignee_id_fkey";