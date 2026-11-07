import type { Product } from './types';

export const NOT_LISTED = 'Brands not on your list';

// Your brand and listed competitors as themselves, every brand the answers
// named that isn't on the list as one entry: they count toward share, but
// shown one by one beside the chosen competitors they read as competitors.
export function groupUnlisted(products: Product[]): Product[] {
  const listed = products.filter(p => p.listed !== false);
  const others = products.filter(p => p.listed === false);
  const count = others.reduce((s, p) => s + p.count, 0);
  if (!count) return listed;
  return [...listed, { name: NOT_LISTED, count, share: others.reduce((s, p) => s + p.share, 0), listed: false }]
    .sort((a, b) => b.count - a.count);
}

// The brand plus the most-named others, so the brand is never pushed out by
// unlisted names; the rest are grouped.
export function topProducts(products: Product[], n: number, grouped = true): Product[] {
  const brand = products.find(p => p.isBrand);
  const others = products.filter(p => !p.isBrand);
  const kept = brand ? [brand, ...others.slice(0, n - 1)] : others.slice(0, n);
  const rest = others.filter(p => !kept.includes(p));
  const out = [...kept].sort((a, b) => b.count - a.count);
  if (grouped && rest.some(p => p.count > 0)) {
    out.push({
      name: 'Other brands', count: rest.reduce((s, p) => s + p.count, 0),
      share: rest.reduce((s, p) => s + p.share, 0), listed: false,
    });
  }
  return out;
}
