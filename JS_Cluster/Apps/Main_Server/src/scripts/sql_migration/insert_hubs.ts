import dotenv from "dotenv";
import { promises as fs } from "fs";
import mysql from "mysql2/promise";

dotenv.config({ path: ".env.admin" });

const script_name = "insert_hubs"
const prerequisite_script = "database_modi_01"

type HubSeed = {
  id: string;
  longitude: number;
  latitude: number;
  address: string;
  deleted: boolean;
  last_modification_date: number;
  created_at: string; // stored as ISO string in hubs.json
};

const MIGRATION_NAME = "database_modi_01";

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
      ? `📜 Migration '${name}' already recorded in 'migration' table.`
      : `📜 Migration '${name}' not found in 'migration' table.`
  );

  return exists;
}


/* -------------------------------------------------------------------------- */
/*                         BULK INSERT HUBS FROM JSON                          */
/* -------------------------------------------------------------------------- */

export async function insertHubsFromJsonBulk() {
  console.log("📂 Reading hubs from src/Assets/hubs.json ...");

  const raw = await fs.readFile("src/Assets/hubs.json", "utf8");
  const hubs: HubSeed[] = JSON.parse(raw);

  if (!Array.isArray(hubs) || hubs.length === 0) {
    console.log("⚠️ hubs.json is empty or not an array, nothing to insert.");
    return;
  }

  console.log(`📦 Loaded ${hubs.length} hubs from hubs.json`);

  // Build bulk INSERT
  const placeholders = hubs.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ");

  const sql = `
    INSERT INTO hubs (
      id,
      longitude,
      latitude,
      address,
      last_modification_date,
      deleted,
      created_at
    )
    VALUES ${placeholders}
  `;

  const values: any[] = [];
  for (const hub of hubs) {
    values.push(
      hub.id,
      hub.longitude,
      hub.latitude,
      hub.address,
      hub.last_modification_date,
      hub.deleted,
      new Date(hub.created_at) // TIMESTAMP accepts Date/ISO/Date
    );
  }

  console.log("🚀 Executing bulk INSERT into 'hubs' table...");

  try {
    const [result] = await pool.query(sql, values);
    console.log("✅ Bulk inserted hubs into 'hubs' table.");
    // console.log(result); // uncomment if you want to inspect affectedRows
  } catch (err: any) {
    console.error("❌ Bulk insert failed:", err);
    throw err;
  }
}

/* -------------------------------------------------------------------------- */
/*                                    MAIN                                    */
/* -------------------------------------------------------------------------- */

async function main() {
  try {
   
    await insertHubsFromJsonBulk();
    console.log(`📜 Migration '${script_name}' recorded`);
    console.log("🎉 Done inserting hubs (bulk).");
  } catch (err) {
    console.error("❌ insertHubsFromJsonBulk main() failed:", err);
  } finally {
    await pool.end();
    console.log("🔌 Closed MySQL pool.");
    process.exit()
  }
}

main();