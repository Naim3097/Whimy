import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '../App';
import type { CartLine } from '../domain/types';
import { lineKey } from '../lib/cart';
import { createMemoryStorage, STORAGE_KEYS, type StorageAdapter } from '../lib/storage';
import { routes } from '../routes';

function renderAt(path: string, storage: StorageAdapter = createMemoryStorage()) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AppProviders storage={storage}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { router, storage };
}

/** Concept A's homepage is code-split: wait for its slideshow before querying it. */
async function renderHomeA() {
  const rendered = renderAt('/concept-a');
  await screen.findByRole('region', { name: 'Petals Heels in three colours' });
  return rendered;
}

/** The site header: the first banner (closed dialogs carry header elements of their own). */
const siteHeader = () => screen.getAllByRole('banner')[0];

const bagLine = (colourId: string, size: CartLine['size']): CartLine => {
  const variant = { productId: 'petals-heels', colourId, size };
  return { ...variant, key: lineKey(variant), quantity: 1, addedAt: 0 };
};

describe('Concept A (/concept-a), after Christy Ng', () => {
  it('opens on a slideshow with one slide per colour, each linking to that colour', async () => {
    await renderHomeA();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/^Whimy: Petals Heels/);
    const hero = screen.getByRole('region', { name: 'Petals Heels in three colours' });
    const slides = within(hero).getAllByRole('group', { hidden: true });
    expect(slides).toHaveLength(3);
    const links = within(hero).getAllByRole('link', { name: /^Shop (choco|strawberry|kiwi)$/, hidden: true });
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/products/petals-heels?colour=rich-brown',
      '/products/petals-heels?colour=blush-pink',
      '/products/petals-heels?colour=sage-green',
    ]);
    // Only the first slide is reachable until the show moves on.
    expect(within(hero).getByRole('link', { name: 'Shop choco' })).toBeVisible();
    expect(within(hero).queryByRole('link', { name: 'Shop kiwi' })).not.toBeInTheDocument();
  });

  it('moves to a slide from its dot and stops playing once the shopper takes over', async () => {
    await renderHomeA();
    const hero = screen.getByRole('region', { name: 'Petals Heels in three colours' });
    expect(within(hero).getByRole('button', { name: /^Pause/ })).toBeInTheDocument();
    await userEvent.click(within(hero).getByRole('button', { name: 'Show slide 3 of 3' }));
    expect(within(hero).getByRole('link', { name: 'Shop kiwi' })).toBeInTheDocument();
    expect(within(hero).getByRole('button', { name: /^Play/ })).toBeInTheDocument();
  });

  it('swipes on a touch screen, then announces slides once the shopper has taken over', async () => {
    await renderHomeA();
    const hero = screen.getByRole('region', { name: 'Petals Heels in three colours' });
    const track = hero.querySelector('[aria-live]') as HTMLElement;
    // Silent while it turns on its own (the WAI-ARIA carousel pattern).
    expect(track).toHaveAttribute('aria-live', 'off');
    fireEvent.pointerDown(track, { pointerType: 'touch', clientX: 300, clientY: 200 });
    fireEvent.pointerUp(track, { pointerType: 'touch', clientX: 120, clientY: 210 });
    expect(within(hero).getByRole('link', { name: 'Shop strawberry' })).toBeInTheDocument();
    expect(track).toHaveAttribute('aria-live', 'polite');
    // A mouse drag selects text instead.
    fireEvent.pointerDown(track, { pointerType: 'mouse', clientX: 300, clientY: 200 });
    fireEvent.pointerUp(track, { pointerType: 'mouse', clientX: 120, clientY: 200 });
    expect(within(hero).getByRole('link', { name: 'Shop strawberry' })).toBeInTheDocument();
  });

  it('lists the four doors and the three colours on the product band', async () => {
    await renderHomeA();
    const doors = screen.getByRole('navigation', { name: 'Ways into Whimy' });
    expect(within(doors).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([
      '/shop/petals-collection',
      '/help#size-fit',
      '/story#letter',
      '/next-bloom',
    ]);
    const band = screen.getByRole('region', { name: 'The Petals Collection' });
    const products = await within(band).findAllByRole('link', { name: /^Petals Heels, / });
    expect(products.map((a) => a.getAttribute('href'))).toEqual([
      '/products/petals-heels?colour=rich-brown',
      '/products/petals-heels?colour=blush-pink',
      '/products/petals-heels?colour=sage-green',
    ]);
  });
});

