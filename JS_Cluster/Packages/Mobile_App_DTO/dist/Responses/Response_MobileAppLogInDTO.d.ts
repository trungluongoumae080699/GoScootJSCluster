import { MobileAppCustomer } from "../Models/MobileAppCustomer.js";
export type Response_MobileAppLogInDTO = {
    userProfile: MobileAppCustomer;
    sessionId: string;
};
