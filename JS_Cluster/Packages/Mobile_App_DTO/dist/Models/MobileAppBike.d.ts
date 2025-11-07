export declare enum MobileAppBikeType {
    SCOOTER = "scooter",
    BIKE = "bike"
}
export type MobileAppBike = {
    id: string;
    bikeType: MobileAppBikeType;
    batteryStatus: number;
    maximumSpeed: number;
    maximumFunctionalDistance: number;
};
