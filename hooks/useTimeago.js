import { useEffect, useState } from "react";

const UNITS = [
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

const getDayDiffs = (timestamp) => {
  const now = Date.now();
  const elapsed = (timestamp - now) / 1000;

  for (const [unit, secondsInUnit] of UNITS) {
    if (Math.abs(elapsed) > secondsInUnit || unit === "second") {
      const value = Math.round(elapsed / secondsInUnit);
      return { value, unit };
    }
  }
};

export default function useTimeago(timestamp) {
  const [timeago, setTimeago] = useState(() => getDayDiffs(timestamp));

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeago = getDayDiffs(timestamp);
      setTimeago(newTimeago);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeago]);

  const { value, unit } = timeago;
  const rtf = new Intl.RelativeTimeFormat("es");
  return rtf.format(value, unit);
}
