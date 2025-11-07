export declare enum MobileAppTripStateEnum {
    Cancelled = "cancelled",
    PENDING = "pending",
    COMPLETE = "complete",
    IN_PROGRESS = "in progress"
}
export type MobileAppTrip = {
    id: string;
    bike_id: string;
    customer_id: string;
    trip_status: MobileAppTripStateEnum;
    reservation_expiry: number;
    trip_start_date?: number;
    trip_end_date?: number;
    trip_start_long: number;
    trip_start_lat: number;
    trip_end_long?: number;
    trip_end_lat?: number;
    trip_scret?: string;
};
