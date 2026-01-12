import { BikeTelemetry } from "@trungthao/admin_dashboard_dto";
import * as XLSX from "xlsx";



export type ExportBikeTelemetryExcelOptions = {
  fileName?: string;
  sheetName?: string;
  // nếu muốn chuyển time -> ISO string thì bật true
  formatTimeAsISO?: boolean; // default false
};

function toIso(ms: number): string {
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

export function exportBikeTelemetryToExcel(
  telemetry: BikeTelemetry[],
  options: ExportBikeTelemetryExcelOptions = {}
): { fileName: string; rowCount: number } {
  const datePart = new Date().toISOString().split("T")[0];

  const fileName =
    options.fileName ?? `bike-telemetry-${datePart}.xlsx`;

  const sheetName = (options.sheetName ?? "BikeTelemetry").slice(0, 31);

  // ✅ columns match EXACTLY BikeTelemetry keys
  const rows = telemetry.map((t) => ({
    id: t.id ?? "",
    bike_id: t.bike_id ?? "",
    battery: t.battery ?? "",
    last_gps_long: t.last_gps_long ?? "",
    last_gps_lat: t.last_gps_lat ?? "",
    longitude: t.longitude ?? "",
    latitude: t.latitude ?? "",
    time: options.formatTimeAsISO ? toIso(t.time) : (t.time ?? ""),
    last_gps_contact_time: options.formatTimeAsISO
      ? toIso(t.last_gps_contact_time)
      : (t.last_gps_contact_time ?? ""),
    batteryIsLow: Boolean(t.batteryIsLow),
    isToppled: Boolean(t.isToppled),
    isCrashed: Boolean(t.isCrashed),
    isOutOfBound: Boolean(t.isOutOfBound),
    usageStatus: t.usageStatus ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: [
      "id",
      "bike_id",
      "battery",
      "last_gps_long",
      "last_gps_lat",
      "longitude",
      "latitude",
      "time",
      "last_gps_contact_time",
      "batteryIsLow",
      "isToppled",
      "isCrashed",
      "isOutOfBound",
      "usageStatus",
    ],
  });

  const workbook = XLSX.utils.book_new();

  // widths roughly matching each field
  worksheet["!cols"] = [
    { wch: 28 }, // id
    { wch: 28 }, // bike_id
    { wch: 10 }, // battery
    { wch: 14 }, // last_gps_long
    { wch: 14 }, // last_gps_lat
    { wch: 14 }, // longitude
    { wch: 14 }, // latitude
    { wch: 22 }, // time
    { wch: 22 }, // last_gps_contact_time
    { wch: 12 }, // batteryIsLow
    { wch: 10 }, // isToppled
    { wch: 10 }, // isCrashed
    { wch: 12 }, // isOutOfBound
    { wch: 14 }, // usageStatus
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);

  return { fileName, rowCount: telemetry.length };
}