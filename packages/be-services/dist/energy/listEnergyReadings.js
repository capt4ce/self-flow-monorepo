"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEnergyReadings = listEnergyReadings;
const db_1 = require("@self-flow/db");
const schema_1 = require("@self-flow/db/src/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
async function listEnergyReadings(userId) {
    const db = (0, db_1.getDb)();
    const readings = await db
        .select()
        .from(schema_1.energyReadings)
        .where((0, drizzle_orm_1.eq)(schema_1.energyReadings.userId, userId))
        .orderBy(schema_1.energyReadings.timestamp);
    return readings;
}
