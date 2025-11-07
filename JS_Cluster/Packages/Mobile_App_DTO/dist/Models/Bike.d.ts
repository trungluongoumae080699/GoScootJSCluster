export declare enum BikeType {
    SCOOTER = "scooter",
    BIKE = "bike"
}
export type Bike = {
    id: string;
    bikeType: BikeType;
    batteryStatus: number;
    maximumSpeed: number;
    maximumFunctionalDistance: number;
};
