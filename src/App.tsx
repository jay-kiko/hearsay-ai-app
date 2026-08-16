import { useCallback, useEffect, useRef, useState } from 'react';
import type { AccessCode, AnalysisResult, AppState, CategoryOption, NewPersona, PersonaResult } from './types';
import { INITIAL_PERSONAS, INITIAL_MODELS } from './data';
import { ApiError, checkAccessStatus, detectBrand, generatePersonas, generatePrompts, getCategories, listCodes, mintCodes, revokeCode, startAnalysis, streamAnalysis } from './api';
import { Nav } from './components/Nav';
import { Home } from './components/Home';
import { Wizard } from './components/Wizard';
import { Running } from './components/Running';
import { Results } from './components/Results';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { Activation } from './components/Activation';
import { AccessGate } from './components/AccessGate';
import { AdminLogin } from './components/AdminLogin';
import { AdminCodes } from './components/AdminCodes';
import { Toast } from './components/Toast';

const IS_ADMIN_ROUTE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('admin');

// Sole purpose: survive a page reload without forcing the code back in.
// Nothing else about the session (wizard progress, results) is persisted —
// this app is deliberately ephemeral beyond that one annoyance.
const SESSION_CODE_KEY = 'hearsay_access_code';

const GATE_STATUS_MESSAGE: Record<string, string> = {
  unknown: 'Access code not found.',
  exhausted: 'This access code has no uses remaining.',
  revoked: 'This access code has been revoked.',
};

function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Could not reach the backend. Is it running?';
}

// /api/detect is a plain synchronous POST, not SSE like /api/analysis — the
// backend does a real web-search pass then a structuring call server-side
// (routinely 15-30s), but there's no incremental state to reflect, so this is
// purely cosmetic reassurance on a timer, not real progress.
const DETECT_MESSAGE_INTERVAL_MS = 5_000;
const DETECT_SLOW_AFTER_MS = 20_000;

function truncateForMessage(s: string, max: number): string {
  const trimmed = s.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function detectMessagesFor(query: string): string[] {
  const label = truncateForMessage(query, 40) || 'your brand';
  return [`Looking up "${label}"…`, 'Searching the web for real competitors…', 'Confirming details…'];
}

// Unlike /api/detect, the analysis run has real per-persona settle events
// over SSE — so instead of a cosmetic timer, this extrapolates from actual
// elapsed time and completions so far. No estimate exists until the first
// persona settles, since there's nothing yet to extrapolate from.
function formatEta(ms: number): string {
  const totalSeconds = Math.max(1, Math.round(ms / 1000));
  if (totalSeconds < 60) return `~${totalSeconds}s remaining`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds === 0 ? `~${minutes}m remaining` : `~${minutes}m ${seconds}s remaining`;
}

// Backend sends share as a 0-1 fraction; the charts here render it as a
// whole-number percentage.
function normalizeResult(result: AnalysisResult): AnalysisResult {
  return { ...result, products: result.products.map(p => ({ ...p, share: Math.round(p.share * 100) })) };
}

const INITIAL_STATE: AppState = {
  screen: 'home',
  step: 1,
  query: '',
  brand: 'Flowstate',
  industry: 'Project Management Software',
  competitors: ['Asana', 'Monday.com', 'ClickUp', 'Notion'].map(name => ({ name, matchNames: [name] })),
  buyerContext: '',
  brandSummary: '',
  market: '',
  customCategory: '',
  newCompetitor: '',
  addingPersona: false,
  newPersona: { name: '', role: '', industry: '', goals: '', pains: '', criteria: '' },
  personas: INITIAL_PERSONAS,
  models: INITIAL_MODELS,
  runProgress: 0,
  runStatuses: {},
  openResult: null,
  personaPrompts: {},
  promptsExpanded: {},
};

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const searchRef = useRef<HTMLTextAreaElement>(null);
  const closeStreamRef = useRef<(() => void) | null>(null);

  // ── Access gate ─────────────────────────────────────────────────────
  const [accessCode, setAccessCode] = useState(() => sessionStorage.getItem(SESSION_CODE_KEY) ?? '');
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_CODE_KEY) !== null);
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  // Separate from gateError: gateError is inline form-validation feedback for
  // a code the user is actively typing in; gateNotice is a toast for landing
  // back on this screen mid-session because a previously-valid code just
  // turned out to be exhausted/revoked/unknown out from under them.
  const [gateNotice, setGateNotice] = useState<string | null>(null);

  const lockOut = useCallback((message: string) => {
    sessionStorage.removeItem(SESSION_CODE_KEY);
    setUnlocked(false);
    setGateNotice(message);
  }, []);

  const handleSubmitCode = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setGateError('Enter an access code.');
      return;
    }
    setGateLoading(true);
    setGateError(null);
    setGateNotice(null);
    try {
      const status = await checkAccessStatus(trimmed);
      if (status !== 'valid') {
        setGateError(GATE_STATUS_MESSAGE[status] ?? 'This access code is not valid.');
        return;
      }
      sessionStorage.setItem(SESSION_CODE_KEY, trimmed);
      setAccessCode(trimmed);
      setUnlocked(true);
    } catch (e) {
      setGateError(errorMessage(e));
    } finally {
      setGateLoading(false);
    }
  }, []);

  // ── Admin ───────────────────────────────────────────────────────────
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminSecret, setAdminSecret] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminCodes, setAdminCodes] = useState<AccessCode[]>([]);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [revokingCode, setRevokingCode] = useState<string | null>(null);

  const handleAdminLogin = useCallback(async (secret: string) => {
    setAdminLoading(true);
    setAdminError(null);
    try {
      const codes = await listCodes(secret);
      setAdminSecret(secret);
      setAdminCodes(codes);
      setAdminAuthed(true);
    } catch (e) {
      setAdminError(errorMessage(e));
    } finally {
      setAdminLoading(false);
    }
  }, []);

  const handleGenerateCode = useCallback(async (usesTotal: number) => {
    setGenLoading(true);
    setGenError(null);
    try {
      await mintCodes({ count: 1, uses: usesTotal, adminSecret });
      setAdminCodes(await listCodes(adminSecret));
    } catch (e) {
      setGenError(errorMessage(e));
    } finally {
      setGenLoading(false);
    }
  }, [adminSecret]);

  const handleRevokeCode = useCallback(async (code: string) => {
    setRevokingCode(code);
    setGenError(null);
    try {
      await revokeCode({ code, adminSecret });
      setAdminCodes(await listCodes(adminSecret));
    } catch (e) {
      setGenError(errorMessage(e));
    } finally {
      setRevokingCode(null);
    }
  }, [adminSecret]);

  // ── Core app state ──────────────────────────────────────────────────
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [detectMessage, setDetectMessage] = useState('');
  const [detectSlow, setDetectSlow] = useState(false);
  const detectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  // Set only when the user picks one of the fetched category suggestions —
  // each carries its own correctly-scoped buyerContext, distinct from the
  // brand-wide one /api/detect returned. null means "no override": either
  // nothing picked yet, skipped, or a custom free-text category (no scoped
  // buyerContext exists for those) — all three fall back to the original
  // detect-level buyerContext.
  const [categoryBuyerContextOverride, setCategoryBuyerContextOverride] = useState<string | null>(null);
  const [personasLoading, setPersonasLoading] = useState(false);
  const [personasError, setPersonasError] = useState<string | null>(null);
  const [personasProgress, setPersonasProgress] = useState(0);
  const personasTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [promptsError, setPromptsError] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [liveResults, setLiveResults] = useState<Record<string, PersonaResult>>({});
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [runEta, setRunEta] = useState<string | null>(null);
  const runStartedAtRef = useRef<number | null>(null);

  const update = useCallback((patch: Partial<AppState>) => setState(s => ({ ...s, ...patch })), []);

  const closeStream = useCallback(() => {
    closeStreamRef.current?.();
    closeStreamRef.current = null;
  }, []);

  const goHome = useCallback(() => {
    closeStream();
    if (personasTimerRef.current) clearInterval(personasTimerRef.current);
    personasTimerRef.current = null;
    if (detectTimerRef.current) clearInterval(detectTimerRef.current);
    detectTimerRef.current = null;
    setRunError(null);
    setLiveResults({});
    setAnalysisResult(null);
    setRunEta(null);
    runStartedAtRef.current = null;
    setPromptsError(null);
    setDetectError(null);
    setCategoriesError(null);
    setCategories([]);
    setCategoryBuyerContextOverride(null);
    setPersonasError(null);
    setState(s => ({ ...s, screen: 'home', step: 1, runStatuses: {}, runProgress: 0, personaPrompts: {} }));
  }, [closeStream]);

  const focusSearch = useCallback(() => {
    setState(s => ({ ...s, screen: 'home' }));
    setTimeout(() => searchRef.current?.focus(), 50);
  }, []);

  const startWizard = useCallback(async () => {
    const q = state.query.trim() || 'Project management apps for growing software teams';
    const messages = detectMessagesFor(q);
    setDetecting(true);
    setDetectError(null);
    setDetectSlow(false);
    setDetectMessage(messages[0]);

    const startedAt = Date.now();
    detectTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      if (elapsed >= DETECT_SLOW_AFTER_MS) {
        setDetectSlow(true);
        if (detectTimerRef.current) clearInterval(detectTimerRef.current);
        detectTimerRef.current = null;
        return;
      }
      const idx = Math.min(messages.length - 1, Math.floor(elapsed / DETECT_MESSAGE_INTERVAL_MS));
      setDetectMessage(messages[idx]);
    }, 1000);

    try {
      const detected = await detectBrand({ query: q, accessCode });
      update({
        screen: 'wizard',
        step: 1,
        query: q,
        brand: detected.brand,
        industry: detected.industry,
        competitors: detected.competitors,
        buyerContext: detected.buyerContext,
        brandSummary: detected.brandSummary,
        market: '',
        customCategory: '',
      });
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 403)) {
        lockOut(e.message);
      } else {
        setDetectError(errorMessage(e));
      }
    } finally {
      if (detectTimerRef.current) clearInterval(detectTimerRef.current);
      detectTimerRef.current = null;
      setDetecting(false);
    }
  }, [state.query, accessCode, update, lockOut]);

  const goToCategories = useCallback(async () => {
    update({ step: 2 });
    setCategoriesLoading(true);
    setCategoriesError(null);
    setCategoryBuyerContextOverride(null);
    try {
      const result = await getCategories({
        brand: state.brand,
        industry: state.industry,
        competitors: state.competitors,
        buyerContext: state.buyerContext,
        brandSummary: state.brandSummary,
        accessCode,
      });
      setCategories(result);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 403)) {
        lockOut(e.message);
      } else {
        setCategoriesError(errorMessage(e));
      }
    } finally {
      setCategoriesLoading(false);
    }
  }, [state.brand, state.industry, state.competitors, state.buyerContext, state.brandSummary, accessCode, lockOut, update]);

  const goToPersonas = useCallback(async () => {
    update({ step: 3 });
    setPersonasLoading(true);
    setPersonasError(null);
    setPersonasProgress(0);

    // The backend generates all personas in one non-incremental call — there's
    // no real "3 of 8 done" moment to report. This estimates progress from
    // typical duration instead of faking discrete steps, and deliberately
    // caps short of 100% since we don't actually know it's finished until the
    // response arrives.
    const ESTIMATED_MS = 26_000;
    const startedAt = Date.now();
    personasTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setPersonasProgress(Math.min(92, Math.round((elapsed / ESTIMATED_MS) * 92)));
    }, 250);

    try {
      const generated = await generatePersonas({
        brand: state.brand,
        industry: state.industry,
        competitors: state.competitors,
        buyerContext: categoryBuyerContextOverride ?? state.buyerContext,
        brandSummary: state.brandSummary,
        market: state.market,
        accessCode,
      });
      update({ personas: generated.map(p => ({ ...p, selected: true, expanded: false })) });
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 403)) {
        lockOut(e.message);
      } else {
        setPersonasError(errorMessage(e));
      }
    } finally {
      if (personasTimerRef.current) clearInterval(personasTimerRef.current);
      personasTimerRef.current = null;
      setPersonasLoading(false);
    }
  }, [state.brand, state.industry, state.competitors, state.buyerContext, state.brandSummary, state.market, categoryBuyerContextOverride, accessCode, update, lockOut]);

  const goToPrompts = useCallback(async () => {
    update({ step: 5 });
    setPromptsLoading(true);
    setPromptsError(null);
    try {
      const selected = state.personas.filter(p => p.selected);
      const prompts = await generatePrompts({
        brand: state.brand,
        industry: state.industry,
        personas: selected,
        buyerContext: categoryBuyerContextOverride ?? state.buyerContext,
        brandSummary: state.brandSummary,
        market: state.market,
        accessCode,
      });
      update({ personaPrompts: prompts });
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 403)) {
        // The code turned out invalid/exhausted/revoked since it was granted
        // — send the user back to the gate with why, and forget it.
        lockOut(e.message);
      } else {
        setPromptsError(errorMessage(e));
      }
    } finally {
      setPromptsLoading(false);
    }
  }, [state.personas, state.brand, state.industry, state.buyerContext, state.brandSummary, state.market, categoryBuyerContextOverride, accessCode, update, lockOut]);

  const launchAnalysis = useCallback(async () => {
    const selected = state.personas.filter(p => p.selected);
    if (selected.length === 0) return;

    setRunError(null);
    setLiveResults({});
    setAnalysisResult(null);
    setRunEta(null);
    runStartedAtRef.current = null;
    update({ screen: 'running', runProgress: 0, runStatuses: {} });

    try {
      const jobId = await startAnalysis({
        brand: state.brand,
        industry: state.industry,
        competitors: state.competitors,
        personas: selected,
        prompts: state.personaPrompts,
        buyerContext: categoryBuyerContextOverride ?? state.buyerContext,
        brandSummary: state.brandSummary,
        market: state.market,
        accessCode,
      });

      runStartedAtRef.current = Date.now();

      let settledCount = 0;
      closeStreamRef.current = streamAnalysis(jobId, {
        onPersona: event => {
          setState(s => ({ ...s, runStatuses: { ...s.runStatuses, [event.personaId]: event.status } }));
          if (event.result) {
            setLiveResults(r => ({ ...r, [event.personaId]: event.result! }));
          }
          if (event.status === 'done' || event.status === 'error') {
            settledCount++;
            update({ runProgress: Math.round((settledCount / selected.length) * 100) });

            const remaining = selected.length - settledCount;
            if (remaining <= 0 || runStartedAtRef.current === null) {
              setRunEta(null);
            } else {
              const elapsed = Date.now() - runStartedAtRef.current;
              const avgPerPersona = elapsed / settledCount;
              setRunEta(formatEta(avgPerPersona * remaining));
            }
          }
        },
        onComplete: result => {
          setAnalysisResult(normalizeResult(result));
          update({ screen: 'results' });
        },
        onError: message => setRunError(message),
      });
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 403)) {
        lockOut(e.message);
      } else {
        setRunError(errorMessage(e));
      }
    }
  }, [state.personas, state.brand, state.industry, state.competitors, state.personaPrompts, state.buyerContext, state.brandSummary, state.market, categoryBuyerContextOverride, accessCode, update, lockOut]);

  useEffect(() => () => closeStream(), [closeStream]);

  const { screen, step, query, brand, industry, competitors, brandSummary, market, customCategory, newCompetitor, addingPersona, newPersona, personas, models, runProgress, runStatuses, personaPrompts, promptsExpanded } = state;

  const getPersonaPrompts = useCallback((id: string) => personaPrompts[id] ?? [], [personaPrompts]);

  const onToggleExpandPrompt = useCallback((id: string) => {
    setState(s => ({ ...s, promptsExpanded: { ...s.promptsExpanded, [id]: s.promptsExpanded[id] === false ? true : false } }));
  }, []);

  const onAddPrompt = useCallback((id: string) => {
    setState(s => ({
      ...s,
      personaPrompts: { ...s.personaPrompts, [id]: [...(s.personaPrompts[id] ?? []), ''] },
      promptsExpanded: { ...s.promptsExpanded, [id]: true },
    }));
  }, []);

  const onEditPrompt = useCallback((id: string, idx: number, val: string) => {
    setState(s => {
      const arr = [...(s.personaPrompts[id] ?? [])];
      arr[idx] = val;
      return { ...s, personaPrompts: { ...s.personaPrompts, [id]: arr } };
    });
  }, []);

  const onRemovePrompt = useCallback((id: string, idx: number) => {
    setState(s => {
      const arr = (s.personaPrompts[id] ?? []).filter((_, i) => i !== idx);
      return { ...s, personaPrompts: { ...s.personaPrompts, [id]: arr.length ? arr : [''] } };
    });
  }, []);

  const wizardProps = {
    step, brand, industry, competitors, brandSummary, market, customCategory, categories, categoriesLoading, categoriesError, newCompetitor, addingPersona, newPersona, personas, models, personaPrompts, promptsExpanded, personasLoading, personasError, personasProgress, promptsLoading, promptsError, getPersonaPrompts,
    onBrand: (v: string) => update({ brand: v }),
    onIndustry: (v: string) => update({ industry: v }),
    onBrandSummary: (v: string) => update({ brandSummary: v }),
    onMarket: (v: string) => update({ market: v }),
    onCustomCategory: (v: string) => update({ customCategory: v }),
    onSelectCategory: (category: CategoryOption) => {
      update({ industry: category.name });
      setCategoryBuyerContextOverride(category.buyerContext);
    },
    onUseCustomCategory: (v: string) => {
      const trimmed = v.trim();
      if (!trimmed) return;
      update({ industry: trimmed });
      setCategoryBuyerContextOverride(null);
    },
    onRemoveCompetitor: (name: string) => update({ competitors: competitors.filter(x => x.name !== name) }),
    onNewCompetitor: (v: string) => update({ newCompetitor: v }),
    onAddCompetitor: () => {
      const v = newCompetitor.trim();
      if (!v) return;
      // A single-alias competitor is a valid, normal case for the backend —
      // it just won't catch sub-brand mentions the way an AI-detected one
      // with a fuller alias list would.
      update({ competitors: [...competitors, { name: v, matchNames: [v] }], newCompetitor: '' });
    },
    onTogglePersona: (id: string) => update({ personas: personas.map(p => p.id === id ? { ...p, selected: !p.selected } : p) }),
    onExpandPersona: (id: string) => update({ personas: personas.map(p => p.id === id ? { ...p, expanded: !p.expanded } : p) }),
    onOpenAddPersona: () => update({ addingPersona: true }),
    onCloseAddPersona: () => update({ addingPersona: false, newPersona: { name: '', role: '', industry: '', goals: '', pains: '', criteria: '' } }),
    onNewPersonaField: (field: keyof NewPersona, val: string) => update({ newPersona: { ...newPersona, [field]: val } }),
    onSaveCustomPersona: () => {
      if (!newPersona.name.trim()) return;
      const initials = newPersona.name.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('');
      const custom = {
        id: `custom-${Date.now()}`,
        title: newPersona.name,
        initials,
        desc: newPersona.goals || newPersona.role,
        role: newPersona.role,
        pains: newPersona.pains,
        criteria: newPersona.criteria,
        selected: true,
        expanded: false,
      };
      update({ personas: [...personas, custom], addingPersona: false, newPersona: { name: '', role: '', industry: '', goals: '', pains: '', criteria: '' } });
    },
    onToggleModel: (id: string) => update({ models: models.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m) }),
    onToggleExpandPrompt, onAddPrompt, onEditPrompt, onRemovePrompt,
    onNextStep: () => {
      if (step === 1) { goToCategories(); return; }
      if (step === 2) { goToPersonas(); return; }
      if (step === 4) { goToPrompts(); return; }
      update({ step: Math.min(6, step + 1) });
    },
    onPrevStep: () => update({ step: Math.max(1, step - 1) }),
    onGoHome: goHome,
    onOpenHistory: () => update({ screen: 'history' }),
    onOpenSettings: () => update({ screen: 'settings' }),
    onLaunch: launchAnalysis,
  };

  if (IS_ADMIN_ROUTE) {
    if (!adminAuthed) {
      return <AdminLogin error={adminError} loading={adminLoading} onSubmit={handleAdminLogin} />;
    }
    return (
      <AdminCodes
        codes={adminCodes}
        loading={genLoading}
        error={genError}
        revokingCode={revokingCode}
        onGenerate={handleGenerateCode}
        onRevoke={handleRevokeCode}
        onBack={() => {
          // Admin auth and the visitor access-code gate are independent —
          // leaving admin should always drop back to a fresh gate check,
          // not silently reuse whatever code this tab happened to have
          // stored from an earlier, unrelated visitor session.
          sessionStorage.removeItem(SESSION_CODE_KEY);
          window.location.href = window.location.pathname;
        }}
      />
    );
  }

  if (!unlocked) {
    return (
      <>
        <AccessGate error={gateError} loading={gateLoading} onSubmit={handleSubmitCode} />
        {gateNotice && <Toast message={gateNotice} onClose={() => setGateNotice(null)} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Nav
        screen={screen}
        onGoHome={goHome}
        onOpenSettings={() => update({ screen: 'settings' })}
        onFocusSearch={focusSearch}
      />

      {screen === 'home' && (
        <Home
          query={query}
          onQuery={v => update({ query: v })}
          onStartWizard={startWizard}
          detecting={detecting}
          detectError={detectError}
          detectMessage={detectSlow ? "This is taking a little longer than usual — ambiguous names can take a bit. Hang tight." : detectMessage}
          searchRef={searchRef}
        />
      )}

      {screen === 'wizard' && <Wizard {...wizardProps} />}

      {screen === 'running' && (
        <Running
          brand={brand}
          personas={personas}
          runStatuses={runStatuses}
          runProgress={runProgress}
          eta={runEta}
          error={runError}
          onBack={goHome}
        />
      )}

      {screen === 'results' && analysisResult && (
        <Results
          brand={brand}
          industry={industry}
          personas={personas}
          competitors={competitors}
          results={liveResults}
          overview={analysisResult.overview}
          products={analysisResult.products}
          sources={analysisResult.sources}
          onGoHome={goHome}
        />
      )}

      {screen === 'activation' && (
        <Activation brand={brand} sitelist={analysisResult?.sitelist ?? []} onBack={() => update({ screen: 'results' })} />
      )}

      {screen === 'history' && <History onGoHome={goHome} />}
      {screen === 'settings' && <Settings />}
    </div>
  );
}
