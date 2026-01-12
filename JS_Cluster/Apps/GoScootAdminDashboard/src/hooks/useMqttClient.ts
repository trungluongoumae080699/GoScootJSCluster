import { useEffect, useState } from "react";
import mqtt, { MqttClient } from "mqtt";

export function useMqttClient(
  mqttUsername: string,
  mqttPassword: string
): MqttClient | null {
  const [client, setClient] = useState<MqttClient | null>(null);

  useEffect(() => {
    // Don't connect if credentials are missing
    if (!mqttUsername || !mqttPassword) {
      console.log("⚠️ MQTT credentials not available, skipping connection");
      return;
    }

    // Tạo client
    const c = mqtt.connect("ws://still-simply-katydid.ngrok.app/GoScoot/Dashboard/mqtt", {
      username: mqttUsername,
      password: mqttPassword,
      clean: true,
      reconnectPeriod: 2000,
      keepalive: 30,
    });

    setClient(c); // 👉 Trigger re-render với client mới

    c.on("connect", () => console.log("✅ MQTT connected"));
    c.on("error", (err) => console.warn("⚠️ MQTT error:", err.message));
    c.on("close", () => console.log("MQTT disconnected"));
    c.on("message", (topic, message) => {
      console.log(`📩 MQTT message on ${topic}:`, message.toString());
    });

    return () => {
      console.log("MQTT connection closed");
      c.end(true);
      setClient(null);
    };
  }, [mqttUsername, mqttPassword]);

  return client;
}