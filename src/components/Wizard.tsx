import type { Persona, AIModel, NewPersona } from '../types';

interface WizardProps {
  step: number;
  brand: string;
  industry: string;
  competitors: string[];
  brandSummary: string;
  market: string;
  customCategory: string;
  categories: string[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  newCompetitor: string;
  addingPersona: boolean;
  newPersona: NewPersona;
  personas: Persona[];
  models: AIModel[];
  personaPrompts: Record<string, string[]>;
  promptsExpanded: Record<string, boolean>;
  personasLoading: boolean;
  personasError: string | null;
  personasProgress: number;
  promptsLoading: boolean;
  promptsError: string | null;
  getPersonaPrompts: (id: string) => string[];
  onBrand: (v: string) => void;
  onIndustry: (v: string) => void;
  onBrandSummary: (v: string) => void;
  onMarket: (v: string) => void;
  onCustomCategory: (v: string) => void;
  onRemoveCompetitor: (c: string) => void;
  onNewCompetitor: (v: string) => void;
  onAddCompetitor: () => void;
  onTogglePersona: (id: string) => void;
  onExpandPersona: (id: string) => void;
  onOpenAddPersona: () => void;
  onCloseAddPersona: () => void;
  onNewPersonaField: (field: keyof NewPersona, val: string) => void;
  onSaveCustomPersona: () => void;
  onToggleModel: (id: string) => void;
  onToggleExpandPrompt: (id: string) => void;
  onAddPrompt: (id: string) => void;
  onEditPrompt: (id: string, idx: number, val: string) => void;
  onRemovePrompt: (id: string, idx: number) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onGoHome: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onLaunch: () => void;
}

const STEP_LABELS = ['Brand setup', 'Category', 'Personas', 'AI Models', 'Prompts', 'Review'];

function StepBar({ step }: { step: number }) {
  const progress = ((step - 1) / (STEP_LABELS.length - 1)) * 100;

  return (
    <div className="overflow-x-auto mb-[52px] -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="relative flex justify-between max-w-[680px] min-w-[480px] sm:min-w-0 mx-auto">
        <div className="absolute top-[15px] sm:top-[17px] left-[15px] sm:left-[17px] right-[15px] sm:right-[17px] h-[2px] bg-[#E6E6E6]" />
        <div
          className="absolute top-[15px] sm:top-[17px] left-[15px] sm:left-[17px] h-[2px] bg-[#2D6AE0] transition-all duration-[350ms] ease-in-out"
          style={{ width: `calc(${progress}% * (100% - 30px) / 100)` }}
        />
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const isDone = n < step;
          const isActive = n === step;
          return (
            <div key={label} className="relative z-10 flex flex-col items-center gap-[7px] sm:gap-[9px] bg-[#FAFAFA] px-1 sm:px-2.5">
              {isDone && (
                <div className="w-[30px] h-[30px] sm:w-9 sm:h-9 rounded-full bg-[#2D6AE0] text-white flex items-center justify-center text-[13px] sm:text-[15px] font-bold">✓</div>
              )}
              {isActive && (
                <div className="w-[30px] h-[30px] sm:w-9 sm:h-9 rounded-full bg-white border-2 border-[#2D6AE0] text-[#2D6AE0] flex items-center justify-center text-[13px] sm:text-sm font-bold">{n}</div>
              )}
              {!isDone && !isActive && (
                <div className="w-[30px] h-[30px] sm:w-9 sm:h-9 rounded-full bg-white border-2 border-[#E2E2E2] text-[#B0B0B0] flex items-center justify-center text-[13px] sm:text-sm font-semibold">{n}</div>
              )}
              <span className="text-[11px] sm:text-[12.5px] text-[#777] font-medium whitespace-nowrap">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepBrand({ brand, industry, competitors, brandSummary, newCompetitor, onBrand, onIndustry, onBrandSummary, onRemoveCompetitor, onNewCompetitor, onAddCompetitor, onGoHome, onNextStep }: Pick<WizardProps, 'brand' | 'industry' | 'competitors' | 'brandSummary' | 'newCompetitor' | 'onBrand' | 'onIndustry' | 'onBrandSummary' | 'onRemoveCompetitor' | 'onNewCompetitor' | 'onAddCompetitor' | 'onGoHome' | 'onNextStep'>) {
  return (
    <div className="animate-fadeUp">
      <h2 className="text-[30px] tracking-[-0.02em] font-bold mb-2">Here's what we understood</h2>
      <p className="text-[15.5px] text-[#777] mb-8">Confirm the details below — you can edit anything before we continue.</p>

      <div className="bg-white border border-[#ECECEC] rounded-[18px] p-7 flex flex-col gap-6">
        <div className="flex gap-6 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-[12.5px] font-semibold text-[#888] uppercase tracking-[0.03em] mb-[9px]">Brand / Product</label>
            <input value={brand} onChange={e => onBrand(e.target.value)} className="w-full border border-[#E2E2E2] rounded-[11px] px-[14px] py-3 text-[15px] text-[#222] focus:border-[#2D6AE0] focus:outline-none transition-colors" />
          </div>
          <div className="flex-1 min-w-[240px]">
            <label className="block text-[12.5px] font-semibold text-[#888] uppercase tracking-[0.03em] mb-[9px]">
              Industry / Category <span className="text-[#2D6AE0] normal-case tracking-normal font-medium">· auto-detected</span>
            </label>
            <input value={industry} onChange={e => onIndustry(e.target.value)} className="w-full border border-[#E2E2E2] rounded-[11px] px-[14px] py-3 text-[15px] text-[#222] focus:border-[#2D6AE0] focus:outline-none transition-colors" />
          </div>
        </div>

        <div>
          <label className="block text-[12.5px] font-semibold text-[#888] uppercase tracking-[0.03em] mb-[9px]">Brand summary</label>
          <textarea
            value={brandSummary}
            onChange={e => onBrandSummary(e.target.value)}
            rows={3}
            placeholder="A short description of the brand and what it offers…"
            className="w-full border border-[#E2E2E2] rounded-[11px] px-[14px] py-3 text-[14.5px] leading-[1.55] text-[#333] resize-y focus:border-[#2D6AE0] focus:outline-none transition-colors"
          />
          <p className="text-[12.5px] text-[#999] mt-[7px] leading-relaxed">Used to generate more accurate personas and prompts — not shown to the AI models when we measure whether they mention the brand organically.</p>
        </div>

        <div>
          <label className="block text-[12.5px] font-semibold text-[#888] uppercase tracking-[0.03em] mb-[11px]">Competitors detected</label>
          <div className="flex flex-wrap gap-[9px] items-center">
            {competitors.map(c => (
              <span key={c} className="inline-flex items-center gap-2 bg-[#F4F6F9] border border-[#E6E9EE] rounded-full py-[7px] pl-[14px] pr-2 text-[13.5px] text-[#333]">
                {c}
                <span onClick={() => onRemoveCompetitor(c)} className="w-[18px] h-[18px] rounded-full bg-[#E2E6EC] text-[#7A8290] flex items-center justify-center text-[13px] cursor-pointer hover:bg-[#d0d4dc]">×</span>
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <input value={newCompetitor} onChange={e => onNewCompetitor(e.target.value)} onKeyDown={e => e.key === 'Enter' && onAddCompetitor()} placeholder="Add competitor" className="border border-dashed border-[#CFCFCF] rounded-full px-[14px] py-[7px] text-[13.5px] w-[140px] focus:border-[#2D6AE0] focus:outline-none" />
              <span onClick={onAddCompetitor} className="text-[13.5px] text-[#2D6AE0] font-semibold cursor-pointer hover:opacity-80">+ Add</span>
            </span>
          </div>
        </div>

        <div className="bg-[#EEF3FE] rounded-[13px] px-[18px] py-4 text-[14.5px] leading-[1.55] text-[#3a4a63]">
          We'll evaluate how AI models perceive <strong className="text-[#1b1b1b]">{brand}</strong> in the <strong className="text-[#1b1b1b]">{industry}</strong> space against the competitors above.
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-7">
        <button onClick={onGoHome} className="bg-white border border-[#DADADA] text-[#444] rounded-[11px] px-[22px] py-3 text-sm font-semibold cursor-pointer hover:bg-[#F8F8F8]">Edit query</button>
        <button onClick={onNextStep} className="bg-[#2D6AE0] text-white border-none rounded-[11px] px-[26px] py-3 text-sm font-semibold cursor-pointer hover:bg-[#2560d0]">Looks good →</button>
      </div>
    </div>
  );
}

function StepCategory({ industry, market, customCategory, categories, categoriesLoading, categoriesError, onIndustry, onMarket, onCustomCategory, onPrevStep, onNextStep }: Pick<WizardProps, 'industry' | 'market' | 'customCategory' | 'categories' | 'categoriesLoading' | 'categoriesError' | 'onIndustry' | 'onMarket' | 'onCustomCategory' | 'onPrevStep' | 'onNextStep'>) {
  if (categoriesLoading) {
    return (
      <div className="animate-fadeUp text-center py-20 max-w-[380px] mx-auto">
        <div className="w-8 h-8 border-[3px] border-[#EEF3FE] border-t-[#2D6AE0] rounded-full animate-spin-slow mx-auto mb-5" />
        <h2 className="text-[22px] tracking-[-0.02em] font-bold mb-2">Narrowing down your product category…</h2>
        <p className="text-[14.5px] text-[#888]">One request, usually just a few seconds.</p>
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="animate-fadeUp text-center py-20 max-w-[440px] mx-auto">
        <h2 className="text-[22px] tracking-[-0.02em] font-bold mb-2">Couldn't suggest categories</h2>
        <p className="text-[14.5px] text-[#888] mb-7">{categoriesError}</p>
        <div className="flex justify-center gap-3">
          <button onClick={onPrevStep} className="bg-white border border-[#DADADA] text-[#444] rounded-[11px] px-[22px] py-3 text-sm font-semibold cursor-pointer hover:bg-[#F8F8F8]">Back</button>
          <button onClick={onNextStep} className="bg-[#2D6AE0] text-white border-none rounded-[11px] px-[26px] py-3 text-sm font-semibold cursor-pointer hover:bg-[#2560d0]">Continue without a product category →</button>
        </div>
      </div>
    );
  }

  const customTrimmed = customCategory.trim();

  return (
    <div className="animate-fadeUp">
      <h2 className="text-[30px] tracking-[-0.02em] font-bold mb-2">Narrow down your product category</h2>
      <p className="text-[15.5px] text-[#777] mb-7 max-w-[620px]">Optional — pick the category that best matches what {"you're"} actually evaluating, or skip and we'll keep using "{industry}".</p>

      {categories.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {categories.map(cat => {
            const selected = industry === cat;
            return (
              <div key={cat} onClick={() => onIndustry(cat)} className={`flex items-center gap-3 border rounded-[13px] px-[18px] py-[14px] cursor-pointer transition-colors ${selected ? 'border-[#2D6AE0] bg-[#EEF3FE]' : 'border-[#ECECEC] bg-white hover:border-[#D5D5D5]'}`}>
                <div className={`w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selected ? 'border-[#2D6AE0]' : 'border-[#D2D2D2]'}`}>
                  {selected && <div className="w-2 h-2 rounded-full bg-[#2D6AE0]" />}
                </div>
                <span className="text-[14.5px] text-[#222] font-medium">{cat}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2.5 mt-4">
        <input
          value={customCategory}
          onChange={e => onCustomCategory(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && customTrimmed && onIndustry(customTrimmed)}
          placeholder="Or type your own category"
          className={`flex-1 border rounded-[11px] px-[14px] py-3 text-[14.5px] focus:outline-none transition-colors ${customTrimmed && industry === customTrimmed ? 'border-[#2D6AE0]' : 'border-[#E2E2E2] focus:border-[#2D6AE0]'}`}
        />
        <button onClick={() => customTrimmed && onIndustry(customTrimmed)} className="bg-white border border-[#DADADA] text-[#444] rounded-[11px] px-5 py-3 text-[13.5px] font-semibold cursor-pointer hover:bg-[#F8F8F8] whitespace-nowrap">Use this</button>
      </div>

      <span onClick={onNextStep} className="inline-block mt-5 text-[13.5px] text-[#888] cursor-pointer hover:text-[#555] underline underline-offset-2">Continue without a product category →</span>

      <div className="mt-8 pt-7 border-t border-[#ECECEC]">
        <label className="block text-[12.5px] font-semibold text-[#888] uppercase tracking-[0.03em] mb-[9px]">Geographic focus <span className="text-[#B0B0B0] normal-case tracking-normal font-medium">· optional</span></label>
        <input value={market} onChange={e => onMarket(e.target.value)} placeholder="City, state, country, or ZIP" className="w-full max-w-[380px] border border-[#E2E2E2] rounded-[11px] px-[14px] py-3 text-[14.5px] text-[#222] focus:border-[#2D6AE0] focus:outline-none transition-colors" />
        <p className="text-[12.5px] text-[#999] mt-[7px] leading-relaxed">Grounds personas, prompts, and the final analysis in a specific market.</p>
      </div>

      <div className="flex justify-end gap-3 mt-7">
        <button onClick={onPrevStep} className="bg-white border border-[#DADADA] text-[#444] rounded-[11px] px-[22px] py-3 text-sm font-semibold cursor-pointer hover:bg-[#F8F8F8]">Back</button>
        <button onClick={onNextStep} className="bg-[#2D6AE0] text-white border-none rounded-[11px] px-[26px] py-3 text-sm font-semibold cursor-pointer hover:bg-[#2560d0]">Continue →</button>
      </div>
    </div>
  );
}

function StepPersonas({ personas, addingPersona, newPersona, personasLoading, personasError, personasProgress, onTogglePersona, onExpandPersona, onOpenAddPersona, onCloseAddPersona, onNewPersonaField, onSaveCustomPersona, onPrevStep, onNextStep }: Pick<WizardProps, 'personas' | 'addingPersona' | 'newPersona' | 'personasLoading' | 'personasError' | 'personasProgress' | 'onTogglePersona' | 'onExpandPersona' | 'onOpenAddPersona' | 'onCloseAddPersona' | 'onNewPersonaField' | 'onSaveCustomPersona' | 'onPrevStep' | 'onNextStep'>) {
  const selectedCount = personas.filter(p => p.selected).length;

  if (personasLoading) {
    return (
      <div className="animate-fadeUp text-center py-20 max-w-[380px] mx-auto">
        <h2 className="text-[22px] tracking-[-0.02em] font-bold mb-2">Designing buyer personas for your category…</h2>
        <p className="text-[14.5px] text-[#888] mb-6">One request, tailored to your industry and competitors — usually takes 20–30s.</p>
        <div className="h-2 rounded-full bg-[#ECECEC] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#2D6AE0] transition-all duration-300 ease-out"
            style={{ width: `${personasProgress}%` }}
          />
        </div>
        <div className="text-[12.5px] text-[#999] mt-2.5">{personasProgress}%</div>
      </div>
    );
  }

  if (personasError) {
    return (
      <div className="animate-fadeUp text-center py-20 max-w-[440px] mx-auto">
        <h2 className="text-[22px] tracking-[-0.02em] font-bold mb-2">Couldn't generate personas</h2>
        <p className="text-[14.5px] text-[#888] mb-7">{personasError}</p>
        <button onClick={onPrevStep} className="bg-white border border-[#DADADA] text-[#444] rounded-[11px] px-[22px] py-3 text-sm font-semibold cursor-pointer hover:bg-[#F8F8F8]">Back</button>
      </div>
    );
  }

  return (
    <div className="animate-fadeUp">
      <h2 className="text-[30px] tracking-[-0.02em] font-bold mb-2">We generated {selectedCount} buyer personas</h2>
      <p className="text-[15.5px] text-[#777] mb-7 max-w-[620px]">These represent the people who'd ask AI about your category. Adjust, remove, or add custom personas — up to 15.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
        {personas.map(p => (
          <div key={p.id} onClick={() => onExpandPersona(p.id)} className="bg-white border border-[#ECECEC] rounded-[15px] p-[18px] cursor-pointer hover:border-[#D5D5D5] transition-colors">
            <div className="flex items-start gap-[13px]">
              <div className="w-10 h-10 rounded-[11px] bg-[#EEF3FE] text-[#2D6AE0] flex items-center justify-center text-sm font-bold flex-shrink-0">{p.initials}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-[#1b1b1b]">{p.title}</div>
                <div className="text-[13px] text-[#888] leading-[1.45] mt-[3px]">{p.desc}</div>
              </div>
              <div onClick={e => { e.stopPropagation(); onTogglePersona(p.id); }} className="flex-shrink-0 mt-0.5">
                {p.selected
                  ? <div className="w-[22px] h-[22px] rounded-[7px] bg-[#2D6AE0] text-white flex items-center justify-center text-[13px] font-bold">✓</div>
                  : <div className="w-[22px] h-[22px] rounded-[7px] border-2 border-[#E2E2E2]" />
                }
              </div>
            </div>
            {p.expanded && (
              <div className="mt-[14px] pt-[14px] border-t border-[#F0F0F0] flex flex-col gap-[9px]">
                <div className="text-[12.5px] text-[#666] leading-relaxed"><strong className="text-[#444]">Role · </strong>{p.role}</div>
                <div className="text-[12.5px] text-[#666] leading-relaxed"><strong className="text-[#444]">Pain points · </strong>{p.pains}</div>
                <div className="text-[12.5px] text-[#666] leading-relaxed"><strong className="text-[#444]">Decision criteria · </strong>{p.criteria}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {addingPersona ? (
        <div className="bg-white border border-[#cdddf8] rounded-[15px] p-[22px] mt-[14px]">
          <div className="text-[15px] font-semibold mb-4">New custom persona</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['name', 'role', 'industry', 'goals', 'pains', 'criteria'] as (keyof NewPersona)[]).map(field => (
              <input key={field} value={newPersona[field]} onChange={e => onNewPersonaField(field, e.target.value)} placeholder={field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} className="border border-[#E2E2E2] rounded-[10px] px-[13px] py-[11px] text-sm focus:border-[#2D6AE0] focus:outline-none" />
            ))}
          </div>
          <div className="flex justify-end gap-2.5 mt-4">
            <button onClick={onCloseAddPersona} className="bg-white border border-[#DADADA] text-[#444] rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-semibold cursor-pointer hover:bg-[#F8F8F8]">Cancel</button>
            <button onClick={onSaveCustomPersona} className="bg-[#2D6AE0] text-white border-none rounded-[10px] px-5 py-2.5 text-[13.5px] font-semibold cursor-pointer hover:bg-[#2560d0]">Save persona</button>
          </div>
        </div>
      ) : (
        <div onClick={onOpenAddPersona} className="mt-[14px] border-[1.5px] border-dashed border-[#D2D2D2] rounded-[15px] p-[18px] text-center text-sm font-semibold text-[#2D6AE0] cursor-pointer hover:border-[#2D6AE0] hover:bg-[#EEF3FE] transition-colors">
          + Add Custom Persona
        </div>
      )}

      <div className="flex items-center justify-between mt-7">
        <span className="text-[13.5px] text-[#888]">{selectedCount} of 15 personas selected</span>
        <div className="flex gap-3">
          <button onClick={onPrevStep} className="bg-white border border-[#DADADA] text-[#444] rounded-[11px] px-[22px] py-3 text-sm font-semibold cursor-pointer hover:bg-[#F8F8F8]">Back</button>
          <button onClick={onNextStep} className="bg-[#2D6AE0] text-white border-none rounded-[11px] px-[26px] py-3 text-sm font-semibold cursor-pointer hover:bg-[#2560d0]">Continue →</button>
        </div>
      </div>
    </div>
  );
}

function StepModels({ models, onToggleModel, onPrevStep, onNextStep }: Pick<WizardProps, 'models' | 'onToggleModel' | 'onPrevStep' | 'onNextStep'>) {
  return (
    <div className="animate-fadeUp">
      <h2 className="text-[30px] tracking-[-0.02em] font-bold mb-2">Choose which AI models to evaluate</h2>
      <p className="text-[15.5px] text-[#777] mb-7 max-w-[620px]">Select the AI tools your audience is likely using. More models means a broader visibility picture.</p>

      <div className="flex flex-col gap-3">
        {models.map(m => (
          <div key={m.id} className="bg-white border border-[#ECECEC] rounded-[14px] px-[18px] py-4 flex items-center gap-[15px]">
            <div className="w-[42px] h-[42px] rounded-[12px] bg-[#F4F4F4] text-[#555] flex items-center justify-center text-lg font-bold flex-shrink-0">{m.mono}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-[9px]">
                <span className="text-[15.5px] font-semibold text-[#1b1b1b]">{m.name}</span>
                <span className={`text-[10.5px] font-bold tracking-[0.04em] rounded-full px-[9px] py-[3px] ${m.enabled ? 'text-[#2D6AE0] bg-[#EEF3FE]' : 'text-[#A0A0A0] bg-[#F0F0F0]'}`}>{m.badge}</span>
              </div>
              <div className="text-[13px] text-[#999] mt-[2px]">{m.vendor}</div>
            </div>
            <div onClick={() => m.available && onToggleModel(m.id)} className={`cursor-pointer ${!m.available ? 'opacity-40 cursor-not-allowed' : ''}`}>
              {m.enabled
                ? <div className="w-[46px] h-[26px] rounded-full bg-[#2D6AE0] relative"><div className="absolute top-[3px] left-[23px] w-5 h-5 rounded-full bg-white transition-all" /></div>
                : <div className="w-[46px] h-[26px] rounded-full bg-[#E4E4E4] relative opacity-70"><div className="absolute top-[3px] left-[3px] w-5 h-5 rounded-full bg-white" /></div>
              }
            </div>
          </div>
        ))}
      </div>
      <div className="text-[13px] text-[#9A9A9A] mt-4 leading-relaxed">For this preview, Claude is enabled. The architecture supports every model above — additional models are rolling out soon.</div>

      <div className="flex justify-end gap-3 mt-7">
        <button onClick={onPrevStep} className="bg-white border border-[#DADADA] text-[#444] rounded-[11px] px-[22px] py-3 text-sm font-semibold cursor-pointer hover:bg-[#F8F8F8]">Back</button>
        <button onClick={onNextStep} className="bg-[#2D6AE0] text-white border-none rounded-[11px] px-[26px] py-3 text-sm font-semibold cursor-pointer hover:bg-[#2560d0]">Continue →</button>
      </div>
    </div>
  );
}

function StepPrompts({ personas, promptsExpanded, promptsLoading, promptsError, getPersonaPrompts, onToggleExpandPrompt, onAddPrompt, onEditPrompt, onRemovePrompt, onPrevStep, onNextStep }: Pick<WizardProps, 'personas' | 'promptsExpanded' | 'promptsLoading' | 'promptsError' | 'getPersonaPrompts' | 'onToggleExpandPrompt' | 'onAddPrompt' | 'onEditPrompt' | 'onRemovePrompt' | 'onPrevStep' | 'onNextStep'>) {
  const selected = personas.filter(p => p.selected);

  if (promptsLoading) {
    return (
      <div className="animate-fadeUp text-center py-20">
        <div className="w-8 h-8 border-[3px] border-[#EEF3FE] border-t-[#2D6AE0] rounded-full animate-spin-slow mx-auto mb-5" />
        <h2 className="text-[22px] tracking-[-0.02em] font-bold mb-2">Writing prompts for each persona…</h2>
        <p className="text-[14.5px] text-[#888]">One request, {selected.length} distinct buyer voices.</p>
      </div>
    );
  }

  if (promptsError) {
    return (
      <div className="animate-fadeUp text-center py-20 max-w-[440px] mx-auto">
        <h2 className="text-[22px] tracking-[-0.02em] font-bold mb-2">Couldn't generate prompts</h2>
        <p className="text-[14.5px] text-[#888] mb-7">{promptsError}</p>
        <button onClick={onPrevStep} className="bg-white border border-[#DADADA] text-[#444] rounded-[11px] px-[22px] py-3 text-sm font-semibold cursor-pointer hover:bg-[#F8F8F8]">Back</button>
      </div>
    );
  }

  return (
    <div className="animate-fadeUp">
      <h2 className="text-[30px] tracking-[-0.02em] font-bold mb-2">Review and edit the prompts</h2>
      <p className="text-[15.5px] text-[#777] mb-7 max-w-[640px]">We generate one prompt per persona. Edit any of them to better match how your buyers actually ask AI models.</p>

      <div className="flex flex-col gap-3 mb-2">
        {selected.map(p => {
          const prompts = getPersonaPrompts(p.id);
          const expanded = promptsExpanded[p.id] !== false;
          return (
            <div key={p.id} className="bg-white border border-[#ECECEC] rounded-[14px] overflow-hidden">
              <div onClick={() => onToggleExpandPrompt(p.id)} className="flex items-center gap-3 px-[18px] py-[14px] cursor-pointer">
                <div className="w-8 h-8 rounded-[9px] bg-[#EEF3FE] text-[#2D6AE0] flex items-center justify-center text-xs font-bold flex-shrink-0">{p.initials}</div>
                <span className="text-[14.5px] font-semibold text-[#1b1b1b] flex-1">{p.title}</span>
                <span className="text-xs text-[#999] bg-[#F4F4F4] rounded-full px-2.5 py-[3px]">{prompts.length} prompt{prompts.length === 1 ? '' : 's'}</span>
                <span className={`text-xs text-[#999] inline-block transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
              </div>
              {expanded && (
                <div className="px-[18px] pb-[18px] flex flex-col gap-2.5">
                  {prompts.map((value, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <textarea
                        value={value}
                        onChange={e => onEditPrompt(p.id, idx, e.target.value)}
                        placeholder="Type a prompt this persona might ask…"
                        className="flex-1 border border-[#E6E6E6] rounded-[10px] px-[14px] py-3 text-sm leading-[1.55] text-[#333] resize-y min-h-[56px] font-inherit focus:border-[#2D6AE0] focus:outline-none"
                      />
                      {prompts.length > 1 && (
                        <span onClick={() => onRemovePrompt(p.id, idx)} className="text-[13px] text-[#B0B0B0] cursor-pointer px-1 py-2 hover:text-[#C2543A]">✕</span>
                      )}
                    </div>
                  ))}
                  <span onClick={() => onAddPrompt(p.id)} className="text-[13px] font-semibold text-[#2D6AE0] cursor-pointer self-start hover:opacity-80">+ Add another prompt</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onPrevStep} className="bg-white border border-[#DADADA] text-[#444] rounded-[11px] px-[22px] py-3 text-sm font-semibold cursor-pointer hover:bg-[#F8F8F8]">Back</button>
        <button onClick={onNextStep} className="bg-[#2D6AE0] text-white border-none rounded-[11px] px-[26px] py-3 text-sm font-semibold cursor-pointer hover:bg-[#2560d0]">Continue →</button>
      </div>
    </div>
  );
}

function StepReview({ brand, industry, competitors, personas, models, market, samplePrompts, onPrevStep, onLaunch }: Pick<WizardProps, 'brand' | 'industry' | 'competitors' | 'personas' | 'models' | 'market' | 'onPrevStep' | 'onLaunch'> & { samplePrompts: string[] }) {
  const selectedCount = personas.filter(p => p.selected).length;
  const enabledModels = models.filter(m => m.enabled).map(m => m.name).join(', ');

  const rows = [
    { label: 'Brand', value: <span>{brand} <span className="text-[#999] font-normal">in {industry}</span></span> },
    { label: 'Competitors', value: <div className="flex flex-wrap gap-[7px] justify-end">{competitors.map(c => <span key={c} className="text-[13px] bg-[#F4F6F9] border border-[#E6E9EE] rounded-full px-3 py-[5px] text-[#444]">{c}</span>)}</div> },
    ...(market.trim() ? [{ label: 'Geographic focus', value: market.trim() }] : []),
    { label: 'Personas', value: `${selectedCount} selected` },
    { label: 'AI Models', value: enabledModels },
    { label: 'Estimated time', value: '~2 minutes' },
  ];

  return (
    <div className="animate-fadeUp">
      <h2 className="text-[30px] tracking-[-0.02em] font-bold mb-2">Review your analysis setup</h2>
      <p className="text-[15.5px] text-[#777] mb-7">One last look before we run it.</p>

      <div className="bg-white border border-[#ECECEC] rounded-[18px] px-7 py-0 mb-5">
        {rows.map(({ label, value }, i, arr) => (
          <div key={label} className={`flex justify-between items-center py-[18px] ${i < arr.length - 1 ? 'border-b border-[#F2F2F2]' : ''}`}>
            <span className="text-[13px] text-[#999] font-semibold uppercase tracking-[0.04em] flex-shrink-0">{label}</span>
            <span className="text-[15px] text-[#1b1b1b] font-semibold">{value}</span>
          </div>
        ))}
      </div>

      <div className="text-[13px] text-[#999] font-semibold uppercase tracking-[0.04em] mb-3">Sample prompts we'll generate</div>
      <div className="flex flex-col gap-2.5 mb-[30px]">
        {samplePrompts.map((sp, i) => (
          <div key={i} className="bg-white border border-[#ECECEC] border-l-[3px] border-l-[#2D6AE0] rounded-r-[12px] px-[18px] py-[15px] text-sm leading-[1.55] text-[#555] italic">"{sp}"</div>
        ))}
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <button onClick={onPrevStep} className="bg-white border border-[#DADADA] text-[#444] rounded-[11px] px-[22px] py-3 text-sm font-semibold cursor-pointer hover:bg-[#F8F8F8]">Back</button>
        <div className="flex gap-3 items-center">
          <button className="flex-1 sm:flex-none bg-white border border-[#DADADA] text-[#444] rounded-[11px] px-5 py-3 text-sm font-semibold cursor-pointer hover:bg-[#F8F8F8]">Save as Draft</button>
          <button onClick={onLaunch} className="flex-1 sm:flex-none bg-[#2D6AE0] text-white border-none rounded-[11px] px-8 py-[13px] text-[15px] font-semibold cursor-pointer hover:bg-[#2560d0] shadow-[0_8px_20px_-8px_#2D6AE0]">Run Analysis</button>
        </div>
      </div>
    </div>
  );
}

export function Wizard(props: WizardProps) {
  const { step, personas, getPersonaPrompts } = props;
  const samplePrompts = personas
    .filter(p => p.selected)
    .flatMap(p => getPersonaPrompts(p.id))
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div className="max-w-[880px] mx-auto px-4 sm:px-6 py-8 sm:py-[46px] pb-[110px] animate-fadeUp">
      <StepBar step={step} />
      {step === 1 && <StepBrand {...props} />}
      {step === 2 && <StepCategory {...props} />}
      {step === 3 && <StepPersonas {...props} />}
      {step === 4 && <StepModels {...props} />}
      {step === 5 && <StepPrompts {...props} />}
      {step === 6 && <StepReview {...props} samplePrompts={samplePrompts} />}
    </div>
  );
}
