import type { Persona, AIModel, PersonaResult, HistoryEntry, Product, Citation, Publisher, Community, SitelistEntry, AccessCode } from './types';

export const INITIAL_ACCESS_CODES: AccessCode[] = [
  { code: 'HEARSAY-PREVIEW', usesTotal: 25, usesRemaining: 25, createdAt: 'Aug 1, 2026' },
  { code: 'DEMO-2026', usesTotal: 5, usesRemaining: 3, createdAt: 'Aug 8, 2026' },
];

export const INDUSTRIES = [
  'Project Management Software',
  'CRM Software',
  'Cloud Hosting & Infrastructure',
  'Design Tools',
  'Marketing Automation',
  'Analytics Platforms',
  'Customer Support Software',
];

export const INITIAL_PERSONAS: Persona[] = [
  { id: 'p1', title: 'Enterprise CTO', initials: 'EC', desc: 'Evaluates tools that scale securely and integrate cleanly.', role: 'Owns technology strategy at a 5,000-person organization.', pains: 'Vendor lock-in, lengthy security reviews, integration debt.', criteria: 'SOC 2, SSO, API depth, roadmap stability.', selected: true, expanded: false },
  { id: 'p2', title: 'Marketing Director', initials: 'MD', desc: 'Wants visibility into campaigns and team workload.', role: 'Leads a 20-person marketing organization.', pains: 'Scattered tools, unclear reporting, missed deadlines.', criteria: 'Dashboards, integrations, fast adoption.', selected: true, expanded: false },
  { id: 'p3', title: 'Startup Founder', initials: 'SF', desc: 'Needs an affordable tool that grows with the team.', role: 'Running a seed-stage startup of eight.', pains: 'Tight budget, wearing many hats, no time to evaluate.', criteria: 'Price, speed to value, generous free tier.', selected: true, expanded: false },
  { id: 'p4', title: 'Developer', initials: 'DE', desc: 'Cares about API quality, docs, and automation.', role: 'Senior engineer wiring up internal tooling.', pains: 'Flaky APIs, poor docs, brittle integrations.', criteria: 'API design, webhooks, docs, CLI.', selected: true, expanded: false },
  { id: 'p5', title: 'Procurement Manager', initials: 'PM', desc: 'Compares vendors on total cost and compliance.', role: 'Manages company-wide software purchasing.', pains: 'Hidden costs, contract risk, weak SLAs.', criteria: 'TCO, compliance docs, support SLAs.', selected: true, expanded: false },
  { id: 'p6', title: 'Small Business Owner', initials: 'SB', desc: 'Wants something simple that just works.', role: 'Owns a 12-person creative agency.', pains: 'No time to learn complex software.', criteria: 'Simplicity, price, friendly support.', selected: true, expanded: false },
  { id: 'p7', title: 'Freelance Consultant', initials: 'FC', desc: 'Juggles multiple clients and projects at once.', role: 'Independent consultant, several active clients.', pains: 'Context switching, client billing, separate workspaces.', criteria: 'Multi-workspace, low cost, portability.', selected: true, expanded: false },
  { id: 'p8', title: 'Product Manager', initials: 'PM', desc: 'Coordinates roadmaps and dependencies across teams.', role: 'PM at a growth-stage SaaS company.', pains: 'Misaligned teams, status chaos, no single source of truth.', criteria: 'Roadmapping, dependencies, flexible views.', selected: true, expanded: false },
];

export const INITIAL_MODELS: AIModel[] = [
  { id: 'claude', name: 'Claude', vendor: 'Anthropic — conversational AI', available: true, enabled: true, badge: 'Selected', mono: 'C' },
  { id: 'gpt', name: 'ChatGPT', vendor: 'OpenAI', available: false, enabled: false, badge: 'Coming soon', mono: 'G' },
  { id: 'gemini', name: 'Gemini', vendor: 'Google DeepMind', available: false, enabled: false, badge: 'Coming soon', mono: 'G' },
  { id: 'perplexity', name: 'Perplexity', vendor: 'Answer engine', available: false, enabled: false, badge: 'Coming soon', mono: 'P' },
  { id: 'grok', name: 'Grok', vendor: 'xAI', available: false, enabled: false, badge: 'Coming soon', mono: 'Gr' },
  { id: 'copilot', name: 'Copilot', vendor: 'Microsoft', available: false, enabled: false, badge: 'Coming soon', mono: 'Co' },
  { id: 'deepseek', name: 'DeepSeek', vendor: 'Open-weight model', available: false, enabled: false, badge: 'New', mono: 'DS' },
];

