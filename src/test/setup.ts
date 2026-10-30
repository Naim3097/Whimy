import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest globals are off, so register Testing Library's cleanup explicitly.
afterEach(() => cleanup());

// jsdom has no media queries: report "no match" (so no reduced motion, and the carousels play).
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// jsdom does not implement scrolling; the router's scroll restoration calls it on every navigation.
window.scrollTo = (() => {}) as typeof window.scrollTo;

// Nor media playback: Concept B's campaign film plays and pauses as its slide comes and goes.
HTMLMediaElement.prototype.play = () => Promise.resolve();
HTMLMediaElement.prototype.pause = () => {};
