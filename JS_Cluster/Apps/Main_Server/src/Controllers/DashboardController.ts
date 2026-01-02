import { CustomRequest } from "../Middlewares/Authorization.js";
import { Response } from "express";
import { redisClient } from "../RedisConfig.js";
import { fetchBikeIdsAndBatteries, fetchBikeUpdateById, fetchBikeUpdates, fetchBikeUpdatesByIds } from "../Repositories/RedisRepo/BikeRepo.js";
import { fetchBikesNoCount, fetchBikesWithCount, getBikeById, getMobileAppBikesByHub } from "../Repositories/MySqlRepo/BikeRepo.js";
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
  search?: string
  reservationFrom?: number;
  reservationTo?: number;
  page?: number;
  limit?: number;

}

export const fetchTrips = async (
  request: CustomRequest<
    {},
    {}, // body
    {}, // headers
    {
      from?: string;
      to?: string;
      search?: string;
      bikeId?: string;
      status?: TripStatus;
      page?: string;
      limit?: string;
    }
  >,
  response: Response
) => {
  const { from, to, bikeId, search, status, page, limit } =
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
    search,
    reservationFrom,
    reservationTo,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  };

  const result = await getTrips(options);

  return response.json({ data: result.trips, totalCount: result.total });
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
    {}, // body
    {}, // headers
    {
      bikeId?: string;
      from?: string;
      to?: string;
      page?: string;
      limit?: string;
    }
  >,
  response: Response
) => {
  const bikeId = request.query.bikeId as string;

  if (!bikeId) {
    return response.status(400).json({ error: "bikeId parameter is required" });
  }

  const { from, to, page, limit } = request.query;

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
  const pageSizeNum = limit ? Number(limit) : undefined;

  // ---- Call ClickHouse repository ----
  const result = await getBikeTelemetry({
    bikeId,
    from: fromTime,
    to: toTime,
    page: pageNum,
    pageSize: pageSizeNum,
  });

  return response.json(result);
};


type AlertQuery = {
  search?: string;
  from?: string;
  to?: string;
  page?: string;
  limit?: string
};

export const fetchAlerts = async (
  request: CustomRequest<{}, {}, {}, AlertQuery>,
  response: Response
) => {
  try {
    const { search, from, to, limit, page } = request.query;

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

    // ---- Parse page ----
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.max(Number(limit) || 10, 10);

    // ---- Call repository ----
    const result = await getAlerts({
      search,
      from: fromNum,
      to: toNum,
      page: pageNum,
      limit: limitNum,
    });

    return response.json({
      data: result.alerts,
      totalCount: result.total
    });
  } catch (err) {
    console.error("fetchAlerts error:", err);
    return response.status(500).json({ error: "Internal server error" });
  }
};


type Query = {
  page?: string; // ✅ startPage: 1,6,11...
  limit?: string;
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
    const limit = Math.max(Number(req.query.limit) || 10, 10)
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
        bikeStatus,
      });

      ids = updates.map((u) => u.id);

      // nếu không có match thì trả về rỗng luôn
      if (ids.length === 0) {
        const payload: any = { data: [] as Bike[] };
        payload.totalCount = 0;
        return res.json(payload);
      }
      // map để enrich output
      telemetryMap = new Map(updates.map((u) => [u.id, u]));
    }

    const { bikes, totalCount } = await fetchBikesWithCount(startPageNum, limit, ids, search);

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
    else {
      const ids = bikes.map(b => b.id);
      const telemetryMap = await fetchBikeUpdatesByIds(redisClient, ids);

      for (const b of bikes) {
        const tele = telemetryMap.get(b.id);
        if (!tele) continue;

        b.battery_status = tele.battery_status;
        b.batteryIsLow = tele.batteryIsLow;
        b.isOutOfBound = tele.isOutOfBound;
        b.isCrashed = tele.isCrashed;
        b.isToppled = tele.isToppled
        b.status = tele.usageStatus;
        b.latitude = tele.longitude;
        b.latitude = tele.latitude

      }
    }

    return res.json({ data: bikes, totalCount });

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch bikes";
    return res.status(500).json({ error: msg });
  }
};

export const fetchBikeById = async (
  req: CustomRequest<{ bikeId: string }, {}, {}, {}>,
  res: Response
) => {
  try {
    const bikeId = req.params.bikeId
    const bike = await getBikeById(bikeId)
    if (bike) {
      const bikeUpdate = await fetchBikeUpdateById(redisClient, bikeId)
      if (bikeUpdate) {
        bike.battery_status = bikeUpdate.battery_status;
        bike.batteryIsLow = bikeUpdate.batteryIsLow;
        bike.isOutOfBound = bikeUpdate.isOutOfBound;
        bike.isCrashed = bikeUpdate.isCrashed;
        bike.isToppled = bikeUpdate.isToppled
        bike.status = bikeUpdate.usageStatus;
        bike.latitude = bikeUpdate.longitude;
        bike.latitude = bikeUpdate.latitude
      }

    }

    return res.json(bike);

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch bikes";
    return res.status(500).json({ error: msg });
  }
};