describe('Concept B (/, the default), after Jimmy Choo', () => {
  it('opens on the campaign, then the strip of colours and two doors', async () => {
    renderAt('/');
    const campaign = await screen.findByRole('region', { name: 'Petals Heels campaign' });
    expect(within(campaign).getAllByRole('group', { hidden: true })).toHaveLength(2);
    expect(within(campaign).getByRole('link', { name: 'Shop Petals Heels' })).toHaveAttribute('href', '/shop/petals-collection');
    // The meadow is an AI concept visual, and says so where it shows.
    expect(within(campaign).getByRole('button', { name: /^AI visual/ })).toBeInTheDocument();
    expect(campaign.querySelector('picture source')).toHaveAttribute('media', '(min-width: 1024px), (min-aspect-ratio: 4/5)');
    // The film's slide waits off-screen, out of reach, until the campaign moves on.
    expect(within(campaign).queryByRole('link', { name: 'Shop now' })).not.toBeInTheDocument();

    const strip = screen.getByRole('region', { name: 'Petals Heels in each colour' });
    expect(await within(strip).findAllByRole('heading', { level: 3 })).toHaveLength(4);
    expect(within(strip).getByRole('link', { name: 'All three' })).toBeInTheDocument();
    // Its packshots are AI concept visuals, and every tile says so.
    expect(within(strip).getAllByRole('button', { name: /^AI visual/ })).toHaveLength(4);
    expect(strip.querySelector('img')).toHaveAttribute('src', expect.stringMatching(/^\/images\/concept\/packshot-/));

    // The KL scene is a stock photograph, and says so.
    const scene = screen.getByRole('region', { name: 'Based in Kuala Lumpur' });
    expect(within(scene).getByRole('button', { name: /^stock photo/ })).toBeInTheDocument();
    expect(scene.querySelector('img')).toHaveAttribute('src', expect.stringMatching(/^\/images\/stock\/klcc-towers-/));

    const doors = screen.getByRole('region', { name: 'Shop by colour' });
    expect(within(doors).getByRole('link', { name: 'Shop choco' })).toHaveAttribute('href', '/products/petals-heels?colour=rich-brown');
    expect(within(doors).getByRole('link', { name: 'Shop kiwi' })).toHaveAttribute('href', '/products/petals-heels?colour=sage-green');
  });

  it('moves to the labelled stock film by arrow or bar, and one button pauses everything', async () => {
    renderAt('/');
    const campaign = await screen.findByRole('region', { name: 'Petals Heels campaign' });
    const motion = () => within(campaign).getByRole('button', { name: /the campaign$/ });
    expect(motion()).toHaveAccessibleName('Pause the campaign');

    await userEvent.click(within(campaign).getByRole('button', { name: 'Next slide' }));
    expect(within(campaign).getByRole('button', { name: 'Show slide 2 of 2' })).toHaveAttribute('aria-current', 'true');
    expect(within(campaign).getByRole('link', { name: 'Shop now' })).toHaveAttribute('href', '/products/petals-heels');
    expect(within(campaign).getByRole('button', { name: /^stock footage/ })).toBeInTheDocument();
    expect(campaign.querySelector('video source')).toHaveAttribute('src', '/video/satin-sky-1280x720.mp4');

    // The slides stopped when the shopper took over, but the film still moves until paused.
    expect(motion()).toHaveAccessibleName('Pause the campaign');
    await userEvent.click(motion());
    expect(motion()).toHaveAccessibleName('Play the campaign');

    await userEvent.click(within(campaign).getByRole('button', { name: 'Show slide 1 of 2' }));
    expect(within(campaign).getByRole('link', { name: 'Shop Petals Heels' })).toBeInTheDocument();
    await userEvent.click(motion());
    expect(motion()).toHaveAccessibleName('Pause the campaign');
  });

  it('holds while focus is anywhere inside, and Play resumes it with focus still there', async () => {
    renderAt('/');
    const campaign = await screen.findByRole('region', { name: 'Petals Heels campaign' });
    const track = campaign.querySelector('[aria-live]') as HTMLElement;
    expect(track).toHaveAttribute('aria-live', 'off');
    const motion = within(campaign).getByRole('button', { name: /the campaign$/ });
    act(() => motion.focus());
    // Reaching the controls holds the slides, so none moves while a keyboard user is on its way to Pause.
    expect(track).toHaveAttribute('aria-live', 'polite');
    await userEvent.click(motion);
    expect(motion).toHaveAccessibleName('Play the campaign');
    await userEvent.click(motion);
    expect(motion).toHaveAccessibleName('Pause the campaign');
    expect(track).toHaveAttribute('aria-live', 'off');
  });

  it('wears its own header: words beside the glyphs, with Saved and Account', async () => {
    renderAt('/');
    await screen.findByRole('region', { name: 'Petals Heels campaign' });
    const header = siteHeader();
    expect(within(header).getByRole('link', { name: /^Saved/ })).toHaveAttribute('href', '/saved');
    expect(within(header).getByRole('link', { name: 'Account' })).toHaveAttribute('href', '/account');
  });
});

