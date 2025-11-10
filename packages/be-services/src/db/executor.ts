import type { getDb } from "@self-flow/db";

export type Database = ReturnType<typeof getDb>;
export type Transaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];
export type Executor = Transaction | Database;


