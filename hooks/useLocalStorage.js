import { useState } from "react";

export default function useLocalStorage(key, initial) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const data = window.localStorage.getItem(key);
      return data ? JSON.parse(data) : initial;
    } catch (error) {
      return initial;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}
