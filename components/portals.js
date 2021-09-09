import { createPortal } from "react-dom";

export default function Portal({ id, children }) {
  return createPortal(
    <>{children}</>,
    document.getElementById(id || "notifications")
  );
}
