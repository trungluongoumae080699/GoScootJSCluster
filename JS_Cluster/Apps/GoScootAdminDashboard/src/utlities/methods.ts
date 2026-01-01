import { BikeStatus } from "@trungthao/admin_dashboard_dto";

  const getStatusStyle =(status: BikeStatus) => {
    switch (status) {
      case "Idle":
        return { background: "#d4edda", color: "#155724" };
      case "Inused":
        return { background: "#ffe4c4", color: "#856404" };
      case "Reserved":
        return { background: "#fff3cd", color: "#856404" };
      default:
        return { background: "#e2e3e5", color: "#383d41" };
    }
  };

  const getStatusLabel = (status: BikeStatus) => {
    switch (status) {
      case "Idle":
        return "Available";
      case "Inused":
        return "Inused";
      case "Reserved":
        return "Reserved";
      default:
        return status;
    }
  };

  function timestampToDateInput(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10); // yyyy-mm-dd
}

export function dateToStartOfDay(dateStr: string): number {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dateToEndOfDay(dateStr: string): number {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}