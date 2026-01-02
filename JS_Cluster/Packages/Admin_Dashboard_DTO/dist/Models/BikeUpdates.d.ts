import { BikeStatus } from "./Bike.js";
export type BikeUpdate = {
    id: string;
    battery_status: number;
    longitude: number;
    latitude: number;
    batteryIsLow: boolean;
    isToppled: boolean;
    isCrashed: boolean;
    isOutOfBound: boolean;
    usageStatus: BikeStatus;
    currentHub: string | null;
};
