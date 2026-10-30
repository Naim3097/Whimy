import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';
import { AppProviders } from '../../App';
import { products } from '../../data/mock/products';
import { createMemoryStorage } from '../../lib/storage';
import { SetBuilderDialog } from './SetBuilder';

const petals = products.find((p) => p.id === 'petals-heels')!;

// jsdom has <dialog> but not its modal methods.
beforeAll(() => {
  if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  }
});

describe('SetBuilderDialog', () => {
  it('marks each colour left without a size as invalid, until a size is chosen', async () => {
    render(
      <AppProviders storage={createMemoryStorage()}>
        <SetBuilderDialog product={petals} open onClose={() => {}} />
      </AppProviders>,
    );
    const groups = screen.getAllByRole('group', { name: /size \(EU\)$/ });
    expect(groups).toHaveLength(3);
    for (const group of groups) expect(group).not.toHaveAttribute('aria-invalid');

    await userEvent.click(screen.getByRole('button', { name: 'Add all three to bag' }));
    for (const group of groups) {
      expect(group).toHaveAttribute('aria-invalid', 'true');
      expect(group).toHaveAccessibleDescription('Choose a size');
    }

    // A size clears that colour's error and leaves the others standing.
    const inStock = within(groups[0])
      .getAllByRole('radio')
      .find((radio) => !(radio as HTMLInputElement).disabled)!;
    await userEvent.click(inStock);
    expect(groups[0]).not.toHaveAttribute('aria-invalid');
    expect(groups[0]).not.toHaveAccessibleDescription();
    expect(groups[1]).toHaveAttribute('aria-invalid', 'true');
  });
});
