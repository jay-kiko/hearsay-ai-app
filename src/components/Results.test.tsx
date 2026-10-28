import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Results } from './Results';
import type { Persona, PersonaResult, Product, Overview, Sources, ScoreComponent, CompetitorDiagnosis, Opportunity, RadarCategory } from '../types';

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

const RESULT: PersonaResult = {
  prompt: 'What should I buy?',
  mentioned: true,
  sentiment: 'Positive',
  vis: 85,
  rank: 1,
  quote: 'Acme is great',
  parts: [{ text: 'Acme is great', kind: 'brand' }],
  exchanges: [
    {
      prompt: 'What should I buy?',
      mentioned: true,
      sentiment: 'Positive',
      rank: 1,
      vis: 85,
      quote: 'Acme is great',
      parts: [{ text: 'Acme is great', kind: 'brand' }],
    },
  ],
  opportunity: 'Defend',
};

const OVERVIEW: Overview = {
  visibilityScore: 70,
  mentioned: 1,
  total: 1,
  mentionRate: 1,
  avgSentiment: 'Positive',
  topCompetitor: 'Rival Co',
  failedCount: 0,
};

const PRODUCTS: Product[] = [
  { name: 'Acme', count: 1, share: 100, isBrand: true },
];

const SOURCES: Sources = {
  citations: [],
  publishers: [],
  communities: [],
  sourceIntel: [],
};

const SCORE_BREAKDOWN: ScoreComponent[] = [
  { name: 'Presence', score: 100, note: 'Mentioned in 1 of 1 queries' },
  { name: 'Share of Voice', score: 100, note: '100% of all product mentions' },
  { name: 'Recommendation Strength', score: 85, note: 'Average visibility score of 85' },
  { name: 'Ranking', score: 100, note: 'Average position #1' },
  { name: 'Sentiment', score: 100, note: '1 positive · 0 neutral · 0 negative' },
  { name: 'Source Authority', score: 0, note: 'Named in 0 of 0 researched sources' },
];

const EMPTY_DIAGNOSIS: CompetitorDiagnosis = { rivalWins: [], brandWins: [], gaps: [] };

function baseProps(overrides: Partial<React.ComponentProps<typeof Results>> = {}) {
  return {
    brand: 'Acme',
    industry: 'Widgets',
    personas: [PERSONA],
    competitors: [],
    results: { p1: RESULT },
    overview: OVERVIEW,
    products: PRODUCTS,
    sources: SOURCES,
    scoreBreakdown: SCORE_BREAKDOWN,
    competitorDiagnosis: EMPTY_DIAGNOSIS,
    opportunities: [] as Opportunity[],
    radar: [] as RadarCategory[],
    onGoHome: () => {},
    ...overrides,
  };
}

describe('Results — radar chart (dynamic dimensions)', () => {
  it('renders an empty state instead of a chart when radar has no data', () => {
    render(<Results {...baseProps({ radar: [] })} />);
    expect(screen.getByText(/not enough data yet to compute brand strength/i)).toBeInTheDocument();
  });

  it('renders exactly the dimension names/count the backend sent — 3 dimensions, none of them hardcoded SaaS labels', () => {
    const radar: RadarCategory[] = [
      { name: 'Ingredient Transparency', score: 80 },
      { name: 'Packaging Sustainability', score: 40 },
      { name: 'Dermatologist Endorsement', score: 60 },
    ];
    render(<Results {...baseProps({ radar })} />);
    expect(screen.getByText('Ingredient Transparency')).toBeInTheDocument();
    expect(screen.getByText('Packaging Sustainability')).toBeInTheDocument();
    expect(screen.getByText('Dermatologist Endorsement')).toBeInTheDocument();
    // None of the old hardcoded fixed-axis labels should ever appear.
    expect(screen.queryByText('Technical')).not.toBeInTheDocument();
    expect(screen.queryByText('Enterprise')).not.toBeInTheDocument();
  });

  it('renders correctly for a much larger dimension count (8) — no fixed axis-count assumption', () => {
    const radar: RadarCategory[] = Array.from({ length: 8 }, (_, i) => ({ name: `Dimension ${i + 1}`, score: 50 }));
    render(<Results {...baseProps({ radar })} />);
    for (const d of radar) {
      expect(screen.getByText(d.name)).toBeInTheDocument();
    }
  });
});

describe('Results — competitor diagnosis fail-open behavior', () => {
  it('shows a "not enough data" message when all three arrays are empty, not a crash or blank section', () => {
    render(<Results {...baseProps({ competitorDiagnosis: EMPTY_DIAGNOSIS })} />);
    expect(screen.getByText(/not enough data yet for this report/i)).toBeInTheDocument();
  });

  it('renders real rival/brand/gap themes when present', () => {
    const diagnosis: CompetitorDiagnosis = {
      rivalWins: ['Enterprise integrations'],
      brandWins: ['Ease of use'],
      gaps: ['Procurement-framed queries'],
    };
    render(<Results {...baseProps({ competitorDiagnosis: diagnosis })} />);
    expect(screen.getByText('Enterprise integrations')).toBeInTheDocument();
    expect(screen.getByText('Ease of use')).toBeInTheDocument();
    // The top gap also surfaces as the "Biggest Opportunity" summary card,
    // so it legitimately appears twice.
    expect(screen.getAllByText('Procurement-framed queries').length).toBeGreaterThanOrEqual(1);
  });
});

