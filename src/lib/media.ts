import type { Project } from './schema';
import { CATEGORY_META, type Category } from './taxonomy';

export type Cover =
  | { kind: 'thumbnail'; src: string; credit: string }
  | { kind: 'youtube'; src: string; videoId: string }
  | { kind: 'image'; src: string; credit: string }
  | { kind: 'github'; src: string }
  | { kind: 'generated'; src: string };

/** YouTube video id from watch / youtu.be / shorts / embed URLs; null for anything else. */
export function youtubeId(url: string | undefined): string | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, '');
  const id = (v: string | null | undefined) => (v && /^[A-Za-z0-9_-]{11}$/.test(v) ? v : null);
  if (host === 'youtu.be') return id(u.pathname.slice(1).split('/')[0]);
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') return id(u.searchParams.get('v'));
    const m = /^\/(shorts|embed|live)\/([^/?]+)/.exec(u.pathname);
    if (m) return id(m[2]);
  }
  return null;
}

export function githubRepo(url: string | undefined): string | null {
  if (!url) return null;
  const m = /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s#?]+)/i.exec(url);
  return m ? `${m[1]}/${m[2].replace(/\.git$/, '')}` : null;
}

/** Path of the build-time generated cover for a project (always exists; used as fallback too). */
export function generatedCoverPath(id: string): string {
  return `/covers/${id}.svg`;
}

export function coverFor(p: Project): Cover {
  if (p.thumbnail) return { kind: 'thumbnail', src: p.thumbnail, credit: p.imageCredit ?? '' };
  const vid = youtubeId(p.video);
  if (vid) return { kind: 'youtube', src: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`, videoId: vid };
  if (p.image) return { kind: 'image', src: p.image, credit: p.imageCredit ?? '' };
  const repo = githubRepo(p.repoUrl);
  if (repo) return { kind: 'github', src: `https://opengraph.githubassets.com/${p.id}/${repo}` };
  return { kind: 'generated', src: generatedCoverPath(p.id) };
}

/** Category hues: `ink` for lines/labels, `tint` for the pale background, `deep` for the label band. */
export const CATEGORY_COLORS: Record<Category, { ink: string; tint: string; deep: string }> = {
  connectome: { ink: '#0f766e', tint: '#e4f3f0', deep: '#0b5c56' },
  simulation: { ink: '#6d28d9', tint: '#efe8fb', deep: '#4c1d95' },
  body: { ink: '#b45309', tint: '#fbeedd', deep: '#7c3a06' },
  demo: { ink: '#be185d', tint: '#fbe6ef', deep: '#8a1043' },
  tool: { ink: '#1d4ed8', tint: '#e5ecfb', deep: '#1e3a8a' },
  media: { ink: '#475569', tint: '#e9edf2', deep: '#334155' },
  crypto: { ink: '#6b7280', tint: '#ecedf0', deep: '#4b5563' },
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number): () => number {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Deterministic 2:1 "neuron field" cover. Same id -> same picture. Our own artwork,
 * served as a standalone SVG file, so no gradient ids can collide across a page.
 * Light background with category-coloured line work keeps it quieter than photos.
 */
export function generatedCover(id: string, category: Category, name: string): string {
  const W = 1200;
  const H = 600;
  const { ink, tint, deep } = CATEGORY_COLORS[category];
  const r = rng(hash(id));
  const uid = `c${hash(id).toString(36)}`;
  const n = 16 + Math.floor(r() * 8);
  const pts = Array.from({ length: n }, () => ({
    x: Math.round(60 + r() * (W - 120)),
    y: Math.round(40 + r() * (H - 220)),
    s: 4 + Math.round(r() * 12),
  }));
  const edges: string[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d < 260 && r() < 0.7) {
        const mx = (pts[i].x + pts[j].x) / 2 + (r() - 0.5) * 80;
        const my = (pts[i].y + pts[j].y) / 2 + (r() - 0.5) * 80;
        edges.push(
          `<path d="M${pts[i].x} ${pts[i].y}Q${Math.round(mx)} ${Math.round(my)} ${pts[j].x} ${pts[j].y}" stroke-opacity="${(0.3 + r() * 0.4).toFixed(2)}"/>`,
        );
      }
    }
  }
  const nodes = pts
    .map(
      (p) =>
        `<circle cx="${p.x}" cy="${p.y}" r="${p.s * 2.2}" fill="url(#${uid}-g)"/><circle cx="${p.x}" cy="${p.y}" r="${p.s}" fill="${ink}" fill-opacity="0.85"/>`,
    )
    .join('');
  const label = name.length > 30 ? `${name.slice(0, 29)}…` : name;
  const cat = CATEGORY_META[category].label.en;
  const fontSize = label.length > 18 ? 52 : 66;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(name)}">` +
    `<defs><radialGradient id="${uid}-g"><stop offset="0" stop-color="${ink}" stop-opacity="0.35"/><stop offset="1" stop-color="${ink}" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="${W}" height="${H}" fill="${tint}"/>` +
    `<g fill="none" stroke="${ink}" stroke-width="2.2">${edges.join('')}</g>${nodes}` +
    `<rect x="0" y="${H - 160}" width="${W}" height="160" fill="${deep}"/>` +
    `<text x="56" y="${H - 96}" font-family="ui-sans-serif,system-ui,sans-serif" font-size="26" fill="#fff" fill-opacity="0.85" letter-spacing="4">${esc(cat.toUpperCase())}</text>` +
    `<text x="56" y="${H - 40}" font-family="ui-sans-serif,system-ui,sans-serif" font-size="${fontSize}" font-weight="700" fill="#fff">${esc(label)}</text>` +
    `</svg>`
  );
}
