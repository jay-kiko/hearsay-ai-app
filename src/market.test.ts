import { describe, it, expect } from 'vitest';
import { COUNTRIES, GLOBAL, LIMITS_SAFE_AREA, composeMarket, resolveCountry } from './market';

describe('composeMarket', () => {
  it('sends the country alone, or "area, country"', () => {
    expect(composeMarket('Singapore', '')).toBe('Singapore');
    expect(composeMarket('Philippines', '  Makati ')).toBe('Makati, Philippines');
  });

  it('sends just the area, or nothing, with no country', () => {
    expect(composeMarket(GLOBAL, 'Makati')).toBe('Makati');
    expect(composeMarket(GLOBAL, '')).toBe('');
  });

  it("keeps the longest area + country within the backend's 120-character limit", () => {
    const longest = [...COUNTRIES].sort((a, b) => b.length - a.length)[0];
    expect(composeMarket(longest, 'x'.repeat(LIMITS_SAFE_AREA)).length).toBeLessThanOrEqual(120);
  });
});

describe('countries', () => {
  it('covers small markets too, with readable names', () => {
    for (const c of ['Kenya', 'Peru', 'Estonia', 'Bangladesh', 'Hong Kong', 'Singapore']) {
      expect(COUNTRIES).toContain(c);
    }
    expect(new Set(COUNTRIES).size).toBe(COUNTRIES.length);
  });

  it('resolves names, codes and common shorthand to one name, and nothing else', () => {
    expect(resolveCountry('kenya')).toBe('Kenya');
    expect(resolveCountry(' PE ')).toBe('Peru');
    expect(resolveCountry('uk')).toBe('United Kingdom');
    expect(resolveCountry('USA')).toBe('United States');
    expect(resolveCountry("S'pore")).toBe('Singapore');
    expect(resolveCountry('Peru')).toBe('Peru');
    expect(resolveCountry('Jurong')).toBeNull();
    expect(resolveCountry('')).toBeNull();
  });
});
