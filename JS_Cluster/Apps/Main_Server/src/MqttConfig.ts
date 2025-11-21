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

/** Connect once at startup */
export async function initMqtt() {
    adminMqttClient = mqtt.connect(config.brokerUrl, {
        username: config.username,
        password: config.password,
        clean: config.options.clean,
        reconnectPeriod: config.options.reconnectPeriod,
        keepalive: config.options.keepalive,
        clientId: config.options.clientId,
    });

    adminMqttClient.on("connect", () => console.log("[MQTT ADMIN] Connected"));
    adminMqttClient.on("reconnect", () => console.log("[MQTT ADMIN] Reconnecting…"));
    adminMqttClient.on("error", (err) => console.error("[MQTT ADMIN] Error:", err));
    adminMqttClient.on("close", () => console.warn("[MQTT ADMIN] Connection closed"));
}
