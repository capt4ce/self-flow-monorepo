import { db } from "@self-flow/db";
import { energyReadings } from "@self-flow/db/src/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function deleteEnergyReading(
  userId: string,
  readingId: string
): Promise<void> {
  await db
    .delete(energyReadings)
    .where(and(eq(energyReadings.id, readingId), eq(energyReadings.userId, userId)));
}


