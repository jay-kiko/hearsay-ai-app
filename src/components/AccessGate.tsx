import { useState } from 'react';
import kikologo from '../assets/kiko-logo.png';

interface AccessGateProps {
  error: string | null;
  onSubmit: (code: string) => void;
}

export function AccessGate({ error, onSubmit }: AccessGateProps) {
  const [code, setCode] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-6">
      <div className="w-full max-w-[400px] animate-fadeUp">
        <div className="flex justify-center mb-8">
          <img src={kikologo} alt="hearsay.ai" className="h-[45px] w-auto" />
        </div>

        <div className="bg-white border border-[#E6E6E6] rounded-[20px] p-8 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.12)]">
          <h1 className="text-[21px] font-bold text-center mb-2">This preview is invite-only</h1>
          <p className="text-[13.5px] text-[#888] text-center mb-7 leading-relaxed">Enter your access code to continue. Don't have one? Ask whoever sent you here.</p>

          <form onSubmit={e => { e.preventDefault(); onSubmit(code.trim()); }}>
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Access code"
              autoFocus
              className="w-full border border-[#E2E2E2] rounded-[11px] px-4 py-3 text-[15px] text-center tracking-[0.04em] font-mono text-[#222] mb-3 focus:border-[#2D6AE0] focus:outline-none transition-colors"
            />
            {error && <div className="text-[13px] text-[#C2543A] text-center mb-3">{error}</div>}
            <button
              type="submit"
              className="w-full bg-[#2D6AE0] text-white border-none rounded-[11px] py-3 text-sm font-semibold cursor-pointer hover:bg-[#2560d0] transition-colors"
            >
              Continue →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
