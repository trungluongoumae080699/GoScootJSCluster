import { RowDataPacket } from "mysql2";

export interface Staff extends RowDataPacket {
    id: string,
    full_name: string,
    email: string,
    password: string,
    created_at: string
}