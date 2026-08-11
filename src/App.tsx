import { useState, useRef, useCallback, useEffect } from 'react';
import type { AppState, NewPersona, RunStatus, Persona, AccessCode } from './types';
import { INITIAL_PERSONAS, INITIAL_MODELS, RESULTS, INITIAL_ACCESS_CODES } from './data';
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

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — avoids visual ambiguity
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += chars[bytes[i] % chars.length];
  return s.match(/.{1,4}/g)!.join('-');
}

function today(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const RUN_SPEED = 650;

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
  apiKey: '',
  personaPrompts: {},
  promptsExpanded: {},
};

function parseBrand(query: string): string {
  const words = query.trim().split(/\s+/);
  if (words.length === 0 || query.trim() === '') return 'Your Brand';
  return words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function defaultPromptFor(p: Persona, industry: string): string {
  const r = RESULTS[p.id];
  return r ? r.prompt : `As a ${p.title}, which ${industry} tools would you recommend and why?`;
}

function getPersonaPromptsFor(state: AppState, id: string): string[] {
  if (state.personaPrompts[id]) return state.personaPrompts[id];
  const p = state.personas.find(x => x.id === id);
  return [p ? defaultPromptFor(p, state.industry) : ''];
}

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const searchRef = useRef<HTMLTextAreaElement>(null);
  const runTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [unlocked, setUnlocked] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>(INITIAL_ACCESS_CODES);

  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  const handleVerifyCode = useCallback((code: string) => {
    const match = accessCodes.find(c => c.code === code && c.usesRemaining > 0);
    if (!match) {
      setGateError('Invalid or exhausted access code.');
      return;
    }
    setAccessCodes(cs => cs.map(c => c.code === code ? { ...c, usesRemaining: c.usesRemaining - 1 } : c));
    setGateError(null);
    setUnlocked(true);
  }, [accessCodes]);

  const handleAdminLogin = useCallback((username: string, password: string) => {
    if (username === import.meta.env.VITE_ADMIN_USERNAME && password === import.meta.env.VITE_ADMIN_PASSWORD) {
      setAdminError(null);
      setAdminAuthed(true);
    } else {
      setAdminError('Incorrect username or password.');
    }
  }, []);

  const handleGenerateCode = useCallback((usesTotal: number) => {
    setAccessCodes(cs => [...cs, { code: generateCode(), usesTotal, usesRemaining: usesTotal, createdAt: today() }]);
  }, []);

  const handleRevokeCode = useCallback((code: string) => {
    setAccessCodes(cs => cs.map(c => c.code === code ? { ...c, usesRemaining: 0 } : c));
  }, []);

  const update = useCallback((patch: Partial<AppState>) => setState(s => ({ ...s, ...patch })), []);

  const goHome = useCallback(() => {
    if (runTimerRef.current) clearTimeout(runTimerRef.current);
    setState(s => ({ ...s, screen: 'home', step: 1, runStatuses: {}, runProgress: 0 }));
  }, []);

  const focusSearch = useCallback(() => {
    setState(s => ({ ...s, screen: 'home' }));
    setTimeout(() => searchRef.current?.focus(), 50);
  }, []);

  const startWizard = useCallback(() => {
    setState(s => {
      const q = s.query.trim() || 'Project management apps for growing software teams';
      const brand = parseBrand(q);
      return { ...s, screen: 'wizard', step: 1, query: q, brand };
    });
  }, []);

  const launchAnalysis = useCallback(() => {
    setState(s => {
      const selected = s.personas.filter(p => p.selected);
      if (selected.length === 0) return s;

      let i = 0;
      const tick = () => {
        if (i >= selected.length) {
          runTimerRef.current = setTimeout(() => {
            setState(prev => ({ ...prev, screen: 'results' }));
          }, 600);
          return;
        }
        const pid = selected[i].id;
        setState(prev => ({
          ...prev,
          runStatuses: { ...prev.runStatuses, [pid]: 'running' as RunStatus },
          runProgress: Math.round((i / selected.length) * 100),
        }));
        runTimerRef.current = setTimeout(() => {
          setState(prev => ({
            ...prev,
            runStatuses: { ...prev.runStatuses, [pid]: 'done' as RunStatus },
            runProgress: Math.round(((i + 1) / selected.length) * 100),
          }));
          i++;
          runTimerRef.current = setTimeout(tick, 200);
        }, RUN_SPEED);
      };

      runTimerRef.current = setTimeout(tick, 400);
      return { ...s, screen: 'running', runProgress: 0, runStatuses: {} };
    });
  }, []);

  useEffect(() => () => { if (runTimerRef.current) clearTimeout(runTimerRef.current); }, []);

  const { screen, step, query, brand, industry, competitors, newCompetitor, addingPersona, newPersona, personas, models, runProgress, runStatuses, personaPrompts, promptsExpanded } = state;

  const getPersonaPrompts = useCallback((id: string) => getPersonaPromptsFor(state, id), [state]);

  const onToggleExpandPrompt = useCallback((id: string) => {
    setState(s => ({ ...s, promptsExpanded: { ...s.promptsExpanded, [id]: s.promptsExpanded[id] === false ? true : false } }));
  }, []);

  const onAddPrompt = useCallback((id: string) => {
    setState(s => {
      const arr = getPersonaPromptsFor(s, id);
      return { ...s, personaPrompts: { ...s.personaPrompts, [id]: [...arr, ''] }, promptsExpanded: { ...s.promptsExpanded, [id]: true } };
    });
  }, []);

  const onEditPrompt = useCallback((id: string, idx: number, val: string) => {
    setState(s => {
      const arr = [...getPersonaPromptsFor(s, id)];
      arr[idx] = val;
      return { ...s, personaPrompts: { ...s.personaPrompts, [id]: arr } };
    });
  }, []);

  const onRemovePrompt = useCallback((id: string, idx: number) => {
    setState(s => {
      const arr = getPersonaPromptsFor(s, id).filter((_, i) => i !== idx);
      return { ...s, personaPrompts: { ...s.personaPrompts, [id]: arr.length ? arr : [''] } };
    });
  }, []);

  const wizardProps = {
    step, brand, industry, competitors, newCompetitor, addingPersona, newPersona, personas, models, personaPrompts, promptsExpanded, getPersonaPrompts,
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
    onNextStep: () => update({ step: Math.min(5, step + 1) }),
    onPrevStep: () => update({ step: Math.max(1, step - 1) }),
    onGoHome: goHome,
    onOpenHistory: () => update({ screen: 'history' }),
    onOpenSettings: () => update({ screen: 'settings' }),
    onLaunch: launchAnalysis,
  };

  if (IS_ADMIN_ROUTE) {
    if (!adminAuthed) {
      return <AdminLogin error={adminError} onSubmit={handleAdminLogin} />;
    }
    return (
      <AdminCodes
        codes={accessCodes}
        onGenerate={handleGenerateCode}
        onRevoke={handleRevokeCode}
        onBack={() => { window.location.href = window.location.pathname; }}
      />
    );
  }

  if (!unlocked) {
    return <AccessGate error={gateError} onSubmit={handleVerifyCode} />;
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
        />
      )}

      {screen === 'results' && (
        <Results
          brand={brand}
          industry={industry}
          personas={personas}
          competitors={competitors}
          onGoHome={goHome}
          onOpenActivation={() => update({ screen: 'activation' })}
        />
      )}

      {screen === 'activation' && (
        <Activation brand={brand} onBack={() => update({ screen: 'results' })} />
      )}

      {screen === 'history' && <History onGoHome={goHome} />}
      {screen === 'settings' && <Settings />}
    </div>
  );
}
