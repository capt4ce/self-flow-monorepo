import { getDb } from "@self-flow/db";
import { energyReadings } from "@self-flow/db/src/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { UpdateEnergyReadingDTO, EnergyReadingDTO } from "@self-flow/common/types";

export async function updateEnergyReading(
  userId: string,
  readingId: string,
  data: UpdateEnergyReadingDTO
): Promise<EnergyReadingDTO> {
  const db = getDb();
  const updateData: any = {};

  if (data.level !== undefined) updateData.level = data.level;
  if (data.note !== undefined) updateData.note = data.note || null;
  if (data.timestamp !== undefined) updateData.timestamp = data.timestamp;

  const [reading] = await db
    .update(energyReadings)
    .set(updateData)
    .where(and(eq(energyReadings.id, readingId), eq(energyReadings.userId, userId)))
    .returning();

  if (!reading) {
    throw new Error("Energy reading not found");
  }

  return reading as EnergyReadingDTO;
}


