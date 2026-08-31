import { Fragment, useState } from 'react';
import type { Competitor, Persona, PersonaResult, Product, Overview, Sources, Sentiment } from '../types';
import { buildReportCsv, downloadCsv } from '../csv';

interface ResultsProps {
  brand: string;
  industry: string;
  personas: Persona[];
  competitors: Competitor[];
  results: Record<string, PersonaResult>;
  overview: Overview;
  products: Product[];
  sources: Sources;
  onGoHome: () => void;
}

const ACCENT = '#2D6AE0';
const SENTIMENT_COLOR: Record<Sentiment, string> = { Positive: '#1E9E6A', Neutral: '#8A8A8A', Negative: '#D2603F' };

// Mirrors app/services/scoring.py's compute_visibility_score exactly, so we
// can tell whether the persona's vis score is explained by its own
// rank+sentiment (single-prompt personas, or ones where every prompt agreed)
// or is an average across multiple prompts asked for that persona — the
// backend only returns one representative rank/sentiment/quote per persona,
// not a breakdown per prompt, so the average case can't be reconstructed
// exactly and has to be described as an average rather than faked as a formula.
const RANK_STEP = 20;
const SENTIMENT_MULTIPLIER: Record<Sentiment, number> = { Positive: 1.0, Neutral: 0.7, Negative: 0.35 };

function rankScore(rank: number): number {
  return Math.max(0, 100 - (rank - 1) * RANK_STEP);
}

function visibilityBreakdown(r: PersonaResult): string {
  if (!r.mentioned || r.rank === null) {
    return 'Not mentioned in the response — score is 0.';
  }
  const base = rankScore(r.rank);
  const multiplier = SENTIMENT_MULTIPLIER[r.sentiment];
  const computed = Math.max(0, Math.min(100, Math.round(base * multiplier)));
  const position = `Mentioned at position ${r.rank}`;
  if (computed === r.vis) {
    return `${position} · ${r.sentiment} sentiment (${base} rank points × ${multiplier} for ${r.sentiment.toLowerCase()} = ${computed}).`;
  }
  return `${position} in its representative prompt · ${r.sentiment} sentiment — this persona was asked more than once, so ${r.vis} is the average visibility across all of its prompts, not just this one.`;
}

