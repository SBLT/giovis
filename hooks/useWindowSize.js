import { useEffect, useState } from "react";

export default function useWindowSize() {
  const [size, setSize] = useState({
    width: null,
    height: null,
    before: { width: null, height: null },
  });

  useEffect(() => {
    const handleResize = () => {
      setSize((prev) => {
        return {
          width: window.innerWidth,
          height: window.innerHeight,
          before: {
            width: prev.width == null ? window.innerWidth : prev.width,
            height: prev.height == null ? window.innerHeight : prev.height,
          },
        };
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return size;
}
