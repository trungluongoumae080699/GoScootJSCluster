import dotenv from "dotenv";
import { promises as fs } from "fs";
import mysql from "mysql2/promise";

dotenv.config({ path: ".env.admin" });

const script_name = "updat_bike_names";
const prerequisite_script = "insert_bikes";

// must match your trips.json structure
type TripSeed = {
    id: string;
    bike_id: string;
    customer_id: string;
    hub_id: string;
    trip_status: string;
    reservation_date: number;
    reservation_expiry: number;
    trip_start_date: number;
    trip_end_date: number;
    trip_end_long: number;
    trip_end_lat: number;
    trip_secret: string | null;
};

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
/*                         CHECK MIGRATION HAS RUN                             */
/* -------------------------------------------------------------------------- */

async function findScriptByName(name: string): Promise<boolean> {
    const [rows] = await pool.query(
        `SELECT 1 FROM migration WHERE name = ? LIMIT 1`,
        [name]
    );

    const exists = Array.isArray(rows) && rows.length > 0;

    console.log(
        exists
            ? `📜 Migration '${name}' is already recorded.`
            : `⚠️ Migration '${name}' not found in migration table.`
    );

    return exists;
}


/* -------------------------------------------------------------------------- */
/*                         UPDATE BIKES' Names                         */
/* -------------------------------------------------------------------------- */

async function updateBikeNames() {
    console.log("Updating bikes' names ...");
    await pool.query(
        `UPDATE bikes
            SET name = 'VINFAST_7890';`
    )



    console.log(`✅ Successfully add names trips.`);
}

/* -------------------------------------------------------------------------- */
/*                                    MAIN                                    */
/* -------------------------------------------------------------------------- */

async function main() {
    try {
        await updateBikeNames();
        console.log(`📜 Migration '${script_name}' recorded`);
        console.log("🎉 Trip insertion complete!");

    } catch (err) {
        console.error("❌ updateBikesName main() failed:", err);
    } finally {
        await pool.end();
        console.log("🔌 Closed MySQL pool.");
        process.exit();
    }
}

main();
