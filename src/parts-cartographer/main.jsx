import React from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource/titan-one/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/nunito/900.css';
import './styles.css';

import App from './app.jsx';

/* A deploy replaces the hashed chunks, so a tab still on the previous build can
   fail to load a lazy screen. Reload once to pick up the new build; the flag
   stops a loop if the chunk is missing for another reason. */
window.addEventListener('vite:preloadError', (event) => {
  try {
    if (sessionStorage.getItem('ifs.chunk-reload') === '1') return;
    sessionStorage.setItem('ifs.chunk-reload', '1');
  } catch { return; }
  event.preventDefault();
  window.location.reload();
});
window.addEventListener('load', () => {
  setTimeout(() => { try { sessionStorage.removeItem('ifs.chunk-reload'); } catch { /* */ } }, 10_000);
});

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/* PWA service worker — production only (dev server must never be cached) */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  });
}
