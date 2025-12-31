import express, { Router, NextFunction, Request, Response } from "express";
import {formlessAuthenticateDashboard, authenticateCustomer, formlessAuthenticateCustomer, registerCustomer } from "../../Controllers/AuthenticationController.js";
import { CustomRequest } from "../../Middlewares/Authorization.js";
import { authenticationRouter } from "../AuthenticationRouter.js";




export const mobileAppAuthRouter: Router = express.Router();

mobileAppAuthRouter.post("/signIn", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    authenticateCustomer(customerRequest, response, next).catch(next)
});

mobileAppAuthRouter.get("/signIn/session", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    formlessAuthenticateCustomer(customerRequest, response).catch(next)
});

mobileAppAuthRouter.post("/signUp", (request: Request, response: Response, next: NextFunction) => {
    console.log("Handing Registration Request")
    const customerRequest: CustomRequest = request as CustomRequest
    registerCustomer(customerRequest, response, next).catch(next)
})

