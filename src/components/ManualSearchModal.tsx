import React, { useState, useEffect } from 'react';
import { X, Search, FileText, Sparkles } from 'lucide-react';
import type { LyricLine } from '../types/lyrics';
import { formatTimeLRC } from '../utils/lrcParser';

interface ManualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTitle: string;
  currentArtist: string;
  onSearch: (artist: string, title: string) => void;
  onPasteLrc: (lrcContent: string) => void;
  currentLyrics?: LyricLine[];
}

export const ManualSearchModal: React.FC<ManualSearchModalProps> = ({
  isOpen,
  onClose,
  currentTitle,
  currentArtist,
  onSearch,
  onPasteLrc,
  currentLyrics,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'paste'>('search');
  const [artist, setArtist] = useState(currentArtist);
  const [title, setTitle] = useState(currentTitle);
  const [pastedLrc, setPastedLrc] = useState('');

  // Always sync title, artist, and existing lyrics whenever modal opens or song changes
  useEffect(() => {
    if (isOpen) {
      setArtist(currentArtist || '');
      setTitle(currentTitle || '');

      if (currentLyrics && currentLyrics.length > 0) {
        const reconstructed = currentLyrics
          .map((l) => {
            const timeTag = formatTimeLRC(l.time);
            return l.translation ? `${timeTag} ${l.text} // ${l.translation}` : `${timeTag} ${l.text}`;
          })
          .join('\n');
        setPastedLrc(reconstructed);
      } else {
        setPastedLrc('');
      }
    }
  }, [isOpen, currentArtist, currentTitle, currentLyrics]);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSearch(artist.trim(), title.trim());
    onClose();
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedLrc.trim()) return;
    onPasteLrc(pastedLrc);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl border border-white/10 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-lg font-bold text-white font-farsi flex items-center gap-2">
            <Search className="w-5 h-5 text-cyan-400" />
            جستجو یا درج دستی متن لیریکس
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-black/30 rounded-xl border border-white/5 font-farsi text-xs">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'search'
                ? 'bg-cyan-500 text-gray-950 font-bold shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            جستجوی آنلاین (LRCLIB)
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'paste'
                ? 'bg-cyan-500 text-gray-950 font-bold shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            پیست کردن متن یا فایل LRC
          </button>
        </div>

        {activeTab === 'search' ? (
          <form onSubmit={handleSearchSubmit} className="space-y-4 font-farsi">
            <div className="space-y-1 text-right">
              <label className="text-xs text-gray-300">نام آهنگ (Track Title):</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: Shape of You"
                required
                dir="auto"
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="space-y-1 text-right">
              <label className="text-xs text-gray-300">نام خواننده (Artist Name):</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="مثال: Ed Sheeran"
                dir="auto"
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              دریافت لیریکس و ترجمه
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasteSubmit} className="space-y-4 font-farsi">
            <div className="space-y-1 text-right">
              <label className="text-xs text-gray-300">متن LRC یا لیریکس زمان‌بندی‌شده:</label>
              <textarea
                value={pastedLrc}
                onChange={(e) => setPastedLrc(e.target.value)}
                placeholder="[00:15.30] Example lyrics line&#10;[00:20.10] Another line"
                rows={6}
                dir="ltr"
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              اعمال لیریکس
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
