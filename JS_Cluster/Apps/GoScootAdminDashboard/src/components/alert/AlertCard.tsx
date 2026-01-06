import { MdWarning as AlertTriangle } from "react-icons/md";
import styles from "./AlertCard.module.css"
import { Alert } from "../../../../../Packages/Admin_Dashboard_DTO/dist/Models/Alerts";

interface AlertCardProps {
  alert: Alert
  onResolve: () => void;
  onViewDetail: () => void;
  className?: string
}

export default function AlertCard({
  alert,
  onResolve,
  onViewDetail,
  className,
}: AlertCardProps) {
  return (
    <div className={`${styles["alert-item"]} ${className ?? ""}`}>
      <div className={styles["alert-left"]}>
        <div className={styles["alert-icon"]}>
          <AlertTriangle size={70} />
        </div>
        <div>
          <div className={styles.alertHeaderContainer}>
            <h2 className={styles["alert-title"]}>{alert.bike_id}</h2>

            <span className={styles.dot} />

            <span className={styles.alertMeta}>{alert.id}</span>

            <span className={styles.dot} />

            <span className={styles.alertMeta}>
              {new Date(alert.time).toLocaleString("vi-VN")}
            </span>
          </div>

          <p className={styles["alert-desc"]}>{alert.content}</p>
        </div>
      </div>

      <div className={styles["alert-actions"]}>
        <button className={styles["btn-ack"]} onClick={onResolve}>
          Giải Quyết
        </button>
        <button className={styles["btn-dismiss"]} onClick={onViewDetail}>
          Chi Tiết
        </button>
      </div>
    </div>
  );
}