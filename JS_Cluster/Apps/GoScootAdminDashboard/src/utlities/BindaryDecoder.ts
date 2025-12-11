import { Bike, BikeStatus, BikeTelemetry, BikeUpdate, OperationStatus } from "@trungthao/admin_dashboard_dto";
import { Alert } from "../../../../Packages/Admin_Dashboard_DTO/dist/Models/Alerts";

export function decodeTelemetry(bytes: Uint8Array): BikeTelemetry {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;

  // --- ID ---
  const idLen = dv.getUint8(offset);
  offset += 1;
  const id = new TextDecoder().decode(bytes.slice(offset, offset + idLen));
  offset += idLen;

  // --- bike_id ---
  const bikeIdLen = dv.getUint8(offset);
  offset += 1;
  const bike_id = new TextDecoder().decode(bytes.slice(offset, offset + bikeIdLen));
  offset += bikeIdLen;

  // --- battery (int32 LE) ---
  const battery = dv.getInt32(offset, true);
  offset += 4;

  // --- longitude (float32 LE) ---
  const longitude = dv.getFloat32(offset, true);
  offset += 4;

  // --- latitude (float32 LE) ---
  const latitude = dv.getFloat32(offset, true);
  offset += 4;

  // --- time (int64 LE) ---
  const time = Number(dv.getBigInt64(offset, true));
  offset += 8;

  // --- last_gps_long (float32 LE) ---
  const last_gps_long = dv.getFloat32(offset, true);
  offset += 4;

  // --- last_gps_lat (float32 LE) ---
  const last_gps_lat = dv.getFloat32(offset, true);
  offset += 4;

  // --- last_gps_contact_time (int64 LE) ---
  const last_gps_contact_time = Number(dv.getBigInt64(offset, true));
  offset += 8;

  // 6) Operation State  (uint8)
  const operationStateInt = dv.getUint8(offset);
  offset += 1;

  // 7) Usage State  (uint8)
  const usageStateInt = dv.getUint8(offset);
  offset += 1;

  const usageStateMap: BikeStatus[] = [
    BikeStatus.IDLE,
    BikeStatus.RESERVED,
    BikeStatus.INUSED
  ];


  const operationStateMap: OperationStatus[] = [
    OperationStatus.NORMAL,
    OperationStatus.OUT_OF_BOUND,
    OperationStatus.LOW_BATTERY
  ];

  const operationStatus: OperationStatus =
    operationStateMap[operationStateInt] ?? OperationStatus.NORMAL;

  const usageStatus: BikeStatus =
    usageStateMap[usageStateInt] ?? BikeStatus.IDLE;

  return {
    id,
    bike_id,
    battery,
    longitude,
    latitude,
    time,
    last_gps_long,
    last_gps_lat,
    last_gps_contact_time,
    operationStatus,     
    usageStatus
  };
}

export function decodeBikeUpdates(bytes: Uint8Array): BikeUpdate[] {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;

  // Read bike count (uint16 BE)
  const count = dv.getUint16(offset, false); // Big endian
  offset += 2;

  const bikes: BikeUpdate[] = [];

  for (let i = 0; i < count; i++) {
    // 1) ID length
    const idLen = dv.getUint8(offset);
    offset += 1;

    // 2) ID bytes
    const idBytes = bytes.slice(offset, offset + idLen);
    const id = new TextDecoder().decode(idBytes);
    offset += idLen;

    // 3) BatteryStatus (int32 BE)
    const battery_status = dv.getInt32(offset, false);
    offset += 4;

    // 4) Longitude (float32 BE)
    const longitude = dv.getFloat32(offset, false);
    offset += 4;

    // 5) Latitude (float32 BE)
    const latitude = dv.getFloat32(offset, false);
    offset += 4;

    // 6) Operation State  (uint8)
    const operationStateInt = dv.getUint8(offset);
    offset += 1;

    // 7) Usage State  (uint8)
    const usageStateInt = dv.getUint8(offset);
    offset += 1;

    const usageStateMap: BikeStatus[] = [
      BikeStatus.IDLE,
      BikeStatus.RESERVED,
      BikeStatus.INUSED
    ];


    const operationStateMap: OperationStatus[] = [
      OperationStatus.NORMAL,
      OperationStatus.OUT_OF_BOUND,
      OperationStatus.LOW_BATTERY
    ];

    const operationStatus: OperationStatus =
      operationStateMap[operationStateInt] ?? OperationStatus.NORMAL;

    const usageStatus: BikeStatus =
      usageStateMap[usageStateInt] ?? BikeStatus.IDLE;


    bikes.push({
      id,
      battery_status,
      longitude,
      latitude,
      operationStatus,
      usageStatus
    });
  }

  return bikes;
}

export function decodeAlertBinary(bytes: Uint8Array): Alert {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;

  // ---- helper: read uint8-length-prefixed string ----
  const readString = (): string => {
    const len = dv.getUint8(offset);
    offset += 1;

    const strBytes = bytes.slice(offset, offset + len);
    offset += len;

    return new TextDecoder().decode(strBytes);
  };

  const alert: Alert = {
    id: "",
    bike_id: "",
    content: "",
    type: "",
    longitude: 0,
    latitude: 0,
    time: 0,
  };

  // 1. ID
  alert.id = readString();

  // 2. Bike_Id
  alert.bike_id = readString();

  // 3. Content
  alert.content = readString();

  // 4. Type
  alert.type = readString();

  // 5. Longitude (float32 little-endian)
  alert.longitude = dv.getFloat32(offset, true);
  offset += 4;

  // 6. Latitude (float32 little-endian)
  alert.latitude = dv.getFloat32(offset, true);
  offset += 4;

  // 7. Time (uint64 / uint32*2)
  // JS does not support uint64 directly → read as BigUint64 and convert
  const timeBig = dv.getBigUint64(offset, true);
  offset += 8;
  alert.time = Number(timeBig);

  return alert;
}