import { RowDataPacket } from "mysql2";

export enum BikeStatus {
    IDLE = "idle",
    RESERVED = "reserved",
    INUSE = "inuse"
}
export interface Bike extends RowDataPacket {
    id: string,
    status: BikeStatus,
    maximum_speed: number,
    maximum_functional_distance: number,
    purchase_date: number,
    last_service_date: number,
    current_hub: string
}