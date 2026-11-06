import { useState } from 'react';
import { COUNTRIES, GLOBAL, resolveCountry } from '../market';

// Free typing with suggestions from every country. Only a recognised country
// ("uk" -> United Kingdom) is passed up; anything else stays in the box,
// flagged, and counts as no market, so a typo is never sent as one and the
// box never shows one country while another is used.
export function CountryInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  const typed = draft.trim();
  const invalid = typed !== '' && resolveCountry(typed) === null;

  const update = (text: string) => {
    setDraft(text);
    onChange(resolveCountry(text) ?? GLOBAL);
  };

  return (
    <div className="w-full sm:w-[240px]">
      <input
        aria-label="Country"
        aria-invalid={invalid}
        aria-describedby={invalid ? 'country-error' : undefined}
        list="country-options"
        value={draft}
        onChange={e => update(e.target.value)}
        onBlur={() => { const c = resolveCountry(draft); if (c) setDraft(c); }}
        placeholder="Country, e.g. Kenya"
        className={`w-full border rounded-[11px] px-[14px] py-3 text-[14.5px] text-[#222] bg-white focus:outline-none transition-colors ${invalid ? 'border-[#C2543A]' : 'border-[#E2E2E2] focus:border-[#2D6AE0]'}`}
      />
      <datalist id="country-options">
        {COUNTRIES.map(c => <option key={c} value={c} />)}
      </datalist>
      {invalid && <div id="country-error" className="text-[12px] text-[#C2543A] mt-1">Pick a country from the list.</div>}
    </div>
  );
}
