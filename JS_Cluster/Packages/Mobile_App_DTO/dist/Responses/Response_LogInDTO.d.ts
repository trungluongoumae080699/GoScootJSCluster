import { MobileAppCustomer } from "../Models/MobileAppCustomer.js";
export type Response_LogInDTO = {
    userProfile: MobileAppCustomer;
    sessionId: string;
};
