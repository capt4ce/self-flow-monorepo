-- Drop users_id_fkey to prepare for updating foreign key reference
ALTER TABLE
    "users" DROP CONSTRAINT "users_id_fkey";