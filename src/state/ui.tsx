import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { isConceptId, type ConceptId } from '../config/concepts';
import { site } from '../config/site';
import { isLaunchStage, type LaunchStage } from '../lib/launch';
import { persistentStorage, STORAGE_KEYS, type StorageAdapter } from '../lib/storage';

export interface Toast {
  id: number;
  /** Rich text allowed, so a colour reads "*nickname* · Official Name" like everywhere else. */
  message: ReactNode;
  tone?: 'default' | 'success' | 'error';
  action?: { label: string; onClick: () => void };
}

interface UIContextValue {
  toasts: Toast[];
  notify: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  /** The "About this preview" dialog. */
  aboutOpen: boolean;
  setAboutOpen: (open: boolean) => void;
  /** Preview-live or waitlist; starts from `site.launchStage` and remembers the toggle. */
  launchStage: LaunchStage;
  setLaunchStage: (stage: LaunchStage) => void;
  /** The homepage concept last visited; the shared pages wear its bar, header and footer. */
  concept: ConceptId;
  setConcept: (concept: ConceptId) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

function readSafely<T>(storage: StorageAdapter, key: string, accept: (value: unknown) => value is T, fallback: T): T {
  try {
    const value = storage.read<unknown>(key, fallback);
    return accept(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function writeSafely(storage: StorageAdapter, key: string, value: unknown) {
  try {
    storage.write(key, value);
  } catch {
    // Preview state is a convenience; losing it must never break the page.
  }
}

export function UIProvider({ children, storage = persistentStorage }: { children: ReactNode; storage?: StorageAdapter }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [launchStage, setLaunchStageState] = useState<LaunchStage>(() =>
    readSafely(storage, STORAGE_KEYS.launchStage, isLaunchStage, site.launchStage),
  );
  const [concept, setConceptState] = useState<ConceptId>(() => readSafely(storage, STORAGE_KEYS.concept, isConceptId, 'b'));
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  // Each toast owns its 4s timer (Toasts.tsx), held while it is hovered or focused.
  const notify = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-2), { ...toast, id }]);
  }, []);

  const setLaunchStage = useCallback(
    (stage: LaunchStage) => {
      setLaunchStageState(stage);
      writeSafely(storage, STORAGE_KEYS.launchStage, stage);
    },
    [storage],
  );

  const setConcept = useCallback(
    (next: ConceptId) => {
      setConceptState(next);
      writeSafely(storage, STORAGE_KEYS.concept, next);
    },
    [storage],
  );

  const value = useMemo(
    () => ({
      toasts,
      notify,
      dismiss,
      searchOpen,
      setSearchOpen,
      navOpen,
      setNavOpen,
      aboutOpen,
      setAboutOpen,
      launchStage,
      setLaunchStage,
      concept,
      setConcept,
    }),
    [toasts, notify, dismiss, searchOpen, navOpen, aboutOpen, launchStage, setLaunchStage, concept, setConcept],
  );
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside <UIProvider>');
  return ctx;
}
