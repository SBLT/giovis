export default function Spinner({ color = "peter-river@6", ratio = "1" }) {
  return (
    <div
      className="spinner"
      ratio={
        4 < parseFloat(ratio) || parseFloat(ratio) < 0 ? 1 : parseFloat(ratio)
      }
      color={color.includes("@") ? color : `${color}@6`}
    />
  );
}
