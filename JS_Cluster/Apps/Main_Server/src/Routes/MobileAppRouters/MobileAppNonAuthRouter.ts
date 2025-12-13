import express, { Router, Request, Response } from "express";
import { authenticateCustomer, formlessAuthenticateCustomer, registerCustomer } from "../../Controllers/AuthenticationController.js";
import { NextFunction } from "express-serve-static-core";
import { CustomRequest } from "../../Middlewares/Authorization.js";
import { cancelReservation, fetchBikesByHub, fetchMyTrips, reserveBike } from "../../Controllers/MobileAppController.js";


export const mobileAppNonAuthRouter: Router = express.Router();

mobileAppNonAuthRouter.get("/trips", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchMyTrips(customerRequest, response).catch(next)
});

mobileAppNonAuthRouter.get("/hub/bikes/:hubId", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchBikesByHub(customerRequest, response).catch(next)
})

mobileAppNonAuthRouter.post("/reserve/:bikeId/:hubId", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    reserveBike(customerRequest, response).catch(next)
})

mobileAppNonAuthRouter.put("/cancel/:tripId", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    cancelReservation(customerRequest, response).catch(next)
})