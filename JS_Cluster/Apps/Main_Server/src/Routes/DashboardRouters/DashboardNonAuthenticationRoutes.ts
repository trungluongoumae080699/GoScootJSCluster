
import express, { Router, Request, Response } from "express";
import { authenticateAdmin, authenticateCustomer, formlessAuthenticateDashboard, registerCustomer } from "../../Controllers/AuthenticationController.js";
import { NextFunction } from "express-serve-static-core";
import { CustomRequest } from "../../Middlewares/Authorization.js";
import { createTempUser } from "../../Repositories/mqttRepo/mqttDynamicSecurity.js";
import { fetchAlerts, fetchBikes, fetchHubs, fetchTelemetryByBike, fetchTripsByBike } from "../../Controllers/DashboardController.js";


export const dashboardNonAuthenticationRouter: Router = express.Router();



dashboardNonAuthenticationRouter.get("/bikes", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchBikes(customerRequest, response).catch(next)
});

dashboardNonAuthenticationRouter.get("/hubs", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchHubs(customerRequest, response).catch(next)
})

dashboardNonAuthenticationRouter.get("/bikes/hub/:hubId", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchHubs(customerRequest, response).catch(next)
})

dashboardNonAuthenticationRouter.get("/trips/:bikeId", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchTripsByBike(customerRequest, response).catch(next)
});

dashboardNonAuthenticationRouter.get("/telemetry/:bikeId", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchTelemetryByBike(customerRequest, response).catch(next)
});


dashboardNonAuthenticationRouter.get("/alerts", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchAlerts(customerRequest, response).catch(next)
});