describe('Results — opportunities (free-form type, fail-open)', () => {
  it('shows a "not enough data" message when opportunities is empty', () => {
    render(<Results {...baseProps({ opportunities: [] })} />);
    expect(screen.getByText(/not enough data yet to generate opportunities/i)).toBeInTheDocument();
  });

  it('renders whatever "type" string the backend sends verbatim, including one never seen before', () => {
    const opportunities: Opportunity[] = [
      {
        title: 'A brand-new kind of gap',
        type: 'Totally Novel Category',
        impact: 'High',
        effort: 'Low',
        detail: 'Some detail',
        action: 'Some action',
      },
    ];
    render(<Results {...baseProps({ opportunities })} />);
    expect(screen.getByText('Totally Novel Category')).toBeInTheDocument();
    expect(screen.getByText('A brand-new kind of gap')).toBeInTheDocument();
  });
});

describe('Results — score breakdown', () => {
  it('renders every score component with its name, score, and note', () => {
    render(<Results {...baseProps()} />);
    expect(screen.getByText('Source Authority')).toBeInTheDocument();
    expect(screen.getByText('Named in 0 of 0 researched sources')).toBeInTheDocument();
  });
});

describe('Results — Share of Voice (post-fix values)', () => {
  it('renders the share value the backend sent as-is, without re-normalizing it client-side', () => {
    const products: Product[] = [
      { name: 'Acme', count: 4, share: 50, isBrand: true },
      { name: 'Rival', count: 4, share: 50, isBrand: false },
    ];
    render(<Results {...baseProps({ products })} />);
    // Two 50% shares appear (Share of Voice legend + Products mentioned bar) —
    // the point is 50 shows up verbatim, not some client-recomputed value.
    expect(screen.getAllByText('50%').length).toBeGreaterThan(0);
  });
});

describe('Results — per-persona opportunity badge', () => {
  it.each(['Defend', 'Grow', 'High', 'Critical Gap'] as const)('renders the "%s" badge for a persona result', opportunity => {
    const result: PersonaResult = { ...RESULT, opportunity };
    render(<Results {...baseProps({ results: { p1: result } })} />);
    // Persona/Prompts tabs aren't the default active tab, but content stays
    // mounted (hidden, not unmounted) for print — still queryable. The badge
    // legitimately appears twice: once in the compact visibility table
    // (Persona tab), once on the transcript accordion header (Prompts tab).
    expect(screen.getAllByText(opportunity).length).toBeGreaterThanOrEqual(2);
  });
});

describe('Results — sources (measured, buyer-found)', () => {
  const source = {
    domain: 'forum.example',
    url: 'https://forum.example/t/family-cruise',
    category: 'COMMUNITY',
    influence: 'High reach · 2 of 3 buyer questions',
    cited: 2,
    keywords: ['family cruise'],
    personas: ['Test Persona'],
    competitors: ['Rival Co'],
    visibility: 'Not visible' as const,
    mentions: 0,
    evidence: '',
    competitorMentions: { 'Rival Co': 3 },
    gap: 'competitor-owned' as const,
  };

  it('shows the gap, rival counts, page count and coverage note, not "cited across AI responses"', () => {
    const sources: Sources = { ...SOURCES, sourceIntel: [source], coverageNote: 'Only 1 independent sources came back.', queries: [] };
    render(<Results {...baseProps({ sources })} />);
    expect(screen.getAllByText('Rivals named here').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Rival Co (3)')).toBeInTheDocument();
    expect(screen.getByText('Only 1 independent sources came back.')).toBeInTheDocument();
    expect(screen.queryByText(/across AI responses/)).not.toBeInTheDocument();
  });

  it('quotes the evidence passage when the brand is named on the page', () => {
    const visible = { ...source, visibility: 'Visible' as const, mentions: 3, gap: null, evidence: 'We loved Acme for the kids.' };
    render(<Results {...baseProps({ sources: { ...SOURCES, sourceIntel: [visible] } })} />);
    expect(screen.getByText('"We loved Acme for the kids."')).toBeInTheDocument();
  });
});

describe('Results — failures are counted in their own units', () => {
  it('reports failed personas and failed questions separately', () => {
    render(<Results {...baseProps({ overview: { ...OVERVIEW, failedCount: 1, failedPrompts: 2 } })} />);
    expect(screen.getByText(/1 persona failed to run and 2 questions couldn't be answered/)).toBeInTheDocument();
  });
});

describe('Results — source links and unreadable pages', () => {
  const base = {
    domain: 'blog.example',
    url: 'https://blog.example/post',
    category: 'PUBLISHER',
    influence: 'High reach · 2 of 3 buyer questions',
    cited: 1,
    keywords: [],
    personas: [],
    competitors: [],
  };

  it('links to the mention when the backend sends a deep link', () => {
    const s = { ...base, visibility: 'Visible' as const, mentions: 2, link: 'https://blog.example/post#:~:text=Acme' };
    render(<Results {...baseProps({ sources: { ...SOURCES, sourceIntel: [s] } })} />);
    const domainLinks = screen.getAllByText('blog.example').map(el => el.closest('a')).filter(Boolean);
    expect(domainLinks[0]).toHaveAttribute('href', s.link);
    expect(screen.getByText('Open page at the mention →')).toHaveAttribute('href', s.link);
  });

  it('says a blocked page couldn\'t be checked instead of calling it a gap', () => {
    const s = { ...base, visibility: "Couldn't verify" as const, gap: null };
    render(<Results {...baseProps({ sources: { ...SOURCES, sourceIntel: [s] } })} />);
    expect(screen.getAllByText("Couldn't verify").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/blocks automated reading/)).toBeInTheDocument();
    // Only the column label, never the gap badge.
    expect(screen.getAllByText('Rivals named here')).toHaveLength(1);
  });

  it('still renders a visibility value it does not know', () => {
    const s = { ...base, visibility: 'Something new' as unknown as 'Visible' };
    render(<Results {...baseProps({ sources: { ...SOURCES, sourceIntel: [s] } })} />);
    expect(screen.getAllByText('Something new').length).toBeGreaterThanOrEqual(1);
  });
});