describe('keyboard focus on the shop pages', () => {
  it('stays on the filter bar when an active filter is removed', async () => {
    renderAt('/shop/petals-collection?colour=pink&size=37');
    await userEvent.click(await screen.findByRole('button', { name: 'Remove filter: Pink' }));
    // The next filter takes the removed one's place under focus...
    expect(screen.getByRole('button', { name: 'Remove filter: EU 37' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Remove filter: EU 37' }));
    // ...and with none left, the result count takes it.
    expect(screen.queryByRole('list', { name: 'Active filters' })).not.toBeInTheDocument();
    expect(document.activeElement).toHaveTextContent(/^\d+ results?$/);
  });
});

describe("Concept B's utility bar", () => {
  it('keeps one slot for its messages, and Stop turns into Resume in place', async () => {
    renderAt('/');
    const bar = await screen.findByRole('region', { name: 'Site messages' });
    // One message is showing; the others hold the slot unseen and out of the tab order.
    expect(within(bar).getAllByRole('link', { name: /Petals Collection|bloom next|Size, delivery/ })).toHaveLength(1);
    const stop = within(bar).getByRole('button', { name: 'Stop rotating messages' });
    stop.focus();
    await userEvent.keyboard('{Enter}');
    const resume = within(bar).getByRole('button', { name: 'Resume rotating messages' });
    expect(resume).toHaveFocus();
  });
});

describe('switching concepts', () => {
  it('makes B the default: a first visit to a shop page wears its chrome', async () => {
    renderAt('/shop/petals-collection');
    await screen.findByRole('heading', { level: 1, name: 'Petals Collection' });
    expect(within(siteHeader()).getByRole('link', { name: /^Saved/ })).toBeInTheDocument();
    expect(within(siteHeader()).getByRole('link', { name: 'Whimy, home' })).toHaveAttribute('href', '/');
  });

  it('lands links shared with B’s old path on the root', async () => {
    const { router } = renderAt('/home-jimmy-choo');
    await screen.findByRole('region', { name: 'Petals Heels campaign' });
    expect(router.state.location.pathname).toBe('/');
  });

  it('remembers the concept for the shop pages and never touches the bag', async () => {
    const storage = createMemoryStorage();
    storage.write(STORAGE_KEYS.cart, [bagLine('blush-pink', 37)]);
    const { router } = renderAt('/concept-a', storage);

    const bag = () => within(siteHeader()).getByRole('button', { name: /^Bag/ });
    await screen.findByRole('region', { name: 'The Petals Collection' });
    expect(bag()).toHaveTextContent('1');
    expect(within(siteHeader()).queryByRole('link', { name: /^Saved/ })).not.toBeInTheDocument();

    // The presentation switch in the bar above the header.
    const switcher = screen.getAllByRole('navigation', { name: 'Homepage concepts' })[0];
    expect(within(switcher).getByRole('link', { name: /^A/ })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(within(switcher).getByRole('link', { name: /^B/ }));

    await screen.findByRole('region', { name: 'Petals Heels campaign' });
    expect(storage.read(STORAGE_KEYS.concept, null)).toBe('b');
    expect(bag()).toHaveTextContent('1');
    expect(storage.read<CartLine[]>(STORAGE_KEYS.cart, [])).toHaveLength(1);

    // A shop page keeps B's chrome, and the wordmark leads back to B's homepage.
    await router.navigate('/shop/petals-collection');
    await screen.findByRole('heading', { level: 1, name: 'Petals Collection' });
    expect(within(siteHeader()).getByRole('link', { name: /^Saved/ })).toBeInTheDocument();
    expect(within(siteHeader()).getByRole('link', { name: 'Whimy, home' })).toHaveAttribute('href', '/');
  });
});
