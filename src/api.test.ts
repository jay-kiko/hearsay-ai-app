import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatErrorDetail, generatePrompts, startAnalysis, suggestSeedPrompt } from './api';
import { matchNamesFor } from './brandNames';
import type { Persona } from './types';

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

const PERSONA: Persona = {
  id: 'p1',
  title: 'Test Persona',
  desc: 'desc',
  role: 'role',
  pains: 'pains',
  criteria: 'criteria',
  selected: true,
  expanded: false,
  initials: 'TP',
};

describe('generatePrompts', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(jsonResponse({ prompts: { p1: ['a', 'b'] } }));
    vi.stubGlobal('fetch', fetchMock);
  });

  it('omits categories from the request body when none are selected', async () => {
    await generatePrompts({
      brand: 'Acme',
      industry: 'Widgets',
      personas: [PERSONA],
      accessCode: 'CODE-1',
    });

    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.categories).toBeUndefined();
  });

  it('sends the full category objects — name and buyerContext — when multiple are selected', async () => {
    const categories = [
      { name: 'Category A', buyerContext: 'Context A' },
      { name: 'Category B', buyerContext: 'Context B' },
    ];

    await generatePrompts({
      brand: 'Acme',
      industry: 'Widgets',
      personas: [PERSONA],
      categories,
      accessCode: 'CODE-1',
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/prompts');
    const body = JSON.parse(init.body as string);
    expect(body.categories).toEqual(categories);
  });

  it('parses the personaId -> prompt[] response shape', async () => {
    const result = await generatePrompts({
      brand: 'Acme',
      industry: 'Widgets',
      personas: [PERSONA],
      accessCode: 'CODE-1',
    });
    expect(result).toEqual({ p1: ['a', 'b'] });
  });

  it('throws ApiError with the backend detail on a non-ok response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: 'Too many prompt regenerations for this access code' }, false, 429));
    await expect(
      generatePrompts({ brand: 'Acme', industry: 'Widgets', personas: [PERSONA], accessCode: 'CODE-1' })
    ).rejects.toMatchObject({ status: 429, message: 'Too many prompt regenerations for this access code' });
  });
});

describe('suggestSeedPrompt', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(jsonResponse({ prompts: { p1: 'Adapted question for this persona?' } }));
    vi.stubGlobal('fetch', fetchMock);
  });

  it('posts to /api/prompts/seed with the seed prompt and persona payload', async () => {
    await suggestSeedPrompt({
      brand: 'Acme',
      industry: 'Widgets',
      personas: [PERSONA],
      seedPrompt: 'What is the best option?',
      accessCode: 'CODE-1',
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/prompts/seed');
    const body = JSON.parse(init.body as string);
    expect(body.seedPrompt).toBe('What is the best option?');
    expect(body.personas).toEqual([{ id: 'p1', title: 'Test Persona', desc: 'desc', role: 'role', pains: 'pains', criteria: 'criteria' }]);
    expect(body.accessCode).toBe('CODE-1');
  });

  it('parses the one-string-per-persona response shape (not a list, unlike /api/prompts)', async () => {
    const result = await suggestSeedPrompt({
      brand: 'Acme',
      industry: 'Widgets',
      personas: [PERSONA],
      seedPrompt: 'What is the best option?',
      accessCode: 'CODE-1',
    });
    expect(result).toEqual({ p1: 'Adapted question for this persona?' });
    expect(typeof result.p1).toBe('string');
  });
});

describe('backend contract', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(jsonResponse({ prompts: {}, jobId: 'j_1' }));
    vi.stubGlobal('fetch', fetchMock);
  });

  it('sends each persona\'s desc and the brand screen names with prompt generation', async () => {
    const competitors = [{ name: 'Rival', matchNames: ['Rival'] }];
    await generatePrompts({ brand: 'Acme', brandMatchNames: ['Acme', 'Acme Pro'], competitors, industry: 'W', personas: [PERSONA], accessCode: 'C' });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.personas[0].desc).toBe('desc');
    expect(body.brandMatchNames).toEqual(['Acme', 'Acme Pro']);
    expect(body.competitors).toEqual(competitors);
  });

  it('sends brandMatchNames with the analysis so aliases count as mentions', async () => {
    await startAnalysis({ brand: 'Acme', brandMatchNames: ['Acme', 'Acme Pro'], industry: 'W', competitors: [], personas: [PERSONA], prompts: { p1: ['q'] }, accessCode: 'C' });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.brandMatchNames).toEqual(['Acme', 'Acme Pro']);
  });
});

describe('matchNamesFor', () => {
  it('keeps detected aliases through a small edit and always includes the brand field', () => {
    expect(matchNamesFor('Disney Cruise Line', 'Disney Cruise', ['Disney Cruise', 'DCL'])).toEqual(['Disney Cruise Line', 'Disney Cruise', 'DCL']);
  });

  it('drops the old brand\'s aliases after a rename to an unrelated brand', () => {
    expect(matchNamesFor('Royal Caribbean', 'Disney Cruise', ['Disney Cruise', 'DCL'])).toEqual(['Royal Caribbean']);
  });
});

describe('formatErrorDetail', () => {
  it('turns a 422 validation list into a readable line instead of [object Object]', () => {
    const detail = [{ loc: ['body', 'brandSummary'], msg: 'String should have at most 2000 characters' }];
    expect(formatErrorDetail(detail)).toBe('Brand summary: String should have at most 2000 characters');
  });

  it('passes plain string details through', () => {
    expect(formatErrorDetail('Access code not found')).toBe('Access code not found');
  });

  it('names nested fields by their first named part', () => {
    const detail = [{ loc: ['body', 'prompts', 'p1', 0], msg: 'String should have at most 500 characters' }];
    expect(formatErrorDetail(detail)).toBe('Prompts: String should have at most 500 characters');
  });
});
