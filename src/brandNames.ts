// The names sent as the brand's: the (possibly edited) brand field, plus the
// aliases detect found for the brand it detected. A small edit ("Disney
// Cruise" -> "Disney Cruise Line") keeps those aliases; renaming to an
// unrelated brand drops them, or the old brand's names would count as
// mentions of the new one.
export function matchNamesFor(brand: string, detectedBrand: string, aliases: string[]): string[] {
  const words = (t: string) => new Set(t.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  const detected = words(detectedBrand);
  const sameBrand = [...words(brand)].some(w => detected.has(w));
  const names = [brand.trim(), ...(sameBrand ? aliases : [])].filter(Boolean);
  return names.filter((n, i) => names.findIndex(m => m.toLowerCase() === n.toLowerCase()) === i);
}
