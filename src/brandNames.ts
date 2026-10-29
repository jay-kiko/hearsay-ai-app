// The names sent as the brand's: the (possibly edited) brand field, plus the
// aliases detect found for the brand it detected. A small edit ("Disney
// Cruise" -> "Disney Cruise Line") keeps those aliases; renaming to an
// unrelated brand drops them, or the old brand's names would count as
// mentions of the new one.
function isDetectedBrand(brand: string, detectedBrand: string): boolean {
  const words = (t: string) => new Set(t.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  const detected = words(detectedBrand);
  return [...words(brand)].some(w => detected.has(w));
}

export function matchNamesFor(brand: string, detectedBrand: string, aliases: string[]): string[] {
  const names = [brand.trim(), ...(isDetectedBrand(brand, detectedBrand) ? aliases : [])].filter(Boolean);
  return names.filter((n, i) => names.findIndex(m => m.toLowerCase() === n.toLowerCase()) === i);
}

export interface BrandNameFields {
  brandMatchNames: string[];
  // Ambiguous names ("Disney") the backend counts only in a sentence with one
  // of categoryTerms ("cruise", "ship").
  brandContextNames: string[];
  categoryTerms: string[];
}

// Everything the backend needs to recognise the brand, sent with prompt
// generation (to screen out prompts naming it) and with the analysis. Detected
// names are dropped after a rename to an unrelated brand, as above.
export function brandNameFields(
  brand: string,
  detected: { brand: string; brandMatchNames: string[]; brandContextNames: string[]; categoryTerms: string[] },
): BrandNameFields {
  const same = isDetectedBrand(brand, detected.brand);
  return {
    brandMatchNames: matchNamesFor(brand, detected.brand, detected.brandMatchNames),
    brandContextNames: same ? detected.brandContextNames : [],
    categoryTerms: same ? detected.categoryTerms : [],
  };
}
