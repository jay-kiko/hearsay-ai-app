import { describe, it, expect } from 'vitest';
import { GLOBAL, LIMITS_SAFE_AREA, composeMarket } from './market';

describe('composeMarket', () => {
  it('sends the country alone, or "area, country"', () => {
    expect(composeMarket('Singapore', '')).toBe('Singapore');
    expect(composeMarket('Philippines', '  Makati ')).toBe('Makati, Philippines');
  });

  it('sends just the area, or nothing, with no country', () => {
    expect(composeMarket(GLOBAL, 'Makati')).toBe('Makati');
    expect(composeMarket(GLOBAL, '')).toBe('');
  });

  it('always names Singapore so the backend turns on inventory and localisation', () => {
    expect(composeMarket('Singapore', 'Jurong')).toMatch(/\bSingapore\b/);
  });

  it('keeps the longest area + country within the backend\'s 120-character limit', () => {
    expect(composeMarket('United Arab Emirates', 'x'.repeat(LIMITS_SAFE_AREA)).length).toBeLessThanOrEqual(120);
  });
});
