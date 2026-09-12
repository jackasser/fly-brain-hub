import { describe, expect, it } from 'vitest';
import { pickXMedia, updateXMedia, xStatusId } from '../../scripts/fetch-x-media.mjs';

const videoPost = {
  user: { screen_name: 'lyra' },
  photos: [],
  video: { poster: 'https://pbs.twimg.com/amplify_video_thumb/1/img/a.jpg', variants: [] },
  mediaDetails: [{ type: 'video', media_url_https: 'https://pbs.twimg.com/amplify_video_thumb/1/img/a.jpg' }],
};
const photoPost = { user: { screen_name: 'mark' }, photos: [{ url: 'https://pbs.twimg.com/media/b.jpg' }] };

describe('R-11 X post media', () => {
  it('AC-11-10 xStatusId parses x.com and twitter.com status URLs only', () => {
    expect(xStatusId('https://x.com/_lyraaaa_/status/2097527368919470162')).toBe('2097527368919470162');
    expect(xStatusId('https://twitter.com/a/status/1?s=20')).toBe('1');
    expect(xStatusId('https://mobile.twitter.com/a/status/2')).toBe('2');
    expect(xStatusId('https://x.com/a')).toBeNull();
    expect(xStatusId('https://github.com/a/status/1')).toBeNull();
    expect(xStatusId(undefined)).toBeNull();
  });

  it('AC-11-11 pickXMedia prefers the video poster, then the first photo, only from pbs.twimg.com', () => {
    expect(pickXMedia(videoPost)).toEqual({ image: videoPost.video.poster, imageKind: 'video-poster', handle: 'lyra' });
    expect(pickXMedia(photoPost)).toEqual({ image: 'https://pbs.twimg.com/media/b.jpg', imageKind: 'photo', handle: 'mark' });
    expect(pickXMedia({ user: { screen_name: 'x' }, photos: [{ url: 'http://evil.example/a.jpg' }] })).toBeNull();
    expect(pickXMedia({ user: { screen_name: 'x' } })).toBeNull();
    expect(pickXMedia(null)).toBeNull();
  });

  it('AC-11-12 updateXMedia fills image/imageKind/imageCredit for X posts and leaves others alone', async () => {
    const entries = [
      { id: 'a', url: 'https://x.com/lyra/status/1', featured: false, sourceRefs: ['https://s.example'] },
      { id: 'b', url: 'https://github.com/o/r', sourceRefs: ['https://s.example'] },
      { id: 'c', url: 'https://x.com/z/status/3', image: 'https://keep.example/x.png', imageCredit: 'keep', sourceRefs: [] },
    ];
    const fetchFn = async (url: string) => ({
      ok: url.includes('id=1'),
      status: url.includes('id=1') ? 200 : 404,
      json: async () => videoPost,
    });
    const { entries: out, updated, skipped } = await updateXMedia(entries, fetchFn as never, '2026-09-12');
    expect(updated).toEqual(['a']);
    expect(skipped).toEqual([]);
    expect(Object.keys(out[0])).toEqual(['id', 'url', 'image', 'imageKind', 'imageCredit', 'featured', 'sourceRefs']);
    expect(out[0]).toMatchObject({ image: videoPost.video.poster, imageKind: 'video-poster', imageCredit: '@lyra on X (video poster, 2026-09-12)' });
    expect(out[1]).toEqual(entries[1]);
    expect(out[2]).toEqual(entries[2]);
  });
});
