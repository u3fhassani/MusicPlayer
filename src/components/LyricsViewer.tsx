import React, { useEffect, useRef, useState } from 'react';
import type { LyricLine, ViewMode } from '../types/lyrics';
import { formatTime } from '../utils/lrcParser';
import { Sparkles, ArrowDownCircle, Languages, Plus, Minus, Search, Music2, Edit3 } from 'lucide-react';

interface LyricsViewerProps {
  lyrics: LyricLine[];
  activeIndex: number;
  viewMode: ViewMode;
  onSeek: (seconds: number) => void;
  onWordClick: (word: string) => void;
  offset: number;
  onOffsetChange: (delta: number) => void;
  isLoadingLyrics: boolean;
  isTranslating: boolean;
  onManualSearchClick: () => void;
  onOpenEditor?: () => void;
}

export const LyricsViewer: React.FC<LyricsViewerProps> = ({
  lyrics,
  activeIndex,
  viewMode,
  onSeek,
  onWordClick,
  offset,
  onOffsetChange,
  isLoadingLyrics,
  isTranslating,
  onManualSearchClick,
  onOpenEditor,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const [userIsScrolling, setUserIsScrolling] = useState(false);
  const userScrollTimeoutRef = useRef<number | null>(null);

  // Buttery-smooth automatic scrolling using container.scrollTo exact centering
  useEffect(() => {
    if (userIsScrolling || activeIndex < 0) return;

    const container = containerRef.current;
    const activeEl = activeLineRef.current;
    if (container && activeEl) {
      const containerHeight = container.clientHeight;
      const lineOffsetTop = activeEl.offsetTop;
      const lineHeight = activeEl.clientHeight;
      const targetScroll = lineOffsetTop - containerHeight / 2 + lineHeight / 2;

      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth',
      });
    }
  }, [activeIndex, userIsScrolling]);

  const handleUserWheelOrTouch = () => {
    setUserIsScrolling(true);
    if (userScrollTimeoutRef.current) {
      window.clearTimeout(userScrollTimeoutRef.current);
    }
    userScrollTimeoutRef.current = window.setTimeout(() => {
      setUserIsScrolling(false);
    }, 4000);
  };

  const snapToActive = () => {
    setUserIsScrolling(false);
    const container = containerRef.current;
    const activeEl = activeLineRef.current;
    if (container && activeEl) {
      const containerHeight = container.clientHeight;
      const lineOffsetTop = activeEl.offsetTop;
      const lineHeight = activeEl.clientHeight;
      const targetScroll = lineOffsetTop - containerHeight / 2 + lineHeight / 2;

      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth',
      });
    }
  };

  const renderInteractiveText = (text: string, isActive: boolean) => {
    const words = text.split(/(\s+)/);

    return words.map((word, i) => {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '');
      if (!cleanWord) return <span key={i}>{word}</span>;

      return (
        <span
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            onWordClick(cleanWord);
          }}
          className={`cursor-pointer transition-all duration-300 rounded px-1 inline-block ${
            isActive
              ? 'hover:bg-cyan-400/20 hover:text-cyan-200 hover:underline'
              : 'hover:text-white hover:underline'
          }`}
          title={`کلیک برای دیدن معنی کلمه "${cleanWord}"`}
        >
          {word}
        </span>
      );
    });
  };

  if (isLoadingLyrics) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="relative">
          <div className="w-14 h-14 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          <Music2 className="w-6 h-6 text-cyan-300 absolute inset-0 m-auto animate-pulse" />
        </div>
        <p className="text-lg font-medium text-gray-200 font-farsi">در حال جستجو و بارگذاری لیریکس هماهنگ...</p>
        <p className="text-xs text-gray-400 font-farsi">از دیتابیس جهانی LRCLIB</p>
      </div>
    );
  }

  if (lyrics.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5">
        <div className="p-4 rounded-full bg-white/5 border border-white/10 text-gray-400">
          <Languages className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white font-farsi">متن هماهنگ یافت نشد</h3>
          <p className="text-sm text-gray-400 max-w-sm font-farsi">
            برای این آهنگ لیریکس خودکار پیدا نشد. می‌توانید نام را آنلاین جستجو کنید یا متن فارسی/انگلیسی را خودتان اضافه نمایید.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={onManualSearchClick}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold font-farsi text-xs transition-all active:scale-95"
          >
            <Search className="w-4 h-4" />
            جستجوی آنلاین
          </button>
          {onOpenEditor && (
            <button
              onClick={onOpenEditor}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold font-farsi text-xs transition-all shadow-lg shadow-cyan-500/25 active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
              افزودن متن (فارسی / انگلیسی)
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden">
      {/* Top Sync & Status Bar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-white/5 text-xs text-gray-400 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          {isTranslating ? (
            <span className="flex items-center gap-1.5 text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-full animate-pulse font-farsi">
              <Sparkles className="w-3.5 h-3.5" />
              در حال ترجمه متن به فارسی...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-gray-400 font-farsi">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
              لیریکس هماهنگ فعال
            </span>
          )}

          {/* Discreet button in top bar when user manually scrolls */}
          {userIsScrolling && (
            <button
              onClick={snapToActive}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 text-xs font-farsi transition-all cursor-pointer shadow-sm animate-fadeIn"
              title="پرش به خط در حال پخش"
            >
              <ArrowDownCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>بازگشت به خط در حال پخش</span>
            </button>
          )}
        </div>

        {/* Sync Offset Controls & Edit Button */}
        <div className="flex items-center gap-2">
          {onOpenEditor && (
            <button
              onClick={onOpenEditor}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 font-farsi text-[11px] transition-all border border-white/5"
              title="ویرایش یا افزودن لیریکس و ترجمه فارسی"
            >
              <Edit3 className="w-3 h-3 text-cyan-400" />
              <span>ویرایش متن</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1 border border-white/5">
            <span className="text-[11px] font-farsi ml-1">سینک:</span>
            <button
              onClick={() => onOffsetChange(-0.5)}
              className="p-1 hover:text-white rounded hover:bg-white/10 transition-colors"
              title="نیم ثانیه عقب‌تر"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono text-cyan-300 min-w-[34px] text-center">
              {offset > 0 ? `+${offset.toFixed(1)}` : offset.toFixed(1)}s
            </span>
            <button
              onClick={() => onOffsetChange(0.5)}
              className="p-1 hover:text-white rounded hover:bg-white/10 transition-colors"
              title="نیم ثانیه جلوتر"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Centered Lyrics List */}
      <div
        ref={containerRef}
        onWheel={handleUserWheelOrTouch}
        onTouchMove={handleUserWheelOrTouch}
        className="flex-1 overflow-y-auto px-3 sm:px-8 py-[25vh] sm:py-[38vh] space-y-4 sm:space-y-6 select-text scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20"
      >
        {lyrics.map((line, index) => {
          const isActive = index === activeIndex;
          const isPassed = index < activeIndex;

          return (
            <div
              key={line.id || index}
              ref={isActive ? activeLineRef : null}
              onClick={() => onSeek(line.time)}
              className={`group cursor-pointer will-change-transform transform transition-all duration-700 ease-out rounded-2xl p-3.5 sm:p-5 flex flex-col items-center justify-center text-center relative max-w-2xl mx-auto ${
                isActive
                  ? 'opacity-100 bg-white/[0.06] border border-cyan-400/40 shadow-2xl shadow-cyan-500/10 scale-[1.04]'
                  : isPassed
                  ? 'opacity-30 blur-[0.4px] hover:opacity-75 hover:blur-none scale-100'
                  : 'opacity-40 blur-[0.3px] hover:opacity-85 hover:blur-none scale-100'
              }`}
            >
              {/* Original Song Text (Center-aligned) */}
              {viewMode !== 'persian' && (
                <p
                  className={`text-center tracking-wide leading-relaxed font-bold transition-all duration-500 text-base sm:text-xl ${
                    isActive
                      ? 'text-white text-glow-cyan'
                      : 'text-gray-400 group-hover:text-white'
                  }`}
                >
                  {renderInteractiveText(line.text, isActive)}
                </p>
              )}

              {/* Persian Translation (Center-aligned) */}
              {viewMode !== 'english' && (
                <p
                  className={`font-farsi text-center leading-relaxed font-medium transition-all duration-500 mt-0.5 sm:mt-1 text-sm sm:text-lg ${
                    isActive
                      ? 'text-cyan-200 font-bold'
                      : 'text-gray-400 group-hover:text-gray-200'
                  }`}
                >
                  {line.translation ? (
                    line.translation
                  ) : isTranslating ? (
                    <span className="text-xs text-gray-500 italic">در حال ترجمه...</span>
                  ) : null}
                </p>
              )}

              {/* Timestamp on hover */}
              <span className="absolute left-3 top-3 text-[10px] font-mono text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                {formatTime(line.time)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
