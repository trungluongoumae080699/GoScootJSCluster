import { useNotifications } from "../../context/NotificationContext";
import { MdWarning } from "react-icons/md";
import "./Toast.css";
import { useNavigate } from "react-router-dom";

export default function ToastContainer() {
  const { toastQueue } = useNotifications();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/alert");
  };

  return (
    <div className="toast-container">
      {toastQueue.map((n: any) => (
        <div key={n.id} className="toast" onClick={handleClick}>
          <MdWarning size={35} /> {n.message}
        </div>
      ))}
    </div>
  );
}
