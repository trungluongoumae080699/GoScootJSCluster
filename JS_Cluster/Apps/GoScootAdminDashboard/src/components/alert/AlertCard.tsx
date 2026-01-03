import { MdWarning as AlertTriangle } from "react-icons/md";
import "./AlertCard.css";

interface AlertCardProps {
  title: string;
  description: string;
  onResolve: () => void;
  onViewDetail: () => void;
}

export default function AlertCard({
  title,
  description,
  onResolve,
  onViewDetail,
}: AlertCardProps) {
  
  return (
    <div className="alert-item">
      <div className="alert-left">
        <div className="alert-icon">
          <AlertTriangle size={70} />
        </div>
        <div>
          <h2 className="alert-title">{title}</h2>
          <p className="alert-desc">{description}</p>
        </div>
      </div>
      <div className="alert-actions">
        <button className="btn-ack" onClick={onResolve}>
          Giải Quyết
        </button>
        <button className="btn-dismiss" onClick={onViewDetail}>
          Chi Tiết
        </button>
      </div>
    </div>
  );
}