
import { ResultSetHeader } from "mysql2/promise";

import crypto from "crypto";
import { Trip } from "../../Models/Trip.js";
import { pool } from "../../MySqlConfig.js";




export async function reserveBikeForCustomer(
  customerId: string,
  bikeId: string,
  reservation_expiry: number,
  trip_secret: string,
  hubLong: number,
  hubLat: number
) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      "CALL CreateTripReservation(?, ?, ?, ?)",
      [customerId, bikeId, hubLong, hubLat]
    );
    console.log("✅ Trip reservation successful:", rows);
    return rows;
  } catch (err: any) {
    if (err.errno === 1644) {
      // SQLSTATE '45000' from SIGNAL in the procedure
      console.error("🚫 Customer already has a pending reservation");
    } else {
      console.error("❌ Error during trip reservation:", err);
    }
    throw err;
  } finally {
    conn.release();
  }
}

  
export async function getTrips(customerId?: string): Promise<Trip[]> {
  const [rows] = await pool.query<Trip[]>(
    `
    SELECT
      id,
      bike_id,
      customer_id,
      trip_status,
      UNIX_TIMESTAMP(reservation_expiry) * 1000 AS reservation_expiry,
      UNIX_TIMESTAMP(trip_start_date) * 1000 AS trip_start_date,
      UNIX_TIMESTAMP(trip_end_date) * 1000 AS trip_end_date,
      trip_start_long,
      trip_start_lat,
      trip_end_long,
      trip_end_lat
    FROM trips
    WHERE (? IS NULL OR customer_id = ?)
    ORDER BY trip_start_date DESC
    `,
    [customerId ?? null, customerId ?? null]
  );

  return rows;
}

/**
 * Fetch the pending trip for a given customer (if any).
 *
 * @param customerId - The customer's UUID
 * @returns The Trip record or null if none pending
 */
export async function getPendingTripByCustomerId(customerId: string): Promise<Trip | null> {
  const [rows] = await pool.query<Trip[]>(
    `
    SELECT
      id,
      bike_id,
      customer_id,
      trip_status,
      UNIX_TIMESTAMP(reservation_expiry) * 1000 AS reservation_expiry,
      UNIX_TIMESTAMP(trip_start_date) * 1000 AS trip_start_date,
      UNIX_TIMESTAMP(trip_end_date) * 1000 AS trip_end_date,
      trip_start_long,
      trip_start_lat,
      trip_end_long,
      trip_end_lat,
      trip_secret
    FROM trips
    WHERE customer_id = ?
      AND trip_status = 'pending'
    LIMIT 1
    `,
    [customerId]
  );

  return rows.length > 0 ? rows[0] : null;
}