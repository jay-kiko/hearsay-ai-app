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
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onFocusSearch: () => void;
}

export function Nav({ screen, onGoHome, onOpenHistory, onOpenSettings, onFocusSearch }: NavProps) {
  const isHome = screen === 'home';
  const showWizardNav = screen !== 'home';

  return (
    <nav className="h-[70px] flex items-center justify-between px-9 border-b border-[#ECECEC] bg-[rgba(250,250,250,0.82)] backdrop-blur-sm sticky top-0 z-50">
      {/* Logo */}
      <div onClick={onGoHome} className="flex items-center cursor-pointer select-none">
        <img src={kikologo} alt="hearsay.ai" className="h-[45px] w-auto block mt-3" />
      </div>

      {isHome && (
        <div className="flex items-center gap-[30px]">
          {Object.keys(NAV_SECTIONS).map(item => (
            <span
              key={item}
              onClick={() => scrollTo(NAV_SECTIONS[item])}
              className="text-sm text-[#5A5A5A] cursor-pointer hover:text-[#141414] transition-colors"
            >
              {item}
            </span>
          ))}
          <button
            onClick={onFocusSearch}
            className="bg-[#2D6AE0] text-white border-none rounded-[10px] px-5 py-[10px] text-sm font-semibold cursor-pointer hover:bg-[#2560d0] transition-colors"
          >
            Get Started
          </button>
        </div>
      )}

      {showWizardNav && (
        <div className="flex items-center gap-1.5">
          <span onClick={onGoHome} className="text-sm text-[#5A5A5A] cursor-pointer px-[14px] py-2 rounded-[9px] hover:text-[#141414] hover:bg-[#F4F4F4] transition-colors">New Analysis</span>
          <span onClick={onOpenHistory} className="text-sm text-[#5A5A5A] cursor-pointer px-[14px] py-2 rounded-[9px] hover:text-[#141414] hover:bg-[#F4F4F4] transition-colors">History</span>
          <span onClick={onOpenSettings} className="text-sm text-[#5A5A5A] cursor-pointer px-[14px] py-2 rounded-[9px] hover:text-[#141414] hover:bg-[#F4F4F4] transition-colors">Settings</span>
          <div className="w-[34px] h-[34px] rounded-full bg-[#EEF3FE] text-[#2D6AE0] flex items-center justify-center text-[13px] font-bold ml-2">AK</div>
        </div>
      )}
    </nav>
  );
}
