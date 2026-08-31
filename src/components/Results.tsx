import { Fragment, useState } from 'react';
import type { Competitor, CompetitorDiagnosis, Opportunity, Persona, PersonaOpportunity, PersonaResult, Product, Overview, RadarCategory, ScoreComponent, Sources, SourceIntel, Sentiment } from '../types';
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
  scoreBreakdown: ScoreComponent[];
  competitorDiagnosis: CompetitorDiagnosis;
  opportunities: Opportunity[];
  radar: RadarCategory[];
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

// Dimensions are picked per-brand by the backend (e.g. "Ingredient
// Transparency" for skincare, "Room Comfort" for a hotel) — never assume a
// fixed axis count or fixed labels here, just render whatever comes back.
function RadarChart({ data }: { data: RadarCategory[] }) {
  if (data.length === 0) {
    return <div className="text-[13px] text-[#999] text-center py-10">Not enough data yet to compute brand strength dimensions.</div>;
  }

  const n = data.length;
  const cx = 110, cy = 110, r = 80;

  const toXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
  });

  const rings = [0.25, 0.5, 0.75, 1];
  const angles = data.map((_, i) => (i * 2 * Math.PI) / n);

  const dataPoints = data.map((d, i) => toXY(angles[i], (Math.max(0, Math.min(100, d.score)) / 100) * r));
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
      {data.map((d, i) => {
        const pos = toXY(angles[i], r + 18);
        return (
          <text key={d.name} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#888" fontFamily="sans-serif">
            {d.name}
          </text>
        );
      })}
    </svg>
  );
}

// Deterministic read on competitive position from vis/mentioned alone (see
// pipeline._classify_opportunity) — "High" here means "high-opportunity",
// mentioned but weak, not "high-performing". Not mentioned at all is always
// Critical Gap regardless of how other personas are doing.
const PERSONA_OPPORTUNITY_STYLE: Record<PersonaOpportunity, { color: string; bg: string }> = {
  Defend: { color: '#1E9E6A', bg: '#E8F6EF' },
  Grow: { color: ACCENT, bg: '#EEF3FE' },
  High: { color: '#B8862F', bg: '#FBF2E2' },
  'Critical Gap': { color: '#C2543A', bg: '#FBEDE8' },
};

function PersonaOpportunityBadge({ opportunity }: { opportunity: PersonaOpportunity }) {
  const style = PERSONA_OPPORTUNITY_STYLE[opportunity];
  return <span className="text-[11.5px] font-semibold rounded-full px-[11px] py-1 whitespace-nowrap" style={{ color: style.color, background: style.bg }}>{opportunity}</span>;
}

