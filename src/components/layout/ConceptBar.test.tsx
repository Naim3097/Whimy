import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryStorage, STORAGE_KEYS } from '../../lib/storage';
import type { LaunchStage } from '../../lib/launch';
import { UIProvider } from '../../state/ui';
import { ConceptBar } from './ConceptBar';

/** Concept B's homepage, where the bar is the dark utility bar with rotating messages. */
function renderBar(stage: LaunchStage = 'preview-live') {
  const storage = createMemoryStorage();
  storage.write(STORAGE_KEYS.launchStage, stage);
  const router = createMemoryRouter([{ path: '*', element: <ConceptBar /> }], { initialEntries: ['/'] });
  render(
    <UIProvider storage={storage}>
      <RouterProvider router={router} />
    </UIProvider>,
  );
  return screen.getByRole('region', { name: 'Site messages' });
}

/** Every message in the slot, the unseen ones included (the first is showing). */
const slotTexts = (bar: HTMLElement) => {
  const first = within(bar).getByRole('link', { name: /^(The Petals Collection|Launch date)/ });
  return [...(first.parentElement?.children ?? [])].map((a) => a.textContent ?? '');
};

describe("Concept B's utility bar", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('turns on its own in silence, and announces the message Next brings in', () => {
    const bar = renderBar();
    const status = within(bar).getByRole('status');
    const shown = () => within(bar).getByRole('link', { name: /Petals Collection|bloom next|see Help/ });
    expect(shown()).toHaveTextContent('The Petals Collection in three colours');
    expect(status.textContent).toBe('');

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(shown()).toHaveTextContent('Which colour should bloom next? Vote');
    expect(status.textContent).toBe('');

    fireEvent.click(within(bar).getByRole('button', { name: 'Next message' }));
    expect(shown()).toHaveTextContent('Size, delivery and exchanges: see Help');
    expect(status).toHaveTextContent('Size, delivery and exchanges: see Help');

    // Next stops the turning, and the next press is announced in its turn.
    fireEvent.click(within(bar).getByRole('button', { name: 'Next message' }));
    expect(status).toHaveTextContent('The Petals Collection in three colours');
  });

  // A tripwire, not a measurement: the longest (42 characters) is about 231px of 12px Franklin,
  // inside the 244px slot of a 320px phone.
  it.each<LaunchStage>(['preview-live', 'waitlist'])('keeps every %s message short enough not to ellipsise', (stage) => {
    const texts = slotTexts(renderBar(stage));
    expect(texts).toHaveLength(3);
    for (const text of texts) expect(text.length).toBeLessThanOrEqual(42);
  });
});
