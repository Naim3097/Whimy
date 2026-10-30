import { useCallback, useEffect, useRef, useState, type FocusEvent, type PointerEvent } from 'react';
import { usePrefersReducedMotion } from './dom';

interface CarouselOptions {
  count: number;
  /** Milliseconds per slide while playing: one value for every slide, or one per slide. */
  interval?: number | readonly number[];
  /** Hold while the pointer is over the carousel. Jimmy Choo's keeps going under the pointer. */
  holdOnHover?: boolean;
}

/**
 * State for a hero carousel, after both reference sites and the WAI-ARIA
 * carousel pattern: it plays on its own and stops for good when the shopper
 * takes over with a dot, an arrow, a bar or a swipe. It holds while focus is
 * anywhere inside it (and, if asked, while the pointer is over it); a held
 * slide resumes where it stopped. Pressing Play overrides the hold until focus
 * and pointer have left. Pause stops everything that moves, films included.
 * Under reduced motion nothing moves until the shopper presses Play. WCAG 2.2.2.
 */
export function useCarousel({ count, interval = 6000, holdOnHover = true }: CarouselOptions) {
  const [index, setIndex] = useState(0);
  const [pointerIn, setPointerIn] = useState(false);
  const [focusIn, setFocusIn] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [choice, setChoice] = useState<'play' | 'pause' | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  /** Whether anything may move on its own: a slide's film, and the slides themselves unless stopped. */
  const motion = choice ? choice === 'play' : !reducedMotion;
  const playing = count > 1 && motion && !stopped;
  const held = !resumed && ((holdOnHover && pointerIn) || focusIn);
  const running = playing && !held;
  const duration = typeof interval === 'number' ? interval : (interval[index] ?? 6000);

  // Time already spent on the current slide, so a held slide resumes where it stopped.
  const clock = useRef({ index: 0, ms: 0 });

  useEffect(() => {
    if (!running) return;
    if (clock.current.index !== index) clock.current = { index, ms: 0 };
    const since = performance.now();
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % count), Math.max(0, duration - clock.current.ms));
    return () => {
      window.clearTimeout(timer);
      clock.current.ms += performance.now() - since;
    };
  }, [running, index, count, duration]);

  /** Milliseconds already spent on slide `i` (0 for any slide but the current one). */
  const elapsed = useCallback((i: number) => (clock.current.index === i ? clock.current.ms : 0), []);

  const goTo = useCallback(
    (next: number) => {
      setStopped(true);
      setIndex(((next % count) + count) % count);
    },
    [count],
  );
  const next = () => goTo(index + 1);
  const previous = () => goTo(index - 1);

  const handlers = {
    onPointerEnter: () => setPointerIn(true),
    onPointerLeave: () => {
      setPointerIn(false);
      if (!focusIn) setResumed(false);
    },
    onFocus: () => setFocusIn(true),
    onBlur: (e: FocusEvent<HTMLElement>) => {
      if (e.currentTarget.contains(e.relatedTarget)) return;
      setFocusIn(false);
      if (!pointerIn) setResumed(false);
    },
  };

  // A horizontal swipe on a touch screen moves one slide; vertical drags still scroll the page
  // (the track sets touch-action: pan-y). Mouse drags are left alone: they select text.
  const swipeFrom = useRef<{ x: number; y: number } | null>(null);
  const swipe = {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      swipeFrom.current = e.pointerType === 'mouse' ? null : { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      const from = swipeFrom.current;
      swipeFrom.current = null;
      if (!from) return;
      const dx = e.clientX - from.x;
      if (Math.abs(dx) > 40 && Math.abs(dx) > 1.5 * Math.abs(e.clientY - from.y)) (dx < 0 ? next : previous)();
    },
    onPointerCancel: () => {
      swipeFrom.current = null;
    },
  };

  return {
    index,
    /** The slides advance on their own. */
    playing,
    /** Playing, but held by focus or the pointer. */
    held,
    motion,
    duration,
    elapsed,
    /** For the slides' container: changes are announced only when the slides are not turning on their own. */
    live: running ? ('off' as const) : ('polite' as const),
    goTo,
    next,
    previous,
    play: () => {
      setChoice('play');
      setStopped(false);
      setResumed(true);
    },
    pause: () => setChoice('pause'),
    handlers: holdOnHover ? handlers : { onFocus: handlers.onFocus, onBlur: handlers.onBlur },
    swipe,
  };
}
