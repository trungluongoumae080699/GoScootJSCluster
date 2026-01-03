import styles from "./Input.module.css";

type BaseProps = {
  label: string;
  placeHolder?: string;
};

type TextOrDateProps = BaseProps & {
  kind: "input";
  type: "text" | "date" | "number";
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export type Option = { value: string; label: string };

type SelectProps = BaseProps & {
  kind: "select";
  value: string;
  options: Option[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

type InputProps = TextOrDateProps | SelectProps;

export default function Input(props: InputProps) {
  return (
    <div className={styles["input-box"]}>
      <div className={styles["label"]}>{props.label}</div>

      {props.kind === "input" ? (
        <input
          type={props.type}
          className={styles["filter-input"]}
          value={props.value}
          placeholder={props.placeHolder}
          onChange={props.onChange}
        />
      ) : (
        <select
          className={styles["filter-input"]}
          value={props.value}
          onChange={props.onChange}
        >
          {/* placeholder option */}
          {props.placeHolder && (
            <option value="" disabled>
              {props.placeHolder}
            </option>
          )}

          {props.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}