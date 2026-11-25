import type { AudioEQBands, AudioEQPreset, AudioSettings } from '../types/lyrics';

export const EQ_PRESETS: Record<Exclude<AudioEQPreset, 'custom'>, { label: string; bands: AudioEQBands }> = {
  flat: {
    label: 'نرمال (عادی)',
    bands: { subBass: 0, bass: 0, mid: 0, presence: 0, treble: 0 },
  },
  'bass-boost': {
    label: 'بیس سنگین',
    bands: { subBass: 8, bass: 6, mid: 0, presence: 1, treble: 2 },
  },
  pop: {
    label: 'پاپ',
    bands: { subBass: -1, bass: 3, mid: 4, presence: 2, treble: -1 },
  },
  rock: {
    label: 'راک',
    bands: { subBass: 5, bass: 3, mid: -1, presence: 3, treble: 5 },
  },
  vocal: {
    label: 'صدای خواننده',
    bands: { subBass: -3, bass: -1, mid: 5, presence: 4, treble: 2 },
  },
  club: {
    label: 'کلاب / مهمانی',
    bands: { subBass: 6, bass: 4, mid: 1, presence: 4, treble: 4 },
  },
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  preset: 'flat',
  bands: { ...EQ_PRESETS.flat.bands },
  bassBoost: false,
  compressor: true,
  stereoPan: 0,
};
