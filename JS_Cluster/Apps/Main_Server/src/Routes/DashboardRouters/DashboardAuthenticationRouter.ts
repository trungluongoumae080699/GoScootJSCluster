import express, { Router, NextFunction, Request, Response } from "express";
import { authenticateAdmin, formlessAuthenticateDashboard, authenticateCustomer, formlessAuthenticateCustomer, registerCustomer } from "../../Controllers/AuthenticationController.js";
import { CustomRequest } from "../../Middlewares/Authorization.js";
import { authenticationRouter } from "../AuthenticationRouter.js";




export const dashboardAuthenticationRouter: Router = express.Router();

dashboardAuthenticationRouter.post("/signIn", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    authenticateAdmin(customerRequest, response, next).catch(next)
});

dashboardAuthenticationRouter.get("/signIn/session", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    formlessAuthenticateDashboard(customerRequest, response).catch(next)
});

