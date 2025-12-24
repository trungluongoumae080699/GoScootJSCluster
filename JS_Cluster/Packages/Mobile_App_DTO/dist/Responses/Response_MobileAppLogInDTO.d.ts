import { MobileAppCustomer } from "../Models/MobileAppCustomer.js";
export type Response_MobileAppLogInDTO = {
    user_profile: MobileAppCustomer;
    session_id: string;
    mqtt_password?: string | null;
};
