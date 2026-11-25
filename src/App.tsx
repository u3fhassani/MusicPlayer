import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { LyricLine, SongMetadata, ViewMode, VisualizerSettings, WordDefinition, AISettings, AudioSettings } from './types/lyrics';
import { DEFAULT_AUDIO_SETTINGS } from './utils/audioPresets';
import { SAMPLE_SONGS } from './data/sampleSongs';
import { parseLocalAudioFile } from './utils/audioMetadata';
import { parseLRC, getActiveLyricIndex } from './utils/lrcParser';
import { fetchLyricsFromLRCLIB, saveCachedLyrics } from './services/lyricsService';
import { translateLyricsUniversal, translateWithFreeEngine } from './services/aiTranslationService';
import { lookupWord } from './services/dictionaryService';
import {
  saveSongToDB,
  getAllSongsFromDB,
  deleteSongFromDB,
  updateSongLyricsInDB,
  toggleSongFavoriteInDB,
  convertStoredSongToMetadata,
  type StoredSong,
} from './services/storageService';

import { AudioVisualizer, VISUALIZER_LABELS } from './components/AudioVisualizer';
import { LyricsViewer } from './components/LyricsViewer';
import { PlayerControls } from './components/PlayerControls';
import { WordModal } from './components/WordModal';
import { SettingsModal } from './components/SettingsModal';
import { ManualSearchModal } from './components/ManualSearchModal';
import { PlaylistDrawer } from './components/PlaylistDrawer';
import { LyricsEditorModal } from './components/LyricsEditorModal';

import {
  Music,
  Sparkles,
  SlidersHorizontal,
  ListMusic,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  Edit3,
  FileText,
  Disc3,
  Heart,
} from 'lucide-react';

