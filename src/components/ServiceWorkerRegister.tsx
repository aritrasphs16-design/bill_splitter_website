'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.protocol !== 'http:' && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').then(
          function (registration) {
            console.log('Service Worker registration successful with scope: ', registration.scope);
          },
          function (err) {
            console.log('Service Worker registration failed: ', err);
          }
        );
      });
    } else if ('serviceWorker' in navigator && process.env.NODE_ENV === 'development') {
      // Also register in dev for testing purposes, though optional.
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').then(
          function (registration) {
            console.log('Service Worker registration successful (DEV) with scope: ', registration.scope);
          },
          function (err) {
            console.log('Service Worker registration failed (DEV): ', err);
          }
        );
      });
    }
  }, []);

  return null;
}
