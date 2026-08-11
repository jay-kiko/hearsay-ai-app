import type { Persona, AIModel, HistoryEntry } from './types';

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

export const HISTORY: HistoryEntry[] = [
  { id: 'h1', date: 'Jun 28, 2026', brand: 'Flowstate', industry: 'Project Management', personas: 8, models: 'Claude', score: '72', scoreColor: '#2D6AE0', status: 'Complete' },
  { id: 'h2', date: 'Jun 25, 2026', brand: 'Notion', industry: 'Productivity', personas: 6, models: 'Claude', score: '81', scoreColor: '#1E9E6A', status: 'Complete' },
  { id: 'h3', date: 'Jun 22, 2026', brand: 'Linear', industry: 'Dev Tools', personas: 5, models: 'Claude', score: '68', scoreColor: '#2D6AE0', status: 'Complete' },
  { id: 'h4', date: 'Jun 19, 2026', brand: 'Figma', industry: 'Design Tools', personas: 8, models: 'Claude', score: '90', scoreColor: '#1E9E6A', status: 'Complete' },
  { id: 'h5', date: 'Jun 15, 2026', brand: 'Vercel', industry: 'Cloud Hosting', personas: 7, models: 'Claude', score: '77', scoreColor: '#2D6AE0', status: 'Complete' },
];
