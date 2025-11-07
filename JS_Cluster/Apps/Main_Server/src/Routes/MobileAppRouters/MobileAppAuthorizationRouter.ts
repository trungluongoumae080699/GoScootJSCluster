import express, { Router, Request, Response } from "express";
import { authenticateAdmin, authenticateCustomer, formlessAuthenticateCustomer, registerCustomer } from "../../Controllers/AuthenticationController.js";
import { NextFunction } from "express-serve-static-core";
import { CustomRequest } from "../../Middlewares/Authorization.js";


export const mobileAppAuthenticationRouter: Router = express.Router();

mobileAppAuthenticationRouter.post("/signIn", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    authenticateCustomer(customerRequest, response, next)
});

mobileAppAuthenticationRouter.get("/signIn/session", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    formlessAuthenticateCustomer(customerRequest, response,)
});

mobileAppAuthenticationRouter.post("/signUp", (request: Request, response: Response, next: NextFunction) => {
    console.log("Handing Registration Request")
    const customerRequest: CustomRequest = request as CustomRequest
    registerCustomer(customerRequest, response, next)
})