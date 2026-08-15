import { HISTORY } from '../data';

interface HistoryProps {
  onGoHome: () => void;
}

export function History({ onGoHome }: HistoryProps) {
  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-7 py-12 pb-[110px] animate-fadeUp">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-7">
        <div>
          <h2 className="text-[30px] tracking-[-0.02em] font-bold m-0">History</h2>
          <p className="text-[15px] text-[#888] mt-1.5 mb-0">Your past brand visibility analyses.</p>
        </div>
        <button onClick={onGoHome} className="bg-[#2D6AE0] text-white border-none rounded-[11px] px-[22px] py-3 text-sm font-semibold cursor-pointer hover:bg-[#2560d0]">+ New Analysis</button>
      </div>

      <div className="bg-white border border-[#ECECEC] rounded-[16px] overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[1.1fr_1.4fr_0.9fr_0.9fr_1fr_0.9fr] px-[22px] py-[14px] border-b border-[#F0F0F0] text-[11.5px] text-[#9A9A9A] font-bold tracking-[0.05em] uppercase">
              <span>Date</span><span>Brand</span><span>Personas</span><span>Models</span><span>Visibility</span><span>Status</span>
            </div>
            {HISTORY.map((h, i) => (
              <div key={h.id} className={`grid grid-cols-[1.1fr_1.4fr_0.9fr_0.9fr_1fr_0.9fr] px-[22px] py-[18px] text-sm text-[#444] cursor-pointer hover:bg-[#FAFBFD] items-center ${i < HISTORY.length - 1 ? 'border-b border-[#F4F4F4]' : ''}`}>
                <span className="text-[#888]">{h.date}</span>
                <span className="font-semibold text-[#1b1b1b]">{h.brand}</span>
                <span>{h.personas}</span>
                <span>{h.models}</span>
                <span className="font-bold" style={{ color: h.scoreColor }}>{h.score}</span>
                <span>
                  <span className="text-[11.5px] font-semibold text-[#1E9E6A] bg-[#E8F6EF] rounded-full px-2.5 py-1">{h.status}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
