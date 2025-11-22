import dotenv from "dotenv";
import mqtt, { MqttClient } from "mqtt";


dotenv.config()

interface MqttConfig {
    brokerUrl: string;
    username: string;
    password: string;
    options: {
        clean: boolean;
        reconnectPeriod: number;
        keepalive: number;
        clientId: string;
    };
    controlTopic: string;
}

export const config: MqttConfig = {
    brokerUrl: process.env.MQTT_BROKER_URL ?? "mqtt://localhost:1883",
    username: process.env.MQTT_ADMIN_USER ?? "mqtt_admin",
    password: process.env.MQTT_ADMIN_PASSWORD ?? "TrungLuong080699@@@",

    options: {
        clean: true,
        reconnectPeriod: 2000,
        keepalive: 30,
        clientId: `admin_${Math.random().toString(16).slice(2)}`,
    },

    controlTopic: "$CONTROL/dynamic-security/v1",
};

export let adminMqttClient: MqttClient | null = null;

export async function initMqtt(): Promise<void> {
  if (adminMqttClient && adminMqttClient.connected) {
    console.log("[MQTT ADMIN] Already connected");
    return;
  }

  adminMqttClient = mqtt.connect(config.brokerUrl, {
    username: config.username,
    password: config.password,
    clean: config.options.clean,
    reconnectPeriod: config.options.reconnectPeriod,
    keepalive: config.options.keepalive,
    clientId: config.options.clientId,
  });

  adminMqttClient.on("reconnect", () => console.log("[MQTT ADMIN] Reconnecting…"));
  adminMqttClient.on("close", () => console.warn("[MQTT ADMIN] Connection closed"));

  // ✨ PHẦN QUAN TRỌNG: ĐỢI CHO ĐẾN KHI 'connect' HOẶC 'error'
  await new Promise<void>((resolve, reject) => {
    const onConnect = () => {
      console.log("[MQTT ADMIN] Connected");
      cleanup();
      resolve();
    };

    const onError = (err: Error) => {
      console.error("[MQTT ADMIN] Error on initial connect:", err);
      cleanup();
      reject(err);
    };

    const cleanup = () => {
      adminMqttClient?.off("connect", onConnect);
      adminMqttClient?.off("error", onError);
    };

    adminMqttClient!.once("connect", onConnect);
    adminMqttClient!.once("error", onError);
  });
}