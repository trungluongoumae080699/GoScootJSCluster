// src/types/mqtt-dist.d.ts
declare module "mqtt/dist/mqtt" {
  export * from "mqtt";
  import mqttDefault from "mqtt";
  export default mqttDefault;
}