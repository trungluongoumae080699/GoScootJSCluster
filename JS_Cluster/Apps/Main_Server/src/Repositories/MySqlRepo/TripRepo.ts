
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import crypto from "crypto";

import { pool } from "../../MySqlConfig.js";
import { Response_MyTripsListingDTO, Response_TripDTO } from "@trungthao/mobile_app_dto";
import { Response_DashboardGetTripsByBikeDTO, Trip, TripStatus } from "@trungthao/admin_dashboard_dto";
import { GetTripsOptions } from "../../Controllers/DashboardController.js";
import { TripRervationPayload } from "../../Controllers/BkeController.js";


export async function getMyTrips(
  customer_id: string,
  page: number
): Promise<Response_MyTripsListingDTO> {
  const LIMIT = 10;
  const offset = (page - 1) * LIMIT;

  // 1. Count total trips
  const [countRows] = await pool.query(
    `
        SELECT COUNT(*) AS total
        FROM trips
        WHERE customer_id = ?
          AND deleted = 0
        `,
    [customer_id]
  );
  const total = (countRows as any)[0].total as number;
  const totalPages = Math.ceil(total / LIMIT);

  // 2. Fetch page data (same query as before)
  const [rows] = await pool.query(
    `
        SELECT
            t.id,
            t.bike_id,
            t.hub_id,
            t.customer_id,
            t.trip_status,
            t.reservation_expiry,
            t.reservation_date,
            t.trip_start_date,
            t.trip_end_date,
            t.trip_end_long,
            t.trip_start_long,
            t.trip_start_lat,
            t.trip_end_lat,
            t.trip_secret,
            t.isPaid,
            t.price,

            b.id AS bike_id2,
            b.name,
            b.maximum_speed,
            b.maximum_functional_distance,

            h.id AS hub_id,
            h.longitude,
            h.latitude,
            h.address

        FROM trips t
        JOIN bikes b ON t.bike_id = b.id
        JOIN hubs h ON t.hub_id = h.id

        WHERE t.customer_id = ?
          AND t.deleted = 0

        ORDER BY t.reservation_date DESC
        LIMIT ? OFFSET ?
        `,
    [customer_id, LIMIT, offset]
  );

  const trips: Response_TripDTO[] = (rows as any[]).map(r => ({
    trip: {
      id: r.id,
      bike_id: r.bike_id,
      hub_id: r.hub_id,
      customer_id: r.customer_id,
      trip_status: r.trip_status,
      reservation_date: Number(r.reservation_date),
      reservation_expiry: Number(r.reservation_expiry),
      trip_start_date: r.trip_start_date ? Number(r.trip_start_date) : undefined,
      trip_end_date: r.trip_end_date ? Number(r.trip_end_date) : undefined,
      trip_end_long: r.trip_end_long ?? undefined,
      trip_end_lat: r.trip_end_lat ?? undefined,
      trip_start_lat: r.trip_start_lat ?? undefined,
      trip_start_long: r.trip_start_long ?? undefined,
      trip_secret: r.trip_secret ?? undefined,
      isPaid: r.isPaid === 0 ? false : true,
      price: r.price ?? undefined
    },
    bike: {
      id: r.bike_id2,
      name: r.name,
      maximum_speed: r.maximum_speed,
      maximum_functional_distance: r.maximum_functional_distance,
    },
    hub: {
      id: r.hub_id,
      longitude: r.longitude,
      latitude: r.latitude,
      address: r.address
    },
  }));

  return {
    trips,
    total,
    page,
    pageSize: LIMIT,
    totalPages,
  };
}

function pickFirstResultSet(callResult: any): RowDataPacket[] {
  // mysql2 CALL returns: [ [rows], [procMeta] ] OR [ [rows], ... ]
  // Typically: result[0] is an array of result sets, and result[0][0] is the first result set.
  const top = callResult?.[0];
  if (Array.isArray(top) && Array.isArray(top[0])) return top[0] as RowDataPacket[];
  if (Array.isArray(top)) return top as RowDataPacket[];
  return [];
}

