import { BikeTelemetry, BikeUpdate } from "@trungthao/admin_dashboard_dto";

export function decodeTelemetry(bytes: Uint8Array): BikeTelemetry {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;

  // --- ID ---
  const idLen = dv.getUint8(offset);
  offset += 1;

  const idBytes = bytes.slice(offset, offset + idLen);
  const id = new TextDecoder().decode(idBytes);
  offset += idLen;

  // --- Bike_Id ---
  const bikeIdLen = dv.getUint8(offset);
  offset += 1;

  const bikeIdBytes = bytes.slice(offset, offset + bikeIdLen);
  const bike_id = new TextDecoder().decode(bikeIdBytes);
  offset += bikeIdLen;

  // --- Battery ---
  const battery = dv.getInt32(offset, true); // LE
  offset += 4;

  // --- Longitude ---
  const longitude = dv.getFloat64(offset, true); // LE
  offset += 8;

  // --- Latitude ---
  const latitude = dv.getFloat64(offset, true); // LE
  offset += 8;

  // --- Time (int64, LE) ---
  const timeBigInt = dv.getBigInt64(offset, true); // LE
  offset += 8;

  const time = Number(timeBigInt); // safe: Unix timestamp fits in JS number

  return {
    id,
    bike_id,
    battery,
    longitude,
    latitude,
    time,
  };
}

export function decodeBikeUpdates(bytes: Uint8Array): BikeUpdate[] {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let offset = 0;

    // Read bike count (uint16 BE)
    const count = dv.getUint16(offset, false); // BE = false
    offset += 2;

    const bikes: BikeUpdate[] = [];

    for (let i = 0; i < count; i++) {
        // 1. Read ID length
        const idLen = dv.getUint8(offset);
        offset += 1;

        // 2. Read ID bytes
        const idBytes = bytes.slice(offset, offset + idLen);
        const id = new TextDecoder().decode(idBytes);
        offset += idLen;

        // 3. Battery (int32 BE)
        const battery_status = dv.getInt32(offset, false);
        offset += 4;

        // 4. Longitude (float64 BE)
        const longitude = dv.getFloat64(offset, false);
        offset += 8;

        // 5. Latitude (float64 BE)
        const latitude = dv.getFloat64(offset, false);
        offset += 8;

        bikes.push({
            id,
            battery_status,
            longitude,
            latitude,
        });
    }

    return bikes;
}