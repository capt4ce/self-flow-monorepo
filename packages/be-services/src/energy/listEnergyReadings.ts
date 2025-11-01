import { db } from "@self-flow/db";
import { energyReadings } from "@self-flow/db/src/drizzle/schema";
import { eq } from "drizzle-orm";
import { EnergyReadingDTO } from "@self-flow/common/types";

export async function listEnergyReadings(userId: string) {
  const readings = await db
    .select()
    .from(energyReadings)
    .where(eq(energyReadings.userId, userId))
    .orderBy(energyReadings.timestamp);

  return readings as EnergyReadingDTO[];
}


