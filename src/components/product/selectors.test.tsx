import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { products } from '../../data/mock/products';
import type { Product } from '../../domain/types';
import { ColourSwatches } from './ColourSwatches';
import { SizeSelector } from './SizeSelector';

// Test-local fixtures: Petals with Blush Pink EU 36 sold out and 2 pairs of Rich Brown EU 35,
// and a demo style sold out in every size.
const realPetals = products.find((p) => p.id === 'petals-heels')!;
const petals: Product = {
  ...realPetals,
  colourways: realPetals.colourways.map((c) =>
    c.id === 'blush-pink' ? { ...c, stock: { ...c.stock, 36: 0 } } : c.id === 'rich-brown' ? { ...c, stock: { ...c.stock, 35: 2 } } : c,
  ),
};
const gilded: Pick<Product, 'colourways'> = {
  colourways: [
    {
      id: 'gold',
      name: 'Gold',
      family: 'metallic',
      swatch: { base: '#C9A75A', deep: '#6A5422', tint: '#F6EFDD' },
      images: [],
      stock: { 35: 0, 36: 0, 37: 0, 38: 0, 39: 0, 40: 0 },
    },
  ],
};

describe('ColourSwatches', () => {
  it('exposes colours as a radio group and reports the chosen colour', async () => {
    const onChange = vi.fn();
    render(<ColourSwatches colourways={petals.colourways} selectedId="rich-brown" onChange={onChange} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(screen.getByRole('radio', { name: /rich brown/i })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: /sage green/i }));
    expect(onChange).toHaveBeenCalledWith('sage-green');
  });

  it('disables colourways that are sold out in every size', () => {
    render(<ColourSwatches colourways={gilded.colourways} selectedId="gold" onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: /gold/i })).toBeDisabled();
  });

  it('supports arrow-key selection', async () => {
    const onChange = vi.fn();
    render(<ColourSwatches colourways={petals.colourways} selectedId="rich-brown" onChange={onChange} />);
    screen.getByRole('radio', { name: /rich brown/i }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('blush-pink');
  });
});

describe('SizeSelector', () => {
  it('disables sizes that are sold out in the selected colour only', () => {
    const blush = petals.colourways.find((c) => c.id === 'blush-pink')!;
    const brown = petals.colourways.find((c) => c.id === 'rich-brown')!;
    const { rerender } = render(<SizeSelector sizes={petals.sizes} colourway={blush} selected={null} onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: /EU 36, sold out/i })).toBeDisabled();
    rerender(<SizeSelector sizes={petals.sizes} colourway={brown} selected={null} onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: /^EU 36$/i })).toBeEnabled();
  });

  it('never shows a stock count, even when a size runs low', () => {
    const brown = petals.colourways.find((c) => c.id === 'rich-brown')!;
    render(<SizeSelector sizes={petals.sizes} colourway={brown} selected={35} onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: /^EU 35$/i })).toBeChecked();
    expect(screen.queryByText(/left in eu/i)).not.toBeInTheDocument();
  });
});
