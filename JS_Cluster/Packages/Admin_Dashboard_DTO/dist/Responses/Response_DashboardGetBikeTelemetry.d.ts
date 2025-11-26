import { BikeTelemetry } from "../Models/BikeTelemetry.js";
export interface Response_DashboardGetBikeTelemetryDTO {
    data: BikeTelemetry[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}
