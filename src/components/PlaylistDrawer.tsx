import React, { useState, useRef } from 'react';
import type { StoredSong } from '../services/storageService';
import { formatTime } from '../utils/lrcParser';
import {
  X,
  Play,
  Pause,
  Trash2,
  Music,
  Sparkles,
  Search,
  CheckCircle2,
  ListMusic,
  Plus,
  FolderPlus,
  Heart,
} from 'lucide-react';

interface PlaylistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  songs: StoredSong[];
  currentSongId: string;
  isPlaying: boolean;
  onSelectSong: (song: StoredSong) => void;
  onDeleteSong: (id: string, e: React.MouseEvent) => void;
  onUploadFiles: (files: FileList) => void;
  onTranslateSong: (song: StoredSong, e: React.MouseEvent) => void;
  onToggleFavorite: (songId: string, e: React.MouseEvent) => void;
  isTranslating: boolean;
}

export const PlaylistDrawer: React.FC<PlaylistDrawerProps> = ({
  isOpen,
  onClose,
  songs,
  currentSongId,
  isPlaying,
  onSelectSong,
  onDeleteSong,
  onUploadFiles,
  onTranslateSong,
  onToggleFavorite,
  isTranslating,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState<'all' | 'favorites'>('all');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const favoriteCount = songs.filter((s) => s.isFavorite).length;

  const filteredSongs = songs.filter((s) => {
    const matchesFolder = activeFolder === 'all' || Boolean(s.isFavorite);
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-md h-full flex flex-col border-l border-white/10 shadow-2xl p-6 relative transform transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-farsi">لیست پخش و آرشیو آهنگ‌ها</h3>
              <p className="text-xs text-gray-400 font-farsi">
                {songs.length} آهنگ ذخیره‌شده (دائمی در مرورگر)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Add New Buttons */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در بین آهنگ‌ها..."
              dir="rtl"
              className="w-full pr-9 pl-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 text-xs font-farsi focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Hidden Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="audio/*"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onUploadFiles(e.target.files);
              }
            }}
            className="hidden"
          />

          <input
            type="file"
            ref={folderInputRef}
            {...({ webkitdirectory: '', directory: '' } as any)}
            multiple
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onUploadFiles(e.target.files);
              }
            }}
            className="hidden"
          />

          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold font-farsi text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              افزودن آهنگ‌ها
            </button>

            <button
              onClick={() => folderInputRef.current?.click()}
              className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold font-farsi text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 transition-all active:scale-95"
              title="انتخاب کل یک پوشه از سیستم و اضافه کردن تمام آهنگ‌های درون آن"
            >
              <FolderPlus className="w-4 h-4" />
              افزودن پوشه کامل
            </button>
          </div>

          {/* Folder Tabs: All Songs vs Favorites */}
          <div className="flex gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 font-farsi text-xs">
            <button
              onClick={() => setActiveFolder('all')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeFolder === 'all'
                  ? 'bg-white/15 text-white font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5 text-cyan-400" />
              <span>همه آهنگ‌ها ({songs.length})</span>
            </button>
            <button
              onClick={() => setActiveFolder('favorites')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeFolder === 'favorites'
                  ? 'bg-rose-500/25 text-rose-200 font-bold border border-rose-500/30 shadow'
                  : 'text-gray-400 hover:text-rose-300'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${activeFolder === 'favorites' ? 'text-rose-400 fill-rose-400' : 'text-rose-400'}`} />
              <span>علاقه‌مندی‌ها ({favoriteCount})</span>
            </button>
          </div>
        </div>

        {/* Songs List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
          {filteredSongs.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              {activeFolder === 'favorites' ? (
                <>
                  <Heart className="w-10 h-10 text-rose-400/50 mx-auto" />
                  <p className="text-sm text-gray-400 font-farsi">هنوز آهنگی به پوشه علاقه‌مندی‌ها اضافه نکرده‌اید.</p>
                  <p className="text-xs text-gray-500 font-farsi">روی آیکون قلب ❤️ کنار هر آهنگ کلیک کنید.</p>
                </>
              ) : (
                <>
                  <Music className="w-10 h-10 text-gray-500 mx-auto opacity-50" />
                  <p className="text-sm text-gray-400 font-farsi">هیچ آهنگی در این لیست پیدا نشد.</p>
                  <div className="flex justify-center gap-3 font-farsi text-xs text-cyan-400">
                    <button onClick={() => fileInputRef.current?.click()} className="underline">
                      انتخاب فایل
                    </button>
                    <span>یا</span>
                    <button onClick={() => folderInputRef.current?.click()} className="underline">
                      انتخاب پوشه
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            filteredSongs.map((song) => {
              const isCurrent = song.id === currentSongId;
              const hasTranslation = song.isTranslated || song.lyrics.some((l) => l.translation);

              return (
                <div
                  key={song.id}
                  onClick={() => onSelectSong(song)}
                  className={`group p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all border ${
                    isCurrent
                      ? 'bg-cyan-500/15 border-cyan-400/40 shadow-lg shadow-cyan-500/10'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-gray-800">
                      <img
                        src={
                          song.coverUrl ||
                          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'
                        }
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                      {isCurrent && (
                        <div className="absolute inset-0 bg-cyan-950/60 flex items-center justify-center">
                          {isPlaying ? (
                            <Pause className="w-4 h-4 text-cyan-300 fill-current animate-pulse" />
                          ) : (
                            <Play className="w-4 h-4 text-cyan-300 fill-current" />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 text-left">
                      <h4
                        className={`text-xs font-bold truncate ${
                          isCurrent ? 'text-cyan-300' : 'text-white'
                        }`}
                        title={song.title}
                      >
                        {song.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 truncate" title={song.artist}>
                        {song.artist}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1">
                        {hasTranslation ? (
                          <span className="text-[10px] font-farsi px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            ترجمه‌شده
                          </span>
                        ) : song.lyrics.length > 0 ? (
                          <span className="text-[10px] font-farsi px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300">
                            لیریکس انگلیسی
                          </span>
                        ) : (
                          <span className="text-[10px] font-farsi px-1.5 py-0.2 rounded bg-gray-500/20 text-gray-400">
                            بدون متن
                          </span>
                        )}

                        {song.duration ? (
                          <span className="text-[10px] text-gray-500 font-mono">
                            {formatTime(song.duration)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => onToggleFavorite(song.id, e)}
                      className={`p-1.5 rounded-lg transition-all active:scale-90 ${
                        song.isFavorite
                          ? 'text-rose-400 bg-rose-500/15 hover:bg-rose-500/25'
                          : 'text-gray-500 hover:text-rose-400 hover:bg-white/5 opacity-70 group-hover:opacity-100'
                      }`}
                      title={song.isFavorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
                    >
                      <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-rose-400' : ''}`} />
                    </button>

                    {!hasTranslation && song.lyrics.length > 0 && (
                      <button
                        onClick={(e) => onTranslateSong(song, e)}
                        disabled={isTranslating}
                        className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        title="ترجمه فوری این آهنگ با Google Translate"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={(e) => onDeleteSong(song.id, e)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="حذف از لیست"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-white/10 text-center">
          <p className="text-[11px] text-gray-400 font-farsi">
            💾 پوشه‌ها و فایل‌ها به صورت مستقیم در مرورگر ذخیره شده و هیچ آپلودی به سرور انجام نمی‌شود.
          </p>
        </div>
      </div>
    </div>
  );
};
