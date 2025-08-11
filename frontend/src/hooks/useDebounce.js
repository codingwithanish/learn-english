import { useEffect, useRef } from 'react';

export const useDebounce = (callback, value, delay) => {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef();

  // Update ref to latest callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Debounce logic
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);
};