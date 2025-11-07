import { NextFunction, Request, RequestHandler, Response } from "express";




//This middleware will instantiate the Request Object
export function requestPreProcession(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
        console.log(req.url)
        next();
       /*  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
        if (checkIpAccessToken(ip) === 0) {
            res.status(429).json({
                message: 'Rate limit exceeded. Please try again later.'
            });
        }
        else {
            const newRequest: RequestObject = {
                _id: new ObjectId().toHexString(),
                createdAt: new Date(),
                targetUrl: req.url,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            }
            const customRequest: CustomRequest = req as CustomRequest
            customRequest.request = newRequest
            console.log("Preprocessing Done")
            next();
        } */




    };
}