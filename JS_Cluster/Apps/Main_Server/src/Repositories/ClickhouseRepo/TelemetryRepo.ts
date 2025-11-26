import { BikeTelemetry } from "@trungthao/admin_dashboard_dto";
import { clickhouse } from "../../ClickHouseConfig.js";
import { GetBikeTelemetryOptions, GetBikeTelemetryResult } from "../../Controllers/DashboardController.js";

export async function getBikeTelemetry(
  options: GetBikeTelemetryOptions
): Promise<GetBikeTelemetryResult> {
  const {
    bikeId,
    from,
    to,
    page = 1,
    pageSize = 50,
    sortDirection = "desc",
  } = options;

  if (!bikeId) {
    throw new Error("bikeId is required");
  }

  const safePage = Math.max(Number(page) || 1, 1);
  const safePageSize = Math.max(Number(pageSize) || 1, 1);
  const offset = (safePage - 1) * safePageSize;

  const whereClauses: string[] = ["bike_id = {bike_id:String}"];
  const queryParams: Record<string, string | number> = {
    bike_id: bikeId,
  };

  if (typeof from === "number") {
    whereClauses.push("time >= {from:UInt64}");
    queryParams.from = from;
  }

  if (typeof to === "number") {
    whereClauses.push("time <= {to:UInt64}");
    queryParams.to = to;
  }

  const whereSql =
    whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

  const orderDir = sortDirection.toLowerCase() === "asc" ? "ASC" : "DESC";

  // ---------- 1) COUNT query ----------
  const countQuery = `
    SELECT count() AS total
    FROM telemetry
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
    return {
      data: [],
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages,
    };
  }

  // ---------- 2) DATA query ----------
  const dataQuery = `
    SELECT
      id,
      bike_id,
      battery_status,
      longitude,
      latitude,
      time
    FROM telemetry
    ${whereSql}
    ORDER BY time ${orderDir}
    LIMIT {limit:UInt32} OFFSET {offset:UInt64}
  `;

  const dataResult = await clickhouse.query({
    query: dataQuery,
    format: "JSONEachRow",
    query_params: {
      ...queryParams,
      limit: safePageSize,
      offset,
    },
  });

  const rows = (await dataResult.json()) as {
    id: string;
    bike_id: string;
    battery: number;
    longitude: number;
    latitude: number;
    time: number | string;
  }[];

  const data: BikeTelemetry[] = rows.map((row) => ({
    id: row.id,
    bike_id: row.bike_id,
    battery: Number(row.battery),
    longitude: Number(row.longitude),
    latitude: Number(row.latitude),
    time: Number(row.time),
  }));

  return {
    data,
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages,
  };
}