export async function reserveBikeForCustomer(
  tripId: string,
  customerId: string,
  bikeId: string,
  hubId: string,
  tripSecret: string,
): Promise<Response_TripDTO> {
  const conn = await pool.getConnection();

  try {
    const reservationDate = Date.now();
    const reservationExpiry = reservationDate + 15 * 60 * 1000; // +15 minutes

    const [callResult] = await conn.query(
      "CALL CreateTripReservation(?, ?, ?, ?, ?, ?, ?)",
      [
        tripId,
        customerId,
        bikeId,
        hubId,
        reservationDate,
        reservationExpiry,
        tripSecret,
      ]
    );

    const rows = pickFirstResultSet(callResult);
    if (rows.length === 0) {
      throw new Error("CreateTripReservation returned no rows");
    }

    const r: any = rows[0];

    const dto: Response_TripDTO = {
      trip: {
        id: r.trip_id ?? r.id,
        bike_id: r.trip_bike_id ?? r.bike_id,
        customer_id: r.trip_customer_id ?? r.customer_id,
        hub_id: r.trip_hub_id ?? r.hub_id,
        trip_status: r.trip_status,
        reservation_expiry: Number(r.reservation_expiry),
        reservation_date: Number(r.reservation_date),
        trip_secret: r.trip_secret ?? null, // ✅ fixed typo
      },

      bike: {
        id: r.bike_id,
        name: r.bike_name,
        maximum_speed: r.bike_maximum_speed != null ? Number(r.bike_maximum_speed) : 0,
        maximum_functional_distance:
          r.bike_maximum_functional_distance != null
            ? Number(r.bike_maximum_functional_distance)
            : 0,
      },

      hub: {
        id: r.hub_id,
        address: r.hub_address ?? r.address, // ✅ procedure returns hub_address
        longitude: Number(r.hub_longitude),
        latitude: Number(r.hub_latitude),
      },
    };

    return dto;
  } catch (err: any) {
    if (err?.errno === 1644) {
      console.error("🚫 Reservation rejected by procedure:", err?.sqlMessage ?? err?.message);
    } else {
      console.error("❌ Error during trip reservation:", err);
    }
    throw err;
  } finally {
    conn.release();
  }
}


interface TripRow extends RowDataPacket {
  id: string;
  bike_id: string;
  customer_id: string;
  hub_id: string;
  trip_status: TripStatus;
  reservation_expiry: number;
  reservation_date: number;
  trip_start_date: number | null;
  trip_end_date: number | null;
  trip_end_long: number | null;
  trip_end_lat: number | null;
  trip_secret: string | null;
  deleted: 0 | 1;
  price: number | null;
  isPaid: 0 | 1;
  created_at: Date | string;
}


function mapTripRow(row: TripRow): Trip {
  return {
    id: row.id,
    bike_id: row.bike_id,
    customer_id: row.customer_id,
    hub_id: row.hub_id,
    trip_status: row.trip_status,
    reservation_expiry: Number(row.reservation_expiry),
    reservation_date: Number(row.reservation_date),
    trip_start_date: row.trip_start_date !== null ? Number(row.trip_start_date) : null,
    trip_end_date: row.trip_end_date !== null ? Number(row.trip_end_date) : null,
    trip_end_long: row.trip_end_long !== null ? Number(row.trip_end_long) : null,
    trip_end_lat: row.trip_end_lat !== null ? Number(row.trip_end_lat) : null,
    trip_secret: row.trip_secret,
    deleted: row.deleted === 1,
    price: row.price !== null ? Number(row.price) : null,
    isPaid: row.isPaid === 1,
    created_at: new Date(row.created_at),
  };
}





export async function getTrips(
  options: GetTripsOptions = {}
): Promise<Response_DashboardGetTripsByBikeDTO> {
  const {
    bikeId,
    search,
    status,
    reservationFrom,
    reservationTo,
    page,
    limit,
  } = options;

  const safePage = Math.max(Number(page) || 1, 1);
  const safePageSize = Math.max(Number(limit) || 10, 0);
  const offset = (safePage - 1) * safePageSize;

  const conditions: string[] = ["deleted = 0"];
  const params: any[] = [];

  // Optional bike filter
  if (bikeId) {
    conditions.push("bike_id = ?");
    params.push(bikeId);
  }

  if (search && search.trim() !== "") {
    conditions.push(`
    MATCH(bike_id, customer_id)
    AGAINST (? IN BOOLEAN MODE)
  `);
    params.push(search + "*");
  }

  // Optional status filter
  if (status) {
    conditions.push("trip_status = ?");
    params.push(status);
  }

  // Optional reservation date range
  if (typeof reservationFrom === "number") {
    conditions.push("reservation_date >= ?");
    params.push(reservationFrom);
  }
  if (typeof reservationTo === "number") {
    conditions.push("reservation_date <= ?");
    params.push(reservationTo);
  }

  // Base WHERE clause
  const whereClause =
    conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "";

  // --- 1) Count query ---
  const countSql = `
    SELECT COUNT(*) AS total
    FROM trips
    ${whereClause}
  `;

  interface CountRow extends RowDataPacket {
    total: number;
  }

  const [countRows] = await pool.query<CountRow[]>(countSql, params);
  const total = countRows[0]?.total ?? 0;
  const totalPages = total === 0 ? 0 : Math.ceil(total / safePageSize);

  // If no data, early return
  if (total === 0) {
    return {
      trips: [],
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages,
    };
  }

  let dataSql = `
    SELECT
      id,
      bike_id,
      customer_id,
      hub_id,
      trip_status,
      reservation_expiry,
      reservation_date,
      trip_start_date,
      trip_end_date,
      trip_end_long,
      trip_end_lat,
      trip_secret,
      deleted,
      price,
      isPaid,
      created_at
    FROM trips
    ${whereClause}
    ORDER BY reservation_date DESC
    LIMIT ? OFFSET ?
  `;

  const dataParams = [...params, safePageSize, offset];

  const [rows] = await pool.query<TripRow[]>(dataSql, dataParams);

  const trips = rows.map(mapTripRow);

  return {
    trips,
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages,
  };
}

