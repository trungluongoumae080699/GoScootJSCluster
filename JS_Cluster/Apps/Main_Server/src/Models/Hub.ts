import { RowDataPacket } from "mysql2";

export interface Hub extends RowDataPacket {
    id: string,
    longitude: number,
    latitude: number
    created_at: number
}