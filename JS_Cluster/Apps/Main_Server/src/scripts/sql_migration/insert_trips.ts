import dotenv from "dotenv";
import { promises as fs } from "fs";
import mysql from "mysql2/promise";

dotenv.config({ path: ".env.admin" });

const script_name = "insert_trips";
const prerequisite_script = "database_modi_02";

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
/*                             BULK INSERT (CHUNKED)                           */
/* -------------------------------------------------------------------------- */

async function insertTripsChunk(trips: TripSeed[]) {
  const placeholders = trips.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");

  const sql = `
    INSERT INTO trips (
      id,
      bike_id,
      customer_id,
      hub_id,
      trip_status,
      reservation_date,
      reservation_expiry,
      trip_start_date,
      trip_end_date,
      trip_end_long,
      trip_end_lat,
      trip_secret
    )
    VALUES ${placeholders}
  `;

  const values: any[] = [];

  for (const t of trips) {
    values.push(
      t.id,
      t.bike_id,
      t.customer_id,
      t.hub_id,
      t.trip_status,
      t.reservation_date,
      t.reservation_expiry,
      t.trip_start_date,
      t.trip_end_date,
      t.trip_end_long,
      t.trip_end_lat,
      t.trip_secret
    );
  }

  return pool.query(sql, values);
}

/* -------------------------------------------------------------------------- */
/*                         READ trips.json AND INSERT                          */
/* -------------------------------------------------------------------------- */

async function insertTripsFromJsonBulk() {
  console.log("📂 Reading trips from src/Assets/trips.json ...");

  const raw = await fs.readFile("src/Assets/trips.json", "utf8");
  const trips: TripSeed[] = JSON.parse(raw);

  if (!Array.isArray(trips) || trips.length === 0) {
    console.log("⚠️ trips.json is empty or not an array, nothing to insert.");
    return;
  }

  console.log(`📦 Loaded ${trips.length} trips from trips.json`);

  // Chunk size (safe for MySQL)
  const CHUNK_SIZE = 500;
  let insertedCount = 0;

  console.log("🚀 Starting chunked bulk insert (500 rows per chunk)...");

  for (let i = 0; i < trips.length; i += CHUNK_SIZE) {
    const chunk = trips.slice(i, i + CHUNK_SIZE);

    try {
      await insertTripsChunk(chunk);
      insertedCount += chunk.length;
      console.log(`   ➕ Inserted chunk ${i / CHUNK_SIZE + 1} → Total: ${insertedCount}`);
    } catch (err) {
      console.error("❌ Failed inserting chunk:", err);
      throw err;
    }
  }

  console.log(`✅ Successfully inserted all ${insertedCount} trips.`);
}

/* -------------------------------------------------------------------------- */
/*                                    MAIN                                    */
/* -------------------------------------------------------------------------- */

async function main() {
  try {
    await insertTripsFromJsonBulk();
    console.log(`📜 Migration '${script_name}' recorded`);
    console.log("🎉 Trip insertion complete!");

  } catch (err) {
    console.error("❌ insertTripsFromJsonBulk main() failed:", err);
  } finally {
    await pool.end();
    console.log("🔌 Closed MySQL pool.");
    process.exit();
  }
}

main();