import { BikeStatus } from "./Bike.js"
import { OperationStatus } from "./BikeTelemetry.js"

export type BikeUpdate = {
    id: string,
    battery_status: number,
    longitude: number,
    latitude: number,
    operationStatus: OperationStatus,
    usageStatus: BikeStatus,
    currentHub: string | null,
}