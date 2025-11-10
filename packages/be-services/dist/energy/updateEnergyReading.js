"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEnergyReading = updateEnergyReading;
const db_1 = require("@self-flow/db");
const schema_1 = require("@self-flow/db/src/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
async function updateEnergyReading(userId, readingId, data) {
    const db = (0, db_1.getDb)();
    const updateData = {};
    if (data.level !== undefined)
        updateData.level = data.level;
    if (data.note !== undefined)
        updateData.note = data.note || null;
    if (data.timestamp !== undefined)
        updateData.timestamp = data.timestamp;
    const [reading] = await db
        .update(schema_1.energyReadings)
        .set(updateData)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.energyReadings.id, readingId), (0, drizzle_orm_1.eq)(schema_1.energyReadings.userId, userId)))
        .returning();
    if (!reading) {
        throw new Error("Energy reading not found");
    }
    return reading;
}
