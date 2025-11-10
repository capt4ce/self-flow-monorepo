"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEnergyReading = deleteEnergyReading;
const db_1 = require("@self-flow/db");
const schema_1 = require("@self-flow/db/src/drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
async function deleteEnergyReading(userId, readingId) {
    const db = (0, db_1.getDb)();
    await db
        .delete(schema_1.energyReadings)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.energyReadings.id, readingId), (0, drizzle_orm_1.eq)(schema_1.energyReadings.userId, userId)));
}
