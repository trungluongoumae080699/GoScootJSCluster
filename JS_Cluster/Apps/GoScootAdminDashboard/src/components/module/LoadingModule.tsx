import { ClipLoader } from "react-spinners";

type FullPageLoaderProps = {
  size?: number;
  color?: string;
};

export default function Loader({
  size = 35,
  color = "#C85A28",
}: FullPageLoaderProps) {
  return (
    <div
      style={{
        width:  "100%",
        height:  "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ClipLoader size={size} color={color} />
    </div>
  );
}