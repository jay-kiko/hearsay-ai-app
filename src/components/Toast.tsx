interface ToastProps {
  message: string;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  return (
    <div className="fixed bottom-5 right-5 max-w-[340px] bg-white border border-[#F0D9D2] rounded-[13px] shadow-[0_12px_40px_-16px_rgba(0,0,0,0.18)] px-[16px] py-[14px] flex items-start gap-3 animate-fadeUp z-50">
      <div className="w-8 h-8 rounded-full bg-[#FBEDE8] text-[#C2543A] flex items-center justify-center text-sm font-bold flex-shrink-0">!</div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold text-[#1b1b1b] mb-0.5">Access code no longer valid</div>
        <div className="text-[13px] text-[#777] leading-relaxed">{message}</div>
      </div>
      <button onClick={onClose} aria-label="Dismiss" className="text-[#B0B0B0] hover:text-[#777] text-sm leading-none cursor-pointer flex-shrink-0 bg-transparent border-none p-0.5">✕</button>
    </div>
  );
}
