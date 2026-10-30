import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../App';
import { createMemoryStorage } from '../lib/storage';
import { routes } from '../routes';

// jsdom's name computation drops the space before the visually hidden words; browsers keep it.
const named = (words: string) => new RegExp(`^${words} ?\\(opens in new tab\\)$`);

describe('product page links that open a new tab', () => {
  it('name their destination without reading out the ↗ beside it', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/products/petals-heels'] });
    render(
      <AppProviders storage={createMemoryStorage()}>
        <RouterProvider router={router} />
      </AppProviders>,
    );
    expect(await screen.findByRole('link', { name: named('Also coming to TikTok Shop') })).toBeInTheDocument();
    // The colour's note cites its Instagram post (in the gallery and, below 1024px, the buy box).
    expect(screen.getAllByRole('link', { name: named('Whimy on Instagram') }).length).toBeGreaterThan(0);
    expect(screen.queryAllByRole('link', { name: /↗/ })).toHaveLength(0);
  });
});
