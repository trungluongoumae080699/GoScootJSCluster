
import express, { Router, Request, Response } from "express";

import { NextFunction } from "express-serve-static-core";
import { authenticateAdmin, formlessAuthenticateDashboard, authenticateCustomer, formlessAuthenticateCustomer, registerCustomer } from "../Controllers/AuthenticationController.js";
import { CustomRequest } from "../Middlewares/Authorization.js";



export const authenticationRouter: Router = express.Router();

authenticationRouter.post("/dashboard/signIn", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    authenticateAdmin(customerRequest, response, next).catch(next)
});

authenticationRouter.get("/dashboard/signIn/session", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    formlessAuthenticateDashboard(customerRequest, response).catch(next)
});

authenticationRouter.post("/app/signIn", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    authenticateCustomer(customerRequest, response, next).catch(next)
});

authenticationRouter.get("/app/signIn/session", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    formlessAuthenticateCustomer(customerRequest, response).catch(next)
});

authenticationRouter.post("/app/signUp", (request: Request, response: Response, next: NextFunction) => {
    console.log("Handing Registration Request")
    const customerRequest: CustomRequest = request as CustomRequest
    registerCustomer(customerRequest, response, next).catch(next)
})

