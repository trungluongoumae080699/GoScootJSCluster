
import express, { Router, Request, Response } from "express";
import { authenticateAdmin, authenticateCustomer, formlessAuthenticateDashboard, registerCustomer } from "../../Controllers/AuthenticationController.js";
import { NextFunction } from "express-serve-static-core";
import { CustomRequest } from "../../Middlewares/Authorization.js";
import { createTempUser } from "../../Repositories/mqttRepo/mqttDynamicSecurity.js";
import { fetchAlerts, fetchBikes, fetchTelemetryByBike, fetchTripsByBike } from "../../Controllers/DashboardController.js";


export const dashboardNonAuthenticationRouter: Router = express.Router();



dashboardNonAuthenticationRouter.get("/bikes", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchBikes(customerRequest, response)
});

dashboardNonAuthenticationRouter.get("/trips/:bikeId", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchTripsByBike(customerRequest, response)
});

dashboardNonAuthenticationRouter.get("/telemetry/:bikeId", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchTelemetryByBike(customerRequest, response)
});


dashboardNonAuthenticationRouter.get("/alerts", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchAlerts(customerRequest, response)
});


