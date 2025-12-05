import { StringColorFormat } from "@faker-js/faker";
import { Trip } from "@trungthao/admin_dashboard_dto";
import { CustomRequest } from "../Middlewares/Authorization.js";
import { Response

 } from "express";
import { findActiveTripReservation } from "../Repositories/MySqlRepo/TripRepo.js";

export type TripRervationPayload = {
  bike_id: string;
  trip_id: string;
  customer_id: string;
  trip_secret: string;
  reservation_expiry: number;
}

export type TripValidationResponse = {
  trip_id: string;
  
}

export const validateTrip = async (
  request: CustomRequest<
    { bikeId: string }, // params
    {}, // body
    TripRervationPayload // headers
    
  >,
  response: Response
) => {
  const { bikeId } = request.params;
  if (bikeId !== request.body.bike_id) {
    return response
      .status(400)
      .json({ error: "bikeId path parameter does not match body bike_id" });
  }
  const trip = await findActiveTripReservation(request.body);
  if (!trip) {
    return response
      .status(404)
      .json({ error: "No active trip reservation found for the given bike and customer" });
  }
  return response.status(200).json({ trip: trip });
  
};