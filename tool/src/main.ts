import '../../style.css';
import matrix from '../../dist/matrix.json';

type Row = {
  slug: string;
  entity_name: string;
  photo_volume: string;
  export_platforms: string;
  accuracy_risk: string;
  recommended_tool: string;
  est_time_saved_mins: string;
  common_mistake: string;
  time_savings_score: string;
};

const rows = matrix as Row[];

const riskByGoods: Record<string, string> = {
  household: 'Low',
  collectibles: 'Med',
  highvalue: 'High',
  industrial: 'Med',
};
const volumeByAnswer: Record<string, string> = {
  small: 'Low',
  medium: 'Med',
  large: 'High',
};

const form = document.getElementById('quiz') as HTMLFormElement;
const results = document.getElementById('results') as HTMLElement;

function currentAnswers(): Record<string, string> {
  const data = new FormData(form);
  return {
    goods: (data.get('goods') as string) || '',
    volume: (data.get('volume') as string) || '',
    platform: (data.get('platform') as string) || '',
  };
}

function syncHash(a: Record<string, string>) {
  const parts: string[] = [];
  if (a.goods) parts.push(`g=${a.goods}`);
  if (a.volume) parts.push(`v=${a.volume}`);
  if (a.platform) parts.push(`p=${encodeURIComponent(a.platform)}`);
  location.hash = parts.join('&');
}

function readHash(): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = location.hash.replace(/^#/, '');
  for (const part of raw.split('&')) {
    const [k, v] = part.split('=');
    if (k && v) out[k] = decodeURIComponent(v);
  }
  return out;
}

function scoreRow(row: Row, a: Record<string, string>): { score: number; max: number; reasons: string[] } {
  let score = 0;
  let max = 7;
  const reasons: string[] = [];

  if (row.accuracy_risk === riskByGoods[a.goods]) { score += 3; reasons.push('accuracy demand matches your goods'); }
  if (row.photo_volume === volumeByAnswer[a.volume]) { score += 2; reasons.push('built for your lot volume'); }
  if (row.export_platforms.split(', ').includes(a.platform)) { score += 2; reasons.push(`exports to ${a.platform}`); }
  if (a.goods === 'industrial') {
    max += 2;
    if (/BidSpotter|Proxibid/.test(row.export_platforms)) { score += 2; reasons.push('handles heavy-equipment spec fields'); }
  }
  return { score, max, reasons };
}

function render() {
  const a = currentAnswers();
  syncHash(a);

  if (!a.goods || !a.volume || !a.platform) {
    results.innerHTML = '<p class="method-note">Answer all three questions above to see your ranked shortlist. Your answers stay in this browser tab and in the page link — nothing is uploaded.</p>';
    return;
  }

  const scored = rows
    .map((row) => ({ row, ...scoreRow(row, a) }))
    .sort((x, y) => y.score - x.score || Number(y.row.time_savings_score) - Number(x.row.time_savings_score))
    .slice(0, 3);

  const items = scored
    .map(
      (s) => `
      <li>
        <h3><a href="../${s.row.slug}/">${s.row.entity_name}</a></h3>
        <p class="why">Match ${s.score}/${s.max} — ${s.reasons.join('; ')}. Estimated saving: ${s.row.est_time_saved_mins} min per lot with ${s.row.recommended_tool}. Watch for: ${s.row.common_mistake.toLowerCase()}.</p>
      </li>`
    )
    .join('');

  results.innerHTML = `
    <h2>Your shortlist</h2>
    <ol>${items}</ol>
    <p class="method-note"><strong>Method &amp; limits:</strong> Ranking matches your three answers against per-workflow attributes in our 40-row dataset (accuracy risk +3, lot volume +2, export platform +2, heavy-equipment bonus +2; ties broken by estimated time savings). All dataset figures are labeled estimates, last checked 2026-10-18 — not measured guarantees. Use this as a starting shortlist, then read the linked workflow page before committing.</p>
  `;
}

form.addEventListener('change', render);

// Restore answers from a shared link
const saved = readHash();
if (saved.g) (form.querySelector(`input[name="goods"][value="${saved.g}"]`) as HTMLInputElement | null)?.click();
if (saved.v) (form.querySelector(`input[name="volume"][value="${saved.v}"]`) as HTMLInputElement | null)?.click();
if (saved.p) (form.querySelector(`input[name="platform"][value="${saved.p}"]`) as HTMLInputElement | null)?.click();
render();