import type { AccessCode, AccessStatus, AnalysisResult, DetectResult, GeneratedPersona, Persona, PersonaEvent } from './types';

const BASE = import.meta.env.VITE_API_BASE_URL;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parseErrorDetail(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.detail || res.statusText;
  } catch {
    return res.statusText;
  }
}

function personaPayload(personas: Persona[]) {
  return personas.map(p => ({ id: p.id, title: p.title, role: p.role, pains: p.pains, criteria: p.criteria }));
}

export async function checkAccessStatus(code: string): Promise<AccessStatus> {
  const res = await fetch(`${BASE}/api/access/status?code=${encodeURIComponent(code)}`);
  if (!res.ok) throw new ApiError(res.status, await parseErrorDetail(res));
  const body = await res.json();
  return body.status;
}

export async function detectBrand(args: { query: string; accessCode: string }): Promise<DetectResult> {
  // A real web-search pass plus a structuring call, server-side — routinely
  // 15-30s, longer for ambiguous names. Without a client-side ceiling a truly
  // hung request would just leave the caller waiting forever.
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: args.query, accessCode: args.accessCode }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'TimeoutError' || e.name === 'AbortError')) {
      throw new ApiError(0, "That took too long to respond. Please try again — it's usually faster.");
    }
    throw e;
  }
  if (!res.ok) throw new ApiError(res.status, await parseErrorDetail(res));
  return res.json();
}

export async function getCategories(args: {
  brand: string;
  industry: string;
  competitors: string[];
  buyerContext?: string;
  brandSummary?: string;
  accessCode: string;
}): Promise<string[]> {
  const res = await fetch(`${BASE}/api/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand: args.brand,
      industry: args.industry,
      competitors: args.competitors,
      buyerContext: args.buyerContext,
      brandSummary: args.brandSummary,
      accessCode: args.accessCode,
    }),
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorDetail(res));
  const body = await res.json();
  return body.categories;
}

export async function generatePersonas(args: {
  brand: string;
  industry: string;
  competitors: string[];
  buyerContext?: string;
  brandSummary?: string;
  market?: string;
  accessCode: string;
}): Promise<GeneratedPersona[]> {
  const res = await fetch(`${BASE}/api/generate-personas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand: args.brand,
      industry: args.industry,
      competitors: args.competitors,
      buyerContext: args.buyerContext,
      brandSummary: args.brandSummary,
      market: args.market,
      accessCode: args.accessCode,
    }),
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorDetail(res));
  const body = await res.json();
  return body.personas;
}

export async function generatePrompts(args: {
  brand: string;
  industry: string;
  personas: Persona[];
  buyerContext?: string;
  brandSummary?: string;
  market?: string;
  accessCode: string;
}): Promise<Record<string, string[]>> {
  const res = await fetch(`${BASE}/api/prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand: args.brand,
      industry: args.industry,
      personas: personaPayload(args.personas),
      buyerContext: args.buyerContext,
      brandSummary: args.brandSummary,
      market: args.market,
      accessCode: args.accessCode,
    }),
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorDetail(res));
  const body = await res.json();
  return body.prompts;
}

export async function startAnalysis(args: {
  brand: string;
  industry: string;
  competitors: string[];
  personas: Persona[];
  prompts: Record<string, string[]>;
  buyerContext?: string;
  brandSummary?: string;
  market?: string;
  accessCode: string;
}): Promise<string> {
  const res = await fetch(`${BASE}/api/analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand: args.brand,
      industry: args.industry,
      competitors: args.competitors,
      personas: personaPayload(args.personas),
      prompts: args.prompts,
      buyerContext: args.buyerContext,
      brandSummary: args.brandSummary,
      market: args.market,
      accessCode: args.accessCode,
    }),
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorDetail(res));
  const body = await res.json();
  return body.jobId;
}

export function streamAnalysis(
  jobId: string,
  handlers: {
    onPersona: (event: PersonaEvent) => void;
    onComplete: (result: AnalysisResult) => void;
    onError: (message: string) => void;
  }
): () => void {
  const source = new EventSource(`${BASE}/api/analysis/${jobId}/stream`);

  // Network payloads aren't guaranteed well-formed — a parse failure here
  // must still close the connection and surface *something*, or a single
  // bad event leaves EventSource silently retrying the same broken message
  // forever (no onError call ever fires, so nothing closes it).
  function safeParse<T>(raw: string): T | null {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  source.addEventListener('persona', e => {
    const parsed = safeParse<PersonaEvent>((e as MessageEvent).data);
    if (parsed) handlers.onPersona(parsed);
  });
  source.addEventListener('complete', e => {
    const parsed = safeParse<AnalysisResult>((e as MessageEvent).data);
    source.close();
    if (parsed) handlers.onComplete(parsed);
    else handlers.onError('Received a malformed completion payload from the server.');
  });
  source.addEventListener('error', e => {
    // A named "event: error" from the backend arrives as a MessageEvent with
    // .data; a dropped connection fires the same listener but as a plain
    // Event with no .data — only the former is a real job failure to report.
    const data = (e as MessageEvent).data;
    if (data) {
      const parsed = safeParse<{ message?: string }>(data);
      source.close();
      handlers.onError(parsed?.message || 'Analysis failed');
    }
  });

  return () => source.close();
}

export async function mintCodes(args: { count: number; uses: number; adminSecret: string }): Promise<string[]> {
  const res = await fetch(`${BASE}/admin/codes?count=${args.count}&uses=${args.uses}`, {
    method: 'POST',
    headers: { 'X-Admin-Secret': args.adminSecret },
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorDetail(res));
  const body = await res.json();
  return body.codes;
}

export async function listCodes(adminSecret: string): Promise<AccessCode[]> {
  const res = await fetch(`${BASE}/admin/codes`, {
    headers: { 'X-Admin-Secret': adminSecret },
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorDetail(res));
  const body = await res.json();
  return body.codes;
}

export async function revokeCode(args: { code: string; adminSecret: string }): Promise<void> {
  const res = await fetch(`${BASE}/admin/codes/${encodeURIComponent(args.code)}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Secret': args.adminSecret },
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorDetail(res));
}
