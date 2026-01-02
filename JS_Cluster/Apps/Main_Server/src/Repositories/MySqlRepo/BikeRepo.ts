import { pool } from "../../MySqlConfig.js";
import { MobileAppBikeDTO } from "../../DTOs/MobileApp/Response_MobileAppBikeDTO.js"
import { MobileAppBike } from "@trungthao/mobile_app_dto";
import { RowDataPacket } from "mysql2";
import { Bike, BikeStatus } from "@trungthao/admin_dashboard_dto";

const GROUP_LIMIT = 50;

export async function getBikeMetadata(
  ids?: string[],
  search?: string
): Promise<number> {
  const whereClauses: string[] = ["deleted = 0"];
  const params: any[] = [];

  if (ids?.length) {
    whereClauses.push(`id IN (${ids.map(() => "?").join(",")})`);
    params.push(...ids);
  }

  if (search?.trim()) {
    whereClauses.push(`id LIKE ?`);
    params.push(`%${search.trim()}%`);
  }

  const whereSql =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const [rows] = await pool.execute<RowDataPacket[]>(
    `
    SELECT COUNT(*) AS totalCount
    FROM bikes
    ${whereSql}
    `,
    params
  );

  return Number(rows[0]?.totalCount ?? 0)
}

export async function getMobileAppBikesByHub(
  hubId: string
): Promise<MobileAppBike[]> {
  const sql = `
    SELECT
      id,
      name,
      maximum_speed,
      maximum_functional_distance
    FROM bikes
    WHERE current_hub = ?
  `;

  const [rows] = await pool.query<(RowDataPacket & MobileAppBike)[]>(sql, [hubId]);
  return rows;
}

// Kiểu row lấy từ MySQL
interface BikeRow extends RowDataPacket {
  id: string;
  name: string;
  status: BikeStatus;
  maximum_speed: number;
  maximum_functional_distance: number;
  purchase_date: number;
  last_service_date: number;
  current_hub: string | null;
  deleted: 0 | 1;
  created_at: Date | string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

type GetBikesOptions = {
  ids?: string[];
  hubId?: string;
  limit?: number;
  offset?: number;
};

export type PagedBikesResult = {
  bikes: Bike[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function fetchBikesWithCount(
  page?: number,
  limit?: number,
  ids?: string[],
  search?: string
): Promise<{ bikes: Bike[]; totalCount: number }> {

  const safePage = Math.max(page || 1, 1);
  const safePageSize = Math.max(limit || 10, 10)
  const offset = (safePage - 1) * safePageSize;

  const whereClauses: string[] = [];
  const params: any[] = [];

  if (ids?.length) {
    whereClauses.push(`id IN (${ids.map(() => "?").join(",")})`);
    params.push(...ids);
  }

  if (search?.trim()) {
    whereClauses.push(`id LIKE ?`);
    params.push(`%${search.trim()}%`);
  }

  const whereSql =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // 1️⃣ total count (NO limit / offset)
  const [countRows] = await pool.execute<CountRow[]>(
    `SELECT COUNT(*) AS totalCount FROM bikes ${whereSql}`,
    params
  );

  const totalCount = Number(countRows[0]?.totalCount ?? 0);

  // 2️⃣ fetch exactly ONE GROUP (max 50)
  const [rows] = await pool.execute<BikeRow[]>(
    `
    SELECT
      id,
      name,
      status,
      maximum_speed,
      maximum_functional_distance,
      purchase_date,
      last_service_date,
      current_hub,
      deleted,
      created_at
    FROM bikes
    ${whereSql}
    ORDER BY id
    LIMIT ${limit}
    OFFSET ${offset}
    `,
    params
  );

  const bikes: Bike[] = rows.map((row) => ({
    id: row.id,
    name: row.name ?? "",
    status: row.status,
    maximum_speed: Number(row.maximum_speed),
    maximum_functional_distance: Number(row.maximum_functional_distance),
    purchase_date: Number(row.purchase_date),
    last_service_date: Number(row.last_service_date),
    current_hub: row.current_hub ?? null,
    deleted: row.deleted === 1,
    created_at: new Date(row.created_at),
    batteryIsLow: false,
    isCrashed: false,
    isToppled: false,
    isOutOfBound: false,
  }));

  return { bikes, totalCount };
}

export async function fetchBikesNoCount(
  page: number,
  ids?: string[],
  search?: string
): Promise<Bike[]> {
  const safePage = Math.max(page, 1);
  const offset = (safePage - 1) * GROUP_LIMIT;

  const whereClauses: string[] = [];
  const params: any[] = [];

  if (ids?.length) {
    whereClauses.push(`id IN (${ids.map(() => "?").join(",")})`);
    params.push(...ids);
  }

  if (search?.trim()) {
    whereClauses.push(`id LIKE ?`);
    params.push(`%${search.trim()}%`);
  }

  const whereSql =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const [rows] = await pool.execute<BikeRow[]>(
    `
    SELECT
      id,
      name,
      status,
      maximum_speed,
      maximum_functional_distance,
      purchase_date,
      last_service_date,
      current_hub,
      deleted,
      created_at
    FROM bikes
    ${whereSql}
    ORDER BY id
    LIMIT ${GROUP_LIMIT}
    OFFSET ${offset}
    `,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name ?? "",
    status: row.status,
    maximum_speed: Number(row.maximum_speed),
    maximum_functional_distance: Number(row.maximum_functional_distance),
    purchase_date: Number(row.purchase_date),
    last_service_date: Number(row.last_service_date),
    current_hub: row.current_hub ?? null,
    deleted: row.deleted === 1,
    batteryIsLow: false,
    isCrashed: false,
    isToppled: false,
    isOutOfBound: false,
    created_at: new Date(row.created_at),
  }));
}

export async function getBikeById(bikeId: string): Promise<Bike | null> {
  const sql = `
    SELECT
      id,
      name,
      status,
      maximum_speed,
      maximum_functional_distance,
      purchase_date,
      last_service_date,
      current_hub,
      deleted,
      created_at
    FROM bikes
    WHERE id = ?
      AND deleted = 0
    LIMIT 1
  `;

  const [rows] = await pool.query<BikeRow[]>(sql, [bikeId]);

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];

  const bike: Bike = {
    id: row.id,
    name: row.name,
    status: row.status,
    maximum_speed: row.maximum_speed,
    maximum_functional_distance: row.maximum_functional_distance,
    purchase_date: row.purchase_date,
    last_service_date: row.last_service_date,
    current_hub: row.current_hub,
    deleted: row.deleted === 0 ? false : true,
    batteryIsLow: false,
    isCrashed: false,
    isToppled: false,
    isOutOfBound: false,
    created_at:
      typeof row.created_at === "string"
        ? new Date(row.created_at)
        : row.created_at,
  };

  return bike;
}