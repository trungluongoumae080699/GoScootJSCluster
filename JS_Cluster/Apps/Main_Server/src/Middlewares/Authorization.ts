import { RequestHandler, NextFunction } from "express";
import { getSession, LogInType, SessionObject } from "../Repositories/RedisRepo/SessionRepo.js";
import { Request, Response } from "express";
import { ParsedQs } from "qs";

export type RequestObject = {
    _id: string;
    sessionId?: string;
    targetUrl: string;
    createdAt: Date;
    endedAt?: Date;
    requestBody?: string;
    ipAddress?: string;
    userAgent?: string;
};

export interface CustomRequest<
    TParams = any,
    TResBody = any,
    TReqBody = any,
    TQuery = ParsedQs
> extends Request<TParams, TResBody, TReqBody, TQuery> {
    request: RequestObject;
    session?: SessionObject;
}
export function authorize(allowedRoles: LogInType[]): RequestHandler {
    return async (req, res, next) => {
        console.log("🔐 Authorizing...");
        let session: SessionObject | null = null
        const sessionId = req.headers["authorization"] as string | undefined;
        if (sessionId) {
            session = await getSession(sessionId);
            if (session) {
                const now = Date.now();
                const createdAtMs = new Date(session.createdAt).getTime();
                const expiryMs = createdAtMs + session.validPeriod;
                if (now > expiryMs) {
                    res.status(401).json({ message: "Phiên đăng nhập đã hết hạn." });
                    return;
                }
                if (!allowedRoles.includes(session.logInType)) {
                    res.status(401).json({ message: "Bạn không được thực hiện thao tác này" });
                    return;
                }
                (req as any).session = session;

            }
        }
        if (!sessionId || !session) {
            res.status(401).json({ message: "Thiếu mã phiên đăng nhập." });
            return;
        }
        next()

    };
}