export const RESULTS: Record<string, PersonaResult> = {
  p1: { prompt: 'As an Enterprise CTO evaluating project management platforms for a 5,000-person organization, which tools would you shortlist and why?', mentioned: true, sentiment: 'Positive', vis: 84, rank: 2, quote: 'Strong fit for security-conscious enterprise teams.', parts: [{ text: 'For an organization that size, the platforms that consistently come up are ', kind: 'normal' }, { text: 'Asana', kind: 'competitor' }, { text: ', ', kind: 'normal' }, { text: 'Monday.com', kind: 'competitor' }, { text: ', and ', kind: 'normal' }, { text: 'Flowstate', kind: 'brand' }, { text: '. ', kind: 'normal' }, { text: 'Flowstate', kind: 'brand' }, { text: ' stands out for enterprise SSO, granular permissions, and a mature API — a strong fit for security-conscious teams.', kind: 'normal' }] },
  p2: { prompt: 'I lead a 20-person marketing team and need better visibility into campaigns and workload. Which project management tools do you recommend?', mentioned: true, sentiment: 'Positive', vis: 76, rank: 2, quote: 'Reporting dashboards suit marketing teams well.', parts: [{ text: 'For a marketing team focused on visibility, I\'d look at ', kind: 'normal' }, { text: 'Flowstate', kind: 'brand' }, { text: ', ', kind: 'normal' }, { text: 'Asana', kind: 'competitor' }, { text: ', and ', kind: 'normal' }, { text: 'Monday.com', kind: 'competitor' }, { text: '. ', kind: 'normal' }, { text: 'Flowstate', kind: 'brand' }, { text: '\'s reporting dashboards and workload views are particularly well suited to campaign planning.', kind: 'normal' }] },
  p3: { prompt: 'I\'m a startup founder looking for an affordable project management tool that scales. What should I consider?', mentioned: true, sentiment: 'Neutral', vis: 61, rank: 3, quote: 'Capable, though pricing climbs as you scale.', parts: [{ text: 'On a startup budget, ', kind: 'normal' }, { text: 'ClickUp', kind: 'competitor' }, { text: ' and ', kind: 'normal' }, { text: 'Notion', kind: 'competitor' }, { text: ' offer generous free tiers. ', kind: 'normal' }, { text: 'Flowstate', kind: 'brand' }, { text: ' is capable and scales well, though its pricing can climb as your team grows.', kind: 'normal' }] },
  p4: { prompt: 'As a developer integrating project tooling, which platforms have the best APIs and automation?', mentioned: true, sentiment: 'Positive', vis: 80, rank: 1, quote: 'Best-in-class API and automation support.', parts: [{ text: 'From a developer\'s perspective, ', kind: 'normal' }, { text: 'Flowstate', kind: 'brand' }, { text: ' has best-in-class API design with clean webhooks and a solid CLI. ', kind: 'normal' }, { text: 'Asana', kind: 'competitor' }, { text: '\'s API is also strong, but ', kind: 'normal' }, { text: 'Flowstate', kind: 'brand' }, { text: ' tends to be easier to automate against.', kind: 'normal' }] },
  p5: { prompt: 'Comparing project management vendors on total cost and compliance, what are the leading options?', mentioned: false, sentiment: 'Neutral', vis: 0, rank: null, quote: 'Not surfaced among cost & compliance leaders.', parts: [{ text: 'On total cost of ownership and compliance, the names that lead are ', kind: 'normal' }, { text: 'Asana', kind: 'competitor' }, { text: ', ', kind: 'normal' }, { text: 'Monday.com', kind: 'competitor' }, { text: ', and ', kind: 'normal' }, { text: 'Smartsheet', kind: 'competitor' }, { text: ', which publish detailed compliance documentation and enterprise pricing.', kind: 'normal' }] },
  p6: { prompt: 'I run a small agency and want a simple project tool that just works. Any suggestions?', mentioned: true, sentiment: 'Positive', vis: 70, rank: 2, quote: 'Clean and simple — easy to onboard.', parts: [{ text: 'For a small agency that wants simplicity, ', kind: 'normal' }, { text: 'Trello', kind: 'competitor' }, { text: ' and ', kind: 'normal' }, { text: 'Flowstate', kind: 'brand' }, { text: ' are both easy to onboard. ', kind: 'normal' }, { text: 'Flowstate', kind: 'brand' }, { text: ' gives you room to grow without feeling heavy on day one.', kind: 'normal' }] },
  p7: { prompt: 'As a freelance consultant juggling several clients, which project tools handle multiple workspaces affordably?', mentioned: false, sentiment: 'Neutral', vis: 0, rank: null, quote: 'Absent from freelancer recommendations.', parts: [{ text: 'For juggling multiple clients affordably, freelancers tend to reach for ', kind: 'normal' }, { text: 'Notion', kind: 'competitor' }, { text: ' and ', kind: 'normal' }, { text: 'ClickUp', kind: 'competitor' }, { text: ', which handle multi-workspace setups on low-cost plans.', kind: 'normal' }] },
  p8: { prompt: 'As a product manager coordinating roadmaps across teams, which platforms best handle dependencies and multiple views?', mentioned: true, sentiment: 'Positive', vis: 82, rank: 1, quote: 'Standout roadmap and dependency views.', parts: [{ text: 'For roadmap coordination, ', kind: 'normal' }, { text: 'Flowstate', kind: 'brand' }, { text: ' excels with dependency mapping and multiple board views. ', kind: 'normal' }, { text: 'Asana', kind: 'competitor' }, { text: ' and ', kind: 'normal' }, { text: 'Monday.com', kind: 'competitor' }, { text: ' are comparable, but ', kind: 'normal' }, { text: 'Flowstate', kind: 'brand' }, { text: '\'s timeline view is a standout for PMs.', kind: 'normal' }] },
};

