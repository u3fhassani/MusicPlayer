import React from 'react';
import type { WordDefinition } from '../types/lyrics';
import { Volume2, X, BookOpen, Sparkles } from 'lucide-react';

interface WordModalProps {
  definition: WordDefinition | null;
  loading: boolean;
  onClose: () => void;
}

export const WordModal: React.FC<WordModalProps> = ({ definition, loading, onClose }) => {
  if (!definition && !loading) return null;

  const playPronunciation = () => {
    if (!definition?.word) return;
    try {
      const utterance = new SpeechSynthesisUtterance(definition.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis not supported:', e);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-white/10 relative transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="بستن"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-cyan-200/80">در حال جستجوی معنی و ترجمه...</p>
          </div>
        ) : definition ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-2xl font-bold tracking-wide text-white capitalize flex items-center gap-2">
                  {definition.word}
                  {definition.partOfSpeech && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-normal">
                      {definition.partOfSpeech}
                    </span>
                  )}
                </h3>
                {definition.phonetic && (
                  <p className="text-sm text-gray-400 font-mono mt-0.5">{definition.phonetic}</p>
                )}
              </div>
              <button
                onClick={playPronunciation}
                className="p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-300 transition-all active:scale-95"
                title="پخش تلفظ صوتی"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 to-purple-950/40 border border-cyan-500/20">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>معنی و ترجمه فارسی:</span>
              </div>
              <p className="text-lg font-bold text-white font-farsi leading-relaxed">
                {definition.translation || 'در دسترس نیست'}
              </p>
            </div>

            {definition.definition && (
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>تعریف انگلیسی:</span>
                </div>
                <p className="text-gray-200 leading-relaxed bg-black/20 p-2.5 rounded-lg border border-white/5">
                  {definition.definition}
                </p>
              </div>
            )}

            {definition.example && (
              <div className="text-xs text-gray-400 italic bg-white/5 p-2 rounded-lg">
                &ldquo;{definition.example}&rdquo;
              </div>
            )}

            <p className="text-[11px] text-center text-gray-500 font-farsi">
              💡 برای یادگیری کلمات کافیست روی هر کلمه در لیریکس کلیک کنید
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