export function App() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isSwitchingTrackRef = useRef(false);

  // Playlist & Storage state
  const [playlist, setPlaylist] = useState<StoredSong[]>([]);
  const [currentSongId, setCurrentSongId] = useState<string>('');
  const [currentSong, setCurrentSong] = useState<SongMetadata>(SAMPLE_SONGS[0].metadata);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Lyrics state
  const [lyrics, setLyrics] = useState<LyricLine[]>(SAMPLE_SONGS[0].defaultLyrics);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [syncOffset, setSyncOffset] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('dual');
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [mobileTab, setMobileTab] = useState<'lyrics' | 'cover'>('lyrics');

  // Modals & Drawers
  const [selectedWord, setSelectedWord] = useState<WordDefinition | null>(null);
  const [isLoadingWord, setIsLoadingWord] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Translation Settings (Powered by Google Translate)
  const [aiSettings, setAiSettings] = useState<AISettings>({
    provider: 'free',
  });

  const [visualizerSettings, setVisualizerSettings] = useState<VisualizerSettings>(() => {
    try {
      const saved = localStorage.getItem('lyricflow_visualizer_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      enabled: true,
      type: 'bars',
      colorTheme: 'cyan-purple',
    };
  });

  const handleCycleVisualizerType = () => {
    const order: VisualizerSettings['type'][] = ['bars', 'mirror', 'wave', 'dots', 'pulse'];
    const currentIdx = order.indexOf(visualizerSettings.type);
    const nextType = order[(currentIdx + 1) % order.length];
    const updated: VisualizerSettings = { ...visualizerSettings, type: nextType };
    setVisualizerSettings(updated);
    try {
      localStorage.setItem('lyricflow_visualizer_settings', JSON.stringify(updated));
    } catch (e) {}
    showToast(`انیمیشن پخش به «${VISUALIZER_LABELS[nextType]}» تغییر یافت`, 'info');
  };

  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => {
    try {
      const saved = localStorage.getItem('lyricflow_audio_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_AUDIO_SETTINGS;
  });

  const [settingsInitialTab, setSettingsInitialTab] = useState<'audio' | 'ai'>('audio');
  const [sleepRemainingSeconds, setSleepRemainingSeconds] = useState<number | null>(null);

  const handleUpdateAudioSettings = (updated: AudioSettings) => {
    setAudioSettings(updated);
    try {
      localStorage.setItem('lyricflow_audio_settings', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleSetSleepTimer = (minutes: number | null) => {
    if (minutes === null) {
      setSleepRemainingSeconds(null);
      showToast('تایمر خواب خاموش شد', 'info');
    } else {
      setSleepRemainingSeconds(minutes * 60);
      showToast(`تایمر خواب برای ${minutes} دقیقه تنظیم شد`, 'success');
    }
  };

  // Sleep Timer countdown effect
  useEffect(() => {
    if (sleepRemainingSeconds === null) return;
    if (sleepRemainingSeconds <= 0) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      setSleepRemainingSeconds(null);
      showToast('تایمر خواب به پایان رسید و پخش متوقف شد 🌙', 'info');
      return;
    }

    const timerId = window.setInterval(() => {
      setSleepRemainingSeconds((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [sleepRemainingSeconds]);

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // 1. Initialize Database & Playlist on Mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const stored = await getAllSongsFromDB();
        if (stored.length > 0) {
          setPlaylist(stored);
          const first = stored[0];
          playStoredSong(first, false);
        } else {
          const initialDemos: StoredSong[] = SAMPLE_SONGS.map((demo) => ({
            id: demo.metadata.id,
            title: demo.metadata.title,
            artist: demo.metadata.artist,
            album: demo.metadata.album,
            duration: demo.metadata.duration,
            audioUrl: demo.metadata.audioUrl,
            coverUrl: demo.metadata.coverUrl,
            isLocal: false,
            lyrics: demo.defaultLyrics,
            isTranslated: true,
            createdAt: Date.now(),
          }));

          for (const s of initialDemos) {
            await saveSongToDB(s);
          }
          setPlaylist(initialDemos);
          playStoredSong(initialDemos[0], false);
        }
      } catch (err) {
        console.error('Failed to initialize IndexedDB:', err);
      }
    }
    loadInitialData();
  }, []);

  const handleSaveAISettings = (settings: AISettings) => {
    setAiSettings(settings);
    localStorage.setItem('lyricflow_ai_settings', JSON.stringify(settings));
    showToast('تنظیمات ترجمه ذخیره شد!', 'success');
  };

  // Play a stored song
  const playStoredSong = useCallback((song: StoredSong, startPlaying: boolean = true) => {
    const { metadata, audioUrl } = convertStoredSongToMetadata(song);
    isSwitchingTrackRef.current = true;

    setCurrentSongId(song.id);
    setCurrentSong(metadata);
    setLyrics(song.lyrics || []);
    setActiveIndex(0);
    setSyncOffset(0);
    setCurrentTime(0);
    setDuration(song.duration || 0);

    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch (_) {}
      audioRef.current.src = audioUrl;
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.load();

      if (startPlaying) {
        setIsPlaying(true);
        audioRef.current
          .play()
          .then(() => {
            if (audioRef.current && audioRef.current.currentTime > 0.5) {
              audioRef.current.currentTime = 0;
            }
            isSwitchingTrackRef.current = false;
            setIsPlaying(true);
          })
          .catch((e) => {
            isSwitchingTrackRef.current = false;
            console.warn('Auto-play prevented:', e);
            setIsPlaying(false);
          });
      } else {
        isSwitchingTrackRef.current = false;
        setIsPlaying(false);
      }
    }
  }, [playbackRate]);

  // Synchronize audio time and active lyric line
  const handleTimeUpdate = () => {
    if (!audioRef.current || isSwitchingTrackRef.current) return;
    const time = audioRef.current.currentTime;
    setCurrentTime(time);

    const idx = getActiveLyricIndex(lyrics, time, syncOffset);
    setActiveIndex(idx);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
    if (isSwitchingTrackRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  // Play Next Track
  const handleNextTrack = useCallback(() => {
    if (playlist.length === 0) return;

    let nextIndex: number;
    const currentIndex = playlist.findIndex((s) => s.id === currentSongId);

    if (isShuffle && playlist.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * playlist.length);
      } while (nextIndex === currentIndex);
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }

    playStoredSong(playlist[nextIndex], true);
  }, [playlist, currentSongId, isShuffle, playStoredSong]);

  // Play Previous Track
  const handlePrevTrack = useCallback(() => {
    if (playlist.length === 0) return;
    if (playlist.length === 1 && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      return;
    }

    const currentIndex = playlist.findIndex((s) => s.id === currentSongId);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    playStoredSong(playlist[prevIndex], true);
  }, [playlist, currentSongId, playStoredSong]);

  const handleEnded = () => {
    if (isLooping) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        audioRef.current.play();
      }
    } else {
      handleNextTrack();
    }
  };

  // Play / Pause toggle
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => {
        console.warn('Playback error:', e);
      });
    }
  };

  // Seek audio
  const handleSeek = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = seconds;
    setCurrentTime(seconds);
    const idx = getActiveLyricIndex(lyrics, seconds, syncOffset);
    setActiveIndex(idx);
  };

  const handleSkipTime = (delta: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(currentTime + delta, duration));
    handleSeek(newTime);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      audioRef.current.muted = false;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  };

  const handlePlaybackRateChange = (newRate: number) => {
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
    showToast(`سرعت پخش به ${newRate}x تغییر یافت`, 'info');
  };

  const handleOffsetChange = (delta: number) => {
    setSyncOffset((prev) => parseFloat((prev + delta).toFixed(2)));
  };

  // Process and add files (Instant local reading + background lyrics/translation)
  const processAndAddFiles = async (fileList: File[]) => {
    const validFiles = fileList.filter(
      (f) => f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|ogg|m4a|flac)$/i)
    );

    if (validFiles.length === 0) {
      alert('هیچ فایل صوتی معتبری (MP3, WAV, OGG, M4A) در انتخاب شما یافت نشد.');
      return;
    }

    showToast(`در حال خواندن مستقیم ${validFiles.length} آهنگ از سیستم...`, 'info');

    // 1. Instant parallel local file reading (zero server upload, all in-browser)
    const parsedList = await Promise.all(
      validFiles.map(async (file) => {
        try {
          return await parseLocalAudioFile(file);
        } catch (err) {
          console.error('Failed parsing local file:', file.name, err);
          return null;
        }
      })
    );

    const validParsed = parsedList.filter((p): p is NonNullable<typeof p> => p !== null);
    if (validParsed.length === 0) {
      showToast('خطا در خواندن فایل‌های صوتی انتخاب شده', 'error');
      return;
    }

    // 2. Immediately build StoredSong objects with local blobs & metadata
    const newStoredSongs: StoredSong[] = validParsed.map((parsed) => ({
      id: parsed.metadata.id,
      title: parsed.metadata.title,
      artist: parsed.metadata.artist,
      album: parsed.metadata.album,
      duration: parsed.metadata.duration,
      audioBlob: parsed.audioBlob,
      coverBlob: parsed.coverBlob,
      isLocal: true,
      lyrics: [],
      isTranslated: false,
      createdAt: Date.now(),
    }));

    // 3. Save all songs to IndexedDB immediately and update playlist state
    await Promise.all(newStoredSongs.map((s) => saveSongToDB(s)));
    const updatedSongs = await getAllSongsFromDB();
    setPlaylist(updatedSongs);

    // 4. Play the first song instantly!
    const firstNewSong = newStoredSongs[0];
    playStoredSong(firstNewSong, true);
    showToast(`${newStoredSongs.length} آهنگ فوراً از کامپیوتر بارگذاری و آماده پخش شد!`, 'success');

    // 5. Background lyrics fetching and auto-translation (runs quietly in background without blocking)
    (async () => {
      for (const song of newStoredSongs) {
        try {
          const lrcResult = await fetchLyricsFromLRCLIB(
            song.artist,
            song.title,
            song.duration
          );

          if (lrcResult && lrcResult.syncedLyrics) {
            let songLyrics = parseLRC(lrcResult.syncedLyrics);
            let isTranslated = false;

            try {
              songLyrics = await translateLyricsUniversal(songLyrics, aiSettings);
              isTranslated = true;
              saveCachedLyrics(song.artist, song.title, songLyrics);
            } catch (err) {
              console.warn('Background auto-translate error, trying Google Translate:', err);
              try {
                songLyrics = await translateWithFreeEngine(songLyrics);
                isTranslated = true;
              } catch (e) {
                console.warn('Google Translate fallback error:', e);
              }
            }

            const updatedSong: StoredSong = {
              ...song,
              lyrics: songLyrics,
              isTranslated,
            };

            await saveSongToDB(updatedSong);

            // Update in playlist state
            setPlaylist((prev) =>
              prev.map((s) => (s.id === song.id ? updatedSong : s))
            );

            // If this song is currently active on screen, live-update its lyrics!
            setCurrentSongId((currentId) => {
              if (currentId === song.id) {
                setLyrics(songLyrics);
              }
              return currentId;
            });
          }
        } catch (bgErr) {
          console.warn('Background lyrics processing error for', song.title, bgErr);
        }
      }
    })();
  };

  const handleUploadFileList = (files: FileList) => {
    processAndAddFiles(Array.from(files));
  };

  // Toggle Favorite status for a song
  const handleToggleFavorite = async (songId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const nextFav = await toggleSongFavoriteInDB(songId);
      setPlaylist((prev) =>
        prev.map((s) => (s.id === songId ? { ...s, isFavorite: nextFav } : s))
      );
      showToast(nextFav ? 'به پوشه علاقه‌مندی‌ها اضافه شد ❤️' : 'از پوشه علاقه‌مندی‌ها حذف شد', 'info');
    } catch (err) {
      console.error('Failed toggling favorite:', err);
    }
  };

  // Delete song from playlist
  const handleDeleteSong = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteSongFromDB(id);
      const remaining = playlist.filter((s) => s.id !== id);
      setPlaylist(remaining);
      showToast('آهنگ از لیست پخش حذف شد', 'info');

      if (currentSongId === id && remaining.length > 0) {
        playStoredSong(remaining[0], isPlaying);
      }
    } catch (err) {
      console.error('Failed deleting song:', err);
    }
  };

  // Translate Song On Demand
  const handleTranslateSong = async (song: StoredSong, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (song.lyrics.length === 0) {
      showToast('این آهنگ متنی برای ترجمه ندارد', 'error');
      return;
    }

    setIsTranslating(true);
    showToast('در حال ترجمه متن آهنگ با Google Translate...', 'info');

    try {
      const translated = await translateLyricsUniversal(song.lyrics, aiSettings);

      await updateSongLyricsInDB(song.id, translated, true);

      if (song.id === currentSongId) {
        setLyrics(translated);
      }

      setPlaylist((prev) =>
        prev.map((s) => (s.id === song.id ? { ...s, lyrics: translated, isTranslated: true } : s))
      );

      showToast('ترجمه فارسی با موفقیت انجام و روی آهنگ ذخیره شد!', 'success');
    } catch (err: any) {
      console.warn('Primary translation error, falling back to Google Translate:', err);
      try {
        showToast('در حال ترجمه با Google Translate...', 'info');
        const translated = await translateWithFreeEngine(song.lyrics);
        await updateSongLyricsInDB(song.id, translated, true);
        if (song.id === currentSongId) setLyrics(translated);
        setPlaylist((prev) =>
          prev.map((s) => (s.id === song.id ? { ...s, lyrics: translated, isTranslated: true } : s))
        );
        showToast('ترجمه توسط Google Translate با موفقیت انجام شد!', 'success');
      } catch (fallbackErr: any) {
        showToast(`خطا در ترجمه: ${fallbackErr?.message || 'خطا در برقراری ارتباط'}`, 'error');
      }
    } finally {
      setIsTranslating(false);
    }
  };

  // Manual Lyrics Search
  const handleManualSearch = async (artist: string, title: string) => {
    setIsLoadingLyrics(true);
    showToast(`در حال جستجوی آنلاین برای ${title}...`, 'info');

    try {
      const result = await fetchLyricsFromLRCLIB(artist, title);
      if (result && result.syncedLyrics) {
        let parsed = parseLRC(result.syncedLyrics);
        let isTranslated = false;

        setIsTranslating(true);
        try {
          parsed = await translateLyricsUniversal(parsed, aiSettings);
          isTranslated = true;
        } catch (e) {
          console.warn('AI translation failed, falling back to Google Translate:', e);
          try {
            parsed = await translateWithFreeEngine(parsed);
            isTranslated = true;
          } catch (err) {
            console.warn('Google Translate fallback error:', err);
          }
        } finally {
          setIsTranslating(false);
        }

        setLyrics(parsed);

        await updateSongLyricsInDB(currentSongId, parsed, isTranslated);
        setPlaylist((prev) =>
          prev.map((s) => (s.id === currentSongId ? { ...s, lyrics: parsed, isTranslated } : s))
        );

        showToast('متن هماهنگ با موفقیت دریافت و روی آهنگ ذخیره شد!', 'success');
      } else {
        showToast('لیریکس هماهنگ پیدا نشد. می‌توانید متن را دستی پیست کنید.', 'error');
      }
    } catch (e) {
      console.error('Search error:', e);
      showToast('خطا در جستجوی لیریکس', 'error');
    } finally {
      setIsLoadingLyrics(false);
    }
  };

  // Paste Custom LRC
  const handlePasteLrc = async (rawLrc: string) => {
    let parsed = parseLRC(rawLrc);
    if (parsed.length === 0) {
      showToast('متن وارد شده فاقد زمان‌بندی معتبر [00:12.34] بود', 'error');
      return;
    }

    let isTranslated = false;
    setIsTranslating(true);
    try {
      parsed = await translateLyricsUniversal(parsed, aiSettings);
      isTranslated = true;
    } catch (e) {
      console.warn('AI translation failed, falling back to Google Translate:', e);
      try {
        parsed = await translateWithFreeEngine(parsed);
        isTranslated = true;
      } catch (err) {
        console.warn('Google Translate fallback error:', err);
      }
    } finally {
      setIsTranslating(false);
    }

    setLyrics(parsed);
    await updateSongLyricsInDB(currentSongId, parsed, isTranslated);
    setPlaylist((prev) =>
      prev.map((s) => (s.id === currentSongId ? { ...s, lyrics: parsed, isTranslated } : s))
    );

    showToast('متن دلخواه با موفقیت روی آهنگ ذخیره شد!', 'success');
  };

  // Save lyrics from Custom Lyrics Studio
  const handleSaveLyricsFromEditor = async (newLyrics: LyricLine[]) => {
    setLyrics(newLyrics);
    const hasTranslation = newLyrics.some((l) => l.translation && l.translation.trim().length > 0);
    await updateSongLyricsInDB(currentSongId, newLyrics, hasTranslation);
    setPlaylist((prev) =>
      prev.map((s) => (s.id === currentSongId ? { ...s, lyrics: newLyrics, isTranslated: hasTranslation } : s))
    );
    if (newLyrics.length === 0) {
      showToast('لیریکس آهنگ به طور کامل حذف شد!', 'info');
    } else {
      showToast('لیریکس و ترجمه با موفقیت روی آهنگ ذخیره شد!', 'success');
    }
  };

  // Word Click Handler
  const handleWordClick = async (word: string) => {
    setIsLoadingWord(true);
    setSelectedWord(null);
    try {
      const def = await lookupWord(word, aiSettings);
      setSelectedWord(def);
    } finally {
      setIsLoadingWord(false);
    }
  };

  // Drag and drop listeners with directory extraction support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      const extractedFiles: File[] = [];
      const queue: any[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (typeof item.webkitGetAsEntry === 'function') {
          const entry = item.webkitGetAsEntry();
          if (entry) queue.push(entry);
        }
      }

      if (queue.length > 0) {
        while (queue.length > 0) {
          const entry = queue.shift();
          if (entry.isFile) {
            const file: File = await new Promise((res) => entry.file(res));
            extractedFiles.push(file);
          } else if (entry.isDirectory) {
            const reader = entry.createReader();
            const entries: any[] = await new Promise((res) => reader.readEntries(res));
            queue.push(...entries);
          }
        }
        processAndAddFiles(extractedFiles);
        return;
      }
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex flex-col h-screen w-screen bg-[#07080c] text-white overflow-hidden select-none"
    >
      {/* Hidden Native Audio Element (src managed imperatively by playStoredSong to avoid React reload races) */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="auto"
      />

      {/* Dynamic Ambient Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[140px] opacity-25 transition-all duration-1000"
          style={{
            backgroundColor:
              visualizerSettings.colorTheme === 'emerald-gold'
                ? '#10b981'
                : visualizerSettings.colorTheme === 'neon-amber'
                ? '#f43f5e'
                : visualizerSettings.colorTheme === 'crimson-violet'
                ? '#e11d48'
                : '#06b6d4',
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[140px] opacity-25 transition-all duration-1000"
          style={{
            backgroundColor:
              visualizerSettings.colorTheme === 'emerald-gold'
                ? '#f59e0b'
                : visualizerSettings.colorTheme === 'neon-amber'
                ? '#eab308'
                : visualizerSettings.colorTheme === 'crimson-violet'
                ? '#7c3aed'
                : '#a855f7',
          }}
        />
      </div>

      {/* Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-cyan-400 gap-4 pointer-events-none">
          <FolderPlus className="w-16 h-16 text-cyan-400 animate-bounce" />
          <h2 className="text-2xl font-bold font-farsi text-white">آهنگ‌ها یا پوشه را همین‌جا رها کنید!</h2>
          <p className="text-sm font-farsi text-gray-400">شناسایی خودکار فایل‌های درون پوشه و ذخیره دائمی</p>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-2.5 rounded-full glass-panel border border-white/10 shadow-2xl animate-fadeIn font-farsi text-xs">
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
          {toastMessage.type === 'info' && <Sparkles className="w-4 h-4 text-cyan-400" />}
          <span className="text-white font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* App Header */}
      <header className="glass-panel border-b border-white/10 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 shadow-md shadow-cyan-500/20 shrink-0">
            <Music className="w-4 h-4 sm:w-5 sm:h-5 text-gray-950" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-wide text-white flex items-center gap-1.5 sm:gap-2">
              LyricFlow <span className="text-cyan-400 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 font-mono">Bilingual Pro</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-gray-400 font-farsi hidden md:block">
              موزیک پلیر کامل با لیریکس دو زبانه و هوش مصنوعی چندگانه
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Custom Lyrics Studio Button */}
          <button
            onClick={() => setIsEditorOpen(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-farsi text-xs border border-cyan-500/25 transition-all active:scale-95 shadow-sm"
            title="افزودن یا ویرایش متن انگلیسی و ترجمه فارسی"
          >
            <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">ویرایش متن و ترجمه</span>
          </button>

          {/* Translate Button for current song */}
          {lyrics.length > 0 && !lyrics.some((l) => l.translation) && (
            <button
              onClick={() => {
                const currentStored = playlist.find((s) => s.id === currentSongId);
                if (currentStored) {
                  handleTranslateSong(currentStored);
                } else {
                  handleTranslateSong({
                    id: currentSong.id,
                    title: currentSong.title,
                    artist: currentSong.artist,
                    album: currentSong.album,
                    duration: currentSong.duration,
                    coverUrl: currentSong.coverUrl,
                    audioUrl: currentSong.audioUrl,
                    isLocal: currentSong.isLocal || false,
                    lyrics: lyrics,
                    isTranslated: false,
                    createdAt: Date.now(),
                  });
                }
              }}
              disabled={isTranslating}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/25 to-cyan-500/20 border border-emerald-400/40 text-emerald-300 hover:text-white font-farsi text-xs transition-all shadow-md active:scale-95"
              title="ترجمه فوری این آهنگ با Google Translate (رایگان و بدون نیاز به کلید)"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">ترجمه به فارسی</span>
            </button>
          )}

          {/* Favorite Toggle for Current Song */}
          {currentSongId && (
            <button
              onClick={() => handleToggleFavorite(currentSongId)}
              className={`p-1.5 sm:p-2 rounded-xl border transition-all active:scale-90 ${
                playlist.find((s) => s.id === currentSongId)?.isFavorite
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-sm shadow-rose-500/20'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-400 hover:text-rose-400'
              }`}
              title={
                playlist.find((s) => s.id === currentSongId)?.isFavorite
                  ? 'حذف از علاقه‌مندی‌ها'
                  : 'افزودن به علاقه‌مندی‌ها'
              }
            >
              <Heart
                className={`w-4 h-4 ${
                  playlist.find((s) => s.id === currentSongId)?.isFavorite ? 'fill-rose-400' : ''
                }`}
              />
            </button>
          )}

          {/* Open Playlist Drawer */}
          <button
            onClick={() => setIsPlaylistOpen(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-farsi text-xs border border-white/10 transition-all active:scale-95"
            title="مشاهده و مدیریت لیست آهنگ‌ها"
          >
            <ListMusic className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">آرشیو آهنگ‌ها ({playlist.length})</span>
            <span className="sm:hidden font-mono text-[11px] font-bold">({playlist.length})</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              setSettingsInitialTab('audio');
              setIsSettingsOpen(true);
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-farsi border border-white/10"
            title="تنظیمات صدا، اکولایزر و هوش مصنوعی"
          >
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">اکولایزر و تنظیمات</span>
          </button>
        </div>
      </header>

      {/* Mobile Tab Switcher (Visible ONLY on mobile screens < md) */}
      <div className="flex md:hidden items-center justify-between px-3.5 py-1.5 border-b border-white/10 bg-[#090b12]/90 backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <div
            className={`w-7 h-7 rounded-full overflow-hidden border border-white/20 shrink-0 ${
              isPlaying ? 'animate-spin-slow' : 'animate-spin-paused'
            }`}
          >
            <img
              src={
                currentSong.coverUrl ||
                'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'
              }
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate max-w-[140px] leading-tight">
              {currentSong.title}
            </p>
            <p className="text-[10px] text-cyan-300 truncate max-w-[140px] leading-tight">
              {currentSong.artist}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10 font-farsi text-xs shrink-0">
          <button
            onClick={() => setMobileTab('lyrics')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
              mobileTab === 'lyrics'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-gray-950 font-bold shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>متن ترانه</span>
          </button>
          <button
            onClick={() => setMobileTab('cover')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
              mobileTab === 'cover'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-gray-950 font-bold shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Disc3 className="w-3.5 h-3.5" />
            <span>کاور دیسک</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden z-10">
        {/* Left Panel: Album Art & Visualizer (Desktop: always visible; Mobile: visible when mobileTab === 'cover') */}
        <section
          className={`w-full md:w-[380px] lg:w-[420px] p-6 flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 glass-panel shrink-0 space-y-5 overflow-y-auto ${
            mobileTab === 'cover' ? 'flex flex-1' : 'hidden md:flex'
          }`}
        >
          <div className="relative group">
            <div
              className={`w-52 h-52 sm:w-64 sm:h-64 rounded-full p-2 bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-950 shadow-2xl border-4 border-white/10 relative flex items-center justify-center ${
                isPlaying ? 'animate-spin-slow' : 'animate-spin-paused'
              }`}
            >
              <div className="absolute inset-2 rounded-full border border-white/5 pointer-events-none" />
              <div className="absolute inset-6 rounded-full border border-white/5 pointer-events-none" />
              <div className="absolute inset-10 rounded-full border border-white/5 pointer-events-none" />

              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-inner border-2 border-white/20">
                <img
                  src={
                    currentSong.coverUrl ||
                    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80'
                  }
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="absolute w-5 h-5 bg-[#07080c] rounded-full border-2 border-white/30" />
            </div>

            <div
              className={`absolute -inset-2 rounded-full blur-xl -z-10 transition-opacity duration-700 ${
                isPlaying ? 'opacity-40 bg-cyan-500' : 'opacity-0'
              }`}
            />
          </div>

          <div className="text-center space-y-1 w-full px-4">
            <h2 className="text-xl font-extrabold text-white truncate" title={currentSong.title}>
              {currentSong.title}
            </h2>
            <p className="text-sm font-medium text-cyan-300 truncate" title={currentSong.artist}>
              {currentSong.artist}
            </p>
            {currentSong.album && (
              <p className="text-xs text-gray-500 truncate">{currentSong.album}</p>
            )}
          </div>

          <div className="w-full max-w-[340px] px-2">
            <AudioVisualizer
              audioElement={audioRef.current}
              isPlaying={isPlaying}
              theme={visualizerSettings.colorTheme}
              type={visualizerSettings.type}
              onCycleType={handleCycleVisualizerType}
              height={65}
              audioSettings={audioSettings}
            />
          </div>
        </section>

        {/* Right Panel: Synchronized Bilingual Lyrics (Desktop: always visible; Mobile: visible when mobileTab === 'lyrics') */}
        <section
          className={`flex-1 flex-col h-full overflow-hidden bg-black/20 ${
            mobileTab === 'lyrics' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <LyricsViewer
            lyrics={lyrics}
            activeIndex={activeIndex}
            viewMode={viewMode}
            onSeek={handleSeek}
            onWordClick={handleWordClick}
            offset={syncOffset}
            onOffsetChange={handleOffsetChange}
            isLoadingLyrics={isLoadingLyrics}
            isTranslating={isTranslating}
            onManualSearchClick={() => setIsSearchOpen(true)}
            onOpenEditor={() => setIsEditorOpen(true)}
          />
        </section>
      </main>

      {/* Bottom Sticky Player Bar */}
      <PlayerControls
        currentSong={currentSong}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isLooping={isLooping}
        isShuffle={isShuffle}
        playbackRate={playbackRate}
        viewMode={viewMode}
        playlistCount={playlist.length}
        onPlayPause={togglePlayPause}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onToggleMute={toggleMute}
        onToggleLoop={() => setIsLooping(!isLooping)}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        onNextTrack={handleNextTrack}
        onPrevTrack={handlePrevTrack}
        onSkipTime={handleSkipTime}
        onChangePlaybackRate={handlePlaybackRateChange}
        onViewModeChange={setViewMode}
        onFileUpload={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleUploadFileList(e.target.files);
          }
        }}
        onFolderUpload={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleUploadFileList(e.target.files);
          }
        }}
        onOpenSettings={() => {
          setSettingsInitialTab('audio');
          setIsSettingsOpen(true);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenPlaylist={() => setIsPlaylistOpen(true)}
      />

      {/* Modals & Drawers */}
      <WordModal
        definition={selectedWord}
        loading={isLoadingWord}
        onClose={() => setSelectedWord(null)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        aiSettings={aiSettings}
        onSaveAISettings={handleSaveAISettings}
        visualizerSettings={visualizerSettings}
        onUpdateVisualizer={setVisualizerSettings}
        audioSettings={audioSettings}
        onUpdateAudioSettings={handleUpdateAudioSettings}
        sleepRemainingSeconds={sleepRemainingSeconds}
        onSetSleepTimer={handleSetSleepTimer}
        initialTab={settingsInitialTab}
      />

      <ManualSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        currentTitle={currentSong.title}
        currentArtist={currentSong.artist}
        onSearch={handleManualSearch}
        onPasteLrc={handlePasteLrc}
        currentLyrics={lyrics}
      />

      <LyricsEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        currentLyrics={lyrics}
        songTitle={currentSong.title}
        songArtist={currentSong.artist}
        onSaveLyrics={handleSaveLyricsFromEditor}
      />

      <PlaylistDrawer
        isOpen={isPlaylistOpen}
        onClose={() => setIsPlaylistOpen(false)}
        songs={playlist}
        currentSongId={currentSongId}
        isPlaying={isPlaying}
        onSelectSong={(song) => {
          playStoredSong(song, true);
          setIsPlaylistOpen(false);
        }}
        onDeleteSong={handleDeleteSong}
        onUploadFiles={handleUploadFileList}
        onTranslateSong={handleTranslateSong}
        onToggleFavorite={handleToggleFavorite}
        isTranslating={isTranslating}
      />
    </div>
  );
}

export default App;
