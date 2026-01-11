import React, { useEffect, useMemo, useState } from "react";
import styles from "./Snackbar.module.css";
import { useGlobalContext } from "../../context/GlobalContext";

interface SnackbarProps {
  duration?: number;
}

const Snackbar: React.FC<SnackbarProps> = ({ duration = 4000 }) => {
  const { snackbar, setSnackbar } = useGlobalContext();
  const { isOn, message, type } = snackbar;

  const close = () => {
    setSnackbar((prev) => ({ ...prev, isOn: false }));
  };

  useEffect(() => {
    if (isOn) {
      const timer = window.setTimeout(() => {
        close();
      }, duration);

      return () => window.clearTimeout(timer);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOn, duration]);

  const icon = useMemo(() => {
    switch (type) {
      case "Success":
        return "✅";
      case "Waiting":
        return "⏳";
      case "Error":
      default:
        return "❌";
    }
  }, [type]);

  const typeClass =
    type === "Success"
      ? styles.success
      : type === "Waiting"
        ? styles.warning
        : styles.error;

  return (
    <div
      className={[
        styles.snackbar,
        typeClass,
        isOn ? styles.on : styles.off
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>

      <span className={styles.message}>{message}</span>

      <button
        type="button"
        className={styles.closeBtn}
        onClick={close}
        aria-label="Close snackbar"
        title="Close"
      >
        ×
      </button>
    </div>
  );
};

export default Snackbar;