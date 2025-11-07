export declare enum TripStateEnum {
    PENDING = "pending",
    COMPLETE = "complete",
    IN_PROGRESS = "in progress"
}
export type Trip = {
    id: string;
    bikeId: string;
    customerId: string;
    tripStatus: TripStateEnum;
    tripExpiryDate: number;
    tripStartDate?: number;
    tripEndDate?: number;
    tripStartLong: number;
    tripStartLat: number;
    tripEndLong?: number;
    tripEndLat?: number;
    tripToken?: string;
};
