import { useEffect, useState } from "react";
import mqtt, { MqttClient } from "mqtt";

export function useMqttClient(
  mqttUsername: string,
  mqttPassword: string
): MqttClient | null {
  const [client, setClient] = useState<MqttClient | null>(null);

  useEffect(() => {
    // Tạo client
    const c = mqtt.connect("ws://still-simply-katydid.ngrok.app/GoScoot/Dashboard/mqtt", {
      username: mqttUsername,
      password: mqttPassword,
      clean: true,
      reconnectPeriod: 2000,
      keepalive: 30,
    });

    setClient(c); // 👉 Triggger re-render với client mới

    c.on("connect", () => console.log("MQTT connected"));
    c.on("error", (err) => console.error("MQTT error:", err));
    c.on("close", () => console.warn("MQTT disconnected"));

    return () => {
      console.log("MQTT connection closed");
      c.end(true);
      setClient(null);
    };
  }, [mqttUsername, mqttPassword]);

  return client;
}