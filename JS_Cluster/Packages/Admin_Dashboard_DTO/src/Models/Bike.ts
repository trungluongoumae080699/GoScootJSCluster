export enum BikeStatus {
    IDLE = "Idle",
    RESERVED = "Reserved",
    INUSED = "Inused",
}

export interface Bike {
    id: string,
    name: string,
    status: BikeStatus,
    maximum_speed: number,
    maximum_functional_distance: number,
    purchase_date: number,
    last_service_date: number,
    current_hub?: string | null,
    deleted: boolean,
    created_at: Date,
    battery_status?: number | null
    longitude?: number,
    latitude?: number,
    batteryIsLow: boolean,
    isToppled: boolean,
    isCrashed: boolean,
    isOutOfBound: boolean,
}

export type Hub = {
    id: string,
    longitude: number,
    latitude: number,
    address: string,
    deleted: boolean,
    last_modification_date: number,
    created_at: Date,
}