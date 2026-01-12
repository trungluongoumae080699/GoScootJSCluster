import { BikeStatus } from "./Bike.js"

export enum OperationStatus {
    NORMAL = "Normal", //0
    OUT_OF_BOUND = "Out of bound", //1
    LOW_BATTERY = "Low battery", // 2
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
    batteryIsLow: boolean,
    isToppled: boolean,
    isCrashed: boolean,
    isOutOfBound: boolean,
    usageStatus: BikeStatus
}