const FIND_ACTIVE_TRIP_SQL = `
  SELECT
    id,
    bike_id,
    customer_id,
    hub_id,
    trip_status,
    reservation_expiry,
    reservation_date,
    trip_start_date,
    trip_end_date,
    trip_start_long,
    trip_start_lat
    trip_end_long,
    trip_end_lat,
    trip_secret,
    deleted,
    price,
    isPaid,
    created_at
  FROM trips
  WHERE id = ?
    AND bike_id = ?
    AND customer_id = ?
    AND trip_secret = ?
    AND deleted = 0
    AND reservation_expiry >= ?
  LIMIT 1
`;

export async function findActiveTripReservation(
  payload: TripRervationPayload
): Promise<TripRow | null> {
  const nowMs = Date.now();

  const [rows] = await pool.query<RowDataPacket[]>(FIND_ACTIVE_TRIP_SQL, [
    payload.trip_id,
    payload.bike_id,
    payload.customer_id,
    payload.trip_secret,
    nowMs,
  ]);

  if (rows.length === 0) {
    return null;
  }

  return rows[0] as TripRow;
}

export async function cancelTrip(tripId: string): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.query("CALL CancelTrip(?)", [tripId]);
  } finally {
    conn.release(); // 🔥 bắt buộc
  }
}

export async function getPendingTripForCustomer(
  customer_id: string
): Promise<Response_TripDTO | null> {

  const [rows] = await pool.query(
    `
    SELECT
        -- trip
        t.id,
        t.bike_id,
        t.hub_id,
        t.customer_id,
        t.trip_status,
        t.reservation_date,
        t.reservation_expiry,
        t.trip_start_date,
        t.trip_end_date,
        t.trip_end_long,
        t.trip_start_long,
        t.trip_start_lat,
        t.trip_end_lat,
        t.trip_secret,
        t.isPaid,
        t.price,

        -- bike
        b.id AS bike_id2,
        b.name,
        b.maximum_speed,
        b.maximum_functional_distance,

        -- hub
        h.id AS hub_id2,
        h.longitude,
        h.latitude,
        h.address

    FROM trips t
    JOIN bikes b ON t.bike_id = b.id
    JOIN hubs h  ON t.hub_id = h.id

    WHERE t.customer_id = ?
      AND t.trip_status = 'Pending'
      AND t.deleted = 0

    ORDER BY t.reservation_date DESC
    LIMIT 1
    `,
    [customer_id]
  );

  if ((rows as any[]).length === 0) {
    return null;
  }

  const r: any = (rows as any[])[0];

  const dto: Response_TripDTO = {
    trip: {
      id: r.id,
      bike_id: r.bike_id,
      hub_id: r.hub_id,
      customer_id: r.customer_id,
      trip_status: r.trip_status,
      reservation_date: Number(r.reservation_date),
      reservation_expiry: Number(r.reservation_expiry),
      trip_start_date: r.trip_start_date ? Number(r.trip_start_date) : undefined,
      trip_end_date: r.trip_end_date ? Number(r.trip_end_date) : undefined,
      trip_end_long: r.trip_end_long ?? undefined,
      trip_end_lat: r.trip_end_lat ?? undefined,
      trip_start_lat: r.trip_start_lat ?? undefined,
      trip_start_long: r.trip_start_long ?? undefined,
      trip_secret: r.trip_secret ?? undefined,
      isPaid: r.isPaid === 1,
      price: r.price ?? undefined
    },

    bike: {
      id: r.bike_id2,
      name: r.name,
      maximum_speed: r.maximum_speed,
      maximum_functional_distance: r.maximum_functional_distance
    },

    hub: {
      id: r.hub_id2,
      longitude: r.longitude,
      latitude: r.latitude,
      address: r.address
    }
  };

  return dto;
}