export const HISTORY: HistoryEntry[] = [
  { id: 'h1', date: 'Jun 28, 2026', brand: 'Flowstate', industry: 'Project Management', personas: 8, models: 'Claude', score: '72', scoreColor: '#2D6AE0', status: 'Complete' },
  { id: 'h2', date: 'Jun 25, 2026', brand: 'Notion', industry: 'Productivity', personas: 6, models: 'Claude', score: '81', scoreColor: '#1E9E6A', status: 'Complete' },
  { id: 'h3', date: 'Jun 22, 2026', brand: 'Linear', industry: 'Dev Tools', personas: 5, models: 'Claude', score: '68', scoreColor: '#2D6AE0', status: 'Complete' },
  { id: 'h4', date: 'Jun 19, 2026', brand: 'Figma', industry: 'Design Tools', personas: 8, models: 'Claude', score: '90', scoreColor: '#1E9E6A', status: 'Complete' },
  { id: 'h5', date: 'Jun 15, 2026', brand: 'Vercel', industry: 'Cloud Hosting', personas: 7, models: 'Claude', score: '77', scoreColor: '#2D6AE0', status: 'Complete' },
];

export const SAMPLE_PROMPTS = [
  'As a startup founder evaluating project management tools, which platforms would you recommend and why?',
  'I\'m an enterprise CTO looking for a scalable PM platform with strong security. What should I consider?',
  'What project management software is best for a small creative agency?',
];

