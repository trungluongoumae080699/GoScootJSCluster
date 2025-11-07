import { Staff } from "../Models/Staff.js";
export type Response_LogInDTO = {
    staffProfile: Staff;
    sessionId: string;
};
