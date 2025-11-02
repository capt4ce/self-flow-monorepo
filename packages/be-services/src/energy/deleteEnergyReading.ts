import { getDb } from "@self-flow/db";
import { energyReadings } from "@self-flow/db/src/drizzle/schema";
import { eq, and } from "drizzle-orm";

type Env = {
  DATABASE_URL?: string;
};

export async function deleteEnergyReading(
  userId: string,
  readingId: string,
  env?: Env
): Promise<void> {
  const db = getDb(env);
  await db
    .delete(energyReadings)
    .where(and(eq(energyReadings.id, readingId), eq(energyReadings.userId, userId)));
}


