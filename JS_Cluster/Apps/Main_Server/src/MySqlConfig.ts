import mysql, {
    RowDataPacket,
    OkPacket,
    ResultSetHeader,
} from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config()

export const pool = mysql.createPool({
    host: process.env.DB_MYSQL_HOST,
    port: Number(process.env.DB_MYSQL_PORT) || 3306,
    user: process.env.DB_MYSQL_RUNTIME_USER,
    password: process.env.DB_MYSQL_RUNTIME_PASS,
    database: process.env.DB_MYSQL_NAME,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 1,
});

export type QueryResult =
    | RowDataPacket[]
    | RowDataPacket[][]
    | OkPacket
    | OkPacket[]
    | ResultSetHeader;

export async function query<T extends QueryResult = RowDataPacket[]>(
    sql: string,
    params?: any[]
): Promise<T> {
    const [rows] = await pool.query<T>(sql, params);
    return rows;
}