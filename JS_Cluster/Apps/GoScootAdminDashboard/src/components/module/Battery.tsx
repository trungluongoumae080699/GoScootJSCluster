import styles from "./Battery.module.css";

type BatterySize = "xs" | "sm" | "md" | "lg";
type BatteryOrientation = "horizontal" | "vertical";

type BatteryProps = {
  level: number;               // 0 → 100
  size?: BatterySize;          // default: md
  orientation?: BatteryOrientation; // default: horizontal
  showText?: boolean;          // default: true
};

export default function Battery({
  level,
  size = "md",
  orientation = "horizontal",
  showText = true,
}: BatteryProps) {
  const safeLevel = Math.max(0, Math.min(100, level));

  const colorClass =
    safeLevel <= 20
      ? styles.low
      : safeLevel <= 50
      ? styles.medium
      : styles.high;

  return (
    <div
      className={[
        styles.wrapper,
        styles[orientation],
        styles[size],
      ].join(" ")}
    >
      <div className={styles.battery}>
        <div className={styles.cap} />
        <div className={styles.body}>
          <div
            className={`${styles.level} ${colorClass}`}
            style={
              orientation === "horizontal"
                ? { width: `${safeLevel}%` }
                : { height: `${safeLevel}%` }
            }
          />
        </div>
      </div>

      {showText && (
        <span className={styles.text}>{safeLevel}%</span>
      )}
    </div>
  );
}