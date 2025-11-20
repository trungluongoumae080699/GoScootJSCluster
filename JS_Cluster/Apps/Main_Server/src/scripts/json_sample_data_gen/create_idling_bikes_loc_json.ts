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
    return rows as any[];
}

/* -------------------------------------------------------------------------- */
/*                        CONVERT TO MAP STRUCTURE                             */
/* -------------------------------------------------------------------------- */

function convertToMap(rows: any[]) {
    const map: Record<string, [number, number]> = {};

    for (const row of rows) {
        const id = row.bike_id;
        const lat = row.hub_latitude;
        const long = row.hub_longitude;

        map[id] = [lat, long];
    }

    return map;
}

/* -------------------------------------------------------------------------- */
/*                                WRITE JSON                                  */
/* -------------------------------------------------------------------------- */

async function writeJsonFile(data: any) {
    const jsonString = JSON.stringify(data, null, 2);
    await fs.writeFile(OUTPUT_PATH, jsonString, "utf8");
    console.log(`📝 Wrote map with ${Object.keys(data).length} entries to ${OUTPUT_PATH}`);
}

/* -------------------------------------------------------------------------- */
/*                                   MAIN                                     */
/* -------------------------------------------------------------------------- */

async function main() {
    const conn = await pool.getConnection();

    try {
        console.log("🚀 Fetching bike–hub coordinates…");
        const rows = await fetchBikeHubCoords();

        console.log(`✅ Retrieved ${rows.length} rows.`);

        const map = convertToMap(rows);

        await writeJsonFile(map);

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