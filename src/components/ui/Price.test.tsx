import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Provenance } from '../../domain/types';
import { UIProvider, useUI } from '../../state/ui';
import { Price } from './Price';

function AboutProbe() {
  const { aboutOpen } = useUI();
  return <output data-testid="about">{aboutOpen ? 'open' : 'closed'}</output>;
}

function renderWithUI(ui: ReactNode) {
  return render(
    <UIProvider>
      {ui}
      <AboutProbe />
    </UIProvider>,
  );
}

describe('Price', () => {
  it('throws when rendered without a provenance', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    const missing = undefined as unknown as Provenance;
    expect(() => renderWithUI(<Price amount={19900} provenance={missing} />)).toThrow(/provenance/);
    quiet.mockRestore();
  });

  it('marks a demo price as sample', () => {
    renderWithUI(<Price amount={19900} provenance="mock" />);
    expect(screen.getByText('RM 199.00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'sample value, not confirmed by Whimy' })).toHaveTextContent('sample');
  });

  it('marks an unconfirmed price as tbc', () => {
    renderWithUI(<Price amount={19900} provenance="assumption" />);
    expect(screen.getByRole('button', { name: 'tbc, to be confirmed by Whimy' })).toHaveTextContent('tbc');
  });

  it('shows no mark for a verified price', () => {
    renderWithUI(<Price amount={19900} provenance="verified" />);
    expect(screen.getByText('RM 199.00')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows a was-price only when the price is verified', () => {
    const { unmount } = renderWithUI(<Price amount={19900} compareAt={25900} provenance="mock" />);
    expect(screen.queryByText('RM 259.00')).not.toBeInTheDocument();
    unmount();
    renderWithUI(<Price amount={19900} compareAt={25900} provenance="verified" />);
    expect(screen.getByText('RM 259.00')).toBeInTheDocument();
  });

  it('opens About this preview from the mark', async () => {
    renderWithUI(<Price amount={19900} provenance="mock" />);
    expect(screen.getByTestId('about')).toHaveTextContent('closed');
    await userEvent.click(screen.getByRole('button', { name: 'sample value, not confirmed by Whimy' }));
    expect(screen.getByTestId('about')).toHaveTextContent('open');
  });
});
