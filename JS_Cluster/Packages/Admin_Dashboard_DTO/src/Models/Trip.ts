export enum TripStatus {
    CANCELLED = "cancelled",
    PENDING = "pending",
    COMPLETE = "complete",
    IN_PROGRESS = "in progress"
}

export interface Trip {
    id: string,
    bike_id: string,
    customer_id: string,
    hub_id: string,
    trip_status: TripStatus
    reservation_date: number,
    reservation_expiry: number,
    trip_start_date?: number | null,
    trip_end_date?: number | null,
    trip_end_long?: number | null,
    trip_end_lat?: number | null,
    trip_secret?: string | null,
    price?: number | null,
    deleted: boolean,
    isPaid: boolean,
    created_at: Date
}