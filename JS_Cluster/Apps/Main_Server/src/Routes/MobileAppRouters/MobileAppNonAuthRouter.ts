import express, { Router, Request, Response } from "express";
import { authenticateCustomer, formlessAuthenticateCustomer, registerCustomer } from "../../Controllers/AuthenticationController.js";
import { NextFunction } from "express-serve-static-core";
import { CustomRequest } from "../../Middlewares/Authorization.js";
import { fetchBikesByHub, fetchMyTrips } from "../../Controllers/MobileAppController.js";


export const mobileAppNonAuthRouter: Router = express.Router();

mobileAppNonAuthRouter.get("/trips", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchMyTrips(customerRequest, response)
});

mobileAppNonAuthRouter.get("/hub/bikes/:hubId", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchBikesByHub(customerRequest, response)
})