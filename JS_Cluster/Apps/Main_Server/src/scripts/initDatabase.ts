import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2";
import dotenv from "dotenv";

dotenv.config({ path: ".env.admin" });

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
/*                              Table: customers                              */
/* -------------------------------------------------------------------------- */
async function createCustomersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id CHAR(36) PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      phone_number VARCHAR(15) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("✅ Table 'customers' ready.");
}

/* -------------------------------------------------------------------------- */
/*                                Table: hubs                                 */
/* -------------------------------------------------------------------------- */
async function createHubsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hubs (
      id CHAR(36) PRIMARY KEY,
      longitude DOUBLE NOT NULL,
      latitude DOUBLE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("✅ Table 'hubs' ready.");
}

/* -------------------------------------------------------------------------- */
/*                                Table: bikes                                */
/* -------------------------------------------------------------------------- */
async function createBikesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bikes (
      id CHAR(36) PRIMARY KEY,
      status ENUM('idle', 'reserved', 'inuse') DEFAULT 'idle',
      maximum_speed DOUBLE NOT NULL,
      maximum_functional_distance DOUBLE NOT NULL,
      purchase_date DATETIME,
      last_service_date DATETIME,
      current_hub CHAR(36),
      FOREIGN KEY (current_hub)
        REFERENCES hubs(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("✅ Table 'bikes' ready.");
}

/* -------------------------------------------------------------------------- */
/*                               Table: staff                                 */
/* -------------------------------------------------------------------------- */
async function createStaffTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS staff (
      id CHAR(36) PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("✅ Table 'staff' ready.");
}

/* -------------------------------------------------------------------------- */
/*                               Table: trips                                 */
/* -------------------------------------------------------------------------- */
async function createTripsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trips (
      id CHAR(36) PRIMARY KEY,
      bike_id CHAR(36) NOT NULL,
      customer_id CHAR(36) NOT NULL,
      trip_status ENUM('cancelled', 'pending', 'complete', 'in progress') DEFAULT 'pending',
      reservation_expiry DATETIME NOT NULL,
      trip_start_date DATETIME,
      trip_end_date DATETIME,
      trip_start_long DOUBLE NOT NULL,
      trip_start_lat DOUBLE NOT NULL,
      trip_end_long DOUBLE,
      trip_end_lat DOUBLE,
      trip_secret CHAR(64),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bike_id)
        REFERENCES bikes(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
      FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("✅ Table 'trips' ready.");
}

/* -------------------------------------------------------------------------- */
/*                              Table initializer                             */
/* -------------------------------------------------------------------------- */
async function initTables() {
  console.log("⚙️  Creating database tables...");
  try {
    await createCustomersTable();
    await createHubsTable();
    await createBikesTable();
    await createStaffTable();
    await createTripsTable();
    console.log("✅ All tables created successfully.");
  } catch (err) {
    console.error("❌ Failed to create tables:", err);
  }
}

/* -------------------------------------------------------------------------- */
/*                      Procedures / Events: individual funcs                 */
/* -------------------------------------------------------------------------- */


async function createTripReservationProcedure() {
  await pool.query("DROP PROCEDURE IF EXISTS CreateTripReservation;");

  const sql = `
CREATE PROCEDURE CreateTripReservation(
    IN para_trip_id            CHAR(36),
    IN para_customer_id        CHAR(36),
    IN para_bike_id            CHAR(36),
    IN para_hub_long           DOUBLE,
    IN para_hub_lat            DOUBLE,
    IN para_reservation_expiry DATETIME,
    IN para_trip_secret        CHAR(64)
)
BEGIN
    DECLARE existing_count INT DEFAULT 0;

    SELECT COUNT(*) INTO existing_count
    FROM trips
    WHERE customer_id = para_customer_id
      AND trip_status = 'pending';

    IF existing_count > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Customer already has a pending reservation';
    ELSE
        IF para_reservation_expiry <= NOW() THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Reservation expiry must be in the future';
        END IF;

        START TRANSACTION;

        UPDATE bikes
           SET status = 'reserved'
         WHERE id = para_bike_id
           AND status = 'idle';

        IF ROW_COUNT() = 0 THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Bike is not available for reservation';
        ELSE
            INSERT INTO trips (
                id,
                bike_id,
                customer_id,
                trip_status,
                reservation_expiry,
                trip_start_long,
                trip_start_lat,
                trip_secret
            )
            VALUES (
                para_trip_id,
                para_bike_id,
                para_customer_id,
                'pending',
                para_reservation_expiry,
                para_hub_long,
                para_hub_lat,
                para_trip_secret
            );

            COMMIT;
        END IF;
    END IF;
END;
  `;
  await pool.query(sql);
  console.log("✅ Stored procedure 'CreateTripReservation' created.");
}

async function createCancelExpiredTripsEvent() {
  await pool.query("DROP EVENT IF EXISTS cancel_expired_trips;");

  const sql = `
CREATE EVENT IF NOT EXISTS cancel_expired_trips
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
  START TRANSACTION;

  DROP TEMPORARY TABLE IF EXISTS tmp_expired_trips;
  CREATE TEMPORARY TABLE tmp_expired_trips (
    id CHAR(36) PRIMARY KEY,
    bike_id CHAR(36)
  ) ENGINE=MEMORY;

  INSERT INTO tmp_expired_trips (id, bike_id)
  SELECT id, bike_id
  FROM trips
  WHERE trip_status = 'pending'
    AND reservation_expiry <= NOW()
  FOR UPDATE;

  UPDATE bikes AS b
  JOIN tmp_expired_trips AS e ON e.bike_id = b.id
  SET b.status = 'idle';

  UPDATE trips AS t
  JOIN tmp_expired_trips AS e ON e.id = t.id
  SET
    t.trip_status   = 'cancelled',
    t.trip_secret   = NULL
    -- , t.token_expiry  = NULL   -- uncomment only if the column exists
  ;

  DROP TEMPORARY TABLE IF EXISTS tmp_expired_trips;

  COMMIT;
END;
  `;
  await pool.query(sql);
  console.log("✅ Event 'cancel_expired_trips' created (every 1 min).");
}

/* -------------------------------------------------------------------------- */
/*                           High-level initializer                           */
/* -------------------------------------------------------------------------- */

async function initDatabaseObjects() {
  const conn = await pool.getConnection();
  try {
    console.log("⚙️  Initializing MySQL procedures and events...");
    await createTripReservationProcedure();
    await createCancelExpiredTripsEvent();
    console.log("✅ Procedures and events initialized.");
  } catch (err) {
    console.error("❌ Failed to initialize database objects:", err);
  } finally {
    conn.release();
  }
}


/* -------------------------------------------------------------------------- */
/*                             Bootstrap (standalone)                         */
/* -------------------------------------------------------------------------- */

function logEnv() {
  console.log("🔧 MySQL target:");
  console.log(`   • host=${process.env.DB_MYSQL_HOST}`);
  console.log(`   • port=${process.env.DB_MYSQL_PORT || 3306}`);
  console.log(`   • db  =${process.env.DB_MYSQL_NAME}`);
  console.log(`   • user=${process.env.DB_MYSQL_ADMIN_USER}`);
}

async function pingDB() {
  interface NowRow extends RowDataPacket { now: string }

  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query<NowRow[]>("SELECT NOW() AS now");
    console.log(`🟢 DB reachable. NOW() = ${rows?.[0]?.now}`);
  } finally {
    conn.release();
  }
}

process.on("unhandledRejection", (err) => {
  console.error("❌ UnhandledRejection:", err);
  process.exitCode = 1;
});
process.on("uncaughtException", (err) => {
  console.error("❌ UncaughtException:", err);
  process.exit(1);
});

async function main() {
  console.log("🚀 Starting DB initialization (admin mode)...");
  logEnv();

  console.time("⏱️ total");

  try {
    console.time("⏱️ ping");
    await pingDB();
    console.timeEnd("⏱️ ping");

    console.time("⏱️ tables");
    await initTables();
    console.timeEnd("⏱️ tables");

    console.time("⏱️ routines+events");
    await initDatabaseObjects();
    console.timeEnd("⏱️ routines+events");

    console.log("✅ All DB objects are in place.");
  } catch (err) {
    console.error("❌ Initialization failed:", err);
    process.exitCode = 1;
  } finally {
    console.timeEnd("⏱️ total");
    await pool.end().catch(() => {});
    console.log("👋 Pool closed. Done.");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // Run only when executed directly (not when imported)
  main();
}