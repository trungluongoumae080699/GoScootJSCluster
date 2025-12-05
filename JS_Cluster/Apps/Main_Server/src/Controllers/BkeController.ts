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

export type TripResponsePayload = {
    id: string | null;
    isValid: boolean;
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
  const id: string | null = trip ? trip.id : null;
  const isValid: boolean = trip ? true : false;
  return response.status(200).json({id, isValid});
  
};