// The geographic focus sent to the backend as `market`. A country is picked
// from a list rather than typed, because the backend recognises markets by
// name: Singapore inventory turns on only for "Singapore"/"SG", and search
// localisation only for the supported countries below. Free text like
// "S'pore", "Jurong" or "Manila" silently got neither.

// Markets the backend localises search for (Singapore also has programmatic
// inventory). Keep in sync with grounding._MARKET_LOCATION and
// inventory.applies_to in hearsay-ai-api.
export const SUPPORTED_COUNTRIES = ['Singapore', 'Malaysia', 'Philippines', 'Indonesia'] as const;

// Still grounds personas, prompts and answers in the country; just no search
// localisation or inventory.
export const OTHER_COUNTRIES = [
  'Australia',
  'Canada',
  'Hong Kong',
  'India',
  'Japan',
  'New Zealand',
  'South Korea',
  'Taiwan',
  'Thailand',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Vietnam',
] as const;

// '' = no regional focus.
export const GLOBAL = '';

export const DEFAULT_COUNTRY = 'Singapore';

// Max area length, so "area, <longest country>" stays within the backend's
// 120-character market limit.
export const LIMITS_SAFE_AREA = 90;

// "Makati, Philippines", "Singapore", or just the area when no country is set.
export function composeMarket(country: string, area: string): string {
  const a = area.trim();
  if (!country) return a;
  return a ? `${a}, ${country}` : country;
}
