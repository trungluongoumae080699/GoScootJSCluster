import { BikeTelemetry } from "@trungthao/admin_dashboard_dto";
import { clickhouse } from "../../ClickHouseConfig.js";
import { GetBikeTelemetryOptions, GetBikeTelemetryResult } from "../../Controllers/DashboardController.js";


export async function getBikeTelemetry(
  options: GetBikeTelemetryOptions
): Promise<GetBikeTelemetryResult> {
  const { bikeId, from, to, page, pageSize, sortDirection = "desc" } = options;

  if (!bikeId) throw new Error("bikeId is required");

  const safePage = Math.max(Number(page) || 1, 1);
  const safePageSize = Math.max(Number(pageSize) || 100, 1); // ✅ allow smaller than 100
  const offset = (safePage - 1) * safePageSize;

  const whereClauses: string[] = ["bike_id = {bike_id:String}"];
  const queryParams: Record<string, string | number> = { bike_id: bikeId };

  if (typeof from === "number") {
    whereClauses.push("time >= {from:UInt64}");
    queryParams.from = from;
  }
  if (typeof to === "number") {
    whereClauses.push("time <= {to:UInt64}");
    queryParams.to = to;
  }

  const whereSql = "WHERE " + whereClauses.join(" AND ");
  const orderDir = sortDirection.toLowerCase() === "asc" ? "ASC" : "DESC";

  // ---------- 1) COUNT ----------
  const countQuery = `
    SELECT count() AS total
    FROM bikerental.telemetry
    ${whereSql}
  `;

  const countResult = await clickhouse.query({
    query: countQuery,
    format: "JSONEachRow",
    query_params: queryParams,
  });

  const countRows = (await countResult.json()) as { total: string }[];
  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = total === 0 ? 0 : Math.ceil(total / safePageSize);

  if (total === 0) {
    return { data: [], page: safePage, pageSize: safePageSize, total, totalPages };
  }

  // ---------- 2) DATA ----------
  const dataQuery = `
    SELECT
      id,
      bike_id,
      battery_status,
      longitude,
      latitude,
      time,
      last_gps_long,
      last_gps_lat,
      last_gps_contact_time,
      battery_is_low,
      is_out_of_bound,
      is_crashed,
      is_toppled,
      usage_status
    FROM bikerental.telemetry
    ${whereSql}
    ORDER BY time ${orderDir}
    LIMIT {limit:UInt32} OFFSET {offset:UInt64}
  `;

  const dataResult = await clickhouse.query({
    query: dataQuery,
    format: "JSONEachRow",
    query_params: { ...queryParams, limit: safePageSize, offset },
  });

  const rows = (await dataResult.json()) as {
    id: string;
    bike_id: string;
    battery_status: number | string;
    longitude: number | string;
    latitude: number | string;
    time: number | string;
    last_gps_long: number | string;
    last_gps_lat: number | string;
    last_gps_contact_time: number | string;

    battery_is_low: number | string | boolean;
    is_out_of_bound: number | string | boolean;
    is_crashed: number | string | boolean;
    is_toppled: number | string | boolean;

    usage_status: string; // Enum8 comes back as string label in JSON
  }[];

  const toBool01 = (v: any) => {
    if (typeof v === "boolean") return v;
    const s = String(v).trim().toLowerCase();
    return s === "1" || s === "true";
  };

  const data: BikeTelemetry[] = rows.map((row) => ({
    id: row.id,
    bike_id: row.bike_id,
    battery: Number(row.battery_status),
    longitude: Number(row.longitude),
    latitude: Number(row.latitude),
    time: Number(row.time),
    last_gps_long: Number(row.last_gps_long),
    last_gps_lat: Number(row.last_gps_lat),
    last_gps_contact_time: Number(row.last_gps_contact_time),

    batteryIsLow: toBool01(row.battery_is_low),
    isOutOfBound: toBool01(row.is_out_of_bound),
    isCrashed: toBool01(row.is_crashed),
    isToppled: toBool01(row.is_toppled),

    usageStatus: row.usage_status as BikeTelemetry["usageStatus"],
  }));

  return {
    data,
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages,
  };
}