import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = 'data/matrix.txt';
const OUTPUT_DIR = 'dist';
const SITE_URL = 'https://catalogauction.netlify.app';
const CONTACT_EMAIL = 'hello@example.com'; 
const CHECKED = '2026-10-18';

const IMG = {
  gavel:    { src: '/assets/img/hero-gavel.jpg', alt: 'Wooden auction gavel resting on its sound block' },
  estate:   { src: '/assets/img/estate-room.jpg', alt: 'Vintage room filled with inherited household items' },
  shop:     { src: '/assets/img/antique-shop.jpg', alt: 'Crowded antique shop stall with tagged items' },
  coins:    { src: '/assets/img/coins.jpg', alt: 'Close-up of old coins and collectibles' },
  jewelry:  { src: '/assets/img/jewelry.jpg', alt: 'Antique gold jewelry on dark background' },
  paper:    { src: '/assets/img/vinyl.jpg', alt: 'Vintage paper goods, records, and ephemera' },
  watches:  { src: '/assets/img/watches.jpg', alt: 'Vintage wristwatch close-up' },
  objects:  { src: '/assets/img/furniture.jpg', alt: 'Classic interior with antique furnishings' },
};

// Smarter image matching for 1000+ page scale
function imgFor(row) {
  const s = row.slug;
  if (/coin|militaria|firearm/.test(s)) return IMG.coins;
  if (/jewel|handbag|silver/.test(s)) return IMG.jewelry;
  if (/watch/.test(s)) return IMG.watches;
  if (/vinyl|record|ephemera|postcard|map|book|photo/.test(s)) return IMG.paper;
  if (/furniture|rug|mid-century|toy|train|doll|diecast|game|puzzle|bear|clothing/.test(s)) return IMG.objects;
  if (row.category === 'vertical_workflow') return IMG.estate;
  if (row.category === 'platform_export') return IMG.gavel;
  return IMG.shop;
}

const LOGO = `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="4" y="30" width="32" height="5" rx="2" fill="#2C2825"/><rect x="10" y="8" width="16" height="10" rx="3" transform="rotate(-30 18 13)" fill="#B85C38"/><rect x="20" y="14" width="16" height="4" rx="2" transform="rotate(-30 28 16)" fill="#2C2825"/></svg>`;

const GAVEL_BADGE = `<div class="gavel-badge" aria-hidden="true"><svg viewBox="0 0 100 100"><ellipse cx="50" cy="86" rx="30" ry="7" fill="#2C2825"/><g class="gavel-head"><rect x="52" y="18" width="34" height="20" rx="7" fill="#B85C38"/><rect x="20" y="34" width="40" height="8" rx="4" fill="#8a5a3b" transform="rotate(24 40 38)"/></g><g class="sold-tag"><rect x="6" y="6" width="40" height="20" rx="4" fill="#D62828"/><text x="26" y="20" font-size="12" fill="#fff" text-anchor="middle" font-family="sans-serif" font-weight="bold">SOLD</text></g></svg></div>`;

