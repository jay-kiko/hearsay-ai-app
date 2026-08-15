import type { Overview, Persona, PersonaResult, Product } from './types';

function csvValue(value: string | number): string {
  const str = String(value);
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function csvRow(values: (string | number)[]): string {
  return values.map(csvValue).join(',') + '\r\n';
}

export function buildReportCsv(args: {
  brand: string;
  industry: string;
  overview: Overview;
  products: Product[];
  personas: Persona[];
  results: Record<string, PersonaResult>;
}): string {
  const { brand, industry, overview, products, personas, results } = args;
  let csv = '';

  csv += csvRow(['Brand', 'Industry', 'Visibility Score', 'Mention Rate', 'Avg Sentiment', 'Top Competitor']);
  csv += csvRow([
    brand,
    industry,
    overview.visibilityScore,
    `${overview.mentioned}/${overview.total}`,
    overview.avgSentiment,
    overview.topCompetitor ?? '',
  ]);
  csv += '\r\n';

  csv += csvRow(['Product', 'Mentions', 'Share %']);
  for (const p of products) csv += csvRow([p.name, p.count, p.share]);
  csv += '\r\n';

  csv += csvRow(['Persona', 'Mentioned', 'Sentiment', 'Visibility', 'Rank', 'Prompt', 'Quote']);
  for (const p of personas.filter(p => p.selected)) {
    const r = results[p.id];
    if (!r) continue;
    csv += csvRow([p.title, r.mentioned ? 'Yes' : 'No', r.sentiment, r.vis, r.rank ?? '', r.prompt, r.quote]);
  }

  return csv;
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
