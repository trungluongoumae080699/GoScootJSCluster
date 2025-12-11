import express, { Application, Request } from "express";
import cors from "cors";
import http from "http";
import type { NextFunction, Response } from "express";

import https from "https";
import { mobileAppAuthenticationRouter } from "./Routes/MobileAppRouters/MobileAppAuthorizationRouter.js";
import { dashboardAuthenticationRouter } from "./Routes/DashboardRouters/DashboardAuthenticationRouter.js";
import { pool, query } from "./MySqlConfig.js";
import { initRedis, redisClient } from "./RedisConfig.js";
import { requestPreProcession } from "./Middlewares/RequestPreProcession.js";
import { mobileAppNonAuthRouter } from "./Routes/MobileAppRouters/MobileAppNonAuthRouter.js";
import { authorize } from "./Middlewares/Authorization.js";
import { LogInType } from "./Repositories/RedisRepo/SessionRepo.js";
import { initMqtt } from "./MqttConfig.js";
import { dashboardNonAuthenticationRouter } from "./Routes/DashboardRouters/DashboardNonAuthenticationRoutes.js";
import { bikeRouter } from "./Routes/BikeRouters.js";
import { authenticationRouter } from "./Routes/AuthenticationRouter.js";


const app: Application = express();
const PORT = 4000;


//app.use(requestPreProcession());

async function checkMySQL() {
  console.log("🔍 Checking MySQL connection...");
  const [rows] = await query("SELECT 1 AS ok");
  console.log("✅ MySQL connected:", rows[0]);
}



async function startServer() {
  try {
    await initRedis()
    await checkMySQL();
    await initMqtt()

    const server = http.createServer(app);
    app.use(requestPreProcession())
    app.use(express.json());
    app.use(express.static("Asset"));

    app.use("/bike", bikeRouter);
    app.use("/auth", authenticationRouter)
    app.use("/app", authorize([LogInType.CUSTOMER]), mobileAppNonAuthRouter);
    app.use("/dashboard", authorize([LogInType.ADMIN]), dashboardNonAuthenticationRouter )

    /** 404 handler (no route matched) */
    app.use((req: Request, res: Response) => {
      res.status(404).json({ message: "Không tìm thấy tài nguyên." });
    });

    /** Centralized error handler */
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      res.status(500).json({ message: "Đã xảy ra lỗi. Xin vui lòng thử lại." });
    });


    // Start server
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server is listening at http://localhost:${PORT}`);
      console.log(
        `✅ Swagger API doc is runnnig at http://localhost:${PORT}/api-docs/`
      );
    });


    server.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server is listening at http://localhost:${PORT}`);
    });

    // graceful shutdown hook
    process.on("SIGINT", async () => {
      console.log("\n🛑 Shutting down...");
      await redisClient.quit();
      await pool.end();
      process.exit(0);
    });

  } catch (err) {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  }
}

startServer()