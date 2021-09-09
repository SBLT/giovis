import { forwardRef, useEffect, useRef } from "react";
import Icon from "./icons";

function Input(
  { state, className = "", icon, type = "text", onIconClick, ...rest },
  ref
) {
  const input = ref || useRef(null);

  useEffect(() => {
    const selection = (e) => {
      e?.preventDefault();
      const field = input.current?.querySelector("input");
      if (!field) return;

      field.focus();
    };

    input.current?.addEventListener("click", selection);
    return () => input.current?.removeEventListener("click", selection);
  }, []);

  return (
    <div className={`input ${className}`.trim()} state={state} ref={input}>
      {icon && (
        <Icon
          name={icon}
          onClick={(e) => {
            if (typeof onIconClick === "function") onIconClick(e);
          }}
        />
      )}
      <input type={type} {...rest} />
    </div>
  );
}

export default forwardRef(Input);
