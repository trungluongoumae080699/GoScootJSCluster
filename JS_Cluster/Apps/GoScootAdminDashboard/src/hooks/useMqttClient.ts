import { useEffect, useRef } from "react";
import mqtt from "mqtt";

export function useMqttClient(
  mqttUsername: string,
  mqttPassword: string
): mqtt.MqttClient | null {
  const clientRef = useRef<mqtt.MqttClient | null>(null);

  useEffect(() => {
    const client = mqtt.connect("ws://localhost:8083", {
      username: mqttUsername,
      password: mqttPassword,
      clean: true,
      reconnectPeriod: 2000,
      keepalive: 30,
    });

    clientRef.current = client;

    client.on("connect", () => console.log("MQTT connected"));
    client.on("error", (err) => console.error("MQTT error:", err));
    client.on("close", () => console.warn("MQTT disconnected"));

    return () => {
      client.end(true);
      console.log("MQTT connection closed");
    };
  }, [mqttUsername, mqttPassword]);

  return clientRef.current;
}