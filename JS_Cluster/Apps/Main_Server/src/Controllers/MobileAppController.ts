import { Response_BikeListDTO, Response_MobileAppLogInDTO } from "@trungthao/mobile_app_dto";
import { CustomRequest } from "../Middlewares/Authorization.js";
import { Customer } from "../Models/Customer.js";
import { getCustomerById } from "../Repositories/MySqlRepo/CustomerRepo.js";
import { SessionObject, getSession } from "../Repositories/RedisRepo/SessionRepo.js";
import { getMyTrips, reserveBikeForCustomer } from "../Repositories/MySqlRepo/TripRepo.js";
import { Response } from "express";
import { getMobileAppBikesByHub } from "../Repositories/MySqlRepo/BikeRepo.js";
import { redisClient } from "../RedisConfig.js";
import { randomBytes } from "crypto";

export const fetchMyTrips = async (request: CustomRequest<{},{},{},{page?: string}>, response: Response) => {
    let session: SessionObject = request.session as SessionObject
    let page = request.query.page ? Number(request.query.page) : 1
    const result = await getMyTrips(session.userId, page)
    response.status(200).json(result)

}

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

export function generateTripId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = randomBytes(8);

  let suffix = "";
  for (let i = 0; i < 8; i++) {
    suffix += chars[bytes[i] % chars.length];
  }

  return `TRI_${suffix}`;
}

export const reserveBike = async (
  request: CustomRequest<{ bikeId: string; hubId: string }>,
  response: Response
) => {
  try {
    const tripId = generateTripId();               // TRI_XXXXXXXX
    const tripSecret = randomBytes(27).toString("base64url").slice(0, 36);
    const customer_id = request.session!.userId;
    const bike_id = request.params.bikeId;
    const hub_id = request.params.hubId;

    const responseTripDTO = await reserveBikeForCustomer(
      tripId,
      customer_id,
      bike_id,
      hub_id,
      tripSecret
    );

    return response.status(200).json(responseTripDTO);
  } catch (err) {
    console.error("❌ reserveBike failed:", err);

    return response.status(400).json({
      message: "Đã xảy ra lỗi, xin vui lòng thử lại."
    });
  }
};