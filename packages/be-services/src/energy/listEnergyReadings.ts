import { getDb } from "@self-flow/db";
import { energyReadings } from "@self-flow/db/src/drizzle/schema";
import { eq } from "drizzle-orm";
import { EnergyReadingDTO } from "@self-flow/common/types";

type Env = {
  DATABASE_URL?: string;
};

export async function listEnergyReadings(userId: string, env?: Env) {
  const db = getDb(env);
  const readings = await db
    .select()
    .from(energyReadings)
    .where(eq(energyReadings.userId, userId))
    .orderBy(energyReadings.timestamp);

  return readings as EnergyReadingDTO[];
}


