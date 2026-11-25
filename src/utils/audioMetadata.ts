import * as mm from 'music-metadata-browser';
import type { SongMetadata } from '../types/lyrics';

export interface ParsedAudioResult {
  metadata: SongMetadata;
  audioBlob: Blob;
  coverBlob?: Blob;
}

/**
 * Cleans track and artist names from common clutter like "[320]", "(Official Video)", etc.
 */
export function cleanSongQuery(raw: string): string {
  return raw
    .replace(/\(.*?(official|video|audio|lyrics|remix|hd|4k|feat|ft).*?\)/gi, '')
    .replace(/\[.*?(official|video|audio|lyrics|remix|hd|4k|320|128).*?\]/gi, '')
    .replace(/\b(320kbps|128kbps|flac|mp3|official\s*video|official\s*audio|remastered)\b/gi, '')
    .replace(/[_]+/g, ' ')
    .trim();
}

/**
 * Extracts metadata (title, artist, album art, duration) directly from a local File
 * without uploading anything to a server.
 */
export async function parseLocalAudioFile(file: File): Promise<ParsedAudioResult> {
  const audioUrl = URL.createObjectURL(file);
  let title = file.name.replace(/\.[^/.]+$/, '');
  let artist = 'Unknown Artist';
  let album: string | undefined;
  let coverUrl: string | undefined;
  let coverBlob: Blob | undefined;
  let duration: number | undefined;

  // Clean filename if it contains clutter
  title = cleanSongQuery(title);

  try {
    const metadata = await mm.parseBlob(file);
    if (metadata.common.title) {
      title = cleanSongQuery(metadata.common.title);
    } else {
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        artist = cleanSongQuery(parts[0]);
        title = cleanSongQuery(parts.slice(1).join(' - '));
      }
    }

    if (metadata.common.artist) {
      artist = cleanSongQuery(metadata.common.artist);
    }

    if (metadata.common.album) {
      album = metadata.common.album;
    }

    if (metadata.format.duration) {
      duration = Math.round(metadata.format.duration);
    }

    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const pic = metadata.common.picture[0];
      coverBlob = new Blob([pic.data as unknown as BlobPart], { type: pic.format });
      coverUrl = URL.createObjectURL(coverBlob);
    }
  } catch (error) {
    console.warn('Failed to parse audio metadata with music-metadata, falling back to basic filename extraction:', error);
    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      artist = cleanSongQuery(parts[0]);
      title = cleanSongQuery(parts.slice(1).join(' - '));
    }
  }

  const songMeta: SongMetadata = {
    id: `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: title || 'آهنگ ناشناس',
    artist: artist || 'خواننده ناشناس',
    album,
    duration,
    coverUrl,
    audioUrl,
    isLocal: true,
  };

  return {
    metadata: songMeta,
    audioBlob: file,
    coverBlob,
  };
}
