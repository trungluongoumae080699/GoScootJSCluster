
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

dashboardAuthenticationRouter.get("/formless/signIn", (request: Request, response: Response, next: NextFunction) => {
    const customerRequest: CustomRequest = request as CustomRequest
    formlessAuthenticateDashboard(customerRequest, response)
});

dashboardAuthenticationRouter.post("/debug/dynsec/create-test-client", async (req, res) => {
  const username = "node_test_client_3";
  const password = "test123";

  try {
    await createTempUser(username, password);
    return res.json({
      message: "OK",
      username,
      password,
    });
  } catch (err: any) {
    console.error("[DEBUG][DynSec] Failed to create test client:", err);
    return res.status(500).json({
      message: "Failed to create test client",
      error: err?.message ?? String(err),
    });
  }
});

