import type { Persona, RunStatus } from '../types';

interface RunningProps {
  brand: string;
  personas: Persona[];
  runStatuses: Record<string, RunStatus>;
  runProgress: number;
  error: string | null;
  onBack: () => void;
}

export function Running({ brand, personas, runStatuses, runProgress, error, onBack }: RunningProps) {
  const selected = personas.filter(p => p.selected);

  if (error) {
    return (
      <div className="max-w-[480px] mx-auto px-6 py-24 pb-[110px] animate-fadeUp text-center">
        <h2 className="text-[24px] tracking-[-0.02em] font-bold mb-2">The analysis failed</h2>
        <p className="text-[14.5px] text-[#888] mb-7 leading-relaxed">{error}</p>
        <button onClick={onBack} className="bg-white border border-[#DADADA] text-[#444] rounded-[11px] px-[22px] py-3 text-sm font-semibold cursor-pointer hover:bg-[#F8F8F8]">Back to setup</button>
      </div>
    );
  }

  return (
    <div className="max-w-[620px] mx-auto px-4 sm:px-6 py-16 pb-[110px] animate-fadeUp">
      <div className="text-center mb-10">
        <h2 className="text-[28px] tracking-[-0.02em] font-bold mb-2">Analyzing {brand}</h2>
        <p className="text-[15px] text-[#888] mb-6">We're querying each persona and reading every response.</p>
        <div className="max-w-[380px] mx-auto">
          <div className="h-2 rounded-full bg-[#ECECEC] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#2D6AE0] transition-all duration-500 ease-in-out"
              style={{ width: `${runProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2.5 text-[12.5px] text-[#999]">
            <span>{runProgress}% complete</span>
            <span>~2 min remaining</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {selected.map(p => {
          const status = runStatuses[p.id] ?? 'waiting';
          const isDone = status === 'done';
          const isRunning = status === 'running';
          const isError = status === 'error';

          return (
            <div key={p.id} className="bg-white border border-[#ECECEC] rounded-[13px] px-4 py-[14px] flex items-center gap-[13px]">
              <div className="w-[38px] h-[38px] rounded-[10px] bg-[#EEF3FE] text-[#2D6AE0] flex items-center justify-center text-[13px] font-bold flex-shrink-0">{p.initials}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[14.5px] font-semibold text-[#1b1b1b]">{p.title}</div>
                {isDone && <div className="text-[12.5px] text-[#1E9E6A] mt-[2px]">✓ Analysis complete</div>}
                {isRunning && <div className="text-[12.5px] text-[#2D6AE0] mt-[2px]">Querying Claude…</div>}
                {isError && <div className="text-[12.5px] text-[#C2543A] mt-[2px]">Failed — excluded from results</div>}
                {status === 'waiting' && <div className="text-[12.5px] text-[#B0B0B0] mt-[2px]">Waiting</div>}
              </div>
              {isDone && (
                <div className="w-6 h-6 rounded-full bg-[#E8F6EF] text-[#1E9E6A] flex items-center justify-center text-[13px] font-bold">✓</div>
              )}
              {isRunning && (
                <div className="w-5 h-5 border-[2.5px] border-[#EEF3FE] border-t-[#2D6AE0] rounded-full animate-spin-slow" />
              )}
              {isError && (
                <div className="w-6 h-6 rounded-full bg-[#FBEDE8] text-[#C2543A] flex items-center justify-center text-[13px] font-bold">✕</div>
              )}
              {status === 'waiting' && (
                <div className="w-2 h-2 rounded-full bg-[#DADADA]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
