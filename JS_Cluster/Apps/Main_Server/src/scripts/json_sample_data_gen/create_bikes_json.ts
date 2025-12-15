import { promises as fs } from "fs";
import path from "path";
import { faker } from "@faker-js/faker";
import { HubSeed } from "./create_hubs_json.js";

const BikeStatus = {
  IDLE: "Idle",
  RESERVED: "Reserved",
  INUSE: "Inused"
} as const;

export interface BikeSeed {
  id: string;
  status: "Idle" | "Reserved" | "Inused"
  maximum_speed: number;
  maximum_functional_distance: number;
  purchase_date: number;
  last_service_date: number;
  current_hub?: string | null;
  deleted: boolean;
  created_at: string;
}

const OUTPUT_DIR = "src/Assets";
const BIKE_COUNT = 1500;



/* -------------------------------------------------------------------------- */
/*                                 MAIN SCRIPT                                 */
/* -------------------------------------------------------------------------- */

export async function generateBikesJson() {
  console.log("📂 Reading hub IDs from src/Assets/hubIds.json ...");

  const hubIdsRaw = await fs.readFile(path.join(OUTPUT_DIR, "hubIds.json"), "utf8");
  const inUsedBikeIds: string[] = await fs.readFile(path.join(OUTPUT_DIR, "inUseBikeIds.json"), "utf8").then(data => JSON.parse(data)).catch(() => []);
  const idlingBikeIds: string[] = await fs.readFile(path.join(OUTPUT_DIR, "idlingBikeIds.json"), "utf8").then(data => JSON.parse(data)).catch(() => []);
  const hubs: HubSeed[] = await fs.readFile(path.join(OUTPUT_DIR, "hubs.json"), "utf8").then(data => JSON.parse(data)).catch(() => []);
  const bikes: BikeSeed[] = [];
  const bikeLoc: Record<string, [number, number]> = {};
  for (const id of idlingBikeIds) {
    const status = BikeStatus.IDLE; // or however you define it
    const createdAt = new Date();
    const current_hub = faker.helpers.arrayElement(hubs).id;
    const assignedHub = faker.helpers.arrayElement(hubs);
    bikeLoc[id] = [assignedHub.latitude, assignedHub.longitude];
    const now = Date.now();

    const purchase_date = faker.number.int({
      min: now - 1000 * 60 * 60 * 24 * 365 * 2, // 2 years ago
      max: now - 1000 * 60 * 60 * 24 * 30, // 1 month ago
    });

    const last_service_date = faker.number.int({
      min: purchase_date,
      max: now,
    });

    const bike: BikeSeed = {
      id,
      status,
      maximum_speed: faker.number.int({ min: 20, max: 40 }),
      maximum_functional_distance: faker.number.int({ min: 10, max: 100 }),
      purchase_date: purchase_date,
      last_service_date: last_service_date,
      current_hub,
      deleted: false,
      created_at: new Date(purchase_date).toISOString(),
    };

    bikes.push(bike);
  }
  for (const id of inUsedBikeIds) {
    const status = BikeStatus.INUSE;
    const now = Date.now();
    const purchase_date = faker.number.int({
      min: now - 1000 * 60 * 60 * 24 * 365 * 2, // 2 years ago
      max: now - 1000 * 60 * 60 * 24 * 30, // 1 month ago
    });

    const last_service_date = faker.number.int({
      min: purchase_date,
      max: now,
    });

    const bike: BikeSeed = {
      id,
      status,
      maximum_speed: faker.number.int({ min: 20, max: 40 }),
      maximum_functional_distance: faker.number.int({ min: 10, max: 100 }),
      purchase_date,
      last_service_date,
      current_hub: null,
      deleted: false,
      created_at: new Date(purchase_date).toISOString(),
    };
    bikes.push(bike)

  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  await fs.writeFile(
    path.join(OUTPUT_DIR, "bike_loc.json"),
    JSON.stringify(bikeLoc, null, 2),
    "utf8"
  );

  await fs.writeFile(
    path.join(OUTPUT_DIR, "bikes.json"),
    JSON.stringify(bikes, null, 2)
  );

  console.log(`✅ Generated ${BIKE_COUNT} bikes → bikes.json`);
  console.log(`🔑 Bike IDs saved → bikeIds.json`);
}

/* -------------------------------------------------------------------------- */
/*                               RUN IF DIRECTLY                               */
/* -------------------------------------------------------------------------- */

generateBikesJson()
  .then(
    () => {
      console.log("🎉 Bike generation completed.")
      process.exit(0)
    }
  )
  .catch((err) => {
    console.error("❌ Generation failed:", err)
    process.exit(0)
  }
  );