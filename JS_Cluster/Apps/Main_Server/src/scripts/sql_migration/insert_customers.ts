import dotenv from "dotenv";
import { promises as fs } from "fs";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

dotenv.config({ path: ".env.admin" });

const script_name = "insert_customers";
const prerequisite_script = "database_modi_01";

type CustomerSeed = {
  id: string;
  full_name: string;
  phone_number: string;
  password: string; // plain text from JSON
  created_at: string;
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
/*                    CHECK IF A MIGRATION ENTRY EXISTS                       */
/* -------------------------------------------------------------------------- */

async function findScriptByName(name: string): Promise<boolean> {
  const [rows] = await pool.query(
    `SELECT 1 FROM migration WHERE name = ? LIMIT 1`,
    [name]
  );

  const exists = Array.isArray(rows) && rows.length > 0;

  console.log(
    exists
      ? `📜 Migration '${name}' already found in migration table`
      : `⚠️ Migration '${name}' NOT found in migration table`
  );

  return exists;
}

/* -------------------------------------------------------------------------- */
/*                    BULK INSERT CUSTOMERS (WITH BCRYPT)                     */
/* -------------------------------------------------------------------------- */

async function insertCustomersFromJsonBulk() {
  console.log("📂 Reading customers from src/Assets/customers.json ...");

  const raw = await fs.readFile("src/Assets/customers.json", "utf8");
  const customers: CustomerSeed[] = JSON.parse(raw);

  if (!Array.isArray(customers) || customers.length === 0) {
    console.log("⚠️ customers.json is empty or not an array, nothing to insert.");
    return;
  }

  console.log(`📦 Loaded ${customers.length} customers from customers.json`);

  // 🔐 Hash passwords before inserting
  console.log("🔐 Hashing passwords using bcrypt...");
  const saltRounds = 10;

  const hashedCustomers = await Promise.all(
    customers.map(async (c) => ({
      ...c,
      password: await bcrypt.hash(c.password, saltRounds),
    }))
  );

  console.log("🔐 Password hashing complete.");

  // Build SQL placeholders
  const placeholders = hashedCustomers.map(() => "(?, ?, ?, ?, ?)").join(", ");

  const sql = `
    INSERT INTO customers (
      id,
      full_name,
      phone_number,
      password,
      created_at
    )
    VALUES ${placeholders}
  `;

  const values: any[] = [];

  for (const c of hashedCustomers) {
    values.push(
      c.id,
      c.full_name,
      c.phone_number,
      c.password,               // 🔐 hashed password
      new Date(c.created_at)
    );
  }

  console.log("🚀 Executing bulk INSERT into 'customers' table...");

  try {
    await pool.query(sql, values);
    console.log("✅ Bulk inserted all customers into 'customers' table.");
  } catch (err: any) {
    console.error("❌ Bulk insert failed:", err);
    throw err;
  }
}

/* -------------------------------------------------------------------------- */
/*                                     MAIN                                   */
/* -------------------------------------------------------------------------- */

async function main() {
  try {
    

    await insertCustomersFromJsonBulk();
    console.log(`📜 Migration '${script_name}' recorded.`);
    console.log("🎉 Done inserting customers (bulk + bcrypt).");

  } catch (err) {
    console.error("❌ insertCustomersFromJsonBulk main() failed:", err);
  } finally {
    await pool.end();
    console.log("🔌 Closed MySQL pool.");
    process.exit();
  }
}

main();