export type Screen = 'home' | 'wizard' | 'running' | 'results' | 'history' | 'settings';
export type RunStatus = 'waiting' | 'running' | 'done';
export type Sentiment = 'Positive' | 'Neutral' | 'Negative';

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

export interface PersonaResult {
  prompt: string;
  mentioned: boolean;
  sentiment: Sentiment;
  vis: number;
  rank: number | null;
  quote: string;
  parts: ResponsePart[];
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

export interface AppState {
  screen: Screen;
  step: number;
  query: string;
  brand: string;
  industry: string;
  competitors: string[];
  newCompetitor: string;
  addingPersona: boolean;
  newPersona: NewPersona;
  personas: Persona[];
  models: AIModel[];
  runProgress: number;
  runStatuses: Record<string, RunStatus>;
  openResult: string | null;
  apiKey: string;
}
