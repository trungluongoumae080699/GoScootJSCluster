import { BikeStatus, BikeUpdate, OperationStatus } from "@trungthao/admin_dashboard_dto";
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

type FetchBikeUpdatesFilter = {
    battery?: number;
    operationStatus?: OperationStatus;
    bikeStatus?: BikeStatus;   // ✅ NEW
};

function mapBikeStatus(value?: string): BikeStatus | null {
    const code = Number(value);
    if (Number.isNaN(code)) return null;

    switch (code) {
        case 0:
            return BikeStatus.IDLE;
        case 1:
            return BikeStatus.RESERVED;
        case 2:
            return BikeStatus.INUSED;
        default:
            return null;
    }
}

function mapOperationStatus(value?: string): OperationStatus | null {
    const code = Number(value);
    if (Number.isNaN(code)) return null;

    switch (code) {
        case 0:
            return OperationStatus.NORMAL;
        case 1:
            return OperationStatus.OUT_OF_BOUND;
        case 2:
            return OperationStatus.LOW_BATTERY;
        default:
            return null;
    }
}


export const fetchBikeUpdates = async (
    options?: {
        battery?: number;
        operationStatus?: OperationStatus;
        bikeStatus?: BikeStatus;
    }
): Promise<BikeUpdate[]> => {
    const matched: BikeUpdate[] = [];
    let cursor = 0;

    do {
        const scanResult = await redisClient.scan(cursor, {
            MATCH: "bike:*:telemetry",
            COUNT: 100,
        });

        cursor = Number(scanResult.cursor);
        const keys = scanResult.keys;

        if (keys.length === 0) continue;

        const hashes = await Promise.all(
            keys.map((k) => redisClient.hGetAll(k))
        );

        hashes.forEach((hash, index) => {
            if (!hash) return;

            const key = keys[index]; // bike:{id}:telemetry
            const parts = key.split(":");
            if (parts.length < 3) return;

            const id = parts[1];

            const battery_status = Number(hash.battery_status);
            const longitude = Number(hash.longitude);
            const latitude = Number(hash.latitude);

            const operationStatus = mapOperationStatus(hash.operation_state);
            const usageStatus = mapBikeStatus(hash.usage_state);

            const currentHub = hash.current_hub ?? null;

            // ---------- FILTERS ----------
            if (
                options?.battery !== undefined &&
                (!Number.isFinite(battery_status) || battery_status > options.battery)
            ) {
                return;
            }

            if (
                options?.operationStatus !== undefined &&
                operationStatus !== options.operationStatus
            ) {
                return;
            }

            if (
                options?.bikeStatus !== undefined &&
                usageStatus !== options.bikeStatus
            ) {
                return;
            }

            if (operationStatus === null || usageStatus === null) {
                return; // bỏ record Redis bị lỗi / không hợp lệ
            }

            // ---------- PUSH RESULT ----------
            matched.push({
                id,
                battery_status,
                longitude,
                latitude,
                operationStatus, // ✅ from Redis document
                usageStatus,     // ✅ from Redis document
                currentHub
            });
        });
    } while (cursor !== 0);

    return matched;
};