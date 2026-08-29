"use client";

import { useEffect } from "react";

export function GlobalErrorCatcher() {
  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('play() request was interrupted')) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && (event.reason.name === 'AbortError' || (event.reason.message && event.reason.message.includes('play() request was interrupted')))) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener('error', handleWindowError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

    return () => {
      window.removeEventListener('error', handleWindowError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
    };
  }, []);

  return null;
}
