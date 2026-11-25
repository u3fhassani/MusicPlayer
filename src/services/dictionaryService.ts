import type { WordDefinition, AISettings } from '../types/lyrics';

const quickFarsiMap: Record<string, string> = {
  love: 'عشق، دوست داشتن',
  heart: 'قلب، دل',
  soul: 'روح، جان',
  dream: 'رویا، خواب دیدن',
  night: 'شب',
  day: 'روز',
  sky: 'آسمان',
  rain: 'باران',
  tears: 'اشک‌ها',
  forever: 'تا ابد، جاودانه',
  shine: 'درخشیدن، تابیدن',
  stars: 'ستاره‌ها',
  light: 'نور، روشن',
  dark: 'تاریک، تاریکی',
  fire: 'آتش',
  shadow: 'سایه',
  memories: 'خاطرات',
  time: 'زمان، وقت',
  world: 'جهان، دنیا',
  feeling: 'احساس، حس',
  lonely: 'تنها',
  away: 'دور، ناپدید',
  stay: 'ماندن، بمان',
  leave: 'ترک کردن، رفتن',
  hold: 'نگه داشتن، در آغوش گرفتن',
  breathe: 'نفس کشیدن',
  smile: 'لبخند زدن',
  eyes: 'چشم‌ها',
  voice: 'صدا',
  silence: 'سکوت',
  free: 'آزاد، رها',
  wild: 'وحشی، پرشور',
  hope: 'امید',
  faith: 'ایمان، باور',
};

export async function lookupWord(word: string, _aiSettings?: AISettings): Promise<WordDefinition | null> {
  const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase().trim();
  if (!cleanWord || cleanWord.length < 2) return null;

  let phonetic: string | undefined;
  let partOfSpeech: string | undefined;
  let definition: string | undefined;
  let example: string | undefined;
  let translation: string | undefined = quickFarsiMap[cleanWord];

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0];
        phonetic = entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text;
        if (entry.meanings && entry.meanings.length > 0) {
          const meaning = entry.meanings[0];
          partOfSpeech = meaning.partOfSpeech;
          if (meaning.definitions && meaning.definitions.length > 0) {
            definition = meaning.definitions[0].definition;
            example = meaning.definitions[0].example;
          }
        }
      }
    }
  } catch (err) {
    console.warn('Dictionary API error:', err);
  }

  // Google Translate fallback if not in quick map
  if (!translation) {
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=fa&dt=t&q=${encodeURIComponent(
          cleanWord
        )}`
      );
      if (res.ok) {
        const data = await res.json();
        const translatedWord = data?.[0]?.[0]?.[0];
        if (translatedWord) {
          translation = translatedWord.trim();
        }
      }
    } catch (e) {
      console.warn('Google Translate word lookup note:', e);
    }
  }

  if (!definition && !translation) {
    return null;
  }

  return {
    word: cleanWord,
    phonetic,
    partOfSpeech,
    definition: definition || 'تعریف انگلیسی موجود نیست',
    translation: translation || 'معنی ذخیره شده موجود نیست',
    example,
  };
}
