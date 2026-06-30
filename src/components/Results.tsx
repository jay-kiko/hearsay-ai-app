import { useState } from 'react';
import type { Persona } from '../types';
import { RESULTS } from '../data';

interface ResultsProps {
  brand: string;
  industry: string;
  personas: Persona[];
  competitors: string[];
  onGoHome: () => void;
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

function HeatmapChart({ personas }: { personas: Persona[] }) {
  const selected = personas.filter(p => p.selected);
  const dims = ['Visibility', 'Sentiment', 'Rank'];
  const colors = (val: number) => {
    if (val >= 75) return '#1E9E6A';
    if (val >= 50) return '#2D6AE0';
    if (val > 0) return '#F0A64A';
    return '#E5E5E5';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr>
            <th className="text-left text-[#999] font-semibold pb-2 pr-4">Persona</th>
            {dims.map(d => <th key={d} className="text-[#999] font-semibold pb-2 px-2 text-center">{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {selected.map(p => {
            const r = RESULTS[p.id];
            if (!r) return null;
            const vals = [r.vis, r.sentiment === 'Positive' ? 85 : r.sentiment === 'Neutral' ? 50 : 20, r.rank ? (4 - r.rank) * 30 : 0];
            return (
              <tr key={p.id}>
                <td className="py-1.5 pr-4 text-[#333] font-medium whitespace-nowrap">{p.title}</td>
                {vals.map((v, i) => (
                  <td key={i} className="py-1.5 px-2 text-center">
                    <div className="inline-flex items-center justify-center w-10 h-8 rounded-lg text-white text-[12px] font-semibold" style={{ backgroundColor: colors(v) }}>
                      {v > 0 ? v : '–'}
                    </div>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex gap-4 mt-3 text-[12px] text-[#888]">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#1E9E6A] inline-block" />Strong (75+)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#2D6AE0] inline-block" />Good (50–74)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#F0A64A] inline-block" />Weak (1–49)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#E5E5E5] inline-block" />Not mentioned</span>
      </div>
    </div>
  );
}

function BarChart({ brand, competitors }: { brand: string, competitors: string[] }) {
  const allBrands = [brand, ...competitors.slice(0, 3)];
  const mentions = [6, 7, 5, 4];
  const max = Math.max(...mentions);
  const colors = ['#2D6AE0', '#E7A491', '#E7A491', '#E7A491'];

  return (
    <div className="flex flex-col gap-3">
      {allBrands.map((b, i) => (
        <div key={b} className="flex items-center gap-3">
          <div className="w-[100px] text-[13px] text-[#555] text-right truncate">{b}</div>
          <div className="flex-1 h-7 bg-[#F4F4F4] rounded-md overflow-hidden">
            <div
              className="h-full rounded-md transition-all duration-700"
              style={{ width: `${(mentions[i] / max) * 100}%`, backgroundColor: colors[i] }}
            />
          </div>
          <div className="w-5 text-[13px] text-[#666] font-semibold">{mentions[i]}</div>
        </div>
      ))}
    </div>
  );
}

function RadarChart(_props: { brand: string }) {
  const categories = ['Enterprise fit', 'Developer UX', 'Price-value', 'Simplicity', 'API quality', 'Support'];
  const scores = [84, 80, 61, 70, 80, 65];
  const n = categories.length;
  const cx = 110, cy = 110, r = 80;

  const toXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
  });

  const rings = [0.25, 0.5, 0.75, 1];
  const angles = categories.map((_, i) => (i * 2 * Math.PI) / n);

  const dataPoints = scores.map((s, i) => toXY(angles[i], (s / 100) * r));
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
          <text key={cat} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#888" fontFamily="sans-serif">
            {cat}
          </text>
        );
      })}
    </svg>
  );
}

export function Results({ brand, industry, personas, competitors, onGoHome }: ResultsProps) {
  const [openResult, setOpenResult] = useState<string | null>('p1');
  const selected = personas.filter(p => p.selected);
  const mentioned = selected.filter(p => RESULTS[p.id]?.mentioned).length;
  const positiveCount = selected.filter(p => RESULTS[p.id]?.sentiment === 'Positive').length;
  const neutralCount = selected.filter(p => RESULTS[p.id]?.sentiment === 'Neutral').length;

  return (
    <div className="max-w-[1080px] mx-auto px-7 py-10 pb-[110px] animate-fadeUp">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-7">
        <div>
          <div className="text-[13px] text-[#999] font-semibold tracking-[0.03em]">RESULTS · Jun 28, 2026</div>
          <h2 className="text-[32px] tracking-[-0.02em] font-bold mt-1.5 mb-0">{brand}</h2>
          <div className="text-[14.5px] text-[#888] mt-[3px]">{industry} · {selected.length} personas · Claude</div>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          {['Export PDF', 'Export CSV', 'Share'].map(btn => (
            <button key={btn} className="bg-white border border-[#DADADA] text-[#444] rounded-[10px] px-4 py-2.5 text-[13.5px] font-semibold cursor-pointer hover:bg-[#F8F8F8]">{btn}</button>
          ))}
          <button onClick={onGoHome} className="bg-[#2D6AE0] text-white border-none rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-semibold cursor-pointer hover:bg-[#2560d0]">Re-run</button>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-4 gap-4 mb-9">
        <div className="bg-white border border-[#ECECEC] rounded-[16px] p-[22px] flex items-center gap-4">
          <VisibilityRing score={72} />
          <div>
            <div className="text-[12.5px] text-[#999] font-semibold uppercase tracking-[0.03em]">Visibility Score</div>
            <div className="text-[13.5px] text-[#666] mt-1.5 leading-snug">Solid presence across most personas</div>
          </div>
        </div>
        <div className="bg-white border border-[#ECECEC] rounded-[16px] p-[22px]">
          <div className="text-[12.5px] text-[#999] font-semibold uppercase tracking-[0.03em]">Mention Rate</div>
          <div className="text-[38px] font-bold tracking-[-0.02em] mt-2.5">{mentioned}<span className="text-[#C8C8C8] text-[26px]"> / {selected.length}</span></div>
          <div className="text-[13px] text-[#888] mt-1">persona queries mentioned you</div>
        </div>
        <div className="bg-white border border-[#ECECEC] rounded-[16px] p-[22px]">
          <div className="text-[12.5px] text-[#999] font-semibold uppercase tracking-[0.03em]">Avg. Sentiment</div>
          <div className="flex items-center gap-[9px] mt-[14px]">
            <div className="w-3 h-3 rounded-full bg-[#1E9E6A]" />
            <span className="text-2xl font-bold">Positive</span>
          </div>
          <div className="text-[13px] text-[#888] mt-2">{positiveCount} positive · {neutralCount} neutral · 0 negative</div>
        </div>
        <div className="bg-white border border-[#ECECEC] rounded-[16px] p-[22px]">
          <div className="text-[12.5px] text-[#999] font-semibold uppercase tracking-[0.03em]">Top Competitor</div>
          <div className="text-[26px] font-bold mt-3">{competitors[0]}</div>
          <div className="text-[13px] text-[#888] mt-1.5">mentioned in 7 queries</div>
        </div>
      </div>

      {/* Per-persona accordion */}
      <h3 className="text-[19px] font-bold tracking-[-0.01em] mb-[14px]">Per-persona responses</h3>
      <div className="flex flex-col gap-2.5 mb-10">
        {selected.map(p => {
          const r = RESULTS[p.id];
          if (!r) return null;
          const isOpen = openResult === p.id;

          return (
            <div key={p.id} className="bg-white border border-[#ECECEC] rounded-[15px] overflow-hidden">
              <div onClick={() => setOpenResult(isOpen ? null : p.id)} className="px-5 py-4 flex items-center gap-[14px] cursor-pointer hover:bg-[#FAFBFD]">
                <div className="w-[38px] h-[38px] rounded-[10px] bg-[#EEF3FE] text-[#2D6AE0] flex items-center justify-center text-[13px] font-bold flex-shrink-0">{p.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-[#1b1b1b]">{p.title}</div>
                  <div className="text-[12.5px] text-[#999] mt-[1px] truncate">"{r.quote}"</div>
                </div>
                {r.mentioned
                  ? <span className="text-[11.5px] font-semibold text-[#2D6AE0] bg-[#EEF3FE] rounded-full px-[11px] py-1 whitespace-nowrap">Mentioned</span>
                  : <span className="text-[11.5px] font-semibold text-[#A0A0A0] bg-[#F0F0F0] rounded-full px-[11px] py-1 whitespace-nowrap">Not mentioned</span>
                }
                {r.sentiment === 'Positive' && <span className="text-[11.5px] font-semibold text-[#1E9E6A] bg-[#E8F6EF] rounded-full px-[11px] py-1">Positive</span>}
                {r.sentiment === 'Neutral' && <span className="text-[11.5px] font-semibold text-[#8A8A8A] bg-[#F0F0F0] rounded-full px-[11px] py-1">Neutral</span>}
                {r.sentiment === 'Negative' && <span className="text-[11.5px] font-semibold text-[#D2603F] bg-[#FBEDE8] rounded-full px-[11px] py-1">Negative</span>}
                <span className="text-[#999] text-sm">{isOpen ? '▲' : '▼'}</span>
              </div>
              {isOpen && (
                <div className="px-5 pb-5 border-t border-[#F2F2F2]">
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
              )}
            </div>
          );
        })}
      </div>

      {/* Analytics */}
      <h3 className="text-[19px] font-bold tracking-[-0.01em] mb-[14px]">Visual analytics</h3>
      <div className="bg-white border border-[#ECECEC] rounded-[16px] px-[26px] py-6 mb-4">
        <div className="text-[15px] font-semibold mb-1">Persona signal matrix</div>
        <div className="text-[13px] text-[#999] mb-[18px]">How each persona scored across the key dimensions</div>
        <HeatmapChart personas={personas} />
      </div>
      <div className="grid grid-cols-[1.15fr_1fr] gap-4">
        <div className="bg-white border border-[#ECECEC] rounded-[16px] px-[26px] py-6">
          <div className="text-[15px] font-semibold mb-1">Mention frequency vs. competitors</div>
          <div className="text-[13px] text-[#999] mb-[18px]">Times mentioned across all persona queries</div>
          <BarChart brand={brand} competitors={competitors} />
        </div>
        <div className="bg-white border border-[#ECECEC] rounded-[16px] px-[26px] py-6">
          <div className="text-[15px] font-semibold mb-1">Brand strength by category</div>
          <div className="text-[13px] text-[#999] mb-2">Relative strength across evaluation themes</div>
          <RadarChart brand={brand} />
        </div>
      </div>
    </div>
  );
}
