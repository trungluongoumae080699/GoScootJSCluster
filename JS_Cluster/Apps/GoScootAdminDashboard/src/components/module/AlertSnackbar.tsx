import React, { useEffect, useMemo, useState } from "react";
import styles from "./AlertSnackbar.module.css";
import { GlobalProvider, useGlobalContext } from "../../context/GlobalContext";
import { Alert } from "../../../../../Packages/Admin_Dashboard_DTO/dist/Models/Alerts";
import { useNavigate } from "react-router-dom";

interface SnackbarProps {
    alert: Alert,
    duration?: number;
}


const AlertSnackbar: React.FC<SnackbarProps> = ({ alert }) => {
    const navigate = useNavigate();
    const globalContext = useGlobalContext()
    const [snackbarState, setSnackbarState] = useState<boolean>(true)

    useEffect(() => {
        if (!snackbarState) {
            const timeout = setTimeout(() => {
                globalContext.setAlerts(prevAlerts =>
                    prevAlerts.filter(a => a.id !== alert.id)
                );
            }, 1000);

            return () => clearTimeout(timeout);
        }
    }, [snackbarState, alert]);

    const alertIndex = useMemo(() => {
        return globalContext.alerts.findIndex(a => a.id === alert.id);
    }, [globalContext.alerts, alert.id]);


    const isBehind = useMemo(() => {
        const alerts = globalContext.alerts;
        if (!alerts || alerts.length === 0) return false;

        return alerts[0].id !== alert.id;
    }, [globalContext.alerts, alert.id]);

    return (
        <div
            className={[
                styles.snackbar,
                snackbarState ? styles.on : styles.off,
                isBehind ? styles["snackbar-behind"] : ""
            ].join(" ")}
            style={{
                zIndex: 10000 - alertIndex,
                
            }}
            role="status"
            aria-live="polite"
        >
            <span className={styles.message}>{alert.content}</span>

            <a
                href="#"
                className={styles.detailLink}
                onClick={(e) => {
                    e.preventDefault();
                    globalContext.setActiveAlertId(alert.id)
                    console.log(alert)
                    navigate("/alerts")

                }}
                role="button"
                aria-label="Xem chi tiết"
                title="Xem chi tiết"
            >
                Chi Tiết
            </a>

            <button
                type="button"
                className={styles.closeBtn}
                onClick={() => {
                    setSnackbarState(false)
                }}
                aria-label="Close snackbar"
                title="Close"
            >
                ×
            </button>
        </div>
    );
};

export default AlertSnackbar;