// The geographic focus sent to the backend as `market`. The backend treats
// every country the same: it grounds personas, prompts and answers in the
// market, and names it in each source search. The country is still resolved
// to one canonical name from this list, so "UK", "usa" or a typo never reach
// the backend as a market of their own.

// ISO 3166-1 alpha-2 codes; names come from the browser (Intl.DisplayNames),
// so the list needs no API and no hand-maintained names.
const REGION_CODES = (
  'AD AE AF AG AI AL AM AO AR AS AT AU AW AZ BA BB BD BE BF BG BH BI BJ BM BN BO BR BS BT BW BY BZ ' +
  'CA CD CF CG CH CI CK CL CM CN CO CR CU CV CW CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FK FM ' +
  'FO FR GA GB GD GE GH GI GL GM GN GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM ' +
  'JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM ' +
  'MN MO MR MT MU MV MW MX MY MZ NA NC NE NG NI NL NO NP NR NZ OM PA PE PF PG PH PK PL PR PS PT PW PY ' +
  'QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TL TM TN TO ' +
  'TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WS XK YE ZA ZM ZW'
).split(' ');

function regionNames(): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    return null; // very old browsers: the codes alone still resolve below
  }
}

const names = regionNames();
// Where the browser's name is awkward in a search or too long for the market
// limit ("Hong Kong SAR China", "Congo - Kinshasa").
const NAME_OVERRIDES: Record<string, string> = {
  HK: 'Hong Kong', MO: 'Macau', MM: 'Myanmar', CD: 'DR Congo', CG: 'Republic of the Congo',
};
const nameOf = (code: string) => NAME_OVERRIDES[code] ?? names?.of(code) ?? code;

// Every country by its English name, alphabetical.
export const COUNTRIES: readonly string[] = REGION_CODES.map(nameOf).sort((a, b) => a.localeCompare(b));

// Common ways people type a country that aren't its name or ISO code.
const ALIASES: Record<string, string> = {
  uk: 'GB', britain: 'GB', 'great britain': 'GB', england: 'GB', scotland: 'GB', wales: 'GB',
  usa: 'US', america: 'US', 'united states of america': 'US',
  uae: 'AE', emirates: 'AE', "s'pore": 'SG', spore: 'SG',
  korea: 'KR', 'north korea': 'KP', holland: 'NL', czechia: 'CZ',
  'ivory coast': 'CI', burma: 'MM', turkey: 'TR', turkiye: 'TR',
};

const key = (s: string) => s.trim().toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

const BY_KEY: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const code of REGION_CODES) {
    map.set(key(nameOf(code)), nameOf(code));
    map.set(key(code), nameOf(code));
  }
  for (const [alias, code] of Object.entries(ALIASES)) map.set(alias, nameOf(code));
  return map;
})();

// The canonical country name for what was typed ("uk" -> "United Kingdom"),
// or null when it isn't a country.
export function resolveCountry(typed: string): string | null {
  return BY_KEY.get(key(typed)) ?? null;
}

// '' = no regional focus.
export const GLOBAL = '';

export const DEFAULT_COUNTRY = GLOBAL;

// Max area length, so "area, <longest country>" stays within the backend's
// 120-character market limit. The longest name is ~24 characters; the margin
// covers browsers whose country names differ.
export const LIMITS_SAFE_AREA = 80;

// "Makati, Philippines", "Singapore", or just the area when no country is set.
export function composeMarket(country: string, area: string): string {
  const a = area.trim();
  if (!country) return a;
  return a ? `${a}, ${country}` : country;
}
