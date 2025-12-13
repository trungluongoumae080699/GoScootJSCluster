import express, { Router, Request, Response } from "express";
import { NextFunction } from "express-serve-static-core";
import { CustomRequest } from "../Middlewares/Authorization.js";
import { validateTrip } from "../Controllers/BkeController.js";



export const bikeRouter: Router = express.Router();

bikeRouter.post("/trip/validate/:bikeId", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    validateTrip(customerRequest, response)
});

