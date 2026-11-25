import React, { useState, useEffect } from 'react';
import type { LyricLine } from '../types/lyrics';
import { formatTime, formatTimeLRC, parseLRC } from '../utils/lrcParser';
import { translateWithFreeEngine } from '../services/aiTranslationService';
import {
  X,
  Save,
  Languages,
  FileText,
  Sparkles,
  ClipboardPaste,
  Check,
  Plus,
  Trash2,
  HelpCircle,
  Download,
} from 'lucide-react';

interface LyricsEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLyrics: LyricLine[];
  songTitle: string;
  songArtist: string;
  onSaveLyrics: (lyrics: LyricLine[]) => void;
}

export const LyricsEditorModal: React.FC<LyricsEditorModalProps> = ({
  isOpen,
  onClose,
  currentLyrics,
  songTitle,
  songArtist,
  onSaveLyrics,
}) => {
  const [activeTab, setActiveTab] = useState<'line-by-line' | 'bilingual-paste' | 'raw-lrc'>('line-by-line');
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [pastedPersianText, setPastedPersianText] = useState('');
  const [showBulkPasteArea, setShowBulkPasteArea] = useState(false);
  const [rawLrcText, setRawLrcText] = useState('');
  const [isTranslatingFree, setIsTranslatingFree] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLines(JSON.parse(JSON.stringify(currentLyrics || [])));
      setPastedPersianText('');
      setShowBulkPasteArea(false);

      // Reconstruct raw LRC text for the raw tab
      if (currentLyrics && currentLyrics.length > 0) {
        const raw = currentLyrics
          .map((l) => {
            const timeTag = l.rawTime || `[${formatTime(l.time)}]`;
            if (l.translation) {
              return `${timeTag} ${l.text} // ${l.translation}`;
            }
            return `${timeTag} ${l.text}`;
          })
          .join('\n');
        setRawLrcText(raw);
      } else {
        setRawLrcText('');
      }
    }
  }, [isOpen, currentLyrics]);

  if (!isOpen) return null;

  // Update translation of a single line
  const handleUpdateTranslation = (index: number, newTrans: string) => {
    setLines((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], translation: newTrans };
      return copy;
    });
  };

  // Update English text of a single line
  const handleUpdateText = (index: number, newText: string) => {
    setLines((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], text: newText };
      return copy;
    });
  };

  // Add a new line
  const handleAddLine = () => {
    const lastTime = lines.length > 0 ? lines[lines.length - 1].time + 5 : 0;
    const newLine: LyricLine = {
      id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      time: lastTime,
      rawTime: `[${formatTime(lastTime)}]`,
      text: 'New lyric line',
      translation: '',
    };
    setLines([...lines, newLine]);
  };

  // Delete a line
  const handleDeleteLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Auto-distribute pasted Persian lines onto existing English timestamps
  const handleApplyBulkPersian = () => {
    if (!pastedPersianText.trim()) return;

    // Filter out blank lines
    const persianLines = pastedPersianText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    setLines((prev) =>
      prev.map((line, idx) => {
        if (idx < persianLines.length) {
          return { ...line, translation: persianLines[idx] };
        }
        return line;
      })
    );

    setShowBulkPasteArea(false);
  };

  // Translate with the 100% Free Built-in Engine right inside the editor
  const handleFreeAutoTranslate = async () => {
    if (lines.length === 0) return;
    setIsTranslatingFree(true);
    try {
      const translated = await translateWithFreeEngine(lines);
      setLines(translated);
    } catch (e) {
      console.error('Free translation error:', e);
    } finally {
      setIsTranslatingFree(false);
    }
  };

  // Apply raw LRC
  const handleApplyRawLrc = () => {
    if (!rawLrcText.trim()) return;
    const parsed = parseLRC(rawLrcText);
    if (parsed.length > 0) {
      setLines(parsed);
      setActiveTab('line-by-line');
    } else {
      alert('متن وارد شده فاقد زمان‌بندی استاندارد مانند [00:15.30] است.');
    }
  };

  // Save changes
  const handleSave = () => {
    onSaveLyrics(lines);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  // Clear all lyrics from this song
  const handleClearAllLyrics = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3500);
      return;
    }
    setLines([]);
    setRawLrcText('');
    setConfirmClear(false);
    onSaveLyrics([]);
    onClose();
  };

  // Export lyrics as a downloadable .lrc file
  const handleDownloadLRC = () => {
    if (lines.length === 0) return;
    const content = lines
      .map((l) => {
        const tag = l.rawTime || formatTimeLRC(l.time);
        return l.translation ? `${tag} ${l.text} // ${l.translation}` : `${tag} ${l.text}`;
      })
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${songArtist || 'Track'} - ${songTitle || 'Lyrics'}.lrc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const translatedCount = lines.filter((l) => l.translation && l.translation.trim().length > 0).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-3xl h-[92vh] flex flex-col rounded-2xl border border-white/10 shadow-2xl p-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-farsi flex items-center gap-2">
                استودیو لیریکس و ترجمه فارسی
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-normal">
                  {translatedCount} از {lines.length} خط ترجمه‌شده
                </span>
              </h3>
              <p className="text-xs text-gray-400 font-farsi">
                آهنگ: {songTitle} - {songArtist}
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

        {/* Tabs & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-white/5 font-farsi text-xs">
          <div className="flex gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('line-by-line')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'line-by-line'
                  ? 'bg-cyan-500 text-gray-950 font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ویرایشگر خط‌به‌خط (فارسی/انگلیسی)
            </button>
            <button
              onClick={() => setActiveTab('raw-lrc')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'raw-lrc'
                  ? 'bg-cyan-500 text-gray-950 font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              متن کامل یا فایل LRC
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Free auto-translate button */}
            <button
              onClick={handleFreeAutoTranslate}
              disabled={isTranslatingFree || lines.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 text-emerald-300 hover:text-white transition-all active:scale-95 shadow"
              title="ترجمه فوری تمام خطوط به صورت ۱۰۰٪ رایگان و بدون نیاز به هیچ کلیدی"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isTranslatingFree ? 'در حال ترجمه خودکار...' : 'ترجمه خودکار رایگان'}</span>
            </button>

            {/* Download LRC file button */}
            <button
              onClick={handleDownloadLRC}
              disabled={lines.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 hover:text-white transition-all active:scale-95 disabled:opacity-40"
              title="دانلود فایل متنی زمان‌بندی‌شده (.lrc) روی کامپیوتر یا گوشی"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>دانلود LRC</span>
            </button>

            {/* Delete All Lyrics button */}
            <button
              onClick={handleClearAllLyrics}
              disabled={lines.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all active:scale-95 disabled:opacity-40 ${
                confirmClear
                  ? 'bg-rose-500 text-white border-rose-400 font-bold animate-pulse shadow-lg shadow-rose-500/30'
                  : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-rose-300 hover:text-rose-200'
              }`}
              title="حذف کامل تمام خطوط لیریکس این آهنگ"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{confirmClear ? 'مطمئنید؟ برای حذف دوباره کلیک کنید' : 'حذف کامل لیریکس'}</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-4">
          {activeTab === 'line-by-line' ? (
            <div className="space-y-3 font-farsi">
              {/* Bulk paste helper panel */}
              <div className="glass-card p-3.5 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-cyan-300 font-bold flex items-center gap-1.5">
                    <ClipboardPaste className="w-4 h-4" />
                    پیست یکجای متن فارسی ترجمه‌شده (از سایت‌های دیگر):
                  </span>
                  <button
                    onClick={() => setShowBulkPasteArea(!showBulkPasteArea)}
                    className="text-xs text-gray-400 hover:text-white underline"
                  >
                    {showBulkPasteArea ? 'بستن کادر' : 'باز کردن کادر پیست'}
                  </button>
                </div>

                {showBulkPasteArea && (
                  <div className="space-y-2 pt-1 animate-fadeIn">
                    <textarea
                      value={pastedPersianText}
                      onChange={(e) => setPastedPersianText(e.target.value)}
                      placeholder="متن ترجمه فارسی را از هر سایتی که کپی کرده‌اید اینجا پیست کنید (هر خط در یک سطر)..."
                      rows={5}
                      dir="rtl"
                      className="w-full p-3 rounded-xl bg-black/50 border border-white/15 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-cyan-400 leading-relaxed font-farsi"
                    />
                    <button
                      onClick={handleApplyBulkPersian}
                      className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-xs transition-all flex items-center gap-1.5 shadow"
                    >
                      <Check className="w-3.5 h-3.5" />
                      تطبیق خودکار سطرهای فارسی روی زمان‌بندی آهنگ
                    </button>
                  </div>
                )}
              </div>

              {/* Lines List */}
              {lines.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <FileText className="w-10 h-10 text-gray-500 mx-auto opacity-40" />
                  <p className="text-sm text-gray-400">هنوز متنی برای این آهنگ ثبت نشده است.</p>
                  <button
                    onClick={handleAddLine}
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-gray-950 font-bold text-xs"
                  >
                    افزودن اولین سطر
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {lines.map((line, index) => (
                    <div
                      key={line.id || index}
                      className="p-3 rounded-xl glass-card border border-white/5 space-y-2 group transition-all hover:border-white/15"
                    >
                      {/* Top bar: Timestamp & Delete */}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded">
                          {formatTime(line.time)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-500">سطر {index + 1}</span>
                          <button
                            onClick={() => handleDeleteLine(index)}
                            className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="حذف این سطر"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Inputs: English & Persian */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {/* English Input */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] text-gray-400">متن انگلیسی:</label>
                          <input
                            type="text"
                            value={line.text}
                            onChange={(e) => handleUpdateText(index, e.target.value)}
                            dir="ltr"
                            className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-cyan-400"
                          />
                        </div>

                        {/* Persian Translation Input */}
                        <div className="space-y-0.5">
                          <label className="text-[10px] text-cyan-300">ترجمه فارسی:</label>
                          <input
                            type="text"
                            value={line.translation || ''}
                            onChange={(e) => handleUpdateTranslation(index, e.target.value)}
                            placeholder="ترجمه فارسی این سطر را بنویسید..."
                            dir="rtl"
                            className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-cyan-500/20 text-cyan-200 text-xs font-farsi focus:outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleAddLine}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-farsi transition-all"
                    >
                      <Plus className="w-4 h-4 text-cyan-400" />
                      افزودن سطر جدید به انتهای آهنگ
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 font-farsi">
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-gray-300/90 leading-relaxed flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  می‌توانید لیریکس را مستقیماً با فرمت استاندارد LRC پیست کنید. برای درج ترجمه فارسی در کنار انگلیسی، کافیست بین آن‌ها علامت <code>//</code> بگذارید:
                  <br />
                  <code className="text-cyan-300 font-mono text-[11px] block mt-1" dir="ltr">
                    [00:15.30] Look up at the stars // به ستاره‌ها نگاه کن
                  </code>
                </span>
              </div>

              <textarea
                value={rawLrcText}
                onChange={(e) => setRawLrcText(e.target.value)}
                placeholder="[00:04.50] Look up at the stars // به ستاره‌ها در آسمان نگاه کن&#10;[00:09.20] Next line..."
                rows={14}
                dir="ltr"
                className="w-full p-4 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-cyan-400 leading-relaxed"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleApplyRawLrc}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-xs transition-all shadow"
                >
                  تجزیه و تبدیل به لیریکس آهنگ
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Save & Status */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-3 font-farsi">
          <span className="text-xs text-gray-400">
            💾 پس از ذخیره، لیریکس مستقیماً در حافظه دائمی مرورگر روی همین آهنگ ثبت می‌شود.
          </span>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs transition-all"
            >
              انصراف
            </button>

            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-xs transition-all shadow-lg active:scale-95 ${
                savedSuccess
                  ? 'bg-emerald-500 text-black'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-gray-950 shadow-cyan-500/25'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  ذخیره شد!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  ذخیره لیریکس روی آهنگ
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