function hexA(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Same 3-color semantic palette already used for sentiment elsewhere in this
// report (green/blue/red-orange), so a low score reads as "needs work"
// without needing a legend to explain a new color.
function visibilityTierColor(score: number): string {
  if (score >= 70) return '#1E9E6A';
  if (score >= 40) return ACCENT;
  return '#D2603F';
}

function visibilityTierMessage(score: number): string {
  if (score >= 70) return 'Solid presence across most personas';
  if (score >= 40) return 'Mixed presence across personas';
  return 'Limited presence across personas';
}

function VisibilityRing({ score }: { score: number }) {
  const r = 50;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = visibilityTierColor(score);
  return (
    <svg width="92" height="92" viewBox="0 0 120 120" className="flex-shrink-0">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#EEEEEE" strokeWidth="11" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 60 60)" />
      <text x="60" y="58" textAnchor="middle" fontSize="32" fontWeight="700" fill={color}>{score}</text>
      <text x="60" y="78" textAnchor="middle" fontSize="13" fill="#A0A0A0">/100</text>
    </svg>
  );
}

function HeatmapChart({ personas, results }: { personas: Persona[]; results: Record<string, PersonaResult> }) {
  const selected = personas.filter(p => p.selected);
  const cols = ['Visibility', 'Sentiment', 'Rank', 'Presence'];

  const cellColor = (v: number): [string, string] => {
    if (v >= 75) return [ACCENT, '#fff'];
    if (v >= 60) return [hexA(ACCENT, 0.62), '#fff'];
    if (v >= 45) return [hexA(ACCENT, 0.40), '#214a8c'];
    if (v >= 20) return [hexA(ACCENT, 0.18), '#33507f'];
    return ['#F1F1F1', '#B0B0B0'];
  };
  const sentimentScore = (s: string) => s === 'Positive' ? 88 : s === 'Neutral' ? 55 : 28;
  const rankScore = (r: number | null) => !r ? 10 : r === 1 ? 92 : r === 2 ? 76 : r === 3 ? 55 : 35;

  return (
    <div className="overflow-x-auto">
      <div className="grid gap-0 items-center" style={{ gridTemplateColumns: '150px repeat(4, 1fr)', minWidth: 520 }}>
        <div />
        {cols.map(c => (
          <div key={c} className="text-center text-[10px] text-[#9A9A9A] font-bold tracking-[0.05em] uppercase pb-2.5">{c}</div>
        ))}
        {selected.map(p => {
          const r = results[p.id];
          const mentioned = !!r?.mentioned;
          const vals = [mentioned ? (r?.vis ?? 0) : 0, mentioned ? sentimentScore(r!.sentiment) : 8, mentioned ? rankScore(r!.rank) : 8, mentioned ? 90 : 10];
          const labels: (string | number)[] = [mentioned ? (r?.vis ?? 0) : '–', mentioned ? r!.sentiment[0] : '–', mentioned ? `#${r!.rank}` : '–', mentioned ? 'Yes' : 'No'];
          return (
            <Fragment key={p.id}>
              <div className="text-[12.5px] text-[#444] pr-3.5 whitespace-nowrap overflow-hidden text-ellipsis">{p.title}</div>
              {vals.map((v, ci) => {
                const [bg, fg] = cellColor(v);
                return (
                  <div key={ci} className="rounded-[9px] h-10 flex items-center justify-center text-xs font-semibold m-[3px]" style={{ background: bg, color: fg }}>
                    {labels[ci]}
                  </div>
                );
              })}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function CompetitorBarChart({ products }: { products: Product[] }) {
  const data = products.slice(0, 5);
  const W = 560, H = 250, padT = 26, padB = 44, x0 = 26;
  const max = Math.max(1, ...data.map(d => d.count));
  const innerW = W - x0 - 20, bw = 60, gap = data.length > 1 ? (innerW - data.length * bw) / (data.length - 1) : 0, chartH = H - padT - padB;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * max));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, display: 'block' }}>
      {ticks.map((g, i) => {
        const y = padT + chartH - (g / max) * chartH;
        return (
          <g key={i}>
            <line x1={x0} y1={y} x2={W - 20} y2={y} stroke="#EDEDED" />
            <text x={x0 - 6} y={y + 3} fontSize="10" fill="#BBB" textAnchor="end">{g}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const bh = (d.count / max) * chartH, x = x0 + i * (bw + gap), y = padT + chartH - bh;
        return (
          <g key={d.name}>
            <rect x={x} y={y} width={bw} height={bh} rx={8} fill={d.isBrand ? ACCENT : '#D7DEE9'} />
            <text x={x + bw / 2} y={y - 9} fontSize="13" fontWeight="700" fill={d.isBrand ? ACCENT : '#9A9A9A'} textAnchor="middle">{d.count}</text>
            <text x={x + bw / 2} y={H - padB + 22} fontSize="11.5" fill={d.isBrand ? '#1b1b1b' : '#888'} fontWeight={d.isBrand ? 700 : 500} textAnchor="middle">{d.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ShareOfVoiceChart({ products }: { products: Product[] }) {
  const grays = ['#D7DEE9', '#C7D0DE', '#B7C2D3', '#A7B4C8', '#97A6BD'];
  let gi = 0;
  const colored = products.map(d => ({ ...d, color: d.isBrand ? ACCENT : grays[gi++ % grays.length] }));
  const S = 200, c = S / 2, r = 78, rw = 26;
  let acc = -90;
  const brandShare = colored.find(d => d.isBrand)?.share ?? 0;

  const arcs = colored.filter(d => d.share > 0).map(d => {
    const a0 = acc, a1 = acc + (d.share / 100) * 360;
    acc = a1;
    const large = a1 - a0 > 180 ? 1 : 0;
    const p0 = [c + r * Math.cos(a0 * Math.PI / 180), c + r * Math.sin(a0 * Math.PI / 180)];
    const p1 = [c + r * Math.cos(a1 * Math.PI / 180), c + r * Math.sin(a1 * Math.PI / 180)];
    const path = `M${p0[0]} ${p0[1]} A${r} ${r} 0 ${large} 1 ${p1[0]} ${p1[1]}`;
    return <path key={d.name} d={path} fill="none" stroke={d.color} strokeWidth={rw} />;
  });

  return (
    <div className="flex gap-7 items-center flex-wrap">
      <svg viewBox={`0 0 ${S} ${S}`} width={S} height={S} className="flex-shrink-0">
        {arcs}
        <text x={c} y={c - 4} textAnchor="middle" fontSize="26" fontWeight="700" fill="#1b1b1b">{brandShare}%</text>
        <text x={c} y={c + 17} textAnchor="middle" fontSize="11" fill="#999">your share</text>
      </svg>
      <div className="flex flex-col gap-2.5 flex-1 min-w-[160px]">
        {colored.map(d => (
          <div key={d.name} className="flex items-center gap-2.5">
            <div className="w-[11px] h-[11px] rounded-[3px] flex-shrink-0" style={{ background: d.color }} />
            <div className="text-[13.5px] flex-1" style={{ color: d.isBrand ? '#1b1b1b' : '#555', fontWeight: d.isBrand ? 700 : 500 }}>{d.name}</div>
            <div className="text-[13.5px] font-bold" style={{ color: d.isBrand ? ACCENT : '#999' }}>{d.share}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsMentioned({ products }: { products: Product[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {products.map(p => (
        <div key={p.name} className="flex items-center gap-3">
          <div className="w-[120px] text-[13.5px] text-[#333] whitespace-nowrap overflow-hidden text-ellipsis flex-shrink-0" style={{ fontWeight: p.isBrand ? 700 : 500 }}>{p.name}</div>
          <div className="flex-1 h-[9px] bg-[#F2F2F2] rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${p.share}%`, background: ACCENT }} />
          </div>
          <div className="w-[22px] text-right text-[13px] font-bold text-[#555]">{p.count}</div>
        </div>
      ))}
    </div>
  );
}

function RadarChart() {
  const categories: [string, number][] = [['Technical', 80], ['Business', 74], ['Enterprise', 66], ['Ease of Use', 78], ['Pricing', 58], ['Support', 64]];
  const n = categories.length;
  const cx = 110, cy = 110, r = 80;

  const toXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
  });

  const rings = [0.25, 0.5, 0.75, 1];
  const angles = categories.map((_, i) => (i * 2 * Math.PI) / n);

  const dataPoints = categories.map((cat, i) => toXY(angles[i], (cat[1] / 100) * r));
  const polyPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox="0 0 220 220" className="w-full max-w-[220px] mx-auto block">
      {rings.map(ring => (
        <polygon
          key={ring}
          points={angles.map(a => toXY(a, r * ring)).map(p => `${p.x},${p.y}`).join(' ')}
          fill="none" stroke="#ECECEC" strokeWidth="1"
        />
      ))}
      {angles.map((a, i) => {
        const end = toXY(a, r);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="#ECECEC" strokeWidth="1" />;
      })}
      <polygon points={polyPoints} fill="rgba(45,106,224,0.12)" stroke="#2D6AE0" strokeWidth="2" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#2D6AE0" />
      ))}
      {categories.map((cat, i) => {
        const pos = toXY(angles[i], r + 18);
        return (
          <text key={cat[0]} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#888" fontFamily="sans-serif">
            {cat[0]}
          </text>
        );
      })}
    </svg>
  );
}

// ── Mock data for sections the backend doesn't compute yet ─────────────────
// Everything below this line is placeholder content clearly labeled in the
// UI as illustrative, standing in for real backend work (attribute
// extraction, source-influence classification, opportunity synthesis) that
// hasn't been built. Swap for real data once those endpoints exist — see the
// three backend specs already drafted for this (categories/prompts-suggest
// were built; competitor attributes, enriched sources, and opportunities are
// still pending).

const MOCK_COMPETITOR_WINS = ['Enterprise integrations', 'Broader review-site presence', 'Longer market history', 'Wider distribution footprint'];
const MOCK_BRAND_WINS = ['Ease of use', 'Pricing clarity', 'More specific fit for your category', 'Faster, more direct AI answers'];
const MOCK_VISIBILITY_GAPS = ['Head-to-head comparison questions', 'Procurement/buying-criteria framed queries', 'Budget-conscious queries'];

function CompetitorAttributes({ topCompetitor }: { topCompetitor: string | null }) {
  return (
    <div className="bg-white border border-[#ECECEC] rounded-[16px] px-[26px] py-6 mb-4 break-inside-avoid">
      <div className="text-[15px] font-semibold mb-1">Why competitors outperform you</div>
      <div className="text-[13px] text-[#999] mb-[18px]">Attributes AI models attach to each brand when recommending options. Illustrative — not yet computed from live data.</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#FBEDE8] rounded-[13px] px-5 py-4">
          <div className="text-[13.5px] font-bold text-[#C2543A] mb-2.5">{topCompetitor ?? 'Competitors'} win{topCompetitor ? 's' : ''} on</div>
          <div className="flex flex-col gap-1.5">
            {MOCK_COMPETITOR_WINS.map(w => <div key={w} className="text-[13.5px] text-[#555]">{w}</div>)}
          </div>
        </div>
        <div className="bg-[#E8F6EF] rounded-[13px] px-5 py-4">
          <div className="text-[13.5px] font-bold text-[#1E9E6A] mb-2.5">Your brand wins on</div>
          <div className="flex flex-col gap-1.5">
            {MOCK_BRAND_WINS.map(w => <div key={w} className="text-[13.5px] text-[#555]">{w}</div>)}
          </div>
        </div>
        <div className="bg-[#F4F4F4] rounded-[13px] px-5 py-4">
          <div className="text-[13.5px] font-bold text-[#666] mb-2.5">Your biggest visibility gaps</div>
          <div className="flex flex-col gap-1.5">
            {MOCK_VISIBILITY_GAPS.map(w => <div key={w} className="text-[13.5px] text-[#555]">{w}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

const MOCK_KEYWORDS_POOL = [
  ['best options', 'top picks', 'comparison'],
  ['pricing', 'free alternatives', 'cost comparison'],
  ['reviews', 'ratings', 'user experience'],
  ['alternatives', 'switching from', 'vs competitors'],
];
const MOCK_RESONATES_POOL = ['Enterprise buyers', 'SMB owners', 'Budget-conscious buyers', 'Researchers/consultants', 'Early adopters'];
const MOCK_VISIBILITY_TAGS = [
  { label: 'Visible', color: '#1E9E6A', bg: '#E8F6EF' },
  { label: 'Weak visibility', color: '#B8862F', bg: '#FBF2E2' },
  { label: 'Not visible', color: '#C2543A', bg: '#FBEDE8' },
];

// Influence tier is derived from the real mention count on each source —
// only the label wording differs by source kind. Keywords/resonance/your-
// visibility columns have no backing data yet, so they cycle a fixed mock
// pool rather than claim a real per-source classification.
function influenceTierFor(count: number, hasCommunity: boolean): string {
  const noun = hasCommunity ? 'community' : 'AI';
  if (count >= 4) return `High ${noun} influence`;
  if (count >= 2) return `Medium ${noun} influence`;
  return `Low ${noun} influence`;
}

interface SourceRow {
  name: string;
  types: string[];
  count: number;
  hasCommunity: boolean;
}

// The same domain can legitimately appear in more than one of the backend's
// three source lists (e.g. both cited as a review site and tracked as a
// publisher) — merging by name avoids that showing up as duplicate rows for
// the same source.
function buildSourceRows(sources: Sources): SourceRow[] {
  const byName = new Map<string, SourceRow>();
  const upsert = (name: string, type: string, count: number, isCommunity: boolean) => {
    const existing = byName.get(name);
    if (existing) {
      if (!existing.types.includes(type)) existing.types.push(type);
      existing.count += count;
      existing.hasCommunity = existing.hasCommunity || isCommunity;
    } else {
      byName.set(name, { name, types: [type], count, hasCommunity: isCommunity });
    }
  };
  sources.citations.forEach(c => upsert(c.domain, 'Review', c.count, false));
  sources.publishers.forEach(p => upsert(p.name, p.type, p.mentions, false));
  sources.communities.forEach(cm => upsert(cm.name, cm.platform, cm.mentions, true));
  return [...byName.values()].sort((a, b) => b.count - a.count);
}

function EnrichedSourcesTable({ sources }: { sources: Sources }) {
  const rows = buildSourceRows(sources);

  if (rows.length === 0) {
    return <div className="bg-white border border-[#ECECEC] rounded-[16px] px-6 py-[22px] text-[13.5px] text-[#999]">No sources found for this report.</div>;
  }

  return (
    <div className="bg-white border border-[#ECECEC] rounded-[16px] overflow-hidden break-inside-avoid">
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[1.3fr_1.1fr_1.4fr_1.2fr_1fr] gap-3 px-6 py-3 text-[11px] text-[#9A9A9A] font-bold tracking-[0.05em] uppercase border-b border-[#F0F0F0]">
            <span>Source</span><span>Influence</span><span>Keywords mentioned</span><span>Resonates with</span><span>Your visibility</span>
          </div>
          {rows.map((row, i) => {
            const tag = MOCK_VISIBILITY_TAGS[i % MOCK_VISIBILITY_TAGS.length];
            const keywords = MOCK_KEYWORDS_POOL[i % MOCK_KEYWORDS_POOL.length];
            const resonates = [MOCK_RESONATES_POOL[i % MOCK_RESONATES_POOL.length], MOCK_RESONATES_POOL[(i + 1) % MOCK_RESONATES_POOL.length]];
            return (
              <div key={row.name} className="grid grid-cols-[1.3fr_1.1fr_1.4fr_1.2fr_1fr] gap-3 px-6 py-3.5 border-b border-[#F6F6F6] items-start">
                <div>
                  <div className="text-[13.5px] font-semibold text-[#1b1b1b]">{row.name}</div>
                  <div className="text-[11px] text-[#999] uppercase tracking-[0.03em] mt-0.5">{row.types.join(' + ')}</div>
                </div>
                <div className="text-[12.5px] text-[#666] pt-0.5">{influenceTierFor(row.count, row.hasCommunity)}</div>
                <div className="text-[12.5px] text-[#666] pt-0.5">{keywords.join(', ')}</div>
                <div className="text-[12.5px] text-[#666] pt-0.5">{resonates.join(', ')}</div>
                <div className="pt-0.5">
                  <span className="text-[11.5px] font-semibold rounded-full px-[10px] py-[3px] whitespace-nowrap" style={{ color: tag.color, background: tag.bg }}>{tag.label}</span>
                  <span className="text-[11px] text-[#AAA] ml-1.5">{row.count}×</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="px-6 py-2.5 text-[11.5px] text-[#AAA] bg-[#FAFAFA] border-t border-[#F0F0F0]">Source names and mention counts are real. Keywords, resonance, and per-source visibility are illustrative — pending backend support.</div>
    </div>
  );
}

interface Opportunity {
  tag: 'Critical gap' | 'Source gap' | 'Competitive';
  title: string;
  description: string;
  doThis: string;
  impact: 'High' | 'Medium' | 'Low';
  effort: 'High' | 'Medium' | 'Low';
}

const OPPORTUNITY_TAG_STYLE: Record<Opportunity['tag'], { color: string; bg: string }> = {
  'Critical gap': { color: '#C2543A', bg: '#FBEDE8' },
  'Source gap': { color: '#B8862F', bg: '#FBF2E2' },
  'Competitive': { color: '#2D6AE0', bg: '#EEF3FE' },
};

// Titles/descriptions below use this report's real numbers wherever they're
// available (mention counts, top competitor, top-cited domain, sentiment).
// The "do this" recommendations themselves are generic placeholder copy —
// pending the actual synthesis/recommendation pass on the backend.
function buildOpportunities(overview: Overview, products: Product[], sources: Sources, brand: string): Opportunity[] {
  const items: Opportunity[] = [];
  const topCitation = sources.citations[0];

  if (overview.total > 0 && overview.mentionRate < 0.5) {
    items.push({
      tag: 'Critical gap',
      title: 'Most persona queries never surface you',
      description: `${brand} was mentioned in only ${overview.mentioned} of ${overview.total} persona queries.`,
      doThis: 'Publish content that directly answers the kinds of questions these personas asked, and pursue placement on the sources AI cites most in this category.',
      impact: 'High',
      effort: 'Medium',
    });
  }

  if (overview.topCompetitor) {
    const competitorProduct = products.find(p => p.name === overview.topCompetitor);
    const brandProduct = products.find(p => p.isBrand);
    items.push({
      tag: 'Competitive',
      title: `${overview.topCompetitor} outperforms you in AI answers`,
      description: `Mentioned in ${competitorProduct?.count ?? 0} of ${overview.total} queries vs. your ${brandProduct?.count ?? 0}.`,
      doThis: `Identify what AI associates with ${overview.topCompetitor} in this category and close the gap in your own content and reviews.`,
      impact: 'High',
      effort: 'Medium',
    });
  }

  if (topCitation) {
    items.push({
      tag: 'Source gap',
      title: `${topCitation.domain} shapes recommendations in your category`,
      description: `Cited ${topCitation.count}× across the AI responses in this report.`,
      doThis: `Make sure ${brand} has an accurate, complete presence on ${topCitation.domain}.`,
      impact: 'Medium',
      effort: 'Low',
    });
  }

  if (overview.avgSentiment !== 'Positive' && overview.mentioned > 0) {
    items.push({
      tag: 'Critical gap',
      title: "Sentiment toward your brand isn't consistently positive",
      description: `Average sentiment across responses that mentioned you is ${overview.avgSentiment}.`,
      doThis: 'Address the specific concerns or gaps showing up in the AI-generated answers about your brand.',
      impact: 'Medium',
      effort: 'Medium',
    });
  }

  if (items.length === 0) {
    items.push({
      tag: 'Competitive',
      title: 'Strong baseline visibility',
      description: `${brand} already shows up consistently across the personas tested.`,
      doThis: 'Maintain current content and monitor for shifts as competitors publish new material.',
      impact: 'Low',
      effort: 'Low',
    });
  }

  return items;
}

function OpportunityCard({ item }: { item: Opportunity }) {
  const tagStyle = OPPORTUNITY_TAG_STYLE[item.tag];
  return (
    <div className="bg-white border border-[#ECECEC] rounded-[15px] px-6 py-5 break-inside-avoid">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-[0.04em] rounded-full px-[10px] py-1 whitespace-nowrap" style={{ color: tagStyle.color, background: tagStyle.bg }}>{item.tag}</span>
          <span className="text-[15.5px] font-bold text-[#1b1b1b]">{item.title}</span>
        </div>
        <div className="text-[12px] text-[#999] whitespace-nowrap">Impact <strong className="text-[#555]">{item.impact}</strong> · Effort <strong className="text-[#555]">{item.effort}</strong></div>
      </div>
      <div className="text-[13.5px] text-[#666] mt-2.5 leading-relaxed">{item.description}</div>
      <div className="text-[13px] text-[#444] mt-3 pt-3 border-t border-[#F2F2F2] leading-relaxed"><span className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#999] mr-1.5">Do this</span>{item.doThis}</div>
    </div>
  );
}

function PromptsTable({ personas, results }: { personas: Persona[]; results: Record<string, PersonaResult> }) {
  const rows = personas.filter(p => p.selected).flatMap(p => {
    const r = results[p.id];
    if (!r) return [];
    return r.exchanges.map((ex, i) => ({ key: `${p.id}-${i}`, personaTitle: p.title, ex }));
  });

  return (
    <div className="bg-white border border-[#ECECEC] rounded-[16px] overflow-hidden break-inside-avoid">
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[1fr_2.5fr_0.8fr_0.8fr_0.8fr] gap-3 px-6 py-3 text-[11px] text-[#9A9A9A] font-bold tracking-[0.05em] uppercase border-b border-[#F0F0F0]">
            <span>Persona</span><span>Prompt</span><span>Mentioned</span><span>Sentiment</span><span>Visibility</span>
          </div>
          {rows.map(row => (
            <div key={row.key} className="grid grid-cols-[1fr_2.5fr_0.8fr_0.8fr_0.8fr] gap-3 px-6 py-3.5 border-b border-[#F6F6F6] items-start">
              <span className="text-[13px] text-[#444] font-medium">{row.personaTitle}</span>
              <span className="text-[13px] text-[#555] leading-snug">{row.ex.prompt}</span>
              <span className={`text-[13px] ${row.ex.mentioned ? 'text-[#2D6AE0] font-semibold' : 'text-[#A0A0A0]'}`}>{row.ex.mentioned ? 'Yes' : 'No'}</span>
              <span className="text-[13px] font-medium" style={{ color: SENTIMENT_COLOR[row.ex.sentiment] }}>{row.ex.sentiment}</span>
              <span className="text-[13px] font-semibold text-[#333]">{row.ex.vis}/100</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'persona', label: 'Persona' },
  { id: 'competitors', label: 'Competitors' },
  { id: 'prompts', label: 'Prompts' },
  { id: 'sources', label: 'Sources' },
  { id: 'opportunities', label: 'Opportunities' },
] as const;
type TabId = typeof TABS[number]['id'];

function TabBar({ tab, onTab }: { tab: TabId; onTab: (t: TabId) => void }) {
  return (
    <div className="flex items-center gap-1 border-b border-[#ECECEC] mb-7 overflow-x-auto print:hidden">
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => onTab(t.id)}
          className={`px-4 py-3 text-[13.5px] font-semibold whitespace-nowrap border-b-2 -mb-px bg-transparent border-x-0 border-t-0 cursor-pointer transition-colors ${tab === t.id ? 'border-[#2D6AE0] text-[#2D6AE0]' : 'border-transparent text-[#888] hover:text-[#444]'}`}
        >
          {t.label}
        </button>
      ))}
      <div className="relative group ml-1">
        <span className="inline-block px-4 py-3 text-[13.5px] font-semibold text-[#B0B0B0] cursor-not-allowed whitespace-nowrap">Actions</span>
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap rounded-[8px] bg-[#1b1b1b] px-3 py-1.5 text-[12px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 z-10">
          Coming soon
        </div>
      </div>
    </div>
  );
}

// Tab sections stay mounted (`hidden` rather than unmounted) and each
// unhides for print, so "Export PDF" still captures the full report in one
// pass regardless of which tab was open on screen — same technique already
// used for the per-persona accordion below.
function TabPanel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <div className={active ? '' : 'hidden print:block'}>{children}</div>;
}

export function Results({ brand, industry, personas, results, overview, products, sources, onGoHome }: ResultsProps) {
  const selected = personas.filter(p => p.selected);
  const [openResult, setOpenResult] = useState<string | null>(selected[0]?.id ?? null);
  const [tab, setTab] = useState<TabId>('overview');
  const positiveCount = selected.filter(p => results[p.id]?.sentiment === 'Positive').length;
  const neutralCount = selected.filter(p => results[p.id]?.sentiment === 'Neutral').length;
  const negativeCount = selected.filter(p => results[p.id]?.sentiment === 'Negative').length;
  const topCompetitorCount = overview.topCompetitor ? products.find(p => p.name === overview.topCompetitor)?.count ?? 0 : 0;
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const opportunities = buildOpportunities(overview, products, sources, brand);

  return (
    <div className="max-w-[1080px] mx-auto px-4 sm:px-7 py-10 pb-[110px] animate-fadeUp">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-7">
        <div>
          <div className="text-[13px] text-[#999] font-semibold tracking-[0.03em]">RESULTS · {today}</div>
          <h2 className="text-[32px] tracking-[-0.02em] font-bold mt-1.5 mb-0">{brand}</h2>
          <div className="text-[14.5px] text-[#888] mt-[3px]">{industry} · {selected.length} personas · Claude</div>
        </div>
        <div className="flex gap-2.5 flex-wrap print:hidden">
          <button onClick={() => window.print()} className="bg-white border border-[#DADADA] text-[#444] rounded-[10px] px-4 py-2.5 text-[13.5px] font-semibold cursor-pointer hover:bg-[#F8F8F8]">Export PDF</button>
          <button
            onClick={() => downloadCsv(`${brand.toLowerCase().replace(/\s+/g, '-')}-hearsay-report.csv`, buildReportCsv({ brand, industry, overview, products, personas, results }))}
            className="bg-white border border-[#DADADA] text-[#444] rounded-[10px] px-4 py-2.5 text-[13.5px] font-semibold cursor-pointer hover:bg-[#F8F8F8]"
          >
            Export CSV
          </button>
          <div className="relative group">
            <button disabled className="bg-white border border-[#DADADA] text-[#444] rounded-[10px] px-4 py-2.5 text-[13.5px] font-semibold opacity-50 cursor-not-allowed">Share</button>
            <div className="pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-[8px] bg-[#1b1b1b] px-3 py-1.5 text-[12px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 z-10">
              Coming soon
            </div>
          </div>
          <button onClick={onGoHome} className="bg-white border border-[#DADADA] text-[#444] rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-semibold cursor-pointer hover:bg-[#F8F8F8]">Re-run</button>
          <div className="relative group">
            <button disabled className="bg-[#2D6AE0] text-white border-none rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-semibold opacity-50 cursor-not-allowed">Build AI Influence Sitelist →</button>
            <div className="pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-[8px] bg-[#1b1b1b] px-3 py-1.5 text-[12px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 z-10">
              Coming soon
            </div>
          </div>
        </div>
      </div>

      {overview.failedCount > 0 && (
        <div className="bg-[#FBEDE8] border border-[#F0D2C4] rounded-[12px] px-[18px] py-3 text-[13.5px] text-[#8a4530] mb-7">
          {overview.failedCount} of {overview.failedCount + overview.total} persona {overview.failedCount === 1 ? 'query' : 'queries'} failed to run and {overview.failedCount === 1 ? "isn't" : "aren't"} reflected below.
        </div>
      )}

      <TabBar tab={tab} onTab={setTab} />

      {/* Overview */}
      <TabPanel active={tab === 'overview'}>
        <h3 className="hidden print:block text-[19px] font-bold tracking-[-0.01em] mb-[14px] break-after-avoid">Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-9">
          <div className="bg-white border border-[#ECECEC] rounded-[16px] p-[22px] flex items-center gap-4 break-inside-avoid">
            <VisibilityRing score={overview.visibilityScore} />
            <div>
              <div className="text-[12.5px] text-[#999] font-semibold uppercase tracking-[0.03em]">Visibility Score</div>
              <div className="text-[13.5px] text-[#666] mt-1.5 leading-snug">{visibilityTierMessage(overview.visibilityScore)}</div>
            </div>
          </div>
          <div className="bg-white border border-[#ECECEC] rounded-[16px] p-[22px] break-inside-avoid">
            <div className="text-[12.5px] text-[#999] font-semibold uppercase tracking-[0.03em]">Mention Rate</div>
            <div className="text-[38px] font-bold tracking-[-0.02em] mt-2.5">{overview.mentioned}<span className="text-[#C8C8C8] text-[26px]"> / {overview.total}</span></div>
            <div className="text-[13px] text-[#888] mt-1">persona queries mentioned you</div>
          </div>
          <div className="bg-white border border-[#ECECEC] rounded-[16px] p-[22px] break-inside-avoid">
            <div className="text-[12.5px] text-[#999] font-semibold uppercase tracking-[0.03em]">Avg. Sentiment</div>
            <div className="flex items-center gap-[9px] mt-[14px]">
              <div className="w-3 h-3 rounded-full" style={{ background: SENTIMENT_COLOR[overview.avgSentiment] }} />
              <span className="text-2xl font-bold">{overview.avgSentiment}</span>
            </div>
            <div className="text-[13px] text-[#888] mt-2">{positiveCount} positive · {neutralCount} neutral · {negativeCount} negative</div>
          </div>
          <div className="bg-white border border-[#ECECEC] rounded-[16px] p-[22px] break-inside-avoid">
            <div className="text-[12.5px] text-[#999] font-semibold uppercase tracking-[0.03em]">Top Competitor</div>
            <div className="text-[26px] font-bold mt-3">{overview.topCompetitor ?? '—'}</div>
            <div className="text-[13px] text-[#888] mt-1.5">{overview.topCompetitor ? `mentioned in ${topCompetitorCount} queries` : 'no competitor surfaced'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.1fr] gap-4 mb-4">
          <div className="bg-white border border-[#ECECEC] rounded-[16px] px-[26px] py-6 break-inside-avoid">
            <div className="text-[15px] font-semibold mb-1">Share of Voice</div>
            <div className="text-[13px] text-[#999] mb-[18px]">Your brand's share of all product mentions across responses</div>
            <ShareOfVoiceChart products={products} />
          </div>
          <div className="bg-white border border-[#ECECEC] rounded-[16px] px-[26px] py-6 break-inside-avoid">
            <div className="text-[15px] font-semibold mb-1">Products mentioned</div>
            <div className="text-[13px] text-[#999] mb-4">Every brand AI responses surfaced, ranked by mention count</div>
            <ProductsMentioned products={products} />
          </div>
        </div>
      </TabPanel>

      {/* Persona */}
      <TabPanel active={tab === 'persona'}>
        <h3 className="text-[19px] font-bold tracking-[-0.01em] mb-[14px] break-after-avoid">Persona signal matrix</h3>
        <div className="bg-white border border-[#ECECEC] rounded-[16px] px-[26px] py-6 mb-9 break-inside-avoid">
          <div className="text-[13px] text-[#999] mb-[18px]">How each persona scored across the key dimensions</div>
          <HeatmapChart personas={personas} results={results} />
        </div>

        <h3 className="text-[19px] font-bold tracking-[-0.01em] mb-[14px] break-after-avoid">Personas analysed · prompts &amp; AI responses</h3>
        <div className="flex flex-col gap-2.5">
          {selected.map(p => {
            const r = results[p.id];
            if (!r) return null;
            const isOpen = openResult === p.id;

            return (
              <div key={p.id} className="bg-white border border-[#ECECEC] rounded-[15px] overflow-hidden break-inside-avoid">
                <div onClick={() => setOpenResult(isOpen ? null : p.id)} className="px-5 py-4 flex flex-wrap items-center gap-x-3 gap-y-2 cursor-pointer hover:bg-[#FAFBFD]">
                  <div className="w-[38px] h-[38px] rounded-[10px] bg-[#EEF3FE] text-[#2D6AE0] flex items-center justify-center text-[13px] font-bold flex-shrink-0">{p.initials}</div>
                  <div className="flex-1 min-w-[150px]">
                    <div className="text-[15px] font-semibold text-[#1b1b1b]">{p.title}</div>
                    <div className="text-[12.5px] text-[#999] mt-[1px] truncate">"{r.quote}"</div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.mentioned
                      ? <span className="text-[11.5px] font-semibold text-[#2D6AE0] bg-[#EEF3FE] rounded-full px-[11px] py-1 whitespace-nowrap">Mentioned</span>
                      : <span className="text-[11.5px] font-semibold text-[#A0A0A0] bg-[#F0F0F0] rounded-full px-[11px] py-1 whitespace-nowrap">Not mentioned</span>
                    }
                    {r.sentiment === 'Positive' && <span className="text-[11.5px] font-semibold text-[#1E9E6A] bg-[#E8F6EF] rounded-full px-[11px] py-1">Positive</span>}
                    {r.sentiment === 'Neutral' && <span className="text-[11.5px] font-semibold text-[#8A8A8A] bg-[#F0F0F0] rounded-full px-[11px] py-1">Neutral</span>}
                    {r.sentiment === 'Negative' && <span className="text-[11.5px] font-semibold text-[#D2603F] bg-[#FBEDE8] rounded-full px-[11px] py-1">Negative</span>}
                    <span className="text-[#999] text-sm print:hidden">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>
                {/* Always in the DOM so printing captures every persona's full Q&A, not just the one expanded on screen. */}
                <div className={`px-5 pb-5 border-t border-[#F2F2F2] ${isOpen ? '' : 'hidden'} print:block`}>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mt-4 text-[13px]">
                    <span className="font-semibold text-[#1b1b1b] flex-shrink-0">Visibility {r.vis}/100</span>
                    <span className="text-[#888] leading-relaxed">{visibilityBreakdown(r)}</span>
                  </div>
                  {r.exchanges.map((ex, i) => (
                    <div key={i} className={i === 0 ? 'mt-4' : 'mt-6 pt-6 border-t border-[#F2F2F2]'}>
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <div className="text-[12px] text-[#999] font-semibold uppercase tracking-[0.04em]">
                          {r.exchanges.length > 1 ? `Prompt ${i + 1} of ${r.exchanges.length}` : 'Prompt sent'}
                        </div>
                        <div className="text-[11.5px] text-[#999]">
                          {ex.mentioned ? <span className="text-[#2D6AE0] font-semibold">Mentioned</span> : 'Not mentioned'} · {ex.sentiment} · Visibility {ex.vis}/100
                        </div>
                      </div>
                      <div className="text-sm text-[#555] italic leading-[1.55] bg-[#FAFAFA] rounded-[10px] px-[15px] py-[13px] mt-2">"{ex.prompt}"</div>
                      <div className="text-[12px] text-[#999] font-semibold uppercase tracking-[0.04em] mt-[18px] mb-2">Claude's response</div>
                      <div className="text-[15px] leading-[1.65] text-[#2b2b2b]">
                        {ex.parts.map((pt, j) => {
                          if (pt.kind === 'brand') return <span key={j} className="text-[#2D6AE0] font-semibold">{pt.text}</span>;
                          if (pt.kind === 'competitor') return <span key={j} className="bg-[#FBEDE8] text-[#C2543A] rounded px-[3px] font-medium">{pt.text}</span>;
                          return <span key={j}>{pt.text}</span>;
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-[18px] mt-5 text-[12.5px] text-[#999]">
                    <span><span className="inline-block w-2.5 h-2.5 rounded-[3px] bg-[#2D6AE0] align-[-1px] mr-1.5" />{brand}</span>
                    <span><span className="inline-block w-2.5 h-2.5 rounded-[3px] bg-[#E7A491] align-[-1px] mr-1.5" />Competitors</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </TabPanel>

      {/* Competitors */}
      <TabPanel active={tab === 'competitors'}>
        <h3 className="text-[19px] font-bold tracking-[-0.01em] mb-[14px] break-after-avoid">Competitors</h3>
        <CompetitorAttributes topCompetitor={overview.topCompetitor} />
        <div className="grid grid-cols-1 sm:grid-cols-[1.15fr_1fr] gap-4">
          <div className="bg-white border border-[#ECECEC] rounded-[16px] px-[26px] py-6 break-inside-avoid">
            <div className="text-[15px] font-semibold mb-1">Competitor comparison</div>
            <div className="text-[13px] text-[#999] mb-[18px]">Mention frequency vs. competitors across all persona queries</div>
            <CompetitorBarChart products={products} />
          </div>
          <div className="bg-white border border-[#ECECEC] rounded-[16px] px-[26px] py-6 break-inside-avoid">
            <div className="text-[15px] font-semibold mb-1">Brand strength by category</div>
            <div className="text-[13px] text-[#999] mb-2">Illustrative — not yet computed from live data</div>
            <RadarChart />
          </div>
        </div>
      </TabPanel>

      {/* Prompts */}
      <TabPanel active={tab === 'prompts'}>
        <h3 className="text-[19px] font-bold tracking-[-0.01em] mb-[14px] break-after-avoid">Every prompt asked, across all personas</h3>
        <PromptsTable personas={personas} results={results} />
      </TabPanel>

      {/* Sources */}
      <TabPanel active={tab === 'sources'}>
        <h3 className="text-[19px] font-bold tracking-[-0.01em] mb-[14px] break-after-avoid">Sources shaping AI recommendations in your category</h3>
        <EnrichedSourcesTable sources={sources} />
      </TabPanel>

      {/* Opportunities */}
      <TabPanel active={tab === 'opportunities'}>
        <h3 className="text-[19px] font-bold tracking-[-0.01em] mb-1 break-after-avoid">Where you can gain the most</h3>
        <div className="text-[13px] text-[#999] mb-[18px]">Ranked by potential impact on your AI Visibility Score. Grounded in this report's real numbers; recommendations are illustrative pending backend support.</div>
        <div className="flex flex-col gap-3">
          {opportunities.map((item, i) => <OpportunityCard key={i} item={item} />)}
        </div>
      </TabPanel>
    </div>
  );
}