function ScoreBreakdownSection({ items }: { items: ScoreComponent[] }) {
  return (
    <div className="bg-white border border-[#ECECEC] rounded-[16px] px-[26px] py-6 mb-4 break-inside-avoid">
      <div className="text-[15px] font-semibold mb-1">Score breakdown</div>
      <div className="text-[13px] text-[#999] mb-[18px]">What's driving your overall Visibility Score</div>
      <div className="flex flex-col gap-4">
        {items.map(item => (
          <div key={item.name}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13.5px] font-semibold text-[#1b1b1b]">{item.name}</span>
              <span className="text-[13.5px] font-bold" style={{ color: visibilityTierColor(item.score) }}>{item.score}/100</span>
            </div>
            <div className="h-2 bg-[#F2F2F2] rounded-full overflow-hidden mb-1.5">
              <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, item.score))}%`, background: visibilityTierColor(item.score) }} />
            </div>
            <div className="text-[12.5px] text-[#888] leading-relaxed">{item.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiagnosisColumn({ title, items, color, bg }: { title: string; items: string[]; color: string; bg: string }) {
  return (
    <div className="rounded-[13px] px-5 py-4" style={{ background: bg }}>
      <div className="text-[13.5px] font-bold mb-2.5" style={{ color }}>{title}</div>
      {items.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {items.map(w => <div key={w} className="text-[13.5px] text-[#555]">{w}</div>)}
        </div>
      ) : (
        <div className="text-[13px] text-[#999]">No signal yet</div>
      )}
    </div>
  );
}

// competitorDiagnosis can come back with all-empty arrays if the underlying
// AI call failed for this job — that's "not enough data yet," not an error,
// so it gets a plain empty state rather than being hidden or crashing.
function CompetitorDiagnosisCard({ diagnosis, topCompetitor }: { diagnosis: CompetitorDiagnosis; topCompetitor: string | null }) {
  const empty = diagnosis.rivalWins.length === 0 && diagnosis.brandWins.length === 0 && diagnosis.gaps.length === 0;
  return (
    <div className="bg-white border border-[#ECECEC] rounded-[16px] px-[26px] py-6 mb-4 break-inside-avoid">
      <div className="text-[15px] font-semibold mb-1">Why competitors outperform you</div>
      <div className="text-[13px] text-[#999] mb-[18px]">Attributes AI models attach to each brand when recommending options.</div>
      {empty ? (
        <div className="text-[13.5px] text-[#999] py-4">Not enough data yet for this report.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <DiagnosisColumn title={`${topCompetitor ?? 'Competitors'} win${topCompetitor ? 's' : ''} on`} items={diagnosis.rivalWins} color="#C2543A" bg="#FBEDE8" />
          <DiagnosisColumn title="Your brand wins on" items={diagnosis.brandWins} color="#1E9E6A" bg="#E8F6EF" />
          <DiagnosisColumn title="Your biggest visibility gaps" items={diagnosis.gaps} color="#666" bg="#F4F4F4" />
        </div>
      )}
    </div>
  );
}

const SOURCE_VISIBILITY_STYLE: Record<SourceIntel['visibility'], { color: string; bg: string }> = {
  Visible: { color: '#1E9E6A', bg: '#E8F6EF' },
  'Weak visibility': { color: '#B8862F', bg: '#FBF2E2' },
  'Not visible': { color: '#C2543A', bg: '#FBEDE8' },
};

function SourceDetailColumn({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-[11px] text-[#999] font-semibold uppercase tracking-[0.04em] mb-1.5">{label}</div>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map(it => <span key={it} className="text-[12.5px] text-[#555] bg-[#F4F6F9] rounded-full px-2.5 py-1">{it}</span>)}
        </div>
      ) : (
        <div className="text-[12.5px] text-[#AAA]">No signal</div>
      )}
    </div>
  );
}

// One expandable card per cited domain (capped to the 15 most-cited by the
// backend). Individual domains can come back with empty keywords/personas/
// competitors and visibility "Not visible" if enrichment didn't have enough
// signal for that one domain specifically — that's "no signal," not broken
// data, so it renders the same way as any other domain, just with empty
// detail columns.
function SourceIntelList({ sourceIntel }: { sourceIntel: SourceIntel[] }) {
  const [open, setOpen] = useState<string | null>(null);

  if (sourceIntel.length === 0) {
    return <div className="bg-white border border-[#ECECEC] rounded-[16px] px-6 py-[22px] text-[13.5px] text-[#999]">Not enough data yet for source-level detail.</div>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {sourceIntel.map(s => {
        const isOpen = open === s.domain;
        const vis = SOURCE_VISIBILITY_STYLE[s.visibility];
        return (
          <div key={s.domain} className="bg-white border border-[#ECECEC] rounded-[14px] overflow-hidden break-inside-avoid">
            <div onClick={() => setOpen(isOpen ? null : s.domain)} className="px-5 py-4 flex flex-wrap items-center gap-x-3 gap-y-2 cursor-pointer hover:bg-[#FAFBFD]">
              <div className="flex-1 min-w-[160px]">
                <a href={s.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-[14.5px] font-semibold text-[#1b1b1b] hover:text-[#2D6AE0]">{s.domain}</a>
                <div className="text-[12px] text-[#999] mt-0.5">{s.category} · {s.influence}</div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11.5px] font-semibold rounded-full px-[10px] py-[3px] whitespace-nowrap" style={{ color: vis.color, background: vis.bg }}>{s.visibility}</span>
                <span className="text-xs text-[#999] bg-[#F4F4F4] rounded-full px-2.5 py-[3px]">{s.cited}×</span>
                <span className="text-[#999] text-sm print:hidden">{isOpen ? '▲' : '▼'}</span>
              </div>
            </div>
            <div className={`px-5 pb-5 border-t border-[#F2F2F2] ${isOpen ? '' : 'hidden'} print:block`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <SourceDetailColumn label="Keywords" items={s.keywords} />
                <SourceDetailColumn label="Resonates with" items={s.personas} />
                <SourceDetailColumn label="Discusses competitors" items={s.competitors} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OpportunityCard({ item }: { item: Opportunity }) {
  return (
    <div className="bg-white border border-[#ECECEC] rounded-[15px] px-6 py-5 break-inside-avoid">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {/* type is a free-form label from the model, not an enum — one
              consistent badge style regardless of the exact string. */}
          <span className="text-[11px] font-bold uppercase tracking-[0.04em] rounded-full px-[10px] py-1 whitespace-nowrap text-[#2D6AE0] bg-[#EEF3FE]">{item.type}</span>
          <span className="text-[15.5px] font-bold text-[#1b1b1b]">{item.title}</span>
        </div>
        <div className="text-[12px] text-[#999] whitespace-nowrap">Impact <strong className="text-[#555]">{item.impact}</strong> · Effort <strong className="text-[#555]">{item.effort}</strong></div>
      </div>
      <div className="text-[13.5px] text-[#666] mt-2.5 leading-relaxed">{item.detail}</div>
      <div className="text-[13px] text-[#444] mt-3 pt-3 border-t border-[#F2F2F2] leading-relaxed"><span className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#999] mr-1.5">Do this</span>{item.action}</div>
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

export function Results({ brand, industry, personas, results, overview, products, sources, scoreBreakdown, competitorDiagnosis, opportunities, radar, onGoHome }: ResultsProps) {
  const selected = personas.filter(p => p.selected);
  const [openResult, setOpenResult] = useState<string | null>(selected[0]?.id ?? null);
  const [tab, setTab] = useState<TabId>('overview');
  const positiveCount = selected.filter(p => results[p.id]?.sentiment === 'Positive').length;
  const neutralCount = selected.filter(p => results[p.id]?.sentiment === 'Neutral').length;
  const negativeCount = selected.filter(p => results[p.id]?.sentiment === 'Negative').length;
  const topCompetitorCount = overview.topCompetitor ? products.find(p => p.name === overview.topCompetitor)?.count ?? 0 : 0;
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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

        <ScoreBreakdownSection items={scoreBreakdown} />
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
                    <PersonaOpportunityBadge opportunity={r.opportunity} />
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
        <CompetitorDiagnosisCard diagnosis={competitorDiagnosis} topCompetitor={overview.topCompetitor} />
        <div className="grid grid-cols-1 sm:grid-cols-[1.15fr_1fr] gap-4">
          <div className="bg-white border border-[#ECECEC] rounded-[16px] px-[26px] py-6 break-inside-avoid">
            <div className="text-[15px] font-semibold mb-1">Competitor comparison</div>
            <div className="text-[13px] text-[#999] mb-[18px]">Mention frequency vs. competitors across all persona queries</div>
            <CompetitorBarChart products={products} />
          </div>
          <div className="bg-white border border-[#ECECEC] rounded-[16px] px-[26px] py-6 break-inside-avoid">
            <div className="text-[15px] font-semibold mb-1">Brand strength by category</div>
            <div className="text-[13px] text-[#999] mb-2">Dimensions picked for this brand's category</div>
            <RadarChart data={radar} />
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
        <h3 className="text-[19px] font-bold tracking-[-0.01em] mb-[14px] break-after-avoid">Sources referenced by AI responses</h3>
        <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_1fr] gap-4 mb-10">
          <div className="bg-white border border-[#ECECEC] rounded-[16px] px-6 py-[22px] break-inside-avoid">
            <div className="text-[14.5px] font-semibold mb-[14px]">Citation sources</div>
            <div className="flex flex-col gap-[13px]">
              {sources.citations.length === 0 && <div className="text-[13px] text-[#999]">No citations found.</div>}
              {sources.citations.map(c => (
                <div key={c.domain}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[13px] font-semibold text-[#2D6AE0]">{c.domain}</span>
                    <span className="text-[11.5px] text-[#AAA] font-semibold flex-shrink-0">{c.count}×</span>
                  </div>
                  <div className="text-[12.5px] text-[#888] mt-0.5 leading-snug">{c.title}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-[#ECECEC] rounded-[16px] px-6 py-[22px] break-inside-avoid">
            <div className="text-[14.5px] font-semibold mb-[14px]">Publisher list</div>
            <div className="flex flex-col gap-3">
              {sources.publishers.length === 0 && <div className="text-[13px] text-[#999]">No publishers found.</div>}
              {sources.publishers.map(p => (
                <div key={p.name} className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[13.5px] font-semibold text-[#1b1b1b]">{p.name}</div>
                    <div className="text-xs text-[#999]">{p.type}</div>
                  </div>
                  <span className="text-[11.5px] font-semibold text-[#666] bg-[#F4F4F4] rounded-full px-2.5 py-[3px] flex-shrink-0">{p.mentions}×</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-[#ECECEC] rounded-[16px] px-6 py-[22px] break-inside-avoid">
            <div className="text-[14.5px] font-semibold mb-[14px]">Community list</div>
            <div className="flex flex-col gap-3">
              {sources.communities.length === 0 && <div className="text-[13px] text-[#999]">No community threads found.</div>}
              {sources.communities.map(cm => (
                <div key={cm.name} className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[13.5px] font-semibold text-[#1b1b1b]">{cm.name}</div>
                    <div className="text-xs text-[#999]">{cm.platform}</div>
                  </div>
                  <span className="text-[11.5px] font-semibold text-[#666] bg-[#F4F4F4] rounded-full px-2.5 py-[3px] flex-shrink-0">{cm.mentions}×</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <h3 className="text-[19px] font-bold tracking-[-0.01em] mb-1 break-after-avoid">Source Intelligence</h3>
        <div className="text-[13px] text-[#999] mb-[18px]">What each cited domain says, the language it uses, and which buyers it resonates with. Expand a row for detail.</div>
        <SourceIntelList sourceIntel={sources.sourceIntel} />
      </TabPanel>

      {/* Opportunities */}
      <TabPanel active={tab === 'opportunities'}>
        <h3 className="text-[19px] font-bold tracking-[-0.01em] mb-1 break-after-avoid">Where you can gain the most</h3>
        <div className="text-[13px] text-[#999] mb-[18px]">Ranked by potential impact on your AI Visibility Score.</div>
        {opportunities.length === 0 ? (
          <div className="bg-white border border-[#ECECEC] rounded-[16px] px-6 py-[22px] text-[13.5px] text-[#999]">Not enough data yet to generate opportunities for this report.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {opportunities.map((item, i) => <OpportunityCard key={i} item={item} />)}
          </div>
        )}
      </TabPanel>
    </div>
  );
}
