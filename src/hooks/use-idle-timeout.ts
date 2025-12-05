
'use client';

import { useState, useEffect, useRef } from 'react';

interface UseIdleTimeoutProps {
  onIdle: () => void;
  timeout: number;
}

export function useIdleTimeout({ onIdle, timeout }: UseIdleTimeoutProps) {
  const timeoutId = useRef<NodeJS.Timeout>();

  const resetTimer = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = setTimeout(onIdle, timeout);
  };

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];
    
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Set the initial timer
    resetTimer();

    // Cleanup function
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [timeout, onIdle]); // Re-run effect if timeout or onIdle function changes

  return null;
}
