import type { Project } from './schema';
import { CATEGORY_META, type Category } from './taxonomy';

export type Cover =
  | { kind: 'thumbnail'; src: string; credit: string }
  | { kind: 'youtube'; src: string; videoId: string }
  | { kind: 'image'; src: string; credit: string }
  | { kind: 'github'; src: string }
  | { kind: 'generated'; svg: string };

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

export function coverFor(p: Project): Cover {
  if (p.thumbnail) return { kind: 'thumbnail', src: p.thumbnail, credit: p.imageCredit ?? '' };
  const vid = youtubeId(p.video);
  if (vid) return { kind: 'youtube', src: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`, videoId: vid };
  if (p.image) return { kind: 'image', src: p.image, credit: p.imageCredit ?? '' };
  const repo = githubRepo(p.repoUrl);
  if (repo) return { kind: 'github', src: `https://opengraph.githubassets.com/${p.id}/${repo}` };
  return { kind: 'generated', svg: generatedCover(p.id, p.category, p.name) };
}

export const CATEGORY_COLORS: Record<Category, { a: string; b: string }> = {
  connectome: { a: '#0f766e', b: '#134e4a' },
  simulation: { a: '#6d28d9', b: '#3b0764' },
  body: { a: '#b45309', b: '#78350f' },
  demo: { a: '#be185d', b: '#701a3a' },
  tool: { a: '#1d4ed8', b: '#1e3a8a' },
  media: { a: '#475569', b: '#1e293b' },
  crypto: { a: '#6b7280', b: '#374151' },
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
 * so it is safe to ship for entries without an embeddable preview image.
 */
export function generatedCover(id: string, category: Category, name: string): string {
  const W = 1200;
  const H = 600;
  const { a, b } = CATEGORY_COLORS[category];
  const r = rng(hash(id));
  // Gradient ids must be unique per SVG: many covers share one document and url(#id) resolves globally.
  const uid = `c${hash(id).toString(36)}`;
  const n = 16 + Math.floor(r() * 8);
  const pts = Array.from({ length: n }, () => ({
    x: Math.round(60 + r() * (W - 120)),
    y: Math.round(50 + r() * (H - 100)),
    s: 4 + Math.round(r() * 14),
  }));
  const edges: string[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = pts[i].x - pts[j].x;
      const dy = pts[i].y - pts[j].y;
      const d = Math.hypot(dx, dy);
      if (d < 260 && r() < 0.7) {
        const mx = (pts[i].x + pts[j].x) / 2 + (r() - 0.5) * 80;
        const my = (pts[i].y + pts[j].y) / 2 + (r() - 0.5) * 80;
        edges.push(
          `<path d="M${pts[i].x} ${pts[i].y}Q${Math.round(mx)} ${Math.round(my)} ${pts[j].x} ${pts[j].y}" stroke-opacity="${(0.25 + r() * 0.45).toFixed(2)}"/>`,
        );
      }
    }
  }
  const nodes = pts
    .map(
      (p) =>
        `<circle cx="${p.x}" cy="${p.y}" r="${p.s * 2.6}" fill="url(#${uid}-g)" opacity="0.35"/><circle cx="${p.x}" cy="${p.y}" r="${p.s}" fill="#fff" fill-opacity="0.9"/>`,
    )
    .join('');
  const label = name.length > 30 ? `${name.slice(0, 29)}…` : name;
  const cat = CATEGORY_META[category].label.en;
  const fontSize = label.length > 18 ? 56 : 72;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(name)}">` +
    `<defs><linearGradient id="${uid}-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>` +
    `<radialGradient id="${uid}-g"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="${W}" height="${H}" fill="url(#${uid}-bg)"/>` +
    `<g fill="none" stroke="#fff" stroke-width="2.5">${edges.join('')}</g>${nodes}` +
    `<rect x="0" y="${H - 190}" width="${W}" height="190" fill="#000" fill-opacity="0.28"/>` +
    `<text x="56" y="${H - 118}" font-family="ui-sans-serif,system-ui,sans-serif" font-size="28" fill="#fff" fill-opacity="0.8" letter-spacing="4">${esc(cat.toUpperCase())}</text>` +
    `<text x="56" y="${H - 52}" font-family="ui-sans-serif,system-ui,sans-serif" font-size="${fontSize}" font-weight="700" fill="#fff">${esc(label)}</text>` +
    `</svg>`
  );
}
