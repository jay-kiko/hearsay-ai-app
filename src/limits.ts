// Mirrors the backend's request limits (hearsay-ai-api app/models.py). Every
// field ends up in a billed model call, so the backend rejects longer input
// with a 422; capping the inputs here means a user never types past them.
export const LIMITS = {
  name: 120, // brand, competitor, market, category name
  line: 500, // industry
  paragraph: 2000, // brand summary
  prompt: 500,
} as const;

// The prompts actually sent for a run: selected personas only, blank prompts
// dropped (the backend rejects an empty prompt), whitespace trimmed.
export function promptsForRun(personaIds: string[], personaPrompts: Record<string, string[]>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const id of personaIds) {
    const prompts = (personaPrompts[id] ?? []).map(p => p.trim()).filter(Boolean);
    if (prompts.length) out[id] = prompts;
  }
  return out;
}
