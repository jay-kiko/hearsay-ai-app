import type { Screen } from '../types';
import kikologo from "../assets/kiko-logo.png"

const NAV_SECTIONS: Record<string, string> = {
  'Product': 'section-product',
  'Use Cases': 'section-usecases',
  'Pricing': 'section-pricing',
  'Resources': 'section-resources',
};

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

interface NavProps {
  screen: Screen;
  onGoHome: () => void;
  onOpenSettings: () => void;
  onFocusSearch: () => void;
}

export function Nav({ screen, onGoHome, onOpenSettings, onFocusSearch }: NavProps) {
  const isHome = screen === 'home';
  const showWizardNav = screen !== 'home';

  return (
    <nav className="h-[64px] sm:h-[70px] flex items-center justify-between px-4 sm:px-9 border-b border-[#ECECEC] bg-[rgba(250,250,250,0.82)] backdrop-blur-sm sticky top-0 z-50 print:hidden">
      {/* Logo */}
      <div onClick={onGoHome} className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
        <img src={kikologo} alt="hearsay.ai" className="h-9 sm:h-[45px] w-auto block sm:mt-3" />
        <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.05em] uppercase text-[#2D6AE0] bg-[#EEF3FE] rounded-full px-[6px] sm:px-[7px] py-[2px]">Beta</span>
      </div>

      {isHome && (
        <div className="flex items-center gap-2 sm:gap-[30px]">
          <div className="hidden md:flex items-center gap-[30px]">
            {Object.keys(NAV_SECTIONS).map(item => (
              <span
                key={item}
                onClick={() => scrollTo(NAV_SECTIONS[item])}
                className="text-sm text-[#5A5A5A] cursor-pointer hover:text-[#141414] transition-colors"
              >
                {item}
              </span>
            ))}
          </div>
          <button
            onClick={onFocusSearch}
            className="bg-[#2D6AE0] text-white border-none rounded-[10px] px-3.5 sm:px-5 py-2 sm:py-[10px] text-[13px] sm:text-sm font-semibold cursor-pointer hover:bg-[#2560d0] transition-colors flex-shrink-0"
          >
            Get Started
          </button>
        </div>
      )}

      {showWizardNav && (
        <div className="flex items-center gap-0.5 sm:gap-1.5">
          <span onClick={onGoHome} className="text-[12.5px] sm:text-sm text-[#5A5A5A] cursor-pointer px-2 sm:px-[14px] py-1.5 sm:py-2 rounded-[9px] hover:text-[#141414] hover:bg-[#F4F4F4] transition-colors whitespace-nowrap">New Analysis</span>
          <div className="relative group">
            <span className="block text-[12.5px] sm:text-sm text-[#5A5A5A] opacity-50 cursor-not-allowed px-2 sm:px-[14px] py-1.5 sm:py-2 rounded-[9px]">History</span>
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap rounded-[8px] bg-[#1b1b1b] px-3 py-1.5 text-[12px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 z-10">
              Coming soon
            </div>
          </div>
          <span onClick={onOpenSettings} className="text-[12.5px] sm:text-sm text-[#5A5A5A] cursor-pointer px-2 sm:px-[14px] py-1.5 sm:py-2 rounded-[9px] hover:text-[#141414] hover:bg-[#F4F4F4] transition-colors">Settings</span>
        </div>
      )}
    </nav>
  );
}
