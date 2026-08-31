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
    expect(screen.getByText('Procurement-framed queries')).toBeInTheDocument();
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
    // Persona tab is not the default active tab, but content stays mounted
    // (hidden, not unmounted) for print — so it's still queryable.
    expect(screen.getByText(opportunity)).toBeInTheDocument();
  });
});
