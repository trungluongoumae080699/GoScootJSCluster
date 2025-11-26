import { redisClient } from "../../RedisConfig.js";
export type BikeIdsAndBatteries = {
    id: string;
    battery: number;
};


export const fetchBikeIdsAndBatteries = async (
    battery: number
): Promise<BikeIdsAndBatteries[]> => {
    const maxBattery = Number(battery);

    const matched: { id: string; battery_status: number }[] = [];
    let cursor = 0;

    do {
        // SCAN for telemetry keys
        const scanResult = await redisClient.scan(cursor, {
            MATCH: "bike:*:telemetry",
            COUNT: 100,
        });

        cursor = Number(scanResult.cursor);
        const keys = scanResult.keys;

        if (keys.length === 0) continue;

        // Fetch hash fields
        const hashes = await Promise.all(
            keys.map((k) => redisClient.hGetAll(k))
        );

        hashes.forEach((hash, index) => {
            if (!hash) return;

            const key = keys[index]; // e.g. bike:123:telemetry
            const parts = key.split(":");
            if (parts.length < 3) return;

            const id = parts[1];
            const batteryStatus = Number(hash.battery_status ?? "0");

            if (!Number.isNaN(batteryStatus) && batteryStatus <= maxBattery) {
                matched.push({
                    id,
                    battery_status: batteryStatus,
                });
            }
        });
    } while (cursor !== 0);

    // Sort by lowest battery first
    matched.sort((a, b) => a.battery_status - b.battery_status);

    // Convert to final type
    return matched.map(({ id, battery_status }) => ({
        id,
        battery: battery_status,
    }));
};