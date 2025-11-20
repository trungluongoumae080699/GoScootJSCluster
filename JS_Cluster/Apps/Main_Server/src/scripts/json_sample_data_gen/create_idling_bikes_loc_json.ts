import dotenv from "dotenv";
import mysql from "mysql2/promise";
import fs from "fs/promises";

dotenv.config({ path: ".env.admin" });

const OUTPUT_PATH = "src/assets/bike_loc.json";

const pool = mysql.createPool({
    host: process.env.DB_MYSQL_HOST,
    port: Number(process.env.DB_MYSQL_PORT) || 3306,
    user: process.env.DB_MYSQL_ADMIN_USER,
    password: process.env.DB_MYSQL_ADMIN_PASS,
    database: process.env.DB_MYSQL_NAME,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 1,
});

/* -------------------------------------------------------------------------- */
/*                                FETCH DATA                                  */
/* -------------------------------------------------------------------------- */

async function fetchBikeHubCoords() {
    const query = `
        SELECT 
            b.id AS bike_id,
            h.longitude AS hub_longitude,
            h.latitude AS hub_latitude
        FROM bikes b
        JOIN hubs h ON b.current_hub = h.id
        WHERE b.current_hub IS NOT NULL
          AND b.deleted = 0
          AND h.deleted = 0;
    `;

    const [rows] = await pool.query(query);

    // rows is RowDataPacket[], but we'll just treat it as any[]
    const mapped = (rows as any[]).map((row) => ({
        id: row.bike_id as string,
        long: row.hub_longitude as number,
        lat: row.hub_latitude as number,
    }));

    return mapped;
}

/* -------------------------------------------------------------------------- */
/*                                WRITE JSON                                  */
/* -------------------------------------------------------------------------- */

async function writeJsonFile(data: Array<{ id: string; long: number; lat: number }>) {
    const jsonString = JSON.stringify(data, null, 2);
    await fs.writeFile(OUTPUT_PATH, jsonString, "utf8");
    console.log(`📝 Wrote ${data.length} records to ${OUTPUT_PATH}`);
}

/* -------------------------------------------------------------------------- */
/*                                   MAIN                                     */
/* -------------------------------------------------------------------------- */

async function main() {
    const conn = await pool.getConnection();

    try {
        console.log("🚀 Fetching bike–hub coordinates…");
        const coords = await fetchBikeHubCoords();

        console.log(`✅ Fetched ${coords.length} rows from database.`);
        await writeJsonFile(coords);

        console.log("🎉 Export completed.");
    } catch (err) {
        console.error("❌ Export script crashed:", err);
    } finally {
        conn.release();
        await pool.end();
        process.exit(0);
    }
}

main();