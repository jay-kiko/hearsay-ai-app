import { SITELIST } from '../data';

interface ActivationProps {
  brand: string;
  onBack: () => void;
}

function scoreColor(score: number): string {
  if (score >= 80) return '#1E9E6A';
  if (score >= 55) return '#2D6AE0';
  return '#D2603F';
}

export function Activation({ brand, onBack }: ActivationProps) {
  return (
    <div className="max-w-[1080px] mx-auto px-7 py-10 pb-[110px] animate-fadeUp">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-2.5">
        <div>
          <span onClick={onBack} className="text-[13px] text-[#999] font-semibold cursor-pointer hover:text-[#555]">← Back to results</span>
          <h2 className="text-[32px] tracking-[-0.02em] font-bold mt-2 mb-0">AI Influence Sitelist</h2>
          <div className="text-[14.5px] text-[#888] mt-[3px] max-w-[640px] leading-snug">Publishers and digital ecosystems shaping how AI models describe {brand} — ranked by influence and ready to activate as media.</div>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <button className="bg-white border border-[#DADADA] text-[#444] rounded-[10px] px-4 py-2.5 text-[13.5px] font-semibold cursor-pointer hover:bg-[#F8F8F8]">Export CSV</button>
          <button className="bg-[#2D6AE0] text-white border-none rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-semibold cursor-pointer hover:bg-[#2560d0]">Send to media plan</button>
        </div>
      </div>

      <div className="bg-white border border-[#ECECEC] rounded-[16px] overflow-hidden mt-[26px]">
        <div className="grid grid-cols-[1.5fr_0.9fr_1.6fr_1.1fr_0.9fr_1fr] px-[22px] py-[14px] border-b border-[#F0F0F0] text-[11px] text-[#9A9A9A] font-bold tracking-[0.05em] uppercase">
          <span>Publisher</span><span>AI Influence</span><span>Inventory</span><span>Market availability</span><span>Est. CPM</span><span>Status</span>
        </div>
        {SITELIST.map((p, i) => (
          <div key={p.name} className={`grid grid-cols-[1.5fr_0.9fr_1.6fr_1.1fr_0.9fr_1fr] px-[22px] py-4 text-sm text-[#444] items-center ${i < SITELIST.length - 1 ? 'border-b border-[#F4F4F4]' : ''}`}>
            <div>
              <div className="font-semibold text-[#1b1b1b]">{p.name}</div>
              <div className="text-xs text-[#999] mt-[1px]">{p.category}</div>
            </div>
            <div className="font-bold" style={{ color: scoreColor(p.score) }}>{p.score}</div>
            <div className="text-[12.5px] text-[#666] leading-snug">{p.inventory.join(' · ')}</div>
            <div className="text-[13px] text-[#555]">{p.availability}</div>
            <div className="text-[13px] text-[#555]">{p.cpm}</div>
            <span
              className="text-[11.5px] font-semibold rounded-full px-[11px] py-1 justify-self-start"
              style={{ color: p.buyable ? '#1E9E6A' : '#A0A0A0', background: p.buyable ? '#E8F6EF' : '#F0F0F0' }}
            >
              {p.buyable ? 'Buyable' : 'Non-buyable'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
