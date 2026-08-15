import { useState } from 'react';

const SAVED_PERSONAS = [
  { initials: 'VE', title: 'VP of Engineering', desc: 'Evaluates scalability and team velocity' },
  { initials: 'GM', title: 'Growth Marketer', desc: 'Focused on acquisition channels and ROI' },
];

export function Settings() {
  const [apiKey, setApiKey] = useState('sk-ant-0000000000000000');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [savedPersonas, setSavedPersonas] = useState(SAVED_PERSONAS);

  return (
    <div className="max-w-[780px] mx-auto px-4 sm:px-7 py-12 pb-[110px] animate-fadeUp">
      <h2 className="text-[30px] tracking-[-0.02em] font-bold mb-1.5">Settings</h2>
      <p className="text-[15px] text-[#888] mb-8">Manage your API keys, personas, and preferences.</p>

      {/* API Keys */}
      <div className="bg-white border border-[#ECECEC] rounded-[16px] p-[26px] mb-[18px]">
        <div className="text-base font-semibold mb-1">API Keys</div>
        <div className="text-[13.5px] text-[#999] mb-[18px]">Connect the models you want to evaluate against.</div>
        <label className="block text-[12.5px] font-semibold text-[#888] mb-1.5">Claude API key</label>
        <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full border border-[#E2E2E2] rounded-[11px] px-[14px] py-3 text-sm font-mono text-[#444] mb-4 focus:border-[#2D6AE0] focus:outline-none" />
        <label className="block text-[12.5px] font-semibold text-[#888] mb-1.5">OpenAI API key <span className="text-[#B0B0B0] font-normal">· coming soon</span></label>
        <input placeholder="Available when ChatGPT support ships" disabled className="w-full border border-[#EEE] rounded-[11px] px-[14px] py-3 text-sm bg-[#FAFAFA] text-[#B0B0B0]" />
      </div>

      {/* Saved custom personas */}
      <div className="bg-white border border-[#ECECEC] rounded-[16px] p-[26px] mb-[18px]">
        <div className="text-base font-semibold mb-1">Saved custom personas</div>
        <div className="text-[13.5px] text-[#999] mb-[18px]">Reuse these across future analyses.</div>
        <div className="flex flex-col gap-2.5">
          {savedPersonas.map(p => (
            <div key={p.initials} className="flex items-start justify-between gap-3 border border-[#F0F0F0] rounded-[11px] px-[15px] py-[13px]">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-[34px] h-[34px] rounded-[9px] bg-[#EEF3FE] text-[#2D6AE0] flex items-center justify-center text-[12px] font-bold flex-shrink-0">{p.initials}</div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{p.title}</div>
                  <div className="text-[12.5px] text-[#999]">{p.desc}</div>
                </div>
              </div>
              <span onClick={() => setSavedPersonas(sp => sp.filter(x => x.initials !== p.initials))} className="text-[13px] text-[#C2543A] cursor-pointer hover:opacity-80 flex-shrink-0">Remove</span>
            </div>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white border border-[#ECECEC] rounded-[16px] p-[26px] mb-[18px]">
        <div className="text-base font-semibold mb-[18px]">Preferences</div>
        {[
          { label: 'Default number of personas', value: '8' },
          { label: 'Preferred AI model', value: 'Claude' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-3 border-b border-[#F4F4F4]">
            <span className="text-sm text-[#444]">{label}</span>
            <span className="text-sm font-semibold text-[#1b1b1b]">{value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between py-3">
          <span className="text-sm text-[#444]">Email me when an analysis completes</span>
          <div onClick={() => setEmailNotifs(!emailNotifs)} className={`w-[46px] h-[26px] rounded-full relative cursor-pointer transition-colors ${emailNotifs ? 'bg-[#2D6AE0]' : 'bg-[#E4E4E4]'}`}>
            <div className={`absolute top-[3px] w-5 h-5 rounded-full bg-white transition-all ${emailNotifs ? 'left-[23px]' : 'left-[3px]'}`} />
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="bg-white border border-[#ECECEC] rounded-[16px] p-[26px]">
        <div className="text-base font-semibold mb-[18px]">Account</div>
        <div className="flex items-center gap-[14px] mb-[18px]">
          <div className="w-12 h-12 rounded-full bg-[#EEF3FE] text-[#2D6AE0] flex items-center justify-center text-base font-bold">AK</div>
          <div>
            <div className="text-[15px] font-semibold">Alex Kim</div>
            <div className="text-[13px] text-[#999]">alex@company.com</div>
          </div>
        </div>
        <div className="flex gap-2.5">
          {['Profile', 'Billing', 'Team'].map(btn => (
            <button key={btn} className="bg-white border border-[#DADADA] text-[#444] rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-semibold cursor-pointer hover:bg-[#F8F8F8]">{btn}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
