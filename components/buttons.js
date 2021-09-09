import { useRouter } from "next/router";
import { forwardRef } from "react";

function Button({ children, onClick, to, ...rest }, ref) {
  const { className = "", color = "peter-river@6", size } = rest;

  // Vars
  const router = useRouter();
  const Tag = to ? "a" : "button";

  // Handle click
  const handleClick = (e) => {
    e.preventDefault();

    // Creating ripples
    const ripples = document.createElement("span");
    ripples.classList.add("ripple");
    ripples.style.left = `${e.nativeEvent.offsetX}px`;
    ripples.style.top = `${e.nativeEvent.offsetY}px`;
    e.target.insertAdjacentElement("afterbegin", ripples);

    // Removing ripples from DOM
    setTimeout(() => {
      ripples.remove();
    }, 750);

    // Dynamic routing and inherit onClick funtion
    to && router.push(to);
    if (typeof onClick === "function") onClick();
  };

  return (
    <Tag
      {...rest}
      href={to}
      sized={size}
      color={color.includes("@") ? color : `${color}@6`}
      onClick={handleClick}
      className={`button ${className}`.trim()}
      ref={ref}
    >
      <span>{children}</span>
    </Tag>
  );
}

export default forwardRef(Button);
