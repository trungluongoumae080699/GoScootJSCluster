import { CustomRequest } from "../Middlewares/Authorization.js";
import { Response } from "express";
import { redisClient } from "../RedisConfig.js";
import { fetchBikeIdsAndBatteries, fetchBikeUpdates } from "../Repositories/RedisRepo/BikeRepo.js";
import { fetchBikesNoCount, fetchBikesWithCount, getBikesByFilter, getMobileAppBikesByHub } from "../Repositories/MySqlRepo/BikeRepo.js";
import { Bike, BikeStatus, BikeTelemetry, OperationStatus, TripStatus } from "@trungthao/admin_dashboard_dto";
import { getTrips } from "../Repositories/MySqlRepo/TripRepo.js";
import { getBikeTelemetry } from "../Repositories/ClickhouseRepo/TelemetryRepo.js";
import { getAlerts } from "../Repositories/MySqlRepo/AlertRepo.js";
import { getHubsWithinBoundary } from "../Repositories/MySqlRepo/HubRepo.js";
import { Response_BikeListDTO } from "@trungthao/mobile_app_dto";

export type TripSortField = "reservation_date" | "price";
export type SortDirection = "asc" | "desc";

export const fetchHubs = async (
  request: CustomRequest<
    {}, // params
    {}, // res body
    {}, // req body
    {
      maxLong?: string;
      maxLat?: string;
      minLong?: string;
      minLat?: string;
    }
  >,
  response: Response,

) => {
  // Extract & convert query params
  const maxLong = request.query.maxLong ? Number(request.query.maxLong) : undefined;
  const minLong = request.query.minLong ? Number(request.query.minLong) : undefined;
  const maxLat = request.query.maxLat ? Number(request.query.maxLat) : undefined;
  const minLat = request.query.minLat ? Number(request.query.minLat) : undefined;

  // Validate NaN → convert to undefined
  const clean = (n: number | undefined) =>
    typeof n === "number" && !Number.isNaN(n) ? n : undefined;

  const result = await getHubsWithinBoundary(
    clean(minLat),
    clean(maxLat),
    clean(minLong),
    clean(maxLong)
  );

  return response.status(200).json(result);
};

export const fetchBikesByHub = async (
  request: CustomRequest<{ hubId: string }>,
  response: Response
) => {
  const { hubId } = request.params;

  // 1. Fetch base bike data from MySQL
  const bikes = await getMobileAppBikesByHub(hubId);
  // 2. For each bike, get telemetry from Redis
  for (const b of bikes) {
    const redisKey = `bike:${b.id}:telemetry`;

    // HGETALL returns Record<string, string>
    const tele = await redisClient.hGetAll(redisKey);

    const batteryStatus = tele.battery_status
      ? Number(tele.battery_status)
      : null;
    b.battery_status = batteryStatus
  }

  const result: Response_BikeListDTO = {
    bikes: bikes,
    total: bikes.length
  }

  return response.status(200).json(result);
};

export interface GetTripsOptions {
  bikeId?: string;
  status?: TripStatus;
  reservationFrom?: number;
  reservationTo?: number;
  sortBy?: TripSortField;
  sortDirection?: SortDirection; // default: "desc"
  page?: number; // default: 1
  pageSize?: number; // default: 20
}

