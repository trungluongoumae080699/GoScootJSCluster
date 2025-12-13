export declare enum MobileAppTripStateEnum {
    Cancelled = "Cancelled",
    PENDING = "Pending",
    COMPLETE = "Complete",
    IN_PROGRESS = "In Progress"
}
export type MobileAppTrip = {
    id: string;
    bike_id: string;
    hub_id: string;
    customer_id: string;
    trip_status: MobileAppTripStateEnum;
    reservation_date: number;
    reservation_expiry: number;
    trip_start_date?: number | null;
    trip_start_long?: number | null;
    trip_start_lat?: number | null;
    trip_end_date?: number | null;
    trip_end_long?: number | null;
    trip_end_lat?: number | null;
    trip_scret?: string | null;
    price?: number | null;
    isPaid?: boolean | null;
};
