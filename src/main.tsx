import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/im-fell-english/latin-400-italic.css';
import '@fontsource/im-fell-english/latin-400.css';
import '@fontsource/im-fell-english-sc/latin-400.css';
import '@fontsource-variable/libre-franklin/wght.css';
import fellItalicUrl from '@fontsource/im-fell-english/files/im-fell-english-latin-400-italic.woff2?url';
import fellRomanUrl from '@fontsource/im-fell-english/files/im-fell-english-latin-400-normal.woff2?url';
import franklinUrl from '@fontsource-variable/libre-franklin/files/libre-franklin-latin-wght-normal.woff2?url';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import { App } from './App';

// Every first screen needs Franklin, the Fell italic voice and the Fell Roman wordmark; the SC cut loads on demand.
for (const href of [franklinUrl, fellItalicUrl, fellRomanUrl]) {
  if (document.head.querySelector(`link[rel="preload"][href="${href}"]`)) continue;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = 'font/woff2';
  link.crossOrigin = 'anonymous';
  link.href = href;
  document.head.append(link);
}

// Classic (Windows) scrollbars: keep their width in --scrollbar-w, so a dialog that
// locks the page can pad it back and nothing behind the scrim shifts (components.css).
// Measured only while no dialog is open; overlay scrollbars measure 0.
const root = document.documentElement;
new ResizeObserver(() => {
  if (document.querySelector('dialog[open]')) return;
  root.style.setProperty('--scrollbar-w', `${Math.max(0, window.innerWidth - root.clientWidth)}px`);
}).observe(root);

// The router keys a load's first entry by its URL (Layout.tsx), so a page reloaded or reached by
// back/forward returns to where it was. A fresh load (a typed URL, a bookmark, a link from
// elsewhere) opens at the top instead: drop that URL's saved position before the router reads it.
if ((performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type === 'navigate') {
  try {
    const key = 'react-router-scroll-positions';
    const saved = JSON.parse(sessionStorage.getItem(key) ?? '{}') as Record<string, number>;
    delete saved[location.pathname + location.search];
    sessionStorage.setItem(key, JSON.stringify(saved));
  } catch {
    // Storage blocked: nothing was saved either.
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
