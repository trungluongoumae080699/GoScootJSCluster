import { Bike, BikeStatus, BikeTelemetry, BikeUpdate, OperationStatus } from "@trungthao/admin_dashboard_dto";
import { Alert } from "../../../../Packages/Admin_Dashboard_DTO/dist/Models/Alerts";

export function decodeTelemetry(bytes: Uint8Array): BikeTelemetry {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;

  const decoder = new TextDecoder();

  const readU8 = () => dv.getUint8(offset++);
  const readI32LE = () => {
    const v = dv.getInt32(offset, true);
    offset += 4;
    return v;
  };
  const readF32LE = () => {
    const v = dv.getFloat32(offset, true);
    offset += 4;
    return v;
  };
  const readI64LE = () => {
    const v = Number(dv.getBigInt64(offset, true));
    offset += 8;
    return v;
  };
  const readBool = () => readU8() === 1;
  const readLenString = () => {
    const len = readU8();
    const s = decoder.decode(bytes.subarray(offset, offset + len));
    offset += len;
    return s;
  };

  // --- 1) ID (u8 len + bytes) ---
  const id = readLenString();

  // --- 2) Bike ID (u8 len + bytes) ---
  const bike_id = readLenString();

  // --- 3) BatteryStatus (int32 LE) ---
  const battery = readI32LE();

  // --- 4) Longitude (float32 LE) ---
  const longitude = readF32LE();

  // --- 5) Latitude (float32 LE) ---
  const latitude = readF32LE();

  // --- 6) Time (int64 LE) ---
  const time = readI64LE();

  // --- 7) Last GPS Long (float32 LE) ---
  const last_gps_long = readF32LE();

  // --- 8) Last GPS Lat (float32 LE) ---
  const last_gps_lat = readF32LE();

  // --- 9) Last GPS Contact Time (int64 LE) ---
  const last_gps_contact_time = readI64LE();

  // --- 10) BatteryIsLow (u8) ---
  const batteryIsLow = readBool();

  // --- 11) IsToppled (u8) ---
  const isToppled = readBool();

  // --- 12) IsCrashed (u8) ---
  const isCrashed = readBool();

  // --- 13) IsOutOfBound (u8) ---
  const isOutOfBound = readBool();

  // --- 14) UsageStatus (u8 enum index) ---
  const usageStateInt = readU8();

  const usageStateMap: BikeStatus[] = [
    BikeStatus.IDLE,
    BikeStatus.RESERVED,
    BikeStatus.INUSED,
  ];

  const usageStatus: BikeStatus = usageStateMap[usageStateInt] ?? BikeStatus.IDLE;

  // Fields that exist in BikeTelemetry but aren't in this payload:
  // - last_gps_long/lat already mapped
  // - last_gps_long/lat "aliases" (last_gps_long vs last_gps_long) ok
  // - last_gps_long/lat "last_gps_*" already
  // - isOutOfBound mapped from payload, keep both if you also have operation enums elsewhere
  // - latitude/longitude already
  // - last_gps_long/lat vs last_gps_long/lat
  // - If you also need `last_gps_long/lat` AND `last_gps_long/lat` duplicates, set them explicitly below.

  return {
    id,
    bike_id,
    battery,
    last_gps_long,
    last_gps_lat,
    longitude,
    latitude,
    time,
    last_gps_contact_time,
    batteryIsLow,
    isToppled,
    isCrashed,
    isOutOfBound,
    usageStatus,
  };
}


export type BinaryDecodedPayload = {
  protocol: number;
  payload: Uint8Array;
};

export function decodeBinaryPayload(bytes: Uint8Array): BinaryDecodedPayload {
  if (bytes.byteLength < 1) {
    throw new Error("Payload too small to contain protocol byte");
  }

  // protocol is uint8 (0–9)
  const protocol = bytes[0];

  // remaining bytes = actual payload
  const payload = bytes.slice(1);

  return {
    protocol,
    payload,
  };
}


export function decodeBikeUpdates(bytes: Uint8Array): BikeUpdate[] {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;

  const decoder = new TextDecoder();

  const readU8 = () => dv.getUint8(offset++);
  const readU16BE = () => {
    const v = dv.getUint16(offset, false);
    offset += 2;
    return v;
  };
  const readI32BE = () => {
    const v = dv.getInt32(offset, false);
    offset += 4;
    return v;
  };
  const readF32BE = () => {
    const v = dv.getFloat32(offset, false);
    offset += 4;
    return v;
  };
  const readBool = () => readU8() === 1;
  const readLenString = () => {
    const len = readU8();
    const s = decoder.decode(bytes.subarray(offset, offset + len));
    offset += len;
    return s;
  };

  // 0) Bike count (uint16 BE)
  const count = readU16BE();

  const usageStateMap: BikeStatus[] = [
    BikeStatus.IDLE,     // 0
    BikeStatus.RESERVED, // 1
    BikeStatus.INUSED,   // 2
  ];

  const bikes: BikeUpdate[] = [];

  for (let i = 0; i < count; i++) {
    // 1-2) ID (u8 len + bytes)
    const id = readLenString();

    // 3) Battery_Status (int32 BE)
    const battery_status = readI32BE();

    // 4) Longitude (float32 BE)
    const longitude = readF32BE();

    // 5) Latitude (float32 BE)
    const latitude = readF32BE();

    // 6) BatteryIsLow (u8)
    const batteryIsLow = readBool();

    // 7) IsToppled (u8)
    const isToppled = readBool();

    // 8) IsCrashed (u8)
    const isCrashed = readBool();

    // 9) IsOutOfBound (u8)
    const isOutOfBound = readBool();

    // 10) UsageStatus (u8)
    const usageStateInt = readU8();
    const usageStatus: BikeStatus = usageStateMap[usageStateInt] ?? BikeStatus.IDLE;

    bikes.push({
      id,
      battery_status,
      longitude,
      latitude,
      batteryIsLow,
      isToppled,
      isCrashed,
      isOutOfBound,
      usageStatus,
      currentHub: null, // not present in binary payload
    });
  }

  return bikes;
}

export function decodeAlertBinary(bytes: Uint8Array): Alert {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();
  let offset = 0;

  const ensure = (n: number) => {
    if (offset + n > dv.byteLength) {
      throw new RangeError(
        `decodeAlertBinary: need ${n} bytes but only ${dv.byteLength - offset} left (offset=${offset}, len=${dv.byteLength})`
      );
    }
  };

  // 0) protocol / header byte (your int8(0))
  ensure(1);
  const protocol = dv.getUint8(offset);
  offset += 1;
  // (optional) you can use protocol if you want

  const readU8 = () => {
    ensure(1);
    return dv.getUint8(offset++);
  };

  const readString = () => {
    const len = readU8();
    ensure(len);
    const s = decoder.decode(bytes.subarray(offset, offset + len));
    offset += len;
    return s;
  };

  const id = readString();
  const bike_id = readString();
  const content = readString();
  const type = readString();

  ensure(4);
  const longitude = dv.getFloat32(offset, true);
  offset += 4;

  ensure(4);
  const latitude = dv.getFloat32(offset, true);
  offset += 4;

  ensure(8);
  const time = Number(dv.getBigInt64(offset, true));
  offset += 8;

  return { id, bike_id, content, type, longitude, latitude, time };
}