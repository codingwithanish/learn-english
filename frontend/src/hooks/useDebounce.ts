import { useEffect, useRef } from 'react';

/**
 * Custom hook that debounces a callback function
 * @param callback - Function to debounce
 * @param value - Value to pass to the callback
 * @param delay - Delay in milliseconds
 */
export const useDebounce = <T>(
  callback: (value: T) => void | Promise<void>,
  value: T,
  delay: number
): void => {
  const callbackRef = useRef<(value: T) => void | Promise<void>>(callback);
  const timeoutRef = useRef<NodeJS.Timeout>();

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