
import express, { Router, Request, Response } from "express";
import { authenticateAdmin, authenticateCustomer, formlessAuthenticateDashboard, registerCustomer } from "../../Controllers/AuthenticationController.js";
import { NextFunction } from "express-serve-static-core";
import { CustomRequest } from "../../Middlewares/Authorization.js";
import { createTempUser } from "../../Repositories/mqttRepo/mqttDynamicSecurity.js";


export const dashboardAuthenticationRouter: Router = express.Router();

dashboardAuthenticationRouter.post("/signIn", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    authenticateAdmin(customerRequest, response, next)
});

dashboardAuthenticationRouter.get("/signIn/session", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    formlessAuthenticateDashboard(customerRequest, response)
});


