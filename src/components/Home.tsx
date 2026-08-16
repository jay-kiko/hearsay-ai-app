import kikologo from "../assets/kiko-logo.png"

interface HomeProps {
  query: string;
  onQuery: (val: string) => void;
  onStartWizard: () => void;
  detecting: boolean;
  detectError: string | null;
  detectMessage: string;
  searchRef: React.RefObject<HTMLTextAreaElement>;
}

const PILLS = [
  'SaaS CRM tools',
  'Cloud hosting providers',
  'Project management apps',
  'Design tools',
];

/* ─── Hero ─────────────────────────────────────────────────────────────── */

function Hero({ query, onQuery, onStartWizard, detecting, detectError, detectMessage, searchRef }: HomeProps) {
  return (
    <div className="max-w-[780px] mx-auto px-4 sm:px-6 py-14 sm:py-[84px] pb-16 sm:pb-[100px] text-center animate-fadeUp">
      <div className="flex items-center justify-center gap-2 text-[28px] sm:text-[36px]">
        <span>hearsay<span className="text-[32px] sm:text-[42px] font-bold">.</span>ai</span>
        <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-[#2D6AE0] bg-[#EEF3FE] rounded-full px-2 py-[3px] self-start mt-1.5">Beta</span>
      </div>
      <div className="inline-flex items-center gap-[9px] bg-white border border-[#ECECEC] rounded-full px-[14px] py-1.5 pl-1.5 mb-[30px] max-w-full">
        <span className="bg-[#2D6AE0] text-white text-[10.5px] font-bold tracking-[0.05em] rounded-full px-2 py-[3px] flex-shrink-0">NEW</span>
        <span className="text-[12px] sm:text-[13px] text-[#555] text-left">Now analyzing visibility across buyer personas</span>
      </div>

      <h1 className="text-[32px] sm:text-[54px] leading-[1.1] sm:leading-[1.05] tracking-[-0.03em] font-bold m-0 mb-5">
        See what AI really<br />says about your brand.
      </h1>
      <p className="text-[15.5px] sm:text-[18px] leading-[1.55] text-[#666] max-w-[560px] mx-auto mb-8 sm:mb-10">
        hearsay.ai shows you how leading AI models perceive, recommend, and position your brand — across the buyer personas that actually ask about your category.
      </p>

      <div className={`bg-white border rounded-[20px] p-2 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.12)] text-left transition-colors ${detecting ? 'border-[#2D6AE0]/30' : 'border-[#E6E6E6]'}`}>
        <textarea
          ref={searchRef}
          value={query}
          onChange={e => onQuery(e.target.value)}
          placeholder="Describe the brand or product you want to evaluate..."
          disabled={detecting}
          className={`w-full border-none resize-none text-base leading-relaxed px-4 pt-4 pb-2 h-[84px] text-[#222] bg-transparent transition-opacity ${detecting ? 'opacity-50' : ''}`}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !detecting) onStartWizard(); }}
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 pb-3 sm:pb-2 pt-1.5">
          <span className={`text-[12.5px] ${detecting ? 'text-[#2D6AE0] font-medium' : 'text-[#9A9A9A]'}`}>
            {detecting ? detectMessage : "We'll handle the hard part — personas, prompts, and analysis."}
          </span>
          <button
            onClick={onStartWizard}
            disabled={detecting}
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[#2D6AE0] text-white border-none rounded-[11px] px-5 py-[11px] text-sm font-semibold cursor-pointer hover:bg-[#2560d0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {detecting
              ? <><span className="w-[15px] h-[15px] border-2 border-white/40 border-t-white rounded-full animate-spin-slow inline-block flex-shrink-0" />Analyzing…</>
              : <>Analyze <span className="text-[15px]">→</span></>
            }
          </button>
        </div>
      </div>
      {detectError && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-[13px]">
          <span className="text-[#C2543A]">{detectError}</span>
          <button onClick={onStartWizard} className="text-[#2D6AE0] font-semibold cursor-pointer hover:opacity-80 underline underline-offset-2 bg-transparent border-none p-0">Try again →</button>
        </div>
      )}

      <div className="flex flex-wrap gap-2.5 justify-center mt-6">
        {PILLS.map(pill => (
          <span key={pill} onClick={() => onQuery(pill)} className="text-[13px] text-[#555] bg-white border border-[#E6E6E6] rounded-full px-4 py-2 cursor-pointer hover:border-[#2D6AE0] hover:text-[#2D6AE0] transition-colors">
            {pill}
          </span>
        ))}
      </div>

      <div className="mt-16 flex gap-9 justify-center text-[#9A9A9A] text-[13px]">
        <div className="relative group inline-block">
          <span className="opacity-50 cursor-not-allowed">View past analyses →</span>
          <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap rounded-[8px] bg-[#1b1b1b] px-3 py-1.5 text-[12px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 z-10">
            Coming soon
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Product ────────────────────────────────────────────────────────────── */

const HOW_IT_WORKS = [
  { step: '01', icon: '✏️', title: 'Describe your brand', body: 'Tell us your brand, product category, and key competitors in plain language. No configuration required.' },
  { step: '02', icon: '🤖', title: 'AI queries at scale', body: 'We generate hundreds of realistic buyer prompts and run them through leading AI models on your behalf.' },
  { step: '03', icon: '📊', title: 'Get clarity fast', body: 'Receive visibility scores, sentiment breakdowns, and competitor comparisons — ready in under two minutes.' },
];

const FEATURES = [
  { icon: '👥', title: 'Buyer persona coverage', body: 'Pre-built personas for every role — CTO, founder, procurement, marketer — or build your own.' },
  { icon: '⚡', title: 'Multi-model support', body: 'Compare your visibility across Claude, ChatGPT, Gemini, Perplexity, and more in a single run.' },
  { icon: '📈', title: 'Trend tracking', body: 'Run analyses on a schedule and watch your AI visibility improve over time as you publish content.' },
  { icon: '🔌', title: 'Export & integrate', body: 'Download PDF or CSV reports, or push data to your BI tool via our API.' },
];

function SectionProduct() {
  return (
    <section id="section-product" className="border-t border-[#ECECEC] py-16 sm:py-[96px] px-4 sm:px-6">
      <div className="max-w-[960px] mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <span className="text-[12.5px] font-bold tracking-[0.08em] text-[#2D6AE0] uppercase">How it works</span>
          <h2 className="text-[28px] sm:text-[40px] font-bold tracking-[-0.025em] mt-3 mb-4">From query to clarity<br />in under 2 minutes.</h2>
          <p className="text-[15.5px] sm:text-[17px] text-[#666] max-w-[520px] mx-auto leading-relaxed">No prompt engineering. No spreadsheets. Just paste your brand and we handle the rest.</p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12 sm:mb-20">
          {HOW_IT_WORKS.map(s => (
            <div key={s.step} className="relative">
              <div className="text-[11px] font-bold tracking-[0.1em] text-[#CCCCCC] mb-3">{s.step}</div>
              <div className="text-2xl mb-3">{s.icon}</div>
              <div className="text-[17px] font-semibold text-[#1b1b1b] mb-2">{s.title}</div>
              <div className="text-[14.5px] text-[#777] leading-relaxed">{s.body}</div>
            </div>
          ))}
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white border border-[#ECECEC] rounded-[16px] p-6 flex gap-4">
              <span className="text-2xl flex-shrink-0">{f.icon}</span>
              <div>
                <div className="text-[15px] font-semibold text-[#1b1b1b] mb-1">{f.title}</div>
                <div className="text-[13.5px] text-[#777] leading-relaxed">{f.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Use Cases ─────────────────────────────────────────────────────────── */

const USE_CASES = [
  {
    audience: 'Brand & Marketing Teams',
    icon: '📣',
    headline: 'Own your AI narrative before your competitors do.',
    points: ['Audit how AI describes your brand vs. competitors', 'Track sentiment changes after a campaign or product launch', 'Identify gaps in messaging that AI surfaces to buyers'],
    tag: 'Brand Strategy',
  },
  {
    audience: 'Founders & GTM Leaders',
    icon: '🚀',
    headline: 'Know exactly how AI positions you in your category.',
    points: ['Understand where you rank when buyers ask for recommendations', 'Run competitive intelligence at scale without manual work', 'Align sales decks with what AI actually says about you'],
    tag: 'Go-to-Market',
  },
  {
    audience: 'Analysts & Researchers',
    icon: '🔬',
    headline: 'Systematic AI perception data at your fingertips.',
    points: ['Build repeatable AI visibility benchmarks for clients', 'Compare LLM outputs across models and personas in bulk', 'Export clean datasets for deeper analysis or reporting'],
    tag: 'Research & Analytics',
  },
];

function SectionUseCases() {
  return (
    <section id="section-usecases" className="bg-[#F7F9FF] border-t border-[#ECECEC] py-16 sm:py-[96px] px-4 sm:px-6">
      <div className="max-w-[960px] mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <span className="text-[12.5px] font-bold tracking-[0.08em] text-[#2D6AE0] uppercase">Use Cases</span>
          <h2 className="text-[28px] sm:text-[40px] font-bold tracking-[-0.025em] mt-3 mb-4">Built for teams that<br />live by AI visibility.</h2>
          <p className="text-[15.5px] sm:text-[17px] text-[#666] max-w-[480px] mx-auto leading-relaxed">Whether you're in brand, growth, or research — hearsay.ai surfaces the AI intelligence your team needs.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {USE_CASES.map(uc => (
            <div key={uc.audience} className="bg-white border border-[#ECECEC] rounded-[18px] p-7 flex flex-col">
              <span className="inline-block bg-[#EEF3FE] text-[#2D6AE0] text-[11px] font-bold tracking-[0.06em] uppercase rounded-full px-3 py-1 mb-5 self-start">{uc.tag}</span>
              <div className="text-3xl mb-4">{uc.icon}</div>
              <div className="text-[16px] font-semibold text-[#1b1b1b] mb-4 leading-snug">{uc.headline}</div>
              <ul className="mt-auto space-y-2.5">
                {uc.points.map(pt => (
                  <li key={pt} className="flex items-start gap-2.5 text-[13.5px] text-[#666] leading-relaxed">
                    <span className="text-[#2D6AE0] font-bold flex-shrink-0 mt-0.5">→</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ─────────────────────────────────────────────────────────── */

const PLANS = [
  {
    name: 'Free',
    price: '--',
    description: 'For individuals exploring AI visibility for the first time.',
    features: ['5 analyses per month', 'Up to 5 personas per run', 'Claude only', 'PDF export', 'Community support'],
    cta: 'Get started free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '--',
    description: 'For teams actively managing AI brand presence.',
    features: ['Unlimited analyses', 'Up to 15 personas per run', 'All AI models', 'CSV + PDF export', 'Scheduled re-runs', 'Email reports', 'Priority support'],
    cta: 'Start free trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '--',
    description: 'For orgs that need custom limits, SLAs, and white-labelling.',
    features: ['Unlimited everything', 'White-label reports', 'API access', 'SSO / SAML', 'Dedicated CSM', 'Custom model integrations', 'SLA guarantee'],
    cta: 'Talk to sales',
    highlight: false,
  },
];

function SectionPricing() {
  return (
    <section id="section-pricing" className="border-t border-[#ECECEC] py-16 sm:py-[96px] px-4 sm:px-6">
      <div className="max-w-[960px] mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <span className="text-[12.5px] font-bold tracking-[0.08em] text-[#2D6AE0] uppercase">Pricing</span>
          <h2 className="text-[28px] sm:text-[40px] font-bold tracking-[-0.025em] mt-3 mb-4">Simple, transparent pricing.</h2>
          <p className="text-[15.5px] sm:text-[17px] text-[#666] max-w-[420px] mx-auto leading-relaxed">Start free. Scale as your visibility program grows.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`rounded-[20px] p-7 flex flex-col ${plan.highlight ? 'bg-[#2D6AE0] text-white shadow-[0_20px_60px_-12px_rgba(45,106,224,0.4)]' : 'bg-white border border-[#ECECEC]'}`}
            >
              <div className={`text-[12.5px] font-bold uppercase tracking-[0.07em] mb-5 ${plan.highlight ? 'text-[rgba(255,255,255,0.65)]' : 'text-[#999]'}`}>{plan.name}</div>
              <div className="mb-1">
                <span className={`text-[44px] font-bold tracking-[-0.03em] ${plan.highlight ? 'text-white' : 'text-[#141414]'}`}>{plan.price}</span>
              </div>
              <p className={`text-[13.5px] mb-7 leading-relaxed ${plan.highlight ? 'text-[rgba(255,255,255,0.75)]' : 'text-[#777]'}`}>{plan.description}</p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map(f => (
                  <li key={f} className={`flex items-center gap-2.5 text-[13.5px] ${plan.highlight ? 'text-[rgba(255,255,255,0.85)]' : 'text-[#555]'}`}>
                    <span className={`font-bold flex-shrink-0 ${plan.highlight ? 'text-white' : 'text-[#1E9E6A]'}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full rounded-[12px] py-3 text-sm font-semibold transition-colors ${plan.highlight ? 'bg-white text-[#2D6AE0] hover:bg-[#EEF3FE]' : 'bg-[#2D6AE0] text-white hover:bg-[#2560d0]'}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-[13px] text-[#999] mt-8">All plans include a 14-day money-back guarantee. No credit card required to start.</p>
      </div>
    </section>
  );
}

/* ─── Resources ──────────────────────────────────────────────────────────── */

const RESOURCES = [
  {
    type: 'Guide',
    typeColor: 'text-[#2D6AE0] bg-[#EEF3FE]',
    title: 'The AI Visibility Playbook',
    body: 'A step-by-step framework for auditing, improving, and tracking how AI models represent your brand.',
    time: '12 min read',
  },
  {
    type: 'Case Study',
    typeColor: 'text-[#1E9E6A] bg-[#E8F6EF]',
    title: 'How Flowstate boosted AI mention rate by 40% in 60 days',
    body: 'A deep-dive into the content and messaging changes that moved the needle in AI recommendations.',
    time: '8 min read',
  },
  {
    type: 'Blog',
    typeColor: 'text-[#9B59B6] bg-[#F5EEF8]',
    title: 'Why Google SEO alone won\'t save you in 2026',
    body: 'AI search is reshaping how buyers discover products. Here\'s what that means for your visibility strategy.',
    time: '6 min read',
  },
  {
    type: 'Docs',
    typeColor: 'text-[#E67E22] bg-[#FEF5EC]',
    title: 'API Reference',
    body: 'Automate analyses, pull visibility scores, and integrate hearsay.ai data into your own dashboards.',
    time: 'Documentation',
  },
];

function SectionResources() {
  return (
    <section id="section-resources" className="bg-[#F7F9FF] border-t border-[#ECECEC] py-16 sm:py-[96px] px-4 sm:px-6">
      <div className="max-w-[960px] mx-auto">
        <div className="flex items-end justify-between mb-10 sm:mb-12 flex-wrap gap-4">
          <div>
            <span className="text-[12.5px] font-bold tracking-[0.08em] text-[#2D6AE0] uppercase">Resources</span>
            <h2 className="text-[28px] sm:text-[40px] font-bold tracking-[-0.025em] mt-3 mb-2">Learn AI visibility.</h2>
            <p className="text-[15.5px] sm:text-[17px] text-[#666] leading-relaxed">Guides, case studies, and docs to help you win in the AI era.</p>
          </div>
          <span className="text-sm text-[#2D6AE0] font-semibold cursor-pointer hover:opacity-80">View all resources →</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {RESOURCES.map(r => (
            <div key={r.title} className="bg-white border border-[#ECECEC] rounded-[18px] p-7 cursor-pointer hover:border-[#D0D0D0] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] transition-all">
              <span className={`inline-block text-[11px] font-bold uppercase tracking-[0.06em] rounded-full px-3 py-1 mb-5 ${r.typeColor}`}>{r.type}</span>
              <div className="text-[16px] font-semibold text-[#1b1b1b] mb-2.5 leading-snug">{r.title}</div>
              <div className="text-[13.5px] text-[#777] leading-relaxed mb-5">{r.body}</div>
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-[#AAAAAA]">{r.time}</span>
                <span className="text-[13px] text-[#2D6AE0] font-semibold hover:opacity-80">Read →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-[#ECECEC] py-10 px-4 sm:px-9">
      <div className="max-w-[960px] mx-auto flex flex-col sm:flex-row items-center justify-between flex-wrap gap-4 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <img src={kikologo} alt="hearsay.ai" className="h-[45px] w-auto opacity-60" />
        </div>
        <div className="flex gap-6 text-[13px] text-[#999]">
          {['Privacy', 'Terms', 'Security', 'Status'].map(l => (
            <span key={l} className="cursor-pointer hover:text-[#555] transition-colors">{l}</span>
          ))}
        </div>
        <span className="text-[12.5px] text-[#BBBBBB]">© 2026 hearsay.ai. All rights reserved.</span>
      </div>
    </footer>
  );
}

/* ─── Home ──────────────────────────────────────────────────────────────── */

export function Home(props: HomeProps) {
  return (
    <div>
      <Hero {...props} />
      <SectionProduct />
      <SectionUseCases />
      <SectionPricing />
      <SectionResources />
      <Footer />
    </div>
  );
}
