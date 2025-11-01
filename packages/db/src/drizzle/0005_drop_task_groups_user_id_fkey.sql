-- Drop task_groups_user_id_fkey to prepare for updating foreign key reference
ALTER TABLE
    "task_groups" DROP CONSTRAINT "task_groups_user_id_fkey";