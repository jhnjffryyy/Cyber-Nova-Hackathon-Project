import { useEffect, useState } from 'react';

// Returns a Date that re-renders the component when the calendar day changes.
export function useToday(): Date {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const check = () => {
      const now = new Date();
      setToday((prev) =>
        prev.getFullYear() !== now.getFullYear() ||
        prev.getMonth() !== now.getMonth() ||
        prev.getDate() !== now.getDate()
          ? now
          : prev
      );
    };
    const interval = setInterval(check, 60_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  return today;
}
