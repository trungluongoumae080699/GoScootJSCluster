import { Hub } from "../../Models/Hub.js";
import { pool } from "../../MySqlConfig.js";



/**
 * Retrieves all hubs, optionally filtered by geographic boundary.
 *
 * @param minLat - optional southern boundary (min latitude)
 * @param maxLat - optional northern boundary (max latitude)
 * @param minLon - optional western boundary (min longitude)
 * @param maxLon - optional eastern boundary (max longitude)
 */
export async function getHubsWithinBoundary(
  minLat?: number,
  maxLat?: number,
  minLon?: number,
  maxLon?: number
): Promise<Hub[]> {
  let sql = `
    SELECT 
      id, 
      longitude, 
      latitude, 
      UNIX_TIMESTAMP(created_at) * 1000 AS created_at
    FROM hubs
  `;

  const conditions: string[] = [];
  const params: any[] = [];

  if (minLat !== undefined && maxLat !== undefined) {
    conditions.push("latitude BETWEEN ? AND ?");
    params.push(minLat, maxLat);
  } else if (minLat !== undefined) {
    conditions.push("latitude >= ?");
    params.push(minLat);
  } else if (maxLat !== undefined) {
    conditions.push("latitude <= ?");
    params.push(maxLat);
  }

  if (minLon !== undefined && maxLon !== undefined) {
    conditions.push("longitude BETWEEN ? AND ?");
    params.push(minLon, maxLon);
  } else if (minLon !== undefined) {
    conditions.push("longitude >= ?");
    params.push(minLon);
  } else if (maxLon !== undefined) {
    conditions.push("longitude <= ?");
    params.push(maxLon);
  }

  if (conditions.length > 0) {
    sql += " WHERE " + conditions.join(" AND ");
  }

  const [rows] = await pool.query<Hub[]>(sql, params);
  return rows;
}
