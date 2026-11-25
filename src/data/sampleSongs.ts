import type { SongMetadata, LyricLine } from '../types/lyrics';
import { parseLRC } from '../utils/lrcParser';

export interface SampleSong {
  metadata: SongMetadata;
  lrc: string;
  defaultLyrics: LyricLine[];
}

const sample1LRC = `[00:00.00] (Instrumental Intro) // (مقدمه بی‌کلام)
[00:04.50] Look up at the stars in the midnight sky // به ستاره‌ها در آسمان نیمه‌شب نگاه کن
[00:09.20] Watching all the shadows slowly passing by // عبور آرام تمام سایه‌ها را تماشا کن
[00:14.00] Whispers in the breeze calling out your name // زمزمه‌هایی در نسیم که نام تو را صدا می‌زنند
[00:18.80] Nothing in this world will ever feel the same // هیچ‌چیز در این جهان دیگر مثل سابق نخواهد بود
[00:23.50] We were chasing dreams through the neon light // ما در میان نورهای نئونی رویاها را دنبال می‌کردیم
[00:28.20] Holding on together through the darkest night // در تاریک‌ترین شب‌ها دست در دست هم مانده بودیم
[00:33.00] Even if the fire turns to quiet ash // حتی اگر آتش به خاکستری آرام بدل شود
[00:37.80] Love is like an echo that will always last // عشق چون پژواکی‌ست که تا ابد باقی می‌ماند
[00:43.00] (Guitar Solo & Echo) // (تکنوازی گیتار و پژواک)
[00:52.00] Close your eyes and feel the music in your soul // چشمانت را ببند و موسیقی را در عمق جانت حس کن
[00:57.20] Every broken piece is turning into whole // هر تکه‌ی شکسته دوباره به کمال می‌رسد
[01:02.50] Underneath the moonlight we are standing tall // در زیر نور ماه با قامتی استوار ایستاده‌ایم
[01:07.80] Ready for tomorrow, ready for it all // آماده برای فردا، آماده برای همه‌چیز
[01:14.00] (Outro - Fading Melody) // (فرود - محو شدن ملودی)`;

const sample2LRC = `[00:00.00] (Soft Piano Opening) // (مقدمه پیانوی ملایم)
[00:05.10] City lights are fading as the rain comes down // چراغ‌های شهر با بارش باران کم‌سو می‌شوند
[00:10.50] Walking through the silence of an empty town // قدم زدن در سکوت یک شهر خلوت
[00:16.00] Thinking about the promises we used to keep // به یاد وعده‌هایی که در دل داشتیم
[00:21.20] Lost inside a memory before I sleep // گم‌شده در میان خاطره‌ای پیش از آنکه خوابم ببرد
[00:26.50] But hope is like a candle in the gentle wind // اما امید چون شمعی در نسیم ملایم است
[00:32.00] A brand new story is waiting to begin // داستانی نو چشم‌انتظار آغاز است
[00:38.00] (Harmonies Rising) // (اوج‌گیری هارمونی‌ها)
[00:44.00] I can see the dawn breaking through the gray // سپیده‌دم را می‌بینم که از دل تیرگی‌ها می‌شکفد
[00:50.00] Washing all the tears and fears away // و تمام اشک‌ها و ترس‌ها را با خود می‌شوید
[00:58.00] (Final Chords) // (آکوردهای پایانی)`;

export const SAMPLE_SONGS: SampleSong[] = [
  {
    metadata: {
      id: 'sample-1',
      title: 'Midnight Echoes',
      artist: 'Aura & The Stars',
      album: 'Celestial Dreams (2025)',
      duration: 85,
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      audioUrl: 'https://actions.google.com/sounds/v1/water/rain_heavy_loud.ogg',
      isLocal: false,
    },
    lrc: sample1LRC,
    defaultLyrics: parseLRC(sample1LRC),
  },
  {
    metadata: {
      id: 'sample-2',
      title: 'City Rain & Memories',
      artist: 'Julian Vance',
      album: 'Reflections in Blue',
      duration: 65,
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
      audioUrl: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
      isLocal: false,
    },
    lrc: sample2LRC,
    defaultLyrics: parseLRC(sample2LRC),
  },
];
