import { initMqtt } from "../../MqttConfig.js";
import { promises as fs } from "fs";
import { createBikeUser } from "../../Repositories/mqttRepo/mqttDynamicSecurity.js";

type BikeCred = {
  username: string;
  password: string;
};
export async function insertBikesFromJsonBulk() {
  await initMqtt();
  console.log("📂 Reading bikes from src/Assets/bike.json ...");

  const raw = await fs.readFile("src/Assets/bike_creds.json", "utf8");
  const bikes: BikeCred[] = JSON.parse(raw);

  if (!Array.isArray(bikes) || bikes.length === 0) {
    console.error("⚠️ bikes.json is empty or invalid.");
    return;
  }
  for (const bike of bikes){
    await createBikeUser(bike.username, bike.password)
  }
  console.log(`📦 Loaded ${bikes.length} bikes from bikes.json`);

}

insertBikesFromJsonBulk()