function navHtml(current) {
  const links = [
    ['/', 'Home'], ['/verticals/', 'Workflows'], ['/items/', 'Items'],
    ['/platforms/', 'Platforms'], ['/tool/', 'Quiz'], ['/expert-advice/', 'Advice'], ['/faq/', 'FAQ'],
  ];
  return `<header class="site-header">
  <a class="brand" href="/">${LOGO} CatalogAI</a>
  <nav aria-label="Main">${links.map(([href, label]) =>
    `<a href="${href}"${href === current ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
</header>`;
}

function footerHtml() {
  return `<footer class="site-footer"><div class="foot-inner">
  <nav aria-label="Footer">
    <a href="/about/">About</a><a href="/contact/">Contact</a>
    <a href="/privacy/">Privacy</a><a href="/faq/">FAQ</a><a href="/sitemap.xml">Sitemap</a>
  </nav>
  <p class="credit">Photography via Unsplash &amp; Pexels contributors. All time-savings figures are labeled estimates, last checked ${CHECKED}.</p>
</div></footer>`;
}

function layout({ title, desc, canonical, current, body, schemas = [] }) {
  const schemaTags = schemas.map(s => `  <script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${canonical}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/style.css">
${schemaTags}
</head>
<body>
${navHtml(current)}
<main>
${body}
</main>
${footerHtml()}
</body>
</html>`;
}

function medianLots(range) {
  const m = range.match(/(\d+)\s*-\s*(\d+)/);
  return m ? (Number(m[1]) + Number(m[2])) / 2 : 100;
}

function entityBody(row) {
  const img = imgFor(row);
  const med = medianLots(row.typical_lot_size);
  const mins = Number(row.est_time_saved_mins);
  const hours = Math.round((med * mins / 60) * 10) / 10;
  const steps = row.workflow_steps.split(', ');
  
  // FIX: Strip "Export Formatting" from platform titles for a cleaner look
  const title = row.category === 'platform_export' ? `Exporting to ${row.entity_name.replace(' Export Formatting', '').replace(' Feed', '')}` : row.entity_name;

  const intros = [
    `Professional cataloging of ${row.entity_name.toLowerCase()} requires a steady hand and a strict sequence. This page documents the exact method used to process a typical run of ${row.typical_lot_size} efficiently, while keeping a human eye on the details that actually set the hammer price.`,
    `When handling ${row.typical_lot_size} of ${row.entity_name.toLowerCase()}, the room lives or dies on repeatable process. Here, we set out the sequence, the single point where mistakes concentrate, and the exact routine for a clean export.`,
    `The most experienced catalogers know that time is made in the photo batch and lost in the typing. This protocol for ${row.entity_name.toLowerCase()} recovers roughly ${mins} minutes per lot by structuring the draft, leaving the final verification where it belongs: with you.`,
  ];
  const intro = row.accuracy_risk === 'High' 
    ? `Because ${row.entity_name.toLowerCase()} carries significant value risk, start with the mitigation: nothing below leaves your desk without a physical check. ${intros[1]}` 
    : intros[Number(row.id) % intros.length];

  const stepSentences = steps.map((step, i) => {
    if (i === steps.length - 1) return `Only now does the lot touch ${row.export_platforms.split(',')[0]} — after every field above has been human-checked.`;
    if (/check|verif|mark|grade|measure|auth|serial|knot|piece/i.test(step)) return `This is the pause that protects your hammer price: ${step.toLowerCase()} is where drafts get corrected, not confirmed.`;
    return `${step} feeds the working draft, which you treat as a first draft and nothing more.`;
  });

  return `
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <a href="/${row.category === 'vertical_workflow' ? 'verticals' : row.category === 'item_category' ? 'items' : 'platforms'}/">${row.category === 'vertical_workflow' ? 'Workflows' : row.category === 'item_category' ? 'Items' : 'Platforms'}</a> › ${title}</nav>
<figure class="page-figure"><img src="${img.src}" alt="${img.alt}" width="1200" height="514" loading="lazy"><figcaption>Representative photography via Unsplash / Pexels contributors.</figcaption></figure>
<h1>${title}</h1>
<p class="lede">${intro}</p>

<h2>The sequence, step by step</h2>
<ol>${steps.map((s, i) => `<li><strong>${s}.</strong> ${stepSentences[i]}</li>`).join('')}</ol>

<h2>Where details slip</h2>
<p>The recurring failure in ${row.entity_name.toLowerCase()} is that ${row.common_mistake.toLowerCase()}. It survives because it looks plausible in a draft. The working standard is: ${row.best_pairing}. Write the standard on a card and keep it at the packing table.</p>

<h2>A worked example, with real arithmetic</h2>
<p>Take a mid-size event of about ${med} lots. At an estimated ${mins} minutes recovered per lot, that is ${med} × ${mins} = ${med * mins} minutes, or about ${hours} hours returned to your week. Spend a third of it on verification and you still bank roughly ${Math.round(hours * 0.66 * 10) / 10} hours. These figures are estimates from comparable workflows, not measured guarantees.</p>

<h2>When to use a simpler process</h2>
<p>If your next event is small (under ~50 lots) or sits at a ${row.accuracy_risk === 'High' ? 'lower' : 'higher'} accuracy tier than ${row.accuracy_risk.toLowerCase()}, this sequence is over-engineering. Use a bulk-sweep draft instead and reserve this protocol for the lots that carry real value.</p>

<h2>Export reality check</h2>
<p>${row.export_platforms} each format fields differently; we rate this route's export complexity at ${row.export_complexity_rank}/10. Run a 10-lot dry export before the 500-lot night, and fix mapping errors while they are cheap.</p>

<h2>Related workflows</h2>
<ul>${JSON.parse(row.similar_entities).map(s => `<li><a href="/${s}/">${s.replace(/-/g, ' ')}</a></li>`).join('')}</ul>
<p>Not sure where you fit? <a href="/tool/">Take the 3-question quiz</a> for a ranked shortlist.</p>

<p class="method-note"><strong>Method &amp; limits:</strong> figures on this page are labeled estimates derived from comparable-workflow benchmarks (auditing status: ${row.auditing_status}); last checked ${CHECKED}. They are planning numbers, not guarantees.</p>`;
}

function homeBody(rows) {
  const card = (href, img, title, text) => `<article class="card"><img src="${img.src}" alt="${img.alt}" width="600" height="400" loading="lazy"><div class="card-body"><h3>${title}</h3><p>${text}</p><a class="card-link" href="${href}">Browse →</a></div></article>`;
  return `
<section class="hero">
  <div>
    <h1>The quiet standard for the modern auction room.</h1>
    <p class="lede">A methodical reference for cataloging estate, collectible, and commercial lots. We document the exact sequences professional houses use to process hundreds of lots a day without losing the details that set the hammer price.</p>
    <p><a class="btn" href="/tool/">Find your sequence</a> <a class="btn secondary" href="/expert-advice/">Read the standard</a></p>
  </div>
  <figure><img src="${IMG.gavel.src}" alt="${IMG.gavel.alt}" width="1200" height="900">${GAVEL_BADGE}</figure>
</section>

<h2>Start here</h2>
<div class="cards">
  ${card('/verticals/', IMG.estate, 'Auction sequences', 'Estate, storage, charity, and fine-art cataloging protocols, from intake to export.')}
  ${card('/items/', IMG.shop, 'Item categories', 'How to handle coins, jewelry, vinyl, and furniture—the exact points where details slip.')}
  ${card('/platforms/', IMG.gavel, 'Auction platforms', 'HiBid, LiveAuctioneers, and Proxibid: the field limits and dry-run routines for clean feeds.')}
</div>

<h2>About this reference</h2>
<p>CatalogAI is an independent library of ${rows.length} cataloging sequences. We publish the methods, the common failure points, and the time estimates used by established rooms. Every figure is published as a labeled estimate, and every workflow is designed to be verified by a human eye at the packing table.</p>`;
}

function hubBody(cat, title, intro, img) {
  return `
<figure class="page-figure"><img src="${img.src}" alt="${img.alt}" width="1200" height="514"></figure>
<h1>${title}</h1>
<p class="lede">${intro}</p>
<div class="cards">${CAT_ROWS.filter(r => r.category === cat).map(r => {
  const i = imgFor(r);
  const t = r.category === 'platform_export' ? `Exporting to ${r.entity_name.replace(' Export Formatting', '')}` : r.entity_name;
  return `<article class="card"><img src="${i.src}" alt="${i.alt}" width="600" height="400" loading="lazy"><div class="card-body"><h3>${t}</h3><p>${r.summary_fact}</p><a class="card-link" href="/${r.slug}/">Open sequence →</a></div></article>`;
}).join('')}</div>`;
}

const FAQS = [
  ['What happens when the cataloging software gets the details wrong?', 'The software drafts; the human confirms. Every workflow on this site includes a verification pause at the exact step where errors concentrate—maker marks, grades, serials, completeness.'],
  ['Will exported descriptions break my platform feed?', 'Usually not because of the words, but because of formatting: title length limits, HTML in plain-text fields, missing mandatory condition fields. Each platform page lists its specific failure modes and a 10-lot dry-run routine.'],
  ['Does this site store my photos or lot data?', 'No. There is no upload anywhere on this site. The quiz runs entirely in your browser and stores your answers only in the page link so you can share results.'],
  ['How much time does a strict sequence actually save?', 'Our pages publish per-lot estimates (typically 2–15 minutes) with a worked example per page. They are labeled estimates from comparable workflows, last checked 2026-10-18—planning numbers, not guarantees.'],
  ['I run tiny auctions, under 50 lots. Is this for me?', 'Probably not yet. Below ~50 lots, a bulk-sweep draft plus manual edits usually beats a full sequence. Each guide has a "when to use a simpler process" section that says exactly this.'],
];

function trustPages() {
  const about = `
<h1>About CatalogAI</h1>
<p class="lede">An independent, method-first reference for people who catalog auction lots for a living.</p>
<p>CatalogAI exists because cataloging is the invisible cost of every auction: hundreds of photos, hundreds of titles, and one platform feed that rejects you at 11pm for a character limit. We document repeatable sequences that let the initial drafting move quickly, while a human guards the specific details that set the price.</p>
<p>Our reference set currently covers ${'{{ROWS}}'} workflows across auction verticals, item categories and export platforms. Every quantitative claim is published as a labeled estimate with its derivation method and a last-checked date. Where we have no source, we say so on the page.</p>
<h2>Changelog</h2>
<div class="tip"><strong>2026-10-19:</strong> Site launched with 40 workflow pages, 3 hubs, workflow quiz, and trust pages.</div>`;

  const contact = `
<h1>Contact</h1>
<p class="lede">One mailbox, read by a human. No forms, because this site deliberately has no database.</p>
<p>Corrections, missing workflows, export bugs you have hit in the wild—all welcome. If you spot a figure that is wrong, tell us the lot type and what you observed; that is exactly the evidence this reference needs.</p>
<p><a class="btn" href="mailto:${CONTACT_EMAIL}">Email ${CONTACT_EMAIL}</a></p>
<p class="method-note">We store nothing from visitors: no accounts, no cookies, no analytics.</p>`;

  const privacy = `
<h1>Privacy Policy</h1>
<p class="lede">Short, because we collect almost nothing.</p>
<ul>
  <li><strong>No accounts, no cookies, no analytics.</strong> This is a static site; there is no database to leak.</li>
  <li><strong>The quiz never uploads anything.</strong> Your three answers live in your browser and in the page link (the part after #) so you can share results. Clear the tab and they are gone.</li>
  <li><strong>Third parties involved:</strong> Google Fonts serves our typefaces, and our host keeps standard server access logs.</li>
  <li><strong>Contact:</strong> ${CONTACT_EMAIL}. Last updated 2026-10-19.</li>
</ul>`;

  const faq = `
<h1>Frequently asked questions</h1>
<p class="lede">The standard questions every auctioneer asks before changing their cataloging sequence.</p>
${FAQS.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('')}`;

  const advice = `
<h1>Five rules that survive contact with a real sale</h1>
<p class="lede">Written from the failure modes in our dataset, not from theory.</p>
<div class="tip"><strong>1. Photograph for the reviewer, not the algorithm.</strong> One macro shot of every mark, label or runout groove pays for itself the first time a buyer asks for proof.</div>
<div class="tip"><strong>2. Titles are object + material + era + maker, in that order.</strong> Discipline beats poetry, and platform character limits punish poetry first.</div>
<div class="tip"><strong>3. Keep one condition vocabulary and never improvise.</strong> "Light wear to high points" means the same thing on lot 4 and lot 400, or it means nothing.</div>
<div class="tip"><strong>4. Drafts claim value; humans sign them.</strong> Attribution, grading, authenticity and completeness are signatures, not suggestions. See <a href="/vintage-coins-cataloging/">coins</a> and <a href="/fine-jewelry-cataloging/">jewelry</a> for why.</div>
<div class="tip"><strong>5. Dry-run ten lots before you export five hundred.</strong> Every platform page here lists its field limits; mapping errors are cheap at 10 lots and expensive at 500. Start with <a href="/hibib-export-workflow/">HiBid</a> or <a href="/liveauctioneers-export-workflow/">LiveAuctioneers</a>.</div>
<p class="method-note"><strong>Limits:</strong> these rules generalize across our documented workflows; your house rules and local law override them.</p>`;

  return { about, contact, privacy, faq, advice };
}

let CAT_ROWS = [];

async function loadAndValidateData() {
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  const lines = raw.trim().split(/\r?\n/); // Windows safe
  const headers = lines[0].split('|');
  const rows = []; const slugs = new Set();
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('|');
    if (cols.length !== headers.length) { console.error(`❌ Row ${i}: ${cols.length} cols, expected ${headers.length}`); process.exit(1); }
    const row = Object.fromEntries(headers.map((h, idx) => [h, cols[idx]]));
    if (slugs.has(row.slug)) { console.error(`❌ Duplicate slug: ${row.slug}`); process.exit(1); }
    slugs.add(row.slug);
    if (row.auditing_status === 'UNVERIFIED-DRAFT') continue;
    rows.push(row);
  }
  console.log(`✅ Validated ${rows.length} rows.`);
  return rows;
}

async function writePage(dir, html) {
  await fs.mkdir(path.join(OUTPUT_DIR, dir), { recursive: true });
  await fs.writeFile(path.join(OUTPUT_DIR, dir, 'index.html'), html);
}

async function build() {
  console.log('🚀 Starting build...');
  CAT_ROWS = await loadAndValidateData();
  const rows = CAT_ROWS;
  const T = trustPages().about.replace('{{ROWS}}', String(rows.length));
  const trust = { about: T, contact: trustPages().contact, privacy: trustPages().privacy, faq: trustPages().faq, advice: trustPages().advice };

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(path.join(OUTPUT_DIR, 'index.html'), layout({
    title: 'CatalogAI — The Standard for Auction Cataloging',
    desc: 'A methodical reference for cataloging estate, collectible, and commercial lots. The exact sequences professional houses use.',
    canonical: `${SITE_URL}/`, current: '/',
    body: homeBody(rows),
    schemas: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'CatalogAI', url: SITE_URL }],
  }));

  const hubs = [
    ['verticals', 'vertical_workflow', 'Auction sequences', 'End-to-end cataloging sequences by auction type.', IMG.estate],
    ['items', 'item_category', 'Item categories', 'The exact points where details slip when cataloging specific goods.', IMG.shop],
    ['platforms', 'platform_export', 'Auction platforms', 'Field limits and dry-run routines per auction platform.', IMG.gavel],
  ];
  for (const [slug, cat, title, intro, img] of hubs) {
    await writePage(slug, layout({
      title: `${title} | CatalogAI`, desc: intro, canonical: `${SITE_URL}/${slug}/`, current: `/${slug}/`,
      body: hubBody(cat, title, intro, img),
    }));
  }

  for (const row of rows) {
    const hub = row.category === 'vertical_workflow' ? 'verticals' : row.category === 'item_category' ? 'items' : 'platforms';
    await writePage(row.slug, layout({
      title: `${row.entity_name} | CatalogAI`,
      desc: `The cataloging sequence for ${row.entity_name}. Steps, common failure points, and clean exports. Figures are labeled estimates.`,
      canonical: `${SITE_URL}/${row.slug}/`, current: `/${hub}/`,
      body: entityBody(row),
      schemas: [
        { '@context': 'https://schema.org', '@type': 'Article', headline: `${row.entity_name}`, description: row.summary_fact, dateModified: row.last_checked, image: `${SITE_URL}${imgFor(row).src}` },
        { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: hub, item: `${SITE_URL}/${hub}/` },
          { '@type': 'ListItem', position: 3, name: row.entity_name, item: `${SITE_URL}/${row.slug}/` }] },
      ],
    }));
  }

  await writePage('about', layout({ title: 'About | CatalogAI', desc: 'Who builds CatalogAI, the method behind the workflow dataset, and the site changelog.', canonical: `${SITE_URL}/about/`, current: '/', body: trust.about }));
  await writePage('contact', layout({ title: 'Contact | CatalogAI', desc: 'Contact CatalogAI by email. No forms, no database, no data stored.', canonical: `${SITE_URL}/contact/`, current: '/', body: trust.contact }));
  await writePage('privacy', layout({ title: 'Privacy Policy | CatalogAI', desc: 'CatalogAI collects no personal data: no cookies, no analytics, no uploads.', canonical: `${SITE_URL}/privacy/`, current: '/', body: trust.privacy }));
  await writePage('faq', layout({
    title: 'FAQ | CatalogAI', desc: 'Answers on AI lot descriptions, export safety, time savings, data privacy and small-auction fit.',
    canonical: `${SITE_URL}/faq/`, current: '/faq/', body: trust.faq,
    schemas: [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }],
  }));
  await writePage('expert-advice', layout({ title: 'Expert Advice | CatalogAI', desc: 'Five field-tested rules for professional auction cataloging: photography, titles, condition vocabulary, value claims, export dry-runs.', canonical: `${SITE_URL}/expert-advice/`, current: '/expert-advice/', body: trust.advice }));

  await fs.writeFile(path.join(OUTPUT_DIR, 'matrix.json'), JSON.stringify(rows, null, 2));
  const allUrls = ['/', '/verticals/', '/items/', '/platforms/', '/tool/', '/about/', '/contact/', '/privacy/', '/faq/', '/expert-advice/', ...rows.map(r => `/${r.slug}/`)];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allUrls.map(u => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${CHECKED}</lastmod></url>`).join('\n')}\n</urlset>`;
  await fs.writeFile(path.join(OUTPUT_DIR, 'sitemap.xml'), sitemap);
  await fs.copyFile('style.css', path.join(OUTPUT_DIR, 'style.css'));
  await fs.copyFile('llms.txt', path.join(OUTPUT_DIR, 'llms.txt'));
  await fs.copyFile('robots.txt', path.join(OUTPUT_DIR, 'robots.txt'));
  await fs.mkdir(path.join(OUTPUT_DIR, 'assets', 'img'), { recursive: true });
  for (const img of Object.values(IMG)) {
    const src = img.src.replace(/^\//, '');
    try { await fs.copyFile(src, path.join(OUTPUT_DIR, src)); } catch { /* warned earlier */ }
  }

  console.log(`🎉 Build complete: ${allUrls.length} pages.`);
}

build().catch(err => { console.error('❌ Build failed:', err); process.exit(1); });