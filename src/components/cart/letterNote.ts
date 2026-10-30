import { useSyncExternalStore } from 'react';
import { sessionStore, STORAGE_KEYS } from '../../lib/storage';
import { EMPTY_DRAFT, type CheckoutDraftState } from '../../state/checkout';

/**
 * The letter-card note, kept in the checkout draft (`giftNote`) so checkout and
 * the order pick it up. Every write re-reads the stored draft, so the bag never
 * overwrites details entered at checkout, and every open bag view stays in step.
 */
const listeners = new Set<() => void>();

const readDraft = () => sessionStore.read<Partial<CheckoutDraftState>>(STORAGE_KEYS.checkoutDraft, {});

function getNote(): string {
  const note = readDraft().giftNote;
  return typeof note === 'string' ? note : '';
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setNote(note: string) {
  sessionStore.write(STORAGE_KEYS.checkoutDraft, { ...EMPTY_DRAFT, ...readDraft(), giftNote: note });
  listeners.forEach((listener) => listener());
}

export function useLetterNote(): [string, (note: string) => void] {
  return [useSyncExternalStore(subscribe, getNote, () => ''), setNote];
}
