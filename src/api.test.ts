import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePrompts, suggestSeedPrompt } from './api';
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
    expect(body.personas).toEqual([{ id: 'p1', title: 'Test Persona', role: 'role', pains: 'pains', criteria: 'criteria' }]);
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
