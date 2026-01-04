
import express, { Router, Request, Response } from "express";
import { NextFunction } from "express-serve-static-core";
import { CustomRequest } from "../../Middlewares/Authorization.js";
import { createTempUser } from "../../Repositories/mqttRepo/mqttDynamicSecurity.js";
import { fetchAlerts, fetchBikeById, fetchBikesByHub, fetchBikesController, fetchBikeUpdatesByBattery, fetchHubs, fetchTelemetryByBike, fetchTrips} from "../../Controllers/DashboardController.js";


export const dashboardNonAuthenticationRouter: Router = express.Router();

dashboardNonAuthenticationRouter.get("/bikes", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchBikesController(customerRequest, response).catch(next)
});

dashboardNonAuthenticationRouter.get("/bike/:bikeId", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchBikeById(customerRequest, response).catch(next)
});

dashboardNonAuthenticationRouter.get("/update/bike", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    console.log("HAHAHA")
    fetchBikeUpdatesByBattery(customerRequest, response).catch(next)
});


dashboardNonAuthenticationRouter.get("/hubs", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchHubs(customerRequest, response).catch(next)
})

dashboardNonAuthenticationRouter.get("/bikes/hub/:hubId", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchBikesByHub(customerRequest, response).catch(next)
})

dashboardNonAuthenticationRouter.get("/trips", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchTrips(customerRequest, response).catch(next)
});

dashboardNonAuthenticationRouter.get("/telemetry", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchTelemetryByBike(customerRequest, response).catch(next)
});


dashboardNonAuthenticationRouter.get("/alerts", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    fetchAlerts(customerRequest, response).catch(next)
});


