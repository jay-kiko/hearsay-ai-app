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

export type PersonaOpportunity = 'Defend' | 'Grow' | 'High' | 'Critical Gap';

export interface PersonaResult {
  prompt: string;
  mentioned: boolean;
  sentiment: Sentiment;
  vis: number;
  rank: number | null;
  quote: string;
  parts: ResponsePart[];
  exchanges: PersonaExchange[];
  opportunity: PersonaOpportunity;
  // Prompts whose calls failed; left out of every count above.
  failedPrompts?: number;
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

export interface SourceIntel {
  domain: string;
  url: string;
  category: string;
  influence: string;
  cited: number;
  keywords: string[];
  personas: string[];
  competitors: string[];
  // "Couldn't verify": the page blocks automated reading, so presence is unknown.
  visibility: 'Visible' | 'Weak visibility' | 'Not visible' | "Couldn't verify";
  // `url` plus a text fragment that scrolls to the first brand mention.
  link?: string;
  // ISO date of a saved copy (more than a week old) the page was read from,
  // because the site blocks automated reading; null/absent for a live read.
  readFromCopy?: string | null;
  // Brand evidence on the linked page (what `visibility` is derived from).
  mentions?: number;
  // The passage naming the brand on that page; empty when mentions is 0.
  evidence?: string;
  // Same measure per competitor named on the page, most first.
  competitorMentions?: Record<string, number>;
  // Only when the brand isn't visible: rivals named there, or still open.
  gap?: 'competitor-owned' | 'open' | null;
}

// One search the source step ran (searched without the brand).
export interface SourceQuery {
  persona: string | null;
  question: string | null;
  query: string;
  dropped: boolean; // named a brand anyway; its results were discarded
  failed: boolean;
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
  // Reach 0-100; null when fewer than two buyer questions were searched.
  score: number | null;
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
  failedCount: number; // personas that failed entirely
  failedPrompts?: number; // prompts that failed inside otherwise successful personas
}

export interface Sources {
  citations: Citation[];
  publishers: Publisher[];
  communities: Community[];
  sourceIntel: SourceIntel[];
  queries?: SourceQuery[];
  // Set when coverage is thin or a search failed; show it with the list.
  coverageNote?: string | null;
}

export interface ScoreComponent {
  name: string;
  score: number;
  note: string;
}

export interface CompetitorDiagnosis {
  rivalWins: string[];
  brandWins: string[];
  gaps: string[];
}

export interface Opportunity {
  title: string;
  // Free-form label from the model ("Critical gap", "Source gap",
  // "Competitive", "Keyword gap", "Community", ...) — not an exhaustive
  // enum, render whatever string comes back.
  type: string;
  impact: 'High' | 'Medium' | 'Low';
  effort: 'High' | 'Medium' | 'Low';
  detail: string;
  action: string;
}

export interface RadarCategory {
  name: string;
  score: number;
}

export interface AnalysisResult {
  overview: Overview;
  products: Product[];
  sources: Sources;
  sitelist: SitelistEntry[];
  scoreBreakdown: ScoreComponent[];
  competitorDiagnosis: CompetitorDiagnosis;
  opportunities: Opportunity[];
  radar: RadarCategory[];
}

export interface DetectResult {
  brand: string;
  // Every name variant that counts as the brand (product lines, short forms).
  brandMatchNames: string[];
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
  // Aliases detect found for `detectedBrand`; see matchNamesFor in App.tsx.
  brandMatchNames: string[];
  detectedBrand: string;
  industry: string;
  detectedIndustry: string;
  competitors: Competitor[];
  buyerContext: string;
  brandSummary: string;
  // What's sent to the backend: composeMarket(marketCountry, marketArea).
  market: string;
  marketCountry: string;
  marketArea: string;
  customCategory: string;
  selectedCategories: CategoryOption[];
  newCompetitor: string;
  addingPersona: boolean;
  personas: Persona[];
  models: AIModel[];
  runProgress: number;
  runStatuses: Record<string, RunStatus>;
  openResult: string | null;
  personaPrompts: Record<string, string[]>;
  promptsExpanded: Record<string, boolean>;
}
