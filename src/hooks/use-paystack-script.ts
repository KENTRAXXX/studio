'use client';

import { useState, useEffect } from 'react';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export function usePaystackScript() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (window.PaystackPop) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;

    const onScriptLoad = () => setIsLoaded(true);
    const onScriptError = () => {
        console.error('Paystack script failed to load.');
        setError(true);
    };

    script.addEventListener('load', onScriptLoad);
    script.addEventListener('error', onScriptError);

    document.body.appendChild(script);

    return () => {
      script.removeEventListener('load', onScriptLoad);
      script.removeEventListener('error', onScriptError);
    };
  }, []);

  return { isLoaded, error };
}
