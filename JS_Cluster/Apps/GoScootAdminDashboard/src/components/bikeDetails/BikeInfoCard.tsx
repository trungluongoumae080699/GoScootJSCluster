/**
 * BikeInfoCard Component
 * Displays bike information and battery status
 */

import { MdBatteryFull, MdSpeed, MdRoute, MdBuild } from "react-icons/md";
import { Bike, BikeStatus } from "@trungthao/admin_dashboard_dto";
import styles from "./BikeInfoCard.module.css";
import Battery from "../module/Battery";

interface BikeInfoCardProps {
  bike: Bike;
  liveUsageStatusUpdate: BikeStatus | null;
  liveBattery?: number | null;
  liveLowBatteryWarning: boolean;
  liveCrashWarning: boolean;
  liveOutofBoundWarning: boolean;
  liveToppleWarning: boolean,

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
  liveUsageStatusUpdate,
  liveBattery,
  liveCrashWarning = false,
  liveLowBatteryWarning = false,
  liveOutofBoundWarning = false,
  liveToppleWarning = false,
  formatDate,
  getStatusText,
}: BikeInfoCardProps) {
  // Use live battery if available, otherwise fall back to bike data
  const batteryLevel = liveBattery ?? bike.battery_status ?? 0;
  const statusColor = getStatusColor(bike.status);

  const batteryColor = batteryLevel >= 50 ? "#4CAF50" : (batteryLevel <= 20 ? "#f44336" : "#ff9800")



  return (
    <div className={styles["bike-info-section"]}>
      <div className={styles["bike-image"]}>
        <img src="/bike_type.png" alt="Bike" />
      </div>

      <div className={styles["bike-details"]}>
        <div className={styles.header}>
          <h2 className={styles["vin-number"]}>{bike.name}</h2>
          {liveBattery !== null && liveBattery !== undefined && (
            <span
              className={styles.liveText}
              style={{
                fontSize: "12px",
                color: "#4CAF50",
                marginLeft: "8px",
              }}
            >
              ● Trực Tuyến
            </span>
          )}
        </div>
        <p className={styles["bike-model"]}>ID: {bike.id}</p>


        <div className={styles.badgeContainer}>

          <div className={styles["battery-status"]}>
            <Battery
              level={liveBattery ? liveBattery : 0}
              size="xs"
              orientation="vertical"
              showText={false}
            />

            <span
              style={{
                color: batteryColor,
                fontWeight: "bold",
              }}
            >
              {batteryLevel}%
            </span>

          </div>
          {
            liveUsageStatusUpdate ? <div
              className={styles.statusBadge}
              style={{
                backgroundColor: statusColor,
                color: "white",
              }}
            >
              {getStatusText(liveUsageStatusUpdate)}
            </div> : undefined
          }


          {
            liveLowBatteryWarning ? <div
              className={styles.statusBadge}
              style={{
                backgroundColor: "#FF9800",
                color: "white",
              }}
            >
              "Pin Thấp"
            </div> : undefined
          }

          {
            liveOutofBoundWarning ? <div
              className={styles.statusBadge}
              style={{
                backgroundColor: "#FF9800",
                color: "white",
              }}
            >
              "Ngoài Phạm Vi"
            </div> : undefined
          }

          {
            liveCrashWarning ? <div
              className={styles.statusBadge}
              style={{
                backgroundColor: "#F44336",
                color: "white",
              }}
            >
              "Va Chạm"
            </div> : undefined
          }

          {
            liveToppleWarning ? <div
              className={styles.statusBadge}
              style={{
                backgroundColor: statusColor,
                color: "white",
              }}
            >
              "Ngã Đỗ"
            </div> : undefined
          }
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
              Tốc Độ Tối Đa: <strong>{bike.maximum_speed} km/h</strong>
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
              Phạm Vi Di Chuyển Tối Đa:{" "}
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
              Ngày Bảo Dưỡng Gần Nhất: <strong>{formatDate(bike.last_service_date)}</strong>
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
                Trạm Hiện Tại: <strong>{bike.current_hub}</strong>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BikeInfoCard;