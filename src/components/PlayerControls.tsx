import React, { useRef, useState } from 'react';
import type { SongMetadata, ViewMode } from '../types/lyrics';
import { formatTime } from '../utils/lrcParser';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Upload,
  Settings,
  Search,
  Repeat,
  Shuffle,
  ListMusic,
  Gauge,
  FolderPlus,
} from 'lucide-react';

interface PlayerControlsProps {
  currentSong: SongMetadata | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
  isShuffle: boolean;
  playbackRate: number;
  viewMode: ViewMode;
  playlistCount: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleLoop: () => void;
  onToggleShuffle: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onSkipTime: (seconds: number) => void;
  onChangePlaybackRate: (rate: number) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFolderUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onOpenPlaylist: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isLooping,
  isShuffle,
  playbackRate,
  viewMode,
  playlistCount,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleLoop,
  onToggleShuffle,
  onNextTrack,
  onPrevTrack,
  onSkipTime,
  onChangePlaybackRate,
  onViewModeChange,
  onFileUpload,
  onFolderUpload,
  onOpenSettings,
  onOpenSearch,
  onOpenPlaylist,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    onSeek(Math.max(0, Math.min(newTime, duration)));
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-4 h-4" />;
    if (volume < 0.5) return <Volume1 className="w-4 h-4" />;
    return <Volume2 className="w-4 h-4" />;
  };

  const speedOptions = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0];

  return (
    <footer className="glass-panel border-t border-white/10 px-4 py-3 md:px-8 md:py-4 z-30 transition-all">
      {/* Top Track Seek Bar */}
      <div className="w-full mb-3 flex items-center gap-3">
        <span className="text-[11px] font-mono text-gray-400 w-10 text-right">
          {formatTime(currentTime)}
        </span>
        <div
          onClick={handleProgressClick}
          className="flex-1 h-2 bg-white/10 hover:h-3 rounded-full overflow-hidden cursor-pointer relative group transition-all"
        >
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full relative transition-[width] duration-150 ease-out"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <span className="text-[11px] font-mono text-gray-400 w-10">
          {formatTime(duration)}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 lg:gap-4">
        {/* Left: Track Information (Visible on sm and up) */}
        <div className="hidden sm:flex items-center gap-3 w-full sm:w-auto lg:w-1/4 justify-start">
          <div className="relative w-12 h-12 shrink-0">
            <div
              className={`w-full h-full rounded-full overflow-hidden border-2 border-white/10 shadow-md ${
                isPlaying ? 'animate-spin-slow' : 'animate-spin-paused'
              }`}
            >
              <img
                src={
                  currentSong?.coverUrl ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'
                }
                alt={currentSong?.title || 'Cover'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 m-auto w-3 h-3 bg-[#090a0f] border border-white/30 rounded-full" />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate" title={currentSong?.title}>
              {currentSong?.title || 'موزیکی انتخاب نشده'}
            </h4>
            <p className="text-xs text-gray-400 truncate" title={currentSong?.artist}>
              {currentSong?.artist || 'برای شروع فایلی انتخاب کنید'}
            </p>
          </div>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex items-center gap-2 sm:gap-4 justify-center">
          {/* Shuffle Toggle */}
          <button
            onClick={onToggleShuffle}
            className={`p-2 rounded-full transition-all active:scale-90 ${
              isShuffle ? 'text-cyan-400 bg-cyan-500/15' : 'text-gray-400 hover:text-white'
            }`}
            title={isShuffle ? 'پخش تصادفی فعال' : 'پخش تصادفی غیرفعال'}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* Previous Track */}
          <button
            onClick={onPrevTrack}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-90"
            title="آهنگ قبلی"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Skip Back 5s */}
          <button
            onClick={() => onSkipTime(-5)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-90 hidden sm:block"
            title="۵ ثانیه عقب‌تر"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Main Play / Pause Button */}
          <button
            onClick={onPlayPause}
            className="p-3.5 sm:p-4 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 text-gray-950 hover:brightness-110 shadow-lg shadow-cyan-500/30 transition-all active:scale-95"
            title={isPlaying ? 'مکث' : 'پخش'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
            ) : (
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Skip Forward 5s */}
          <button
            onClick={() => onSkipTime(5)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-90 hidden sm:block"
            title="۵ ثانیه جلوتر"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Next Track */}
          <button
            onClick={onNextTrack}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-90"
            title="آهنگ بعدی"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Loop toggle */}
          <button
            onClick={onToggleLoop}
            className={`p-2 rounded-full transition-all active:scale-90 ${
              isLooping ? 'text-cyan-400 bg-cyan-500/15' : 'text-gray-400 hover:text-white'
            }`}
            title={isLooping ? 'تکرار خودکار فعال' : 'تکرار خودکار غیرفعال'}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Actions, Speed, View Mode & Playlist */}
        <div className="flex items-center justify-center lg:justify-end flex-wrap gap-2 sm:gap-2.5 w-full lg:w-1/3">
          {/* Speed Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="p-1.5 rounded-lg text-xs font-mono text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-1 transition-all"
              title="سرعت پخش"
            >
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>{playbackRate}x</span>
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full mb-2 left-0 w-48 glass-panel border border-white/15 rounded-2xl p-2.5 shadow-2xl space-y-2.5 z-40">
                <div className="flex items-center justify-between text-[11px] font-farsi text-gray-300 px-1">
                  <span>سرعت پخش:</span>
                  <span className="font-mono font-bold text-cyan-300">{playbackRate.toFixed(2).replace(/\.00$/, '')}x</span>
                </div>
                <input
                  type="range"
                  min="0.25"
                  max="3"
                  step="0.05"
                  value={playbackRate}
                  onChange={(e) => onChangePlaybackRate(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/15 rounded-lg cursor-pointer accent-cyan-400"
                />
                <div className="grid grid-cols-3 gap-1">
                  {speedOptions.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        onChangePlaybackRate(rate);
                        setShowSpeedMenu(false);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-mono text-center transition-all ${
                        Math.abs(playbackRate - rate) < 0.01
                          ? 'bg-cyan-500 text-gray-950 font-bold shadow'
                          : 'bg-white/5 text-gray-300 hover:bg-white/15'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* View Mode (Languages) */}
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5 font-farsi text-xs">
            <button
              onClick={() => onViewModeChange('dual')}
              className={`px-2 py-1 rounded-lg transition-all ${
                viewMode === 'dual'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="نمایش همزمان انگلیسی و فارسی"
            >
              دوزبانه
            </button>
            <button
              onClick={() => onViewModeChange('english')}
              className={`px-2 py-1 rounded-lg transition-all ${
                viewMode === 'english'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="فقط متن انگلیسی"
            >
              EN
            </button>
            <button
              onClick={() => onViewModeChange('persian')}
              className={`px-2 py-1 rounded-lg transition-all ${
                viewMode === 'persian'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="فقط ترجمه فارسی"
            >
              فا
            </button>
          </div>

          {/* Playlist Drawer Button */}
          <button
            onClick={onOpenPlaylist}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 font-farsi text-xs transition-all active:scale-95"
            title="مشاهده لیست پخش کامل"
          >
            <ListMusic className="w-4 h-4" />
            <span className="font-bold">{playlistCount}</span>
          </button>

          {/* Search Lyrics */}
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="جستجوی لیریکس آهنگ"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Upload File Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileUpload}
            multiple
            accept="audio/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="افزودن فایل‌های صوتی"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Upload Folder Button */}
          <input
            type="file"
            ref={folderInputRef}
            onChange={onFolderUpload}
            {...({ webkitdirectory: '', directory: '' } as any)}
            multiple
            className="hidden"
          />
          <button
            onClick={() => folderInputRef.current?.click()}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="افزودن کل یک پوشه آهنگ"
          >
            <FolderPlus className="w-4 h-4 text-purple-400" />
          </button>

          {/* Volume control */}
          <div className="flex items-center gap-1 group">
            <button
              onClick={onToggleMute}
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
            >
              {getVolumeIcon()}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-14 sm:w-16 accent-cyan-400 h-1 bg-white/20 rounded-lg cursor-pointer"
            />
          </div>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="تنظیمات و کلید AI"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};
