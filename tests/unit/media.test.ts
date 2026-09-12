import { describe, expect, it } from 'vitest';
import { coverFor, generatedCover, youtubeId } from '../../src/lib/media';
import type { Project } from '../../src/lib/schema';

const base: Project = {
  id: 'x-proj',
  name: 'X Project',
  url: 'https://x.example',
  category: 'tool',
  tags: [],
  datasets: [],
  org: 'o',
  date: '2026',
  addedAt: '2026-09-12',
  status: 'active',
  featured: false,
  description_en: 'e'.repeat(60),
  description_ja: 'j'.repeat(40),
  sourceRefs: ['https://x.example'],
};

describe('R-11 media', () => {
  it('AC-11-2 youtubeId parses the common URL shapes', () => {
    expect(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://youtu.be/dQw4w9WgXcQ?t=10')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://vimeo.com/123')).toBeNull();
    expect(youtubeId(undefined)).toBeNull();
  });

  it('AC-11-1 coverFor follows the priority order', () => {
    expect(coverFor(base)).toMatchObject({ kind: 'generated' });
    expect(coverFor({ ...base, repoUrl: 'https://github.com/o/r' })).toEqual({
      kind: 'github',
      src: 'https://opengraph.githubassets.com/x-proj/o/r',
    });
    expect(coverFor({ ...base, repoUrl: 'https://github.com/o/r', image: 'https://img.example/a.png', imageCredit: 'c' })).toEqual({
      kind: 'image',
      src: 'https://img.example/a.png',
      credit: 'c',
    });
    expect(coverFor({ ...base, image: 'https://img.example/a.png', imageCredit: 'c', video: 'https://youtu.be/dQw4w9WgXcQ' })).toEqual({
      kind: 'youtube',
      src: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      videoId: 'dQw4w9WgXcQ',
    });
    expect(coverFor({ ...base, video: 'https://youtu.be/dQw4w9WgXcQ', thumbnail: '/thumbs/x.webp', imageCredit: 'me' })).toEqual({
      kind: 'thumbnail',
      src: '/thumbs/x.webp',
      credit: 'me',
    });
  });

  it('AC-11-3 generatedCover is deterministic and category-coloured', () => {
    const a = generatedCover('x-proj', 'tool', 'X Project');
    const b = generatedCover('x-proj', 'tool', 'X Project');
    expect(a).toBe(b);
    expect(a.startsWith('<svg')).toBe(true);
    expect(a).toContain('X Project');
    expect(a).not.toBe(generatedCover('y-proj', 'tool', 'X Project'));
    expect(generatedCover('x-proj', 'demo', 'X Project')).not.toBe(a);
    // gradient ids are unique per project so several inline covers can share a page
    const idA = /id="([^"]+)-bg"/.exec(a)?.[1];
    const idB = /id="([^"]+)-bg"/.exec(generatedCover('y-proj', 'tool', 'X Project'))?.[1];
    expect(idA).toBeTruthy();
    expect(idA).not.toBe(idB);
    expect(a).toContain(`url(#${idA}-bg)`);
    // must escape text
    expect(generatedCover('z', 'demo', 'A<B&C')).toContain('A&lt;B&amp;C');
  });
});
