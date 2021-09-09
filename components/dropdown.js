import { forwardRef, useEffect, useRef, useState } from "react";

const Dropdown = ({ children, origin = "bottom", ...rest }, ref) => {
  const { className = "", onOpen, onClose } = rest;

  const dropdown = ref || useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  // Children ==> Button and content
  const content = Array.isArray(children) && children[1];
  const button = Array.isArray(children) ? children[0] : children;

  const handleButtonClick = () => {
    if (!isOpen && typeof onOpen === "function") onOpen();
    if (isOpen && typeof onClose === "function") onClose();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handler = (e) => {
      if (!dropdown.current?.contains(e.target)) {
        if (typeof onClose === "function") onClose();
        dropdown.current?.removeAttribute("state");
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      origin={origin || "bottom"}
      state={isOpen ? "is-open" : null}
      className={`dropdown ${className}`.trim()}
      ref={dropdown}
    >
      <div onClick={() => handleButtonClick()} className="dropdown_button">
        {button}
      </div>

      {content && <div className="dropdown_content">{content}</div>}
    </div>
  );
};

export default forwardRef(Dropdown);
