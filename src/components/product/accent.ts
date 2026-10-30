import type { CSSProperties } from 'react';
import type { Colourway } from '../../domain/types';

/**
 * Sets the registered `--accent` to a colourway's swatch colour. It drives only
 * swatch fills that follow the selected colour (DESIGN.md §2): never tints, washes or glows.
 */
export function accentVars(colourway: Colourway | undefined): CSSProperties {
  if (!colourway) return {};
  return { '--accent': colourway.swatch.base } as CSSProperties;
}