export const PRODUCTS: Product[] = [
  { name: 'Asana', count: 7, share: 26 },
  { name: 'Flowstate', count: 6, share: 22, isBrand: true },
  { name: 'Monday.com', count: 5, share: 18 },
  { name: 'ClickUp', count: 4, share: 15 },
  { name: 'Notion', count: 4, share: 12 },
  { name: 'Smartsheet', count: 2, share: 4 },
  { name: 'Trello', count: 2, share: 3 },
];

export const CITATIONS: Citation[] = [
  { domain: 'g2.com', title: 'G2 — Project Management Software Reviews & Rankings', count: 5 },
  { domain: 'capterra.com', title: 'Capterra — Best Project Management Tools 2026', count: 4 },
  { domain: 'reddit.com/r/projectmanagement', title: 'r/projectmanagement — tool comparison threads', count: 3 },
  { domain: 'trustradius.com', title: 'TrustRadius — Verified user reviews', count: 3 },
  { domain: 'producthunt.com', title: 'Product Hunt — launch discussion & upvotes', count: 2 },
  { domain: 'techcrunch.com', title: 'TechCrunch — coverage of workplace software', count: 2 },
];

export const PUBLISHERS: Publisher[] = [
  { name: 'TechCrunch', type: 'Tech news', mentions: 3 },
  { name: 'The Verge', type: 'Tech news', mentions: 2 },
  { name: 'PCMag', type: 'Review outlet', mentions: 2 },
  { name: 'G2', type: 'Review platform', mentions: 5 },
  { name: 'Capterra', type: 'Review platform', mentions: 4 },
  { name: 'Zapier Blog', type: 'Vendor blog', mentions: 2 },
];

export const COMMUNITIES: Community[] = [
  { name: 'r/projectmanagement', platform: 'Reddit', mentions: 3 },
  { name: 'r/SaaS', platform: 'Reddit', mentions: 2 },
  { name: 'Hacker News', platform: 'HN', mentions: 2 },
  { name: 'Indie Hackers', platform: 'Forum', mentions: 1 },
  { name: 'Product Hunt Discussions', platform: 'Product Hunt', mentions: 2 },
];

export const SITELIST: SitelistEntry[] = [
  { name: 'G2', category: 'Review platform', score: 92, inventory: ['Display', 'Native', 'Newsletter'], availability: 'US, UK, EU', cpm: '$18–26', buyable: true },
  { name: 'Capterra', category: 'Review platform', score: 88, inventory: ['Display', 'Native', 'PMP'], availability: 'US, UK, EU, APAC', cpm: '$16–22', buyable: true },
  { name: 'TrustRadius', category: 'Review platform', score: 79, inventory: ['Display', 'Newsletter'], availability: 'US, UK', cpm: '$14–20', buyable: true },
  { name: 'TechCrunch', category: 'Tech news', score: 85, inventory: ['Display', 'Video', 'Newsletter'], availability: 'Global', cpm: '$22–34', buyable: true },
  { name: 'The Verge', category: 'Tech news', score: 74, inventory: ['Display', 'Video'], availability: 'US, UK', cpm: '$20–30', buyable: true },
  { name: 'PCMag', category: 'Review outlet', score: 68, inventory: ['Display', 'Native'], availability: 'US', cpm: '$12–18', buyable: true },
  { name: 'Zapier Blog', category: 'Vendor blog', score: 61, inventory: ['Native', 'Newsletter'], availability: 'Global', cpm: '$9–14', buyable: true },
  { name: 'Product Hunt', category: 'Community', score: 70, inventory: ['Native', 'Newsletter'], availability: 'Global', cpm: '$8–12', buyable: true },
  { name: 'r/projectmanagement', category: 'Community', score: 58, inventory: ['Native'], availability: 'Global', cpm: '—', buyable: false },
  { name: 'Hacker News', category: 'Community', score: 55, inventory: ['Native'], availability: 'Global', cpm: '—', buyable: false },
  { name: 'Indie Hackers', category: 'Community', score: 42, inventory: ['Native', 'Newsletter'], availability: 'Global', cpm: '$6–9', buyable: true },
];
