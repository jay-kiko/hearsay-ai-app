import { useState } from 'react';
import type { AccessCode } from '../types';

interface AdminCodesProps {
  codes: AccessCode[];
  loading: boolean;
  error: string | null;
  onGenerate: (usesTotal: number) => void;
  onBack: () => void;
}

export function AdminCodes({ codes, loading, error, onGenerate, onBack }: AdminCodesProps) {
  const [uses, setUses] = useState(10);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="max-w-[780px] mx-auto px-7 py-12 pb-[110px] animate-fadeUp">
      <span onClick={onBack} className="text-[13px] text-[#999] font-semibold cursor-pointer hover:text-[#555]">← Back to access gate</span>
      <h2 className="text-[30px] tracking-[-0.02em] font-bold mt-3 mb-1.5">Access codes</h2>
      <p className="text-[15px] text-[#888] mb-8">Generate invite codes and set how many times each can be used. Codes can't be revoked once minted — the backend doesn't support that yet.</p>

      <div className="bg-white border border-[#ECECEC] rounded-[16px] p-[26px] mb-[18px] flex items-end gap-4 flex-wrap">
        <div>
          <label className="block text-[12.5px] font-semibold text-[#888] mb-1.5">Number of uses</label>
          <input
            type="number"
            min={1}
            value={uses}
            onChange={e => setUses(Math.max(1, Number(e.target.value) || 1))}
            className="w-[140px] border border-[#E2E2E2] rounded-[11px] px-[14px] py-3 text-sm text-[#444] focus:border-[#2D6AE0] focus:outline-none"
          />
        </div>
        <button
          onClick={() => onGenerate(uses)}
          disabled={loading}
          className="bg-[#2D6AE0] text-white border-none rounded-[11px] px-5 py-3 text-sm font-semibold cursor-pointer hover:bg-[#2560d0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating…' : '+ Generate code'}
        </button>
        {error && <div className="text-[13px] text-[#C2543A] w-full">{error}</div>}
      </div>

      <div className="bg-white border border-[#ECECEC] rounded-[16px] overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] px-[22px] py-[14px] border-b border-[#F0F0F0] text-[11px] text-[#9A9A9A] font-bold tracking-[0.05em] uppercase">
          <span>Code</span><span>Uses</span><span>Created</span><span>Status</span>
        </div>
        {codes.length === 0 && (
          <div className="px-[22px] py-8 text-center text-[13.5px] text-[#999]">No access codes yet.</div>
        )}
        {codes.map((c, i) => {
          const exhausted = c.usesRemaining <= 0;
          return (
            <div key={c.code} className={`grid grid-cols-[1.5fr_1fr_1fr_1fr] px-[22px] py-4 text-sm text-[#444] items-center ${i < codes.length - 1 ? 'border-b border-[#F4F4F4]' : ''}`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono font-semibold text-[#1b1b1b] truncate">{c.code}</span>
                <span onClick={() => copy(c.code)} className="text-[11px] text-[#2D6AE0] cursor-pointer hover:opacity-80 flex-shrink-0">{copied === c.code ? 'Copied' : 'Copy'}</span>
              </div>
              <div className="text-[13.5px]">{c.usesRemaining} / {c.usesTotal}</div>
              <div className="text-[13px] text-[#888]">{new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              <span
                className="text-[11.5px] font-semibold rounded-full px-[11px] py-1 justify-self-start"
                style={{ color: exhausted ? '#A0A0A0' : '#1E9E6A', background: exhausted ? '#F0F0F0' : '#E8F6EF' }}
              >
                {exhausted ? 'Exhausted' : 'Active'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
