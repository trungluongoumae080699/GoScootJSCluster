import { pool } from "../../MySqlConfig.js";
import { MobileAppBikeDTO } from "../../DTOs/MobileApp/Response_MobileAppBikeDTO.js"
import { MobileAppBike } from "@trungthao/mobile_app_dto";
import { RowDataPacket } from "mysql2";
import { Bike, BikeStatus } from "@trungthao/admin_dashboard_dto";



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

export async function getBikesByFilter(
  options: GetBikesOptions = {}
): Promise<PagedBikesResult> {
  const {
    ids,
    hubId,
    limit = 10,
    offset = 0,
  } = options;

  const conditions: string[] = ["deleted = 0"]; // bắt buộc
  const filterParams: any[] = [];

  // Optional hub filter
  if (hubId) {
    conditions.push("current_hub = ?");
    filterParams.push(hubId);
  }

  // Optional ID array filter
  if (ids && ids.length > 0) {
    const placeholders = ids.map(() => "?").join(",");
    conditions.push(`id IN (${placeholders})`);
    filterParams.push(...ids);
  }

  let whereClause = "";
  if (conditions.length > 0) {
    whereClause = " WHERE " + conditions.join(" AND ");
  }

  // ----- 1) COUNT tổng -----
  const countSql = `
    SELECT COUNT(*) AS total
    FROM bikes
    ${whereClause}
  `;

  const [countRows] = await pool.query<CountRow[]>(countSql, filterParams);
  const total = Number(countRows[0]?.total ?? 0);

  // ----- 2) SELECT dữ liệu với LIMIT/OFFSET -----
  const selectSql = `
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
    ${whereClause}
    LIMIT ? OFFSET ?
  `;

  const selectParams = [...filterParams, limit, offset];

  const [rows] = await pool.query<BikeRow[]>(selectSql, selectParams);

  const bikes: Bike[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    maximum_speed: Number(row.maximum_speed),
    maximum_functional_distance: Number(row.maximum_functional_distance),
    purchase_date: Number(row.purchase_date),
    last_service_date: Number(row.last_service_date),
    current_hub: row.current_hub ?? null,
    deleted: row.deleted === 1,
    created_at: new Date(row.created_at),
  }));

  const pageSize = limit;
  const page = pageSize > 0 ? Math.floor(offset / pageSize) + 1 : 1;
  const totalPages = pageSize > 0 && total > 0 ? Math.ceil(total / pageSize) : 0;

  return {
    bikes,
    page,
    pageSize,
    total,
    totalPages,
  };
}