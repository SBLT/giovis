import { forwardRef, useEffect, useRef, useState } from "react";
import Icon from "./icons";

function Chips(props, ref) {
  const field = ref || useRef(null);

  const {
    className = "",
    options,
    placeholder = "",
    onChange,
    value = [],
    ...rest
  } = props || {};
  const { limit = "Infinity", length } = options || {};
  const { max, min = 1 } = length || {};
  const [times, setTimes] = useState(0);
  const [chips, setChips] = useState([]);

  const handleAddChip = (e) => {
    if (e.key != "Enter") return;

    const indexed = chips.reduce(
      (acc, chip) => ({
        ...acc,
        [chip.value.toLowerCase()]: chip,
      }),
      {}
    );

    // Pattern ==> /[\w]{min,max}/g;
    const pattern = new RegExp(`[\\w]{${min},${max}}`, "g");
    const chip = e.target.value;

    const isCorrectlyFormatted = pattern?.test(chip);
    const value = isCorrectlyFormatted ? chip?.match(pattern)[0] : "";
    const isAlreadyInUse = indexed[value.toLowerCase()];

    if (!isCorrectlyFormatted || isAlreadyInUse) {
      e.target.value = "";
      return;
    }

    setChips([...chips, { id: `${Date.now()}`, value: value }]);
    e.target.value = "";
  };

  const handleRemoveChip = (id) => {
    setChips(chips?.filter((chip) => chip.id !== id));
  };

  useEffect(() => {
    if (!value) return;

    let values = value?.map((item, index) => {
      let chip = {};

      if (typeof item === "string") {
        chip.value = item;
        chip.id = index;
      } else {
        chip.value = item?.value || "";
        chip.id = item?.id || index;
      }

      return chip;
    });

    if (JSON.stringify(chips) !== JSON.stringify(values)) setChips(values);
  }, [value]);

  useEffect(() => {
    if (times !== 0) {
      let values = chips.map((chip) => chip?.value);
      if (typeof onChange === "function") onChange(values);
    }

    setTimes(times + 1);
  }, [chips]);

  useEffect(() => {
    const selection = (e) => {
      e?.preventDefault();
      const input = field.current?.querySelector("input");
      if (!input) return;

      input.focus();
    };

    field.current?.addEventListener("mousedown", selection);
    return () => field.current?.removeEventListener("mousedown", selection);
  }, []);

  return (
    <div ref={field} className={`chips ${className}`.trim()} {...rest}>
      {chips?.map((chip) => (
        <div className="chip" key={chip.id}>
          {chip.value}
          <Icon name="close@bold" onClick={() => handleRemoveChip(chip.id)} />
        </div>
      ))}

      {chips?.length < limit && (
        <input
          type="text"
          autoFocus={true}
          onKeyUp={handleAddChip}
          placeholder={placeholder}
          disabled={rest?.disabled}
        />
      )}
    </div>
  );
}

export default forwardRef(Chips);
