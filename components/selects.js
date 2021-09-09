import { Children, forwardRef, useEffect, useRef, useState } from "react";
import Icon from "./icons";

function Select(props, ref) {
  const { children, onChange, state, resizable = true, value } = props;

  // Select state ==> Value, text and more
  const [currentOption, setCurrentOption] = useState({});
  const [isOpen, setIsOpen] = useState(false);

  // Refs
  const select = ref || useRef(null);
  const options = useRef(null);

  useEffect(() => {
    let key;
    if (value) key = value;
    else key = "default";

    const defaultOption = options.current?.querySelector(`[value="${key}"]`);
    if (!defaultOption) return;
    if (key !== "default") defaultOption.setAttribute("state", "is-selected");

    setCurrentOption({
      value: defaultOption.value,
      name: defaultOption.textContent,
    });
  }, [value]);

  useEffect(() => {
    if (!resizable) {
      return select?.current
        ?.querySelector("header span")
        ?.removeAttribute("style");
    }

    let width = 0;
    select.current?.classList.remove("select");
    options.current?.querySelectorAll("option")?.forEach((option) => {
      if (option?.clientWidth > width) width = option?.clientWidth;
    });

    select?.current
      ?.querySelector("header span")
      ?.setAttribute("style", "min-width:" + width + "px");

    select?.current?.classList.add("select");
  }, [Children.count(children), select.current, options.current]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      const selected = e.target.closest("option");

      if (selected) {
        for (const option of options.current.children) {
          option.removeAttribute("state");
        }

        // Update current option settings
        const { value, textContent } = selected;
        setCurrentOption({ value: value, name: textContent });
        selected.setAttribute("state", "is-selected");

        // On change function
        if (typeof onChange == "function") {
          onChange({ value: value, name: textContent });
        }

        // Close select
        setIsOpen(false);
      }
    };

    options.current?.addEventListener("click", handler);
    return () => options.current?.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!select.current?.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      className="select"
      state={isOpen ? `is-open ${state || ""}` : state}
      ref={select}
    >
      <header onClick={() => setIsOpen(!isOpen)}>
        <span>{currentOption?.name}</span>
        <Icon name="arrow-down@broken" />
      </header>

      <div ref={options}>{children}</div>
    </div>
  );
}

export default forwardRef(Select);
