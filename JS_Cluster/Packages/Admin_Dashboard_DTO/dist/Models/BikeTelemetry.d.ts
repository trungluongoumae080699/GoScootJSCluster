import { BikeStatus } from "./Bike.js";
export declare enum OperationStatus {
    NORMAL = "Normal",//0
    OUT_OF_BOUND = "Out of bound",//1
    LOW_BATTERY = "Low battery"
}
export type BikeTelemetry = {
    id: string;
    bike_id: string;
    battery: number;
    last_gps_long: number;
    last_gps_lat: number;
    longitude: number;
    latitude: number;
    time: number;
    last_gps_contact_time: number;
    operationStatus: OperationStatus;
    usageStatus: BikeStatus;
};
