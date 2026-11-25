import type { LyricLine } from '../types/lyrics';

interface LRCLIBResponse {
  id: number;
  name: string;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration: number;
  instrumental: boolean;
  plainLyrics?: string;
  syncedLyrics?: string;
}

const CACHE_PREFIX = 'lyricflow_cache_';

function getCacheKey(artist: string, title: string): string {
  return `${CACHE_PREFIX}${artist.trim().toLowerCase()}_${title.trim().toLowerCase()}`;
}

export function getCachedLyrics(artist: string, title: string): LyricLine[] | null {
  try {
    const key = getCacheKey(artist, title);
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed reading lyrics from cache:', e);
  }
  return null;
}

export function saveCachedLyrics(artist: string, title: string, lyrics: LyricLine[]): void {
  try {
    const key = getCacheKey(artist, title);
    localStorage.setItem(key, JSON.stringify(lyrics));
  } catch (e) {
    console.error('Failed saving lyrics to cache:', e);
  }
}

/**
 * Fetches lyrics from LRCLIB. Handles cleanups and multiple search variations.
 */
export async function fetchLyricsFromLRCLIB(
  artist: string,
  title: string,
  duration?: number
): Promise<{ syncedLyrics?: string; plainLyrics?: string; foundTitle?: string; foundArtist?: string } | null> {
  const cleanTitle = title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
  const cleanArtist = artist.replace(/\(.*?\)|\[.*?\]/g, '').trim();

  // 1. Try exact match first
  try {
    const params = new URLSearchParams({
      track_name: cleanTitle,
      artist_name: cleanArtist,
    });
    if (duration && duration > 0) {
      params.append('duration', Math.round(duration).toString());
    }

    const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`);
    if (res.ok) {
      const data: LRCLIBResponse = await res.json();
      if (data.syncedLyrics || data.plainLyrics) {
        return {
          syncedLyrics: data.syncedLyrics,
          plainLyrics: data.plainLyrics,
          foundTitle: data.trackName,
          foundArtist: data.artistName,
        };
      }
    }
  } catch (err) {
    console.warn('LRCLIB exact match error, falling back to search:', err);
  }

  // 2. Try search by title and artist
  try {
    const query = `${cleanArtist} ${cleanTitle}`.trim();
    const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const items: LRCLIBResponse[] = await res.json();
      if (items && items.length > 0) {
        const best = items.find(item => item.syncedLyrics) || items[0];
        return {
          syncedLyrics: best.syncedLyrics,
          plainLyrics: best.plainLyrics,
          foundTitle: best.trackName,
          foundArtist: best.artistName,
        };
      }
    }
  } catch (err) {
    console.error('LRCLIB search error:', err);
  }

  // 3. Fallback: search by track title alone if artist was generic
  if (cleanTitle.length > 2) {
    try {
      const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(cleanTitle)}`);
      if (res.ok) {
        const items: LRCLIBResponse[] = await res.json();
        if (items && items.length > 0) {
          const best = items.find(item => item.syncedLyrics) || items[0];
          return {
            syncedLyrics: best.syncedLyrics,
            plainLyrics: best.plainLyrics,
            foundTitle: best.trackName,
            foundArtist: best.artistName,
          };
        }
      }
    } catch (e) {
      console.warn('LRCLIB title-only search error:', e);
    }
  }

  return null;
}
