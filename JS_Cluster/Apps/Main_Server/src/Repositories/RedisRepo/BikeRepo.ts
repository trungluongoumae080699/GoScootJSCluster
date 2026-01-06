import { BikeStatus, BikeUpdate, OperationStatus } from "@trungthao/admin_dashboard_dto";
import { redisClient } from "../../RedisConfig.js";
import { AlertType } from "../../../../../Packages/Admin_Dashboard_DTO/dist/Models/Alerts.js";
export type BikeIdsAndBatteries = {
    id: string;
    battery: number;
};

const toBool01 = (v: any): boolean => {
    if (v === undefined || v === null) return false;
    if (typeof v === "boolean") return v;
    const s = String(v).trim().toLowerCase();
    return s === "1" || s === "true";
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

/* 
export const fetchBikeUpdates = async (
    options?: {
        battery?: number;
        // operationStatus removed because redis no longer has operation_state
        bikeStatus?: BikeStatus; // optional: if you still want it, map below
        usageStatus?: string;    // optional: direct string filter
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

        const hashes = await Promise.all(keys.map((k) => redisClient.hGetAll(k)));

        hashes.forEach((hash, index) => {
            if (!hash || Object.keys(hash).length === 0) return;

            const key = keys[index]; // bike:{id}:telemetry
            const parts = key.split(":");
            if (parts.length !== 3) return;

            const id = parts[1];

            const battery_status = Number(hash.battery_status ?? "0");
            const longitude = Number(hash.longitude ?? "0");
            const latitude = Number(hash.latitude ?? "0");
            const batteryIsLow = toBool01(hash.battery_is_low);
            const isToppled = toBool01(hash.is_toppled);
            const isCrashed = toBool01(hash.is_crashed);
            const isOutOfBound = toBool01(hash.is_out_of_bound);

            // usage_state is now a STRING in redis
            const usageStatusStr: string = (hash.usage_state ?? "").toString();

            // ---------- FILTERS ----------
            if (
                options?.battery !== undefined &&
                (!Number.isFinite(battery_status) || battery_status > options.battery)
            ) {
                return;
            }

            // Optional direct string filter
            if (
                options?.usageStatus !== undefined &&
                usageStatusStr !== options.usageStatus
            ) {
                return;
            }

            // Optional: if you still pass BikeStatus enum, you must map it to string
            // Example mapping (adjust to your real BikeStatus values)
            if (options?.bikeStatus !== undefined) {
                const expected = String(options.bikeStatus); // or a mapBikeStatusToString(options.bikeStatus)
                if (usageStatusStr !== expected) return;
            }

            // ---------- PUSH RESULT ----------
            matched.push({
                id,
                battery_status,
                longitude,
                latitude,
                batteryIsLow,
                isToppled,
                isCrashed,
                isOutOfBound,
                usageStatus: usageStatusStr as BikeStatus,
                currentHub: hash.current_hub ?? null,
            });
        });
    } while (cursor !== 0);

    return matched;
}; */

export const fetchBikeUpdates = async (
  options?: {
    battery?: number;
    bikeStatus?: BikeStatus;
    usageStatus?: string;
    alertType?: AlertType; // ✅ NEW
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

    const hashes = await Promise.all(keys.map((k) => redisClient.hGetAll(k)));

    hashes.forEach((hash, index) => {
      if (!hash || Object.keys(hash).length === 0) return;

      const key = keys[index]; // bike:{id}:telemetry
      const parts = key.split(":");
      if (parts.length !== 3) return;

      const id = parts[1];

      const battery_status = Number(hash.battery_status ?? "0");
      const longitude = Number(hash.longitude ?? "0");
      const latitude = Number(hash.latitude ?? "0");

      const batteryIsLow = toBool01(hash.battery_is_low);
      const isToppled = toBool01(hash.is_toppled);
      const isCrashed = toBool01(hash.is_crashed);
      const isOutOfBound = toBool01(hash.is_out_of_bound);

      const usageStatusStr: string = (hash.usage_state ?? "").toString();

      // ---------- FILTERS ----------
      if (
        options?.battery !== undefined &&
        (!Number.isFinite(battery_status) || battery_status > options.battery)
      ) {
        return;
      }

      if (options?.usageStatus !== undefined && usageStatusStr !== options.usageStatus) {
        return;
      }

      if (options?.bikeStatus !== undefined) {
        const expected = String(options.bikeStatus); // hoặc map nếu cần
        if (usageStatusStr !== expected) return;
      }

      // ✅ NEW: filter by alertType (optional)
      if (options?.alertType !== undefined) {
        const pass =
          (options.alertType === AlertType.LOW_BATTERY && batteryIsLow) ||
          (options.alertType === AlertType.TOPPLE && isToppled) ||
          (options.alertType === AlertType.CRASH && isCrashed) ||
          (options.alertType === AlertType.BOUNDARY_CROSS && isOutOfBound);

        if (!pass) return;
      }

      // ---------- PUSH RESULT ----------
      matched.push({
        id,
        battery_status,
        longitude,
        latitude,
        batteryIsLow,
        isToppled,
        isCrashed,
        isOutOfBound,
        usageStatus: usageStatusStr as BikeStatus,
        currentHub: (hash as any).current_hub ?? null, // giữ theo code bạn
      });
    });
  } while (cursor !== 0);

  return matched;
};


type TeleHash = Record<string, string>; // hGetAll result

export async function fetchBikeUpdatesByIds(
    redisClient: any,
    bikeIds: string[],
    batchSize = 200
): Promise<Map<string, BikeUpdate>> {
    const result = new Map<string, BikeUpdate>();
    if (!bikeIds.length) return result;

    for (let i = 0; i < bikeIds.length; i += batchSize) {
        const chunk = bikeIds.slice(i, i + batchSize);

        const multi = redisClient.multi();
        for (const id of chunk) {
            multi.hGetAll(`bike:${id}:telemetry`);
        }

        // node-redis v4: exec() trả array các results theo thứ tự
        const replies: TeleHash[] = await multi.exec();

        for (let j = 0; j < chunk.length; j++) {
            const id = chunk[j];
            const tele = replies[j];

            if (!tele || Object.keys(tele).length === 0) continue;

            const operationStatus = mapOperationStatus(tele.operation_state);
            const usageStatus = tele.usage_state as BikeStatus

            result.set(id, {
                id,
                battery_status: Number(tele.battery_status ?? "0"),
                longitude: Number(tele.longitude ?? "0"),
                latitude: Number(tele.latitude ?? "0"),
                batteryIsLow: toBool01(tele.battery_is_low),
                isToppled: toBool01(tele.is_toppled),
                isCrashed: toBool01(tele.is_crashed),
                isOutOfBound: toBool01(tele.is_out_of_bound),
                usageStatus,
                currentHub: tele.current_hub ?? null,
            });
        }
    }

    return result;
}

export async function fetchBikeUpdateById(
    redisClient: any,
    bikeId: string
): Promise<BikeUpdate | null> {
    // Direct fetch — no MULTI needed for one key
    const tele: TeleHash = await redisClient.hGetAll(`bike:${bikeId}:telemetry`);

    if (!tele || Object.keys(tele).length === 0) {
        return null;
    }
    const usageStatus = tele.usage_state as BikeStatus;
    return {
        id: bikeId,
        battery_status: Number(tele.battery_status ?? "0"),
        longitude: Number(tele.longitude ?? "0"),
        latitude: Number(tele.latitude ?? "0"),
        batteryIsLow: toBool01(tele.battery_is_low),
        isToppled: toBool01(tele.is_toppled),
        isCrashed: toBool01(tele.is_crashed),
        isOutOfBound: toBool01(tele.is_out_of_bound),
        usageStatus,
        currentHub: tele.current_hub ?? null,
    };
}