-- Drop system_creator_id_fkey to prepare for updating foreign key reference
ALTER TABLE
    "system" DROP CONSTRAINT "system_creator_id_fkey";