export const fetchTripsByBike = async (
  request: CustomRequest<
    { bikeId: string }, // params
    {}, // body
    {}, // headers
    {
      from?: string;
      to?: string;
      status?: TripStatus;
      sortBy?: TripSortField;
      sortDirection?: SortDirection;
      page?: string;
      pageSize?: string;
    }
  >,
  response: Response
) => {
  const { bikeId } = request.params;
  if (!bikeId) {
    return response
      .status(400)
      .json({ error: "bikeId path parameter is required" });
  }

  const { from, to, status, sortBy, sortDirection, page, pageSize } =
    request.query;

  // Parse from/to -> numbers (BIGINT)
  let reservationFrom: number | undefined;
  let reservationTo: number | undefined;

  if (from !== undefined) {
    const n = Number(from);
    if (Number.isNaN(n)) {
      return response.status(400).json({ error: "`from` must be a number" });
    }
    reservationFrom = n;
  }

  if (to !== undefined) {
    const n = Number(to);
    if (Number.isNaN(n)) {
      return response.status(400).json({ error: "`to` must be a number" });
    }
    reservationTo = n;
  }

  const options: GetTripsOptions = {
    bikeId,
    status,
    reservationFrom,
    reservationTo,
    sortBy,
    sortDirection,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await getTrips(options);

  return response.json(result);
};

export type BikeTelemetrySortField = "time";

export interface GetBikeTelemetryOptions {
  bikeId: string; // mandatory
  from?: number; // optional time filter (>=)
  to?: number; // optional time filter (<=)
  page?: number; // default 1
  pageSize?: number; // default 50
  sortDirection?: SortDirection; // default "desc" (latest first)
}

export interface GetBikeTelemetryResult {
  data: BikeTelemetry[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}



export const fetchTelemetryByBike = async (
  request: CustomRequest<
    { bikeId: string }, // params
    {}, // body
    {}, // headers
    {
      from?: string;
      to?: string;
      page?: string;
      pageSize?: string;
      sortDirection?: "asc" | "desc";
    }
  >,
  response: Response
) => {
  const { bikeId } = request.params;
  if (!bikeId) {
    return response.status(400).json({ error: "bikeId parameter is required" });
  }

  const { from, to, page, pageSize, sortDirection } = request.query;

  // ---- Parse filters (optional) ----
  let fromTime: number | undefined = undefined;
  let toTime: number | undefined = undefined;

  if (from !== undefined) {
    const n = Number(from);
    if (Number.isNaN(n)) {
      return response.status(400).json({ error: "`from` must be a number" });
    }
    fromTime = n;
  }

  if (to !== undefined) {
    const n = Number(to);
    if (Number.isNaN(n)) {
      return response.status(400).json({ error: "`to` must be a number" });
    }
    toTime = n;
  }

  // ---- Pagination ----
  const pageNum = page ? Number(page) : undefined;
  const pageSizeNum = pageSize ? Number(pageSize) : undefined;

  // ---- Call ClickHouse repository ----
  const result = await getBikeTelemetry({
    bikeId,
    from: fromTime,
    to: toTime,
    page: pageNum,
    pageSize: pageSizeNum,
    sortDirection: sortDirection === "asc" ? "asc" : "desc", // default: desc
  });

  return response.json(result);
};


type AlertQuery = {
  bikeId?: string;
  from?: string;
  to?: string;
  sortDirection?: string; // "asc" | "desc"
  page?: string;
};

export const fetchAlerts = async (
  request: CustomRequest<{}, {}, {}, AlertQuery>,
  response: Response
) => {
  try {
    const { bikeId, from, to, sortDirection, page } = request.query;

    // ---- Parse and validate time filters ----
    let fromNum: number | undefined;
    let toNum: number | undefined;

    if (from !== undefined) {
      const n = Number(from);
      if (Number.isNaN(n)) {
        return response.status(400).json({ error: "Invalid 'from' timestamp" });
      }
      fromNum = n;
    }

    if (to !== undefined) {
      const n = Number(to);
      if (Number.isNaN(n)) {
        return response.status(400).json({ error: "Invalid 'to' timestamp" });
      }
      toNum = n;
    }

    // ---- Parse sort direction ----
    let sortDir: SortDirection = "desc"; // default: latest first
    if (sortDirection === "asc" || sortDirection === "desc") {
      sortDir = sortDirection;
    }

    // ---- Parse page ----
    const pageNum = Math.max(Number(page) || 1, 1);

    // ---- Call repository ----
    const result = await getAlerts({
      bikeId,
      from: fromNum,
      to: toNum,
      sortDirection: sortDir,
      page: pageNum,
      pageSize: 10, // enforce max 10 per your requirement
    });

    return response.json(result);
  } catch (err) {
    console.error("fetchAlerts error:", err);
    return response.status(500).json({ error: "Internal server error" });
  }
};

export const fetchBikes = async (
  request: CustomRequest<
    {},
    {},
    {},
    { battery?: string; hub?: string; page?: string }
  >,
  response: Response
) => {
  const { battery, hub, page } = request.query;

  const PAGE_SIZE = 10;
  const pageNum = Math.max(Number(page) || 1, 1);
  const offset = (pageNum - 1) * PAGE_SIZE;

  // ---------------------------------------------------------
  //  CASE 1: battery is NOT provided -> MySQL only
  // ---------------------------------------------------------
  if (battery === undefined) {
    const sqlResult = await getBikesByFilter({
      hubId: hub,
      limit: PAGE_SIZE,
      offset,
    });

    for (const b of sqlResult.bikes) {
      const redisKey = `bike:${b.id}:telemetry`;

      // HGETALL returns Record<string, string>
      const tele = await redisClient.hGetAll(redisKey);

      const batteryStatus = tele.battery_status
        ? Number(tele.battery_status)
        : null;
      b.battery_status = batteryStatus;
    }

    return response.json(sqlResult);
  }

  // ---------------------------------------------------------
  //  CASE 2: battery IS provided -> Redis + MySQL
  // ---------------------------------------------------------
  const maxBattery = Number(battery);
  if (Number.isNaN(maxBattery)) {
    return response.status(400).json({
      error: "battery must be a number",
    });
  }

  // Step 1: fetch all bikes from Redis with battery <= maxBattery
  const redisBikes = await fetchBikeIdsAndBatteries(maxBattery);
  const ids = redisBikes.map((b) => b.id);

  if (ids.length === 0) {
    return response.json({
      bikes: [],
      page: pageNum,
      pageSize: PAGE_SIZE,
      total: 0,
      totalPages: 0,
    });
  }

  // Step 2: fetch paginated bikes from MySQL
  const sqlResult = await getBikesByFilter({
    ids,
    hubId: hub,
    limit: PAGE_SIZE,
    offset,
  });

  for (const b of sqlResult.bikes) {
    for (const ba_id of redisBikes) {
      if (ba_id.id === b.id) {
        b.battery_status = ba_id.battery;
        break;
      }
    }
  }

  return response.json(sqlResult);
};


type Query = {
  page?: string; // ✅ startPage: 1,6,11...
  withTotalCount?: string; // "true" | undefined
  search?: string;
  battery?: string;
  operationStatus?: string; // enum string hoặc code (tuỳ bạn)
  status?: string; // usage status
};

export const fetchBikesController = async (
  req: CustomRequest<{}, {}, {}, Query>,
  res: Response
) => {
  try {
    const startPageNum = Math.max(Number(req.query.page) || 1, 1);
    const withTotalCount = req.query.withTotalCount === "true";
    const search = req.query.search?.trim() || undefined;

    let batteryNum = undefined
    let operationStatus = undefined
    let bikeStatus = undefined

    if (req.query.battery) {
      batteryNum = req.query.battery?.trim() === "" ? undefined : Number(req.query.battery);
    }

    if (req.query.operationStatus) {
      operationStatus = req.query.operationStatus?.trim() === "" ? undefined : Object.values(OperationStatus).includes(req.query.operationStatus as OperationStatus)
        ? (req.query.operationStatus as OperationStatus)
        : undefined;
    }

    if (req.query.status) {
      bikeStatus = req.query.status?.trim() === "" ? undefined : Object.values(BikeStatus).includes(req.query.status as BikeStatus)
        ? (req.query.status as BikeStatus)
        : undefined;
    }

  console.log(bikeStatus)


    if (batteryNum !== undefined && !Number.isFinite(batteryNum)) {
      return res.status(400).json({ error: "battery must be a number" });
    }



    // ✅ nếu có filter liên quan telemetry => lấy IDs từ Redis trước
    const needsRedisFilter =
      batteryNum !== undefined || operationStatus !== undefined || bikeStatus !== undefined;

    let ids: string[] | undefined = undefined;
    let telemetryMap: Map<string, any> | null = null;

    if (needsRedisFilter) {
      const updates = await fetchBikeUpdates({
        battery: batteryNum,
        operationStatus,
        bikeStatus,
      });

      ids = updates.map((u) => u.id);

      // nếu không có match thì trả về rỗng luôn
      if (ids.length === 0) {
        const payload: any = { data: [] as Bike[] };
        if (withTotalCount) payload.totalCount = 0;
        return res.json(payload);
      }

      // map để enrich output
      telemetryMap = new Map(updates.map((u) => [u.id, u]));
    }

    // ✅ MySQL fetch (LIMIT cố định 50, offset theo groupIndex)
    if (withTotalCount) {
      const { bikes, totalCount } = await fetchBikesWithCount(startPageNum, ids, search);

      // ✅ enrich telemetry fields (nếu Bike DTO có field tương ứng)
      if (telemetryMap) {
        for (const b of bikes as any[]) {
          const tele = telemetryMap.get(b.id);
          if (!tele) continue;

          // add the fields you actually expose in Bike DTO
          b.battery_status = tele.battery_status;
          b.longitude = tele.longitude;
          b.latitude = tele.latitude;
          b.operationStatus = tele.operationStatus;
          b.usageStatus = tele.usageStatus;
          b.currentHub = tele.currentHub;
        }
      }

      return res.json({ data: bikes, totalCount });
    } else {
      const bikes = await fetchBikesNoCount(startPageNum, ids, search);

      if (telemetryMap) {
        for (const b of bikes as any[]) {
          const tele = telemetryMap.get(b.id);
          if (!tele) continue;

          b.battery_status = tele.battery_status;
          b.longitude = tele.longitude;
          b.latitude = tele.latitude;
          b.operationStatus = tele.operationStatus;
          b.usageStatus = tele.usageStatus;
          b.currentHub = tele.currentHub;
        }
      }

      return res.json({ data: bikes });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch bikes";
    return res.status(500).json({ error: msg });
  }
};