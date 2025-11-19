import dotenv from "dotenv";
import { promises as fs } from "fs";
import mysql from "mysql2/promise";

dotenv.config({ path: ".env.admin" });

const script_name = "insert_staff";
const prerequisite_script = "database_modi_01";

type StaffSeed = {
  id: string;
  full_name: string;
  email: string;
  password: string;  // stored as plain text in JSON
  created_at: string; // ISO string
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
      ? `📜 Migration '${name}' already recorded in 'migration' table.`
      : `📜 Migration '${name}' not found in 'migration' table.`
  );

  return exists;
}

/* -------------------------------------------------------------------------- */
/*                       BULK INSERT STAFF FROM JSON                           */
/* -------------------------------------------------------------------------- */

async function insertStaffFromJsonBulk() {
  console.log("📂 Reading staff from src/Assets/staff.json ...");

  const raw = await fs.readFile("src/Assets/staff.json", "utf8");
  const staffList: StaffSeed[] = JSON.parse(raw);

  if (!Array.isArray(staffList) || staffList.length === 0) {
    console.log("⚠️ staff.json is empty or not an array, nothing to insert.");
    return;
  }

  console.log(`📦 Loaded ${staffList.length} staff entries from staff.json`);

  const placeholders = staffList.map(() => "(?, ?, ?, ?, ?)").join(", ");

  const sql = `
    INSERT INTO staff (
      id,
      full_name,
      email,
      password,
      created_at
    )
    VALUES ${placeholders}
  `;

  const values: any[] = [];
  for (const s of staffList) {
    values.push(
      s.id,
      s.full_name,
      s.email,
      s.password,
      new Date(s.created_at)
    );
  }

  console.log("🚀 Executing bulk INSERT into 'staff' table...");

  try {
    await pool.query(sql, values);
    console.log("✅ Bulk inserted staff into 'staff' table.");
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
    await insertStaffFromJsonBulk();
    console.log(`📜 Migration '${script_name}' recorded`);
    console.log("🎉 Done inserting staff (bulk).");

  } catch (err) {
    console.error("❌ insertStaffFromJsonBulk main() failed:", err);
  } finally {
    await pool.end();
    console.log("🔌 Closed MySQL pool.");
    process.exit();
  }
}

main();