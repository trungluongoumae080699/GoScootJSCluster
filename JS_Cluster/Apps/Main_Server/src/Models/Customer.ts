import { RowDataPacket } from "mysql2";

export interface Customer extends RowDataPacket {
    id: string,
    full_name: string,
    phone_number: string,
    password: string,
    created_at: number,
}