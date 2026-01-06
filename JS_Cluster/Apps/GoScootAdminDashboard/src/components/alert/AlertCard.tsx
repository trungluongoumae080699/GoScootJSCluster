import { MdWarning as AlertTriangle } from "react-icons/md";
import styles from "./AlertCard.module.css"

interface AlertCardProps {
  title: string;
  description: string;
  onResolve: () => void;
  onViewDetail: () => void;
  className?: string
}

export default function AlertCard({
  title,
  description,
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
          <h2 className={styles["alert-title"]}>{title}</h2>
          <p className={styles["alert-desc"]}>{description}</p>
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