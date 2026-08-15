import { useCallback, useEffect, useRef, useState } from 'react';
import type { AccessCode, AnalysisResult, AppState, NewPersona, PersonaResult } from './types';
import { INITIAL_PERSONAS, INITIAL_MODELS } from './data';
import { ApiError, detectBrand, generatePrompts, listCodes, mintCodes, startAnalysis, streamAnalysis } from './api';
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

const IS_ADMIN_ROUTE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('admin');

function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Could not reach the backend. Is it running?';
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
  competitors: ['Asana', 'Monday.com', 'ClickUp', 'Notion'],
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
  const [unlocked, setUnlocked] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [gateError, setGateError] = useState<string | null>(null);

  const handleSubmitCode = useCallback((code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setGateError('Enter an access code.');
      return;
    }
    // There's no lightweight endpoint to check a code up front — the backend
    // only validates a code as a side effect of actually using it (first at
    // /api/prompts). If it turns out invalid, we bounce back here with the
    // real error instead of pretending to have checked it already.
    setAccessCode(trimmed);
    setGateError(null);
    setUnlocked(true);
  }, []);

  // ── Admin ───────────────────────────────────────────────────────────
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminSecret, setAdminSecret] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminCodes, setAdminCodes] = useState<AccessCode[]>([]);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

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

  // ── Core app state ──────────────────────────────────────────────────
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [promptsError, setPromptsError] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [liveResults, setLiveResults] = useState<Record<string, PersonaResult>>({});
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const update = useCallback((patch: Partial<AppState>) => setState(s => ({ ...s, ...patch })), []);

  const closeStream = useCallback(() => {
    closeStreamRef.current?.();
    closeStreamRef.current = null;
  }, []);

  const goHome = useCallback(() => {
    closeStream();
    setRunError(null);
    setLiveResults({});
    setAnalysisResult(null);
    setPromptsError(null);
    setDetectError(null);
    setState(s => ({ ...s, screen: 'home', step: 1, runStatuses: {}, runProgress: 0, personaPrompts: {} }));
  }, [closeStream]);

  const focusSearch = useCallback(() => {
    setState(s => ({ ...s, screen: 'home' }));
    setTimeout(() => searchRef.current?.focus(), 50);
  }, []);

  const startWizard = useCallback(async () => {
    const q = state.query.trim() || 'Project management apps for growing software teams';
    setDetecting(true);
    setDetectError(null);
    try {
      const detected = await detectBrand({ query: q, accessCode });
      update({ screen: 'wizard', step: 1, query: q, brand: detected.brand, industry: detected.industry, competitors: detected.competitors });
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 403)) {
        setUnlocked(false);
        setGateError(e.message);
      } else {
        setDetectError(errorMessage(e));
      }
    } finally {
      setDetecting(false);
    }
  }, [state.query, accessCode, update]);

  const goToPrompts = useCallback(async () => {
    update({ step: 4 });
    setPromptsLoading(true);
    setPromptsError(null);
    try {
      const selected = state.personas.filter(p => p.selected);
      const prompts = await generatePrompts({ brand: state.brand, industry: state.industry, personas: selected, accessCode });
      update({ personaPrompts: prompts });
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 403)) {
        // The code turned out invalid/exhausted — this is the first real
        // check it's had, so send the user back to the gate with why.
        setUnlocked(false);
        setGateError(e.message);
      } else {
        setPromptsError(errorMessage(e));
      }
    } finally {
      setPromptsLoading(false);
    }
  }, [state.personas, state.brand, state.industry, accessCode, update]);

  const launchAnalysis = useCallback(async () => {
    const selected = state.personas.filter(p => p.selected);
    if (selected.length === 0) return;

    setRunError(null);
    setLiveResults({});
    setAnalysisResult(null);
    update({ screen: 'running', runProgress: 0, runStatuses: {} });

    try {
      const jobId = await startAnalysis({
        brand: state.brand,
        industry: state.industry,
        competitors: state.competitors,
        personas: selected,
        prompts: state.personaPrompts,
        accessCode,
      });

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
          }
        },
        onComplete: result => {
          setAnalysisResult(normalizeResult(result));
          update({ screen: 'results' });
        },
        onError: message => setRunError(message),
      });
    } catch (e) {
      setRunError(errorMessage(e));
    }
  }, [state.personas, state.brand, state.industry, state.competitors, state.personaPrompts, accessCode, update]);

  useEffect(() => () => closeStream(), [closeStream]);

  const { screen, step, query, brand, industry, competitors, newCompetitor, addingPersona, newPersona, personas, models, runProgress, runStatuses, personaPrompts, promptsExpanded } = state;

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
    step, brand, industry, competitors, newCompetitor, addingPersona, newPersona, personas, models, personaPrompts, promptsExpanded, promptsLoading, promptsError, getPersonaPrompts,
    onBrand: (v: string) => update({ brand: v }),
    onIndustry: (v: string) => update({ industry: v }),
    onRemoveCompetitor: (c: string) => update({ competitors: competitors.filter(x => x !== c) }),
    onNewCompetitor: (v: string) => update({ newCompetitor: v }),
    onAddCompetitor: () => {
      const v = newCompetitor.trim();
      if (!v) return;
      update({ competitors: [...competitors, v], newCompetitor: '' });
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
      if (step === 3) { goToPrompts(); return; }
      update({ step: Math.min(5, step + 1) });
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
        onGenerate={handleGenerateCode}
        onBack={() => { window.location.href = window.location.pathname; }}
      />
    );
  }

  if (!unlocked) {
    return <AccessGate error={gateError} onSubmit={handleSubmitCode} />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Nav
        screen={screen}
        onGoHome={goHome}
        onOpenHistory={() => update({ screen: 'history' })}
        onOpenSettings={() => update({ screen: 'settings' })}
        onFocusSearch={focusSearch}
      />

      {screen === 'home' && (
        <Home
          query={query}
          onQuery={v => update({ query: v })}
          onStartWizard={startWizard}
          onOpenHistory={() => update({ screen: 'history' })}
          detecting={detecting}
          detectError={detectError}
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
          onOpenActivation={() => update({ screen: 'activation' })}
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
