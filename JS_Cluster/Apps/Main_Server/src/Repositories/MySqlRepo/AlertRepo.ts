import { RowDataPacket } from "mysql2";
import { pool } from "../../MySqlConfig.js";
import { SortDirection } from "../../Controllers/DashboardController.js";
import { Response_DashboardGetAlertsDTO } from "@trungthao/admin_dashboard_dto";



export interface Alert {
  id: string;
  bike_id: string;
  content: string;
  type: string;
  longitude: number;
  latitude: number;
  time: number;
}

interface AlertRow extends RowDataPacket {
  id: string;
  bike_id: string;
  content: string;
  type: string;
  longitude: number;
  latitude: number;
  time: number;
}
interface CountRow extends RowDataPacket {
  total: number;
}

export interface GetAlertsOptions {
  bikeId?: string;          // optional if later you want per-bike alerts
  from?: number;            // time >= from  (BIGINT)
  to?: number;              // time <= to    (BIGINT)
  sortDirection?: SortDirection; // "asc" | "desc", default "desc" (latest first)
  page?: number;            // default: 1
  pageSize?: number;        // default: 10, max: 10
}



/**
 * Returns a paginated list of alerts (max 10 per page),
 * optionally filtered by time range and bike_id,
 * sorted by time ASC/DESC.
 */
export async function getAlerts(
  options: GetAlertsOptions = {}
): Promise<Response_DashboardGetAlertsDTO> {
  const {
    bikeId,
    from,
    to,
    sortDirection = "desc",
    page = 1,
    pageSize = 10,
  } = options;

  const safePage = Math.max(Number(page) || 1, 1);
  const safePageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 10); // max 10
  const offset = (safePage - 1) * safePageSize;

  const conditions: string[] = [];
  const params: any[] = [];

  if (bikeId) {
    conditions.push("bike_id = ?");
    params.push(bikeId);
  }

  if (from !== undefined) {
    conditions.push("time >= ?");
    params.push(from);
  }

  if (to !== undefined) {
    conditions.push("time <= ?");
    params.push(to);
  }

  let whereClause = "";
  if (conditions.length > 0) {
    whereClause = " WHERE " + conditions.join(" AND ");
  }

  // ---- 1) Count total ----
  const countSql = `
    SELECT COUNT(*) AS total
    FROM alerts
    ${whereClause}
  `;
  const [countRows] = await pool.query<CountRow[]>(countSql, params);
  const total = countRows[0]?.total ?? 0;
  const totalPages = total === 0 ? 0 : Math.ceil(total / safePageSize);

  // If no records, short-circuit
  if (total === 0) {
    return {
      alerts: [],
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages,
    };
  }

  // ---- 2) Fetch page ----
  const dataSql = `
    SELECT
      id,
      bike_id,
      content,
      type,
      longitude,
      latitude,
      time
    FROM alerts
    ${whereClause}
    ORDER BY time ${sortDirection === "asc" ? "ASC" : "DESC"}
    LIMIT ? OFFSET ?
  `;

  const dataParams = [...params, safePageSize, offset];

  const [rows] = await pool.query<AlertRow[]>(dataSql, dataParams);

  const alerts: Alert[] = rows.map((row) => ({
    id: row.id,
    bike_id: row.bike_id,
    content: row.content,
    type: row.type,
    longitude: Number(row.longitude),
    latitude: Number(row.latitude),
    time: Number(row.time),
  }));

  return {
    alerts,
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages,
  };
}