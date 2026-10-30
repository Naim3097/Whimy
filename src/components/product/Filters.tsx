import { useEffect, useId, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import type { ColourFamily, HeelBand, Size } from '../../domain/types';
import {
  activeFilterCount,
  applyFilters,
  CATEGORY_LABELS,
  COLOUR_FAMILY_LABELS,
  COLOUR_FAMILY_SWATCH,
  computeFacets,
  EMPTY_FILTERS,
  filtersFromParams,
  filtersToParams,
  HEEL_LABELS,
  PRICE_LABELS,
  SORT_OPTIONS,
  sortCards,
  sortFromParams,
  type CatalogFilters,
  type FacetOption,
  type Facets,
  type ListingCard,
  type SortKey,
} from '../../lib/catalog';
import { Icon } from '../ui/Icon';
import { ProductGrid } from './ProductCard';
import styles from './Filters.module.css';

const PAGE_SIZE = 24;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Keeps selected options visible even when the other filters leave them with no matches. */
function withSelected<T extends string | number>(options: FacetOption<T>[], selected: T[], label: (v: T) => string): FacetOption<T>[] {
  const present = new Set(options.map((o) => o.value));
  return [...options, ...selected.filter((s) => !present.has(s)).map((value) => ({ value, label: label(value), count: 0 }))];
}

const sortLabel = (label: string) => label.charAt(0).toLowerCase() + label.slice(1);
const plural = (n: number) => `${n} ${n === 1 ? 'result' : 'results'}`;

interface FacetProps {
  /** A dashed ident shared by the trigger and its popover for anchor positioning. */
  anchor: string;
  title: string;
  active: number;
  /** Grow past 320px so the content keeps to one row (the size squares). */
  fit?: boolean;
  children: ReactNode;
}

/** A text button that opens a 320px popover under it (a bottom sheet on phones). */
function Facet({ anchor, title, active, fit, children }: FacetProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const anchorStyle = { '--anchor': anchor } as CSSProperties;

  return (
    <div className={styles.facet}>
      <button type="button" className={styles.trigger} popoverTarget={id} style={anchorStyle}>
        {title}
        {active > 0 && <span className="num"> ({active})</span>}
        <Icon name="chevronDown" className={styles.caret} />
      </button>
      <div
        id={id}
        popover="auto"
        className={styles.popover}
        style={anchorStyle}
        data-fit={fit || undefined}
        role="dialog"
        aria-labelledby={titleId}
      >
        <div className={styles.popHead}>
          <p id={titleId} className="t-ui">
            {title}
          </p>
          <button type="button" className="link t-small" popoverTarget={id} popoverTargetAction="hide">
            Close
          </button>
        </div>
        <div className={styles.popBody}>{children}</div>
      </div>
    </div>
  );
}

interface FilterBarProps {
  count: number;
  filters: CatalogFilters;
  facets: Facets;
  sort: SortKey;
  onChange: (next: CatalogFilters) => void;
  onSort: (sort: SortKey) => void;
}

/**
 * One bar above the grid: the count, "Colour", "Size" and "Heel height" as
 * text buttons with popovers, and the sort on the right. Never a sidebar.
 */
export function FilterBar({ count, filters, facets, sort, onChange, onSort }: FilterBarProps) {
  const colours = withSelected(facets.colours, filters.colours, (v) => COLOUR_FAMILY_LABELS[v]);
  const sizes = withSelected(facets.sizes, filters.sizes, (v) => `EU ${v}`);
  const heels = withSelected(facets.heels, filters.heels, (v) => HEEL_LABELS[v]);

  // A removed filter link takes focus with it: after the change, focus the link now in its
  // place (the next filter, or "Clear all"), or the count once none are left.
  const wrap = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLParagraphElement>(null);
  const refocus = useRef<number | null>(null);
  useEffect(() => {
    const index = refocus.current;
    if (index === null) return;
    refocus.current = null;
    const links = wrap.current?.querySelectorAll<HTMLButtonElement>(`.${styles.active} button`);
    if (index >= 0 && links?.length) links[Math.min(index, links.length - 1)].focus();
    else countRef.current?.focus();
  });

  return (
    <div ref={wrap} className={styles.barWrap}>
      <div className={styles.bar}>
        <p ref={countRef} tabIndex={-1} className={`t-small muted num ${styles.count}`} aria-live="polite">
          {plural(count)}
        </p>

        <div className={styles.facets}>
          {colours.length > 0 && (
            <Facet anchor="--filter-colour" title="Colour" active={filters.colours.length}>
              <fieldset>
                <legend className="sr-only">Colour</legend>
                {colours.map((o) => (
                  <label key={o.value} className="check">
                    <input
                      type="checkbox"
                      checked={filters.colours.includes(o.value)}
                      onChange={() => onChange({ ...filters, colours: toggle<ColourFamily>(filters.colours, o.value) })}
                    />
                    <span className={styles.option}>
                      <span className="chip" style={{ '--chip': COLOUR_FAMILY_SWATCH[o.value] } as CSSProperties} aria-hidden="true" />
                      {o.label}
                      <span className="muted num">({o.count})</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            </Facet>
          )}

          {sizes.length > 0 && (
            <Facet anchor="--filter-size" title="Size" active={filters.sizes.length} fit>
              <fieldset>
                <legend className="t-small muted">In stock, EU sizes</legend>
                <div className={styles.sizes}>
                  {sizes.map((o) => (
                    <label key={o.value} className={styles.size}>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={filters.sizes.includes(o.value)}
                        onChange={() => onChange({ ...filters, sizes: toggle<Size>(filters.sizes, o.value) })}
                      />
                      <span aria-hidden="true">{o.value}</span>
                      <span className="sr-only">
                        EU {o.value}, {plural(o.count)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </Facet>
          )}

          {heels.length > 0 && (
            <Facet anchor="--filter-heel" title="Heel height" active={filters.heels.length}>
              <fieldset>
                <legend className="sr-only">Heel height</legend>
                {heels.map((o) => (
                  <label key={o.value} className="check">
                    <input
                      type="checkbox"
                      checked={filters.heels.includes(o.value)}
                      onChange={() => onChange({ ...filters, heels: toggle<HeelBand>(filters.heels, o.value) })}
                    />
                    <span className={styles.option}>
                      {o.label}
                      <span className="muted num">({o.count})</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            </Facet>
          )}
        </div>

        <label className={styles.sort}>
          <span>Sort:</span>
          {/* The facet triggers' grammar: the value, then the same chevron 6px after it. */}
          <span className={styles.sortField}>
            <select className={styles.sortSelect} value={sort} onChange={(e) => onSort(e.target.value as SortKey)}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {sortLabel(o.label)}
                </option>
              ))}
            </select>
            <Icon name="chevronDown" className={`${styles.caret} ${styles.sortCaret}`} />
          </span>
        </label>
      </div>

      <ActiveFilters
        filters={filters}
        onRemove={(next, index) => {
          refocus.current = index;
          onChange(next);
        }}
      />
    </div>
  );
}

/**
 * Active filters as "label ×" text links, plus "Clear all". `onRemove` gets the
 * removed link's position, so the bar can put focus back where it was.
 */
export function ActiveFilters({ filters, onRemove }: { filters: CatalogFilters; onRemove: (next: CatalogFilters, index: number) => void }) {
  const active: { key: string; label: string; remove: () => CatalogFilters }[] = [
    ...filters.colours.map((v) => ({ key: `c-${v}`, label: COLOUR_FAMILY_LABELS[v], remove: () => ({ ...filters, colours: filters.colours.filter((x) => x !== v) }) })),
    ...filters.sizes.map((v) => ({ key: `s-${v}`, label: `EU ${v}`, remove: () => ({ ...filters, sizes: filters.sizes.filter((x) => x !== v) }) })),
    ...filters.categories.map((v) => ({ key: `t-${v}`, label: CATEGORY_LABELS[v], remove: () => ({ ...filters, categories: filters.categories.filter((x) => x !== v) }) })),
    ...filters.heels.map((v) => ({ key: `h-${v}`, label: HEEL_LABELS[v], remove: () => ({ ...filters, heels: filters.heels.filter((x) => x !== v) }) })),
    ...filters.price.map((v) => ({ key: `p-${v}`, label: PRICE_LABELS[v], remove: () => ({ ...filters, price: filters.price.filter((x) => x !== v) }) })),
    ...(filters.inStockOnly ? [{ key: 'stock', label: 'In stock', remove: () => ({ ...filters, inStockOnly: false }) }] : []),
  ];
  if (!active.length) return null;
  return (
    <ul role="list" className={styles.active} aria-label="Active filters">
      {active.map((f, i) => (
        <li key={f.key}>
          <button type="button" className={`link t-small ${styles.remove}`} onClick={() => onRemove(f.remove(), i)} aria-label={`Remove filter: ${f.label}`}>
            {f.label} <span aria-hidden="true">×</span>
          </button>
        </li>
      ))}
      <li>
        <button type="button" className={`link t-small muted ${styles.remove}`} onClick={() => onRemove(EMPTY_FILTERS, -1)}>
          Clear all
        </button>
      </li>
    </ul>
  );
}

/**
 * A filterable, sortable card grid whose state lives in the URL
 * (?colour=…&size=…&heel=…&sort=…&page=…). The facet and sort logic is in lib/catalog.
 */
export function CatalogueListing({ cards }: { cards: ListingCard[] }) {
  const [params, setParams] = useSearchParams();
  const gridRef = useRef<HTMLDivElement>(null);
  const key = params.toString();

  const { filters, sort, page } = useMemo(() => {
    const p = new URLSearchParams(key);
    return { filters: filtersFromParams(p), sort: sortFromParams(p), page: Math.max(1, Number(p.get('page') ?? 1) || 1) };
  }, [key]);
  const results = useMemo(() => sortCards(applyFilters(cards, filters), sort), [cards, filters, sort]);
  const facets = useMemo(() => computeFacets(cards, filters), [cards, filters]);
  const visible = results.slice(0, page * PAGE_SIZE);

  const setFilters = (next: CatalogFilters) => setParams(filtersToParams(next, params), { replace: true, preventScrollReset: true });
  const setSort = (value: SortKey) => {
    const next = new URLSearchParams(params);
    if (value === 'featured') next.delete('sort');
    else next.set('sort', value);
    setParams(next, { replace: true, preventScrollReset: true });
  };
  const showMore = () => {
    const next = new URLSearchParams(params);
    next.set('page', String(page + 1));
    setParams(next, { replace: true, preventScrollReset: true });
    // Move focus to the first newly shown card for keyboard and screen-reader users.
    requestAnimationFrame(() => gridRef.current?.querySelectorAll<HTMLAnchorElement>('h3 a')[page * PAGE_SIZE]?.focus());
  };

  return (
    <div className={styles.listing}>
      <FilterBar count={results.length} filters={filters} facets={facets} sort={sort} onChange={setFilters} onSort={setSort} />

      {results.length === 0 ? (
        <div className={styles.empty}>
          <p className="t-ui">Nothing matches {activeFilterCount(filters) === 1 ? 'that filter' : 'those filters'}.</p>
          <button type="button" className="link t-small" onClick={() => setFilters(EMPTY_FILTERS)}>
            Clear all filters
          </button>
        </div>
      ) : (
        <div ref={gridRef}>
          {/* A range of three (Whimy's colours today) gets three larger cards rather than a gap. */}
          <ProductGrid cards={visible} priorityCount={4} columns={cards.length <= 3 ? 3 : 4} />
        </div>
      )}

      {visible.length < results.length && (
        <div className={styles.more}>
          <button type="button" className="btn btn--secondary" onClick={showMore}>
            Show more <span className="num">({visible.length} of {results.length})</span>
          </button>
        </div>
      )}
    </div>
  );
}
