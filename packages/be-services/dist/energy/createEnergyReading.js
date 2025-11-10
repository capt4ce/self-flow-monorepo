"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEnergyReading = createEnergyReading;
const db_1 = require("@self-flow/db");
const schema_1 = require("@self-flow/db/src/drizzle/schema");
async function createEnergyReading(userId, data) {
    const db = (0, db_1.getDb)();
    const [reading] = await db
        .insert(schema_1.energyReadings)
        .values({
        userId,
        level: data.level,
        note: data.note || null,
        timestamp: data.timestamp,
    })
        .returning();
    return reading;
}
