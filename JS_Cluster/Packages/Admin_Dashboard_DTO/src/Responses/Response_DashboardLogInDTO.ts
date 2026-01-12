import { DashboardStaff } from "../Models/DashboardStaff.js"

export type Response_DashboardLogInDTO = {
    staffProfile: DashboardStaff,
    totalBikes: number,
    totalAlerts: number

}