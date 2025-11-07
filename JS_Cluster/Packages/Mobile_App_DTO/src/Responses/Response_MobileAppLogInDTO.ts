import { MobileAppCustomer } from "../Models/MobileAppCustomer.js"
import { MobileAppTrip } from "../Models/MobileAppTrip.js"


export type Response_MobileAppLogInDTO = {
    userProfile: MobileAppCustomer,
    sessionId: string,
}