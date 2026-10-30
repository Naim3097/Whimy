import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { conceptOfPath, type ConceptId } from '../config/concepts';
import { useUI } from '../state/ui';

/**
 * The concept the chrome should wear right now: a homepage always wears its
 * own, every other page the one last visited. Reading the path during render
 * means a homepage never flashes the other concept's header first.
 */
export function useActiveConcept(): ConceptId {
  const { pathname } = useLocation();
  const { concept } = useUI();
  return conceptOfPath(pathname) ?? concept;
}

/** Remembers the homepage concept just visited, so the shop pages keep its chrome. */
export function useRememberConcept() {
  const { pathname } = useLocation();
  const { concept, setConcept } = useUI();
  useEffect(() => {
    const here = conceptOfPath(pathname);
    if (here && here !== concept) setConcept(here);
  }, [pathname, concept, setConcept]);
}
