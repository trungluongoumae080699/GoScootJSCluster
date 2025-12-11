import { BikeStatus } from "./Bike.js"

export enum OperationStatus {
    NORMAL = "Normal",
    OUT_OF_BOUND = "Out of bound",
    LOW_BATTERY = "Low battery",
}

export type BikeTelemetry = {
    id: string,
    bike_id: string,
    battery: number,
    last_gps_long: number,
    last_gps_lat: number,
    longitude: number,
    latitude: number
    time: number,
    last_gps_contact_time: number,
    operationStatus: OperationStatus
    usageStatus: BikeStatus
}