import type { LyricLine } from '../types/lyrics';

/**
 * Parses an LRC string into structured LyricLine objects.
 */
export function parseLRC(lrcText: string): LyricLine[] {
  if (!lrcText || typeof lrcText !== 'string') return [];

  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Skip metadata tags like [ti:Title], [ar:Artist], etc.
    if (/^\[(ti|ar|al|by|offset|length|re|ve):.*\]/i.test(trimmed)) {
      continue;
    }

    const timestamps: { time: number; raw: string }[] = [];
    let match: RegExpExecArray | null;

    timeRegex.lastIndex = 0;
    while ((match = timeRegex.exec(trimmed)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const millisRaw = match[3] || '0';
      const millis = millisRaw.length === 2 ? parseInt(millisRaw, 10) * 10 : parseInt(millisRaw, 10);
      const totalSeconds = minutes * 60 + seconds + millis / 1000;

      timestamps.push({
        time: totalSeconds,
        raw: match[0],
      });
    }

    if (timestamps.length === 0) continue;

    let text = trimmed.replace(timeRegex, '').trim();

    let translation: string | undefined;
    if (text.includes(' // ')) {
      const parts = text.split(' // ');
      text = parts[0].trim();
      translation = parts[1].trim();
    } else if (text.includes(' | ')) {
      const parts = text.split(' | ');
      text = parts[0].trim();
      translation = parts[1].trim();
    }

    for (const ts of timestamps) {
      result.push({
        id: `${ts.time.toFixed(3)}-${Math.random().toString(36).substring(2, 7)}`,
        time: ts.time,
        rawTime: ts.raw,
        text: text,
        translation: translation,
      });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

/**
 * Formats time in seconds to mm:ss format
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats time in seconds to [mm:ss.xx] standard LRC format
 */
export function formatTimeLRC(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '[00:00.00]';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hundredths = Math.floor((seconds % 1) * 100);
  return `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}]`;
}

/**
 * Finds the index of the currently active lyric line given current playback time and sync offset.
 */
export function getActiveLyricIndex(
  lyrics: LyricLine[],
  currentTime: number,
  offsetSeconds: number = 0
): number {
  if (lyrics.length === 0) return -1;
  const targetTime = currentTime + offsetSeconds;

  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (targetTime >= lyrics[i].time) {
      return i;
    }
  }

  return 0;
}
