import { getDb } from "@self-flow/db";
import { energyReadings } from "@self-flow/db/src/drizzle/schema";
import { CreateEnergyReadingDTO, EnergyReadingDTO } from "@self-flow/common/types";

type Env = {
  DATABASE_URL?: string;
};

export async function createEnergyReading(
  userId: string,
  data: CreateEnergyReadingDTO,
  env?: Env
): Promise<EnergyReadingDTO> {
  const db = getDb(env);
  const [reading] = await db
    .insert(energyReadings)
    .values({
      userId,
      level: data.level,
      note: data.note || null,
      timestamp: data.timestamp,
    })
    .returning();

  return reading as EnergyReadingDTO;
}


