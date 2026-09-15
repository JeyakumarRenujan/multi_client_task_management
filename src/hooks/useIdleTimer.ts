import { useState, useEffect, useRef, useCallback } from 'react';

interface UseIdleTimerOptions {
  enabled?: boolean;
  timeoutMinutes?: number; // In minutes, e.g. 2
  onIdle?: () => void;
  onActive?: () => void;
}

export function useIdleTimer({
  enabled = true,
  timeoutMinutes = 2,
  onIdle,
  onActive,
}: UseIdleTimerOptions) {
  const [isIdle, setIsIdle] = useState(false);
  const lastActiveRef = useRef<number>(Date.now());
  const throttleRef = useRef<number>(0);
  const timeoutMs = Math.max(10, timeoutMinutes) * 60 * 1000; // safety minimum 10 seconds if converted, but timeoutMinutes is usually 1, 2, 5...

  const handleUserActivity = useCallback(() => {
    const now = Date.now();
    lastActiveRef.current = now;

    // If currently idle, immediately wake up
    setIsIdle(prev => {
      if (prev) {
        onActive?.();
        return false;
      }
      return false;
    });
  }, [onActive]);

  // Throttled event listener to save CPU cycles
  const throttledActivityHandler = useCallback(() => {
    const now = Date.now();
    if (now - throttleRef.current > 300) {
      throttleRef.current = now;
      handleUserActivity();
    }
  }, [handleUserActivity]);

  const resetTimer = useCallback(() => {
    lastActiveRef.current = Date.now();
    setIsIdle(false);
  }, []);

  const triggerIdleNow = useCallback(() => {
    setIsIdle(true);
    onIdle?.();
  }, [onIdle]);

  useEffect(() => {
    if (!enabled) {
      setIsIdle(false);
      return;
    }

    lastActiveRef.current = Date.now();

    // Check inactivity every second
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActiveRef.current;
      const actualTimeoutMs = Math.max(10_000, timeoutMinutes * 60 * 1000);

      if (elapsed >= actualTimeoutMs) {
        setIsIdle(prev => {
          if (!prev) {
            onIdle?.();
            return true;
          }
          return prev;
        });
      }
    }, 1000);

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];
    events.forEach(event => {
      window.addEventListener(event, throttledActivityHandler, { passive: true });
    });

    return () => {
      clearInterval(interval);
      events.forEach(event => {
        window.removeEventListener(event, throttledActivityHandler);
      });
    };
  }, [enabled, timeoutMinutes, throttledActivityHandler, onIdle]);

  return {
    isIdle,
    setIsIdle,
    resetTimer,
    triggerIdleNow,
  };
}
