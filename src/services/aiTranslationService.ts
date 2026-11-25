import type { LyricLine, AISettings } from '../types/lyrics';

/**
 * Formats translation errors into clear Persian explanations
 */
export function formatAIErrorMessage(errorMsg: string): string {
  if (!errorMsg) return 'خطای نامشخص در ارتباط با گوگل ترنسلیت';

  if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
    return 'خطای شبکه یا اینترنت: ارتباط با گوگل ترنسلیت برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کنید.';
  }

  return errorMsg;
}

/**
 * 100% Free Built-in Google Translate Engine (Requires NO API key, NO payment, NO registration)
 * Auto-detects any source language (sl=auto) and translates to Persian (tl=fa).
 */
export async function translateWithFreeEngine(lines: LyricLine[]): Promise<LyricLine[]> {
  const linesToTranslate = lines
    .map((line, idx) => ({ idx, text: line.text }))
    .filter((l) => l.text.trim().length > 0);

  if (linesToTranslate.length === 0) return lines;

  const translatedMap = new Map<number, string>();
  const chunkSize = 25; // translate in chunks of 25 lines

  for (let i = 0; i < linesToTranslate.length; i += chunkSize) {
    const chunk = linesToTranslate.slice(i, i + chunkSize);
    const combinedText = chunk.map((c) => c.text).join('\n');

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=fa&dt=t&q=${encodeURIComponent(
        combinedText
      )}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data[0])) {
          const fullTranslatedText: string = data[0]
            .map((item: any) => item[0])
            .join('');

          const translatedLines = fullTranslatedText.split('\n');

          chunk.forEach((c, index) => {
            if (translatedLines[index]) {
              translatedMap.set(c.idx, translatedLines[index].trim());
            }
          });
        }
      }
    } catch (e) {
      console.warn('Chunk translation error, trying line-by-line fallback:', e);
      for (const item of chunk) {
        try {
          const singleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=fa&dt=t&q=${encodeURIComponent(
            item.text
          )}`;
          const singleRes = await fetch(singleUrl);
          if (singleRes.ok) {
            const singleData = await singleRes.json();
            const translatedSingle = singleData?.[0]?.[0]?.[0];
            if (translatedSingle) {
              translatedMap.set(item.idx, translatedSingle.trim());
            }
          }
        } catch (err) {
          console.warn(`Line ${item.idx} translation error:`, err);
        }
      }
    }
  }

  return lines.map((line, index) => ({
    ...line,
    translation: translatedMap.get(index) || line.translation,
  }));
}

/**
 * Universal lyrics translation entry point (Powered exclusively by Google Translate)
 */
export async function translateLyricsUniversal(
  lines: LyricLine[],
  _settings?: AISettings
): Promise<LyricLine[]> {
  return translateWithFreeEngine(lines);
}
