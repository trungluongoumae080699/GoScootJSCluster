import { useEffect } from "react";
import { useMqttClient } from "./hooks/useMqttClient";
import { decodeTelemetry } from "./utlities/BindaryDecoder";


export default function VehicleTelemetryPage() {
  const client = useMqttClient(
    "a6fd6b53-51ee-4ad2-9bd6-7f0e553c3249", 
    "A3T8jBd91k6z1Imjf94PdQ==");

  useEffect(() => {
    if (!client) return;

    const topic = `/telemetry/${"BIK-A4IOLKJR"}`;

    client.subscribe(topic, (err) => {
      if (err) console.error("Failed to subscribe:", err);
      else console.log("Subscribed to:", topic);
    });

    const handleMessage = (topic: string, payload: any) => {
      const telemetry = decodeTelemetry(new Uint8Array(payload));
      console.log("Telemetry:", telemetry);
    };

    client.on("message", handleMessage);

    // cleanup when component unmounts OR bikeId changes
    return () => {
      client.off("message", handleMessage);
      client.unsubscribe(topic);
    };
  }, [client, "BIK-A4IOLKJR"]);

  return (
    <div>
      <h1>Live Bike Telemetry for {"BIK-A4IOLKJR"}</h1>
    </div>
  );
}