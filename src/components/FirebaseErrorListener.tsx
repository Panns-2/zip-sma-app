'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

// This is a client-side component that should be placed in your root layout.
// It listens for custom permission errors and throws them so that Next.js
// can display its development error overlay.
export default function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: Error) => {
      // In a development environment, re-throwing the error will trigger
      // the Next.js error overlay, which is great for debugging.
      if (process.env.NODE_ENV === 'development') {
        // We throw this in a timeout to break out of the current event loop tick.
        // This ensures the error is caught by the Next.js overlay and not by
        // any .catch() block that might have emitted the error.
        setTimeout(() => {
          throw error;
        }, 0);
      } else {
        // In production, you might want to log this to a service like Sentry.
        console.error('Caught a Firestore permission error:', error);
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null; // This component does not render anything.
}
