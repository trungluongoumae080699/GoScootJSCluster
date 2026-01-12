import React from "react";
import styles from "./WarningBang.module.css";

export interface WarningBangProps {
  on: boolean;
  title?: string;
  className?: string;
}

const WarningBang: React.FC<WarningBangProps> = ({
  on,
  title = "Warning",
  className = "",
}) => {
  const baseClass = styles["warning-bang"];

  const stateClass = on
    ? [
        styles["warning-danger"],
        styles["warning-bang--blink"],
      ]
    : [styles["warning-ok"]];

  return (
    <span
      className={[baseClass, ...stateClass, className].join(" ")}
      aria-label="warning"
      title={title}
    >
      {on ? "!" : "✓"}
    </span>
  );
};

export default WarningBang;