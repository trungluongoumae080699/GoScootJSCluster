export declare enum BikeStatus {
    IDLE = "Idle",
    RESERVED = "Reserved",
    INUSE = "Inuse"
}
export interface Bike {
    id: string;
    name: string;
    status: BikeStatus;
    maximum_speed: number;
    maximum_functional_distance: number;
    purchase_date: number;
    last_service_date: number;
    current_hub?: string | null;
    deleted: boolean;
    created_at: Date;
    battery_status?: number | null;
}
