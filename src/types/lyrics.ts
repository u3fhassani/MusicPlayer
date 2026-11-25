export interface LyricLine {
  id: string;
  time: number; // in seconds
  rawTime: string;
  text: string;
  translation?: string;
}

export interface SongMetadata {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  coverUrl?: string;
  audioUrl: string;
  isLocal?: boolean;
}

export interface WordDefinition {
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  definition?: string;
  translation?: string;
  example?: string;
}

export type ViewMode = 'dual' | 'english' | 'persian' | 'karaoke';

export type AIProvider = 'free';

export interface AISettings {
  provider: AIProvider;
}

export type VisualizerType = 'bars' | 'wave' | 'mirror' | 'dots' | 'pulse';

export interface VisualizerSettings {
  enabled: boolean;
  type: VisualizerType;
  colorTheme: 'cyan-purple' | 'emerald-gold' | 'crimson-violet' | 'neon-amber';
}

export type AudioEQPreset = 'flat' | 'bass-boost' | 'pop' | 'rock' | 'vocal' | 'club' | 'custom';

export interface AudioEQBands {
  subBass: number;  // 60Hz
  bass: number;     // 230Hz
  mid: number;      // 910Hz
  presence: number; // 3.6kHz
  treble: number;   // 14kHz
}

export interface AudioSettings {
  preset: AudioEQPreset;
  bands: AudioEQBands;
  bassBoost: boolean;
  compressor: boolean;
  stereoPan: number;
}
