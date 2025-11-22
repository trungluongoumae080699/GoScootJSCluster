import { BikeTelemetry } from "@trungthao/admin_dashboard_dto";

export function decodeTelemetry(bytes: Uint8Array): BikeTelemetry {
  const dv = new DataView(bytes.buffer);
  let offset = 0;

  // --- ID ---
  const idLen = dv.getUint8(offset);
  offset += 1;

  const idBytes = bytes.slice(offset, offset + idLen);
  const id = new TextDecoder().decode(idBytes);
  offset += idLen;

  // --- Battery ---
  const battery = dv.getInt32(offset, true);
  offset += 4;

  // --- Longitude ---
  const lon = dv.getFloat64(offset, true);
  offset += 8;

  // --- Latitude ---
  const lat = dv.getFloat64(offset, true);
  offset += 8;

  return {
    id,
    battery,
    longitude: lon,
    latitude: lat,
  };
}