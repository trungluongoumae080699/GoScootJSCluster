import { RowDataPacket } from "mysql2";
import { pool } from "../../MySqlConfig.js";
import { SortDirection } from "../../Controllers/DashboardController.js";
import { Response_DashboardGetAlertsDTO } from "@trungthao/admin_dashboard_dto";
import { Alert, AlertType } from "../../../../../Packages/Admin_Dashboard_DTO/dist/Models/Alerts.js";

import { PoolConnection } from "mysql2/promise";

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
  search?: string;          // optional if later you want per-bike alerts
  from?: number;            // time >= from  (BIGINT)
  to?: number;              // time <= to    (BIGINT)
  page?: number;            // default: 1
  limit?: number;        // default: 10, max: 10
  type?: string
}


export async function getAlertMetadata(): Promise<number> {
  const [rows] = await pool.execute<CountRow[]>(
    `SELECT COUNT(*) AS total FROM alerts`
  );

  return Number(rows[0]?.total ?? 0)
}



/**
 * Returns a paginated list of alerts (max 10 per page),
 * optionally filtered by time range and bike_id,
 * sorted by time ASC/DESC.
 */

type AlertIdRow = RowDataPacket & { id: string };


export async function resolveAlertById(alertId: string): Promise<boolean> {
  let conn: PoolConnection | null = null;

  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 1) Lock row (row-level lock)
    const [rows] = await conn.execute<AlertIdRow[]>(
      `
      SELECT id
      FROM alerts
      WHERE id = ?
      FOR UPDATE
      `,
      [alertId]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return false;
    }

    // 2) Update
    const [result] = await conn.execute<import("mysql2/promise").ResultSetHeader>(
      `
      UPDATE alerts
      SET isResolved = TRUE
      WHERE id = ?
      `,
      [alertId]
    );

    await conn.commit();
    return result.affectedRows > 0;
  } catch (err) {
    if (conn) await conn.rollback();
    throw err;
  } finally {
    if (conn) conn.release();
  }
}



export async function getAlerts(
  options: GetAlertsOptions = {}
): Promise<Response_DashboardGetAlertsDTO> {
  const {
    search,
    from,
    type,
    to,
    page,
    limit,
  } = options;

  const safePage = Math.max(page || 1, 1);
  const safePageSize = Math.max(limit || 10, 10);
  const offset = (safePage - 1) * safePageSize;

  const conditions: string[] = [];
  const params: any[] = [];

  // 🔒 ALWAYS only resolved alerts
  conditions.push("isResolved = TRUE");

  if (search) {
    conditions.push("bike_id = ?");
    params.push(search);
  }

  if (type) {
    conditions.push("type = ?");
    params.push(type);
  }

  if (from !== undefined) {
    conditions.push("time >= ?");
    params.push(from);
  }

  if (to !== undefined) {
    conditions.push("time <= ?");
    params.push(to);
  }

  const whereClause = " WHERE " + conditions.join(" AND ");

  // ---- 1) Count total ----
  const countSql = `
    SELECT COUNT(*) AS total
    FROM alerts
    ${whereClause}
  `;
  const [countRows] = await pool.query<CountRow[]>(countSql, params);
  const total = countRows[0]?.total ?? 0;
  const totalPages = total === 0 ? 0 : Math.ceil(total / safePageSize);

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
    ORDER BY time DESC
    LIMIT ? OFFSET ?
  `;

  const dataParams = [...params, safePageSize, offset];
  const [rows] = await pool.query<AlertRow[]>(dataSql, dataParams);

  const alerts: Alert[] = rows.map((row) => ({
    id: row.id,
    bike_id: row.bike_id,
    content: row.content,
    type: Object.values(AlertType).includes(row.type as AlertType)
      ? (row.type as AlertType)
      : AlertType.BOUNDARY_CROSS,
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