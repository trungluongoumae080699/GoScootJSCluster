import { MdWarning as AlertTriangle } from "react-icons/md";
import "./AlertCard.css";

interface AlertCardProps {
  title: string;
  description: string;
  onAcknowledge: () => void;
  onDismiss: () => void;
}

export default function AlertCard({
  title,
  description,
  onAcknowledge,
  onDismiss,
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
        <button className="btn-ack" onClick={onAcknowledge}>
          Acknowledge
        </button>
        <button className="btn-dismiss" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}