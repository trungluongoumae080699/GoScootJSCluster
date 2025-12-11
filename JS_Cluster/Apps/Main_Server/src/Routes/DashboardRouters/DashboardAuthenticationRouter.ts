import express, { Router, NextFunction, Request, Response } from "express";
import { authenticateAdmin, formlessAuthenticateDashboard, authenticateCustomer, formlessAuthenticateCustomer, registerCustomer } from "../../Controllers/AuthenticationController.js";
import { CustomRequest } from "../../Middlewares/Authorization.js";
import { authenticationRouter } from "../AuthenticationRouter.js";




export const dashboardAuthenticationRouter: Router = express.Router();

dashboardAuthenticationRouter.post("/dashboard/signIn", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    authenticateAdmin(customerRequest, response, next).catch(next)
});

dashboardAuthenticationRouter.get("/dashboard/signIn/session", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    formlessAuthenticateDashboard(customerRequest, response).catch(next)
});

dashboardAuthenticationRouter.post("/app/signIn", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    authenticateCustomer(customerRequest, response, next).catch(next)
});

dashboardAuthenticationRouter.get("/app/signIn/session", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    formlessAuthenticateCustomer(customerRequest, response).catch(next)
});

dashboardAuthenticationRouter.post("/app/signUp", (request: Request, response: Response, next: NextFunction) => {
    console.log("Handing Registration Request")
    const customerRequest: CustomRequest = request as CustomRequest
    registerCustomer(customerRequest, response, next).catch(next)
})

