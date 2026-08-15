import { Fragment, useState } from 'react';
import type { Persona, PersonaResult, Product, Overview, Sources, Sentiment } from '../types';
import { buildReportCsv, downloadCsv } from '../csv';

interface ResultsProps {
  brand: string;
  industry: string;
  personas: Persona[];
  competitors: string[];
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

function VisibilityRing({ score }: { score: number }) {
  const r = 50;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <svg width="92" height="92" viewBox="0 0 120 120" className="flex-shrink-0">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#EEEEEE" strokeWidth="11" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="#2D6AE0" strokeWidth="11" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 60 60)" />
      <text x="60" y="58" textAnchor="middle" fontSize="32" fontWeight="700" fill="#1b1b1b">{score}</text>
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
      {ticks.map(g => {
        const y = padT + chartH - (g / max) * chartH;
        return (
          <g key={g}>
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

export function Results({ brand, industry, personas, results, overview, products, sources, onGoHome }: ResultsProps) {
  const selected = personas.filter(p => p.selected);
  const [openResult, setOpenResult] = useState<string | null>(selected[0]?.id ?? null);
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

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-9">
        <div className="bg-white border border-[#ECECEC] rounded-[16px] p-[22px] flex items-center gap-4 break-inside-avoid">
          <VisibilityRing score={overview.visibilityScore} />
          <div>
            <div className="text-[12.5px] text-[#999] font-semibold uppercase tracking-[0.03em]">Visibility Score</div>
            <div className="text-[13.5px] text-[#666] mt-1.5 leading-snug">Averaged across {overview.total} persona{overview.total === 1 ? '' : 's'} — each scored by mention rank and sentiment</div>
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

      {/* Share of Voice + Products mentioned */}
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

      {/* Per-persona accordion */}
      <h3 className="text-[19px] font-bold tracking-[-0.01em] mb-[14px] mt-9 break-after-avoid">Personas analysed · prompts &amp; AI responses</h3>
      <div className="flex flex-col gap-2.5 mb-10">
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
                <div className="text-[12px] text-[#999] font-semibold uppercase tracking-[0.04em] mt-4 mb-2">Prompt sent</div>
                <div className="text-sm text-[#555] italic leading-[1.55] bg-[#FAFAFA] rounded-[10px] px-[15px] py-[13px]">"{r.prompt}"</div>
                <div className="text-[12px] text-[#999] font-semibold uppercase tracking-[0.04em] mt-[18px] mb-2">Claude's response</div>
                <div className="text-[15px] leading-[1.65] text-[#2b2b2b]">
                  {r.parts.map((pt, i) => {
                    if (pt.kind === 'brand') return <span key={i} className="text-[#2D6AE0] font-semibold">{pt.text}</span>;
                    if (pt.kind === 'competitor') return <span key={i} className="bg-[#FBEDE8] text-[#C2543A] rounded px-[3px] font-medium">{pt.text}</span>;
                    return <span key={i}>{pt.text}</span>;
                  })}
                </div>
                <div className="flex items-center gap-[18px] mt-4 text-[12.5px] text-[#999]">
                  <span><span className="inline-block w-2.5 h-2.5 rounded-[3px] bg-[#2D6AE0] align-[-1px] mr-1.5" />{brand}</span>
                  <span><span className="inline-block w-2.5 h-2.5 rounded-[3px] bg-[#E7A491] align-[-1px] mr-1.5" />Competitors</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sources */}
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

      {/* Analytics */}
      <h3 className="text-[19px] font-bold tracking-[-0.01em] mb-[14px] break-after-avoid">Visual analytics</h3>
      <div className="bg-white border border-[#ECECEC] rounded-[16px] px-[26px] py-6 mb-4 break-inside-avoid">
        <div className="text-[15px] font-semibold mb-1">Persona signal matrix</div>
        <div className="text-[13px] text-[#999] mb-[18px]">How each persona scored across the key dimensions</div>
        <HeatmapChart personas={personas} results={results} />
      </div>
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
    </div>
  );
}
