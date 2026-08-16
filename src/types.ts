export type Screen = 'home' | 'wizard' | 'running' | 'results' | 'history' | 'settings' | 'activation';
export type RunStatus = 'waiting' | 'running' | 'done' | 'error';
export type Sentiment = 'Positive' | 'Neutral' | 'Negative';

export interface Competitor {
  name: string;
  matchNames: string[];
}

export interface Persona {
  id: string;
  title: string;
  desc: string;
  role: string;
  pains: string;
  criteria: string;
  selected: boolean;
  expanded: boolean;
  initials: string;
}

export interface AIModel {
  id: string;
  name: string;
  vendor: string;
  available: boolean;
  enabled: boolean;
  badge: string;
  mono: string;
}

export interface ResponsePart {
  text: string;
  kind: 'brand' | 'competitor' | 'normal';
}

export interface PersonaExchange {
  prompt: string;
  mentioned: boolean;
  sentiment: Sentiment;
  rank: number | null;
  vis: number;
  quote: string;
  parts: ResponsePart[];
}

export interface PersonaResult {
  prompt: string;
  mentioned: boolean;
  sentiment: Sentiment;
  vis: number;
  rank: number | null;
  quote: string;
  parts: ResponsePart[];
  exchanges: PersonaExchange[];
}

export interface HistoryEntry {
  id: string;
  date: string;
  brand: string;
  industry: string;
  personas: number;
  models: string;
  score: string;
  scoreColor: string;
  status: string;
}

export interface NewPersona {
  name: string;
  role: string;
  industry: string;
  goals: string;
  pains: string;
  criteria: string;
}

export interface Product {
  name: string;
  count: number;
  share: number;
  isBrand?: boolean;
}

export interface Citation {
  domain: string;
  title: string;
  count: number;
}

export interface Publisher {
  name: string;
  type: string;
  mentions: number;
}

export interface Community {
  name: string;
  platform: string;
  mentions: number;
}

export interface AccessCode {
  code: string;
  usesTotal: number;
  usesRemaining: number;
  promptCalls: number;
  revoked: boolean;
  createdAt: string;
}

export type AccessStatus = 'unknown' | 'revoked' | 'exhausted' | 'valid';

export interface SitelistEntry {
  name: string;
  category: string;
  score: number;
  inventory: string[];
  availability: string;
  cpm: string;
  buyable: boolean;
}

export interface Overview {
  visibilityScore: number;
  mentioned: number;
  total: number;
  mentionRate: number;
  avgSentiment: Sentiment;
  topCompetitor: string | null;
  failedCount: number;
}

export interface Sources {
  citations: Citation[];
  publishers: Publisher[];
  communities: Community[];
}

export interface AnalysisResult {
  overview: Overview;
  products: Product[];
  sources: Sources;
  sitelist: SitelistEntry[];
}

export interface DetectResult {
  brand: string;
  industry: string;
  competitors: Competitor[];
  buyerContext: string;
  brandSummary: string;
}

export interface CategoryOption {
  name: string;
  buyerContext: string;
}

export interface GeneratedPersona {
  id: string;
  title: string;
  initials: string;
  desc: string;
  role: string;
  pains: string;
  criteria: string;
}

export interface PersonaEvent {
  personaId: string;
  status: RunStatus;
  result?: PersonaResult;
  error?: string;
}

export interface AppState {
  screen: Screen;
  step: number;
  query: string;
  brand: string;
  industry: string;
  competitors: Competitor[];
  buyerContext: string;
  brandSummary: string;
  market: string;
  customCategory: string;
  newCompetitor: string;
  addingPersona: boolean;
  newPersona: NewPersona;
  personas: Persona[];
  models: AIModel[];
  runProgress: number;
  runStatuses: Record<string, RunStatus>;
  openResult: string | null;
  personaPrompts: Record<string, string[]>;
  promptsExpanded: Record<string, boolean>;
}
