/**
 * BikeInfoCard Component
 * Displays bike information and battery status
 */

import { MdBatteryFull, MdSpeed, MdRoute, MdBuild } from "react-icons/md";
import { Bike, BikeStatus } from "@trungthao/admin_dashboard_dto";
import styles from "./BikeInfoCard.module.css";

interface BikeInfoCardProps {
  bike: Bike;
  liveBattery?: number | null;
  formatDate: (timestamp: number) => string;
  getStatusText: (status: BikeStatus) => string;
}

/** Get status badge color based on bike status */
function getStatusColor(status: BikeStatus): string {
  switch (status) {
    case BikeStatus.IDLE:
      return "#4CAF50"; // Green - available
    case BikeStatus.RESERVED:
      return "#FF9800"; // Orange - reserved
    case BikeStatus.INUSED:
      return "#F44336"; // Red - in use
    default:
      return "#9E9E9E"; // Grey - unknown
  }
}

function BikeInfoCard({
  bike,
  liveBattery,
  formatDate,
  getStatusText,
}: BikeInfoCardProps) {
  // Use live battery if available, otherwise fall back to bike data
  const batteryLevel = liveBattery ?? bike.battery_status ?? 0;
  const statusColor = getStatusColor(bike.status);

  const batteryColor = batteryLevel > 20 ? "#4CAF50" : "#F44336";

  return (
    <div className={styles["bike-info-section"]}>
      <div className={styles["bike-image"]}>
        <img src="/bike_type.png" alt="Bike" />
      </div>

      <div className={styles["bike-details"]}>
        <h2 className={styles["vin-number"]}>{bike.name}</h2>
        <p className={styles["bike-model"]}>ID: {bike.id}</p>

        <div className={styles["battery-status"]}>
          <MdBatteryFull
            className={styles["battery-icon"]}
            size={24}
            style={{ color: batteryColor }}
          />

          <span
            style={{
              color: batteryColor,
              fontWeight: "bold",
            }}
          >
            {batteryLevel}%
          </span>

          {liveBattery !== null && liveBattery !== undefined && (
            <span
              style={{
                fontSize: "12px",
                color: "#4CAF50",
                marginLeft: "8px",
              }}
            >
              ● Live
            </span>
          )}
        </div>

        <div
          className={styles["status-badge"]}
          style={{
            backgroundColor: statusColor,
            color: "white",
          }}
        >
          {getStatusText(bike.status)}
        </div>

        <div
          style={{
            marginTop: "15px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              color: "#666",
            }}
          >
            <MdSpeed size={18} color="#C85A28" />
            <span>
              Max Speed: <strong>{bike.maximum_speed} km/h</strong>
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              color: "#666",
            }}
          >
            <MdRoute size={18} color="#C85A28" />
            <span>
              Max Distance:{" "}
              <strong>{bike.maximum_functional_distance} km</strong>
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              color: "#666",
            }}
          >
            <MdBuild size={18} color="#C85A28" />
            <span>
              Last Service: <strong>{formatDate(bike.last_service_date)}</strong>
            </span>
          </div>

          {bike.current_hub && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                color: "#666",
              }}
            >
              <span>🏠</span>
              <span>
                Current Hub: <strong>{bike.current_hub}</strong>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BikeInfoCard;