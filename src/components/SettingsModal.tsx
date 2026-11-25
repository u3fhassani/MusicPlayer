import React, { useState, useEffect } from 'react';
import {
  X,
  Palette,
  Sliders,
  Check,
  Info,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Volume2,
  RotateCcw,
  Moon,
  Waves,
  Languages,
} from 'lucide-react';
import type { VisualizerSettings, AISettings, AudioSettings, AudioEQBands } from '../types/lyrics';
import { formatAIErrorMessage } from '../services/aiTranslationService';
import { EQ_PRESETS, DEFAULT_AUDIO_SETTINGS } from '../utils/audioPresets';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiSettings: AISettings;
  onSaveAISettings: (settings: AISettings) => void;
  visualizerSettings: VisualizerSettings;
  onUpdateVisualizer: (settings: VisualizerSettings) => void;
  audioSettings: AudioSettings;
  onUpdateAudioSettings: (settings: AudioSettings) => void;
  sleepRemainingSeconds: number | null;
  onSetSleepTimer: (minutes: number | null) => void;
  initialTab?: 'audio' | 'ai';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  aiSettings: _aiSettings,
  onSaveAISettings,
  visualizerSettings,
  onUpdateVisualizer,
  audioSettings,
  onUpdateAudioSettings,
  sleepRemainingSeconds,
  onSetSleepTimer,
  initialTab = 'audio',
}) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'ai'>(initialTab);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testingStatus, setTestingStatus] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message?: string }>({
    status: 'idle',
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleBandChange = (band: keyof AudioEQBands, value: number) => {
    onUpdateAudioSettings({
      ...audioSettings,
      preset: 'custom',
      bands: {
        ...audioSettings.bands,
        [band]: value,
      },
    });
  };

  const handlePresetSelect = (presetKey: keyof typeof EQ_PRESETS) => {
    onUpdateAudioSettings({
      ...audioSettings,
      preset: presetKey,
      bands: { ...EQ_PRESETS[presetKey].bands },
    });
  };

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    onSaveAISettings({ provider: 'free' });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleTestAPI = async () => {
    setTestingStatus({ status: 'testing' });
    try {
      const testRes = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=fa&dt=t&q=Music`
      );
      if (testRes.ok) {
        setTestingStatus({
          status: 'success',
          message: 'اتصال با Google Translate برقرار است و آماده ترجمه خودکار تمام زبان‌هاست!',
        });
      } else {
        throw new Error('خطا در ارتباط با گوگل ترنسلیت');
      }
    } catch (err: any) {
      setTestingStatus({ status: 'error', message: formatAIErrorMessage(err.message || String(err)) });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-white/10 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg sm:text-xl font-bold text-white font-farsi">تنظیمات پلیر و ترجمه</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Settings Tabs */}
        <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5 font-farsi text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'audio'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-gray-950 font-bold shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Waves className="w-4 h-4" />
            <span>صدا، اکولایزر و تایمر</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-gray-950 font-bold shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Languages className="w-4 h-4" />
            <span>ترجمه (گوگل ترنسلیت)</span>
          </button>
        </div>

        {activeTab === 'audio' ? (
          <div className="space-y-5 font-farsi animate-fadeIn">
            {/* EQ Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  حالت‌های آماده صدا (Presets):
                </label>
                <button
                  type="button"
                  onClick={() => onUpdateAudioSettings(DEFAULT_AUDIO_SETTINGS)}
                  className="text-[11px] text-gray-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  بازنشانی به حالت عادی
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(Object.keys(EQ_PRESETS) as Array<keyof typeof EQ_PRESETS>).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handlePresetSelect(key)}
                    className={`py-2 px-2 rounded-xl border transition-all ${
                      audioSettings.preset === key
                        ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200 font-bold shadow-md shadow-cyan-500/15'
                        : 'border-white/5 bg-black/30 text-gray-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {EQ_PRESETS[key].label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5-Band Graphic Equalizer */}
            <div className="p-4 rounded-xl bg-black/35 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">اکولایزر ۵ بانده (بیس، میانی، زیر و بم):</span>
                {audioSettings.preset === 'custom' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    شخصی‌سازی شده
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                {[
                  { key: 'subBass' as const, label: 'بیس عمیق (Sub-Bass)', freq: '60Hz', color: 'accent-cyan-400' },
                  { key: 'bass' as const, label: 'بیس گرم (Bass)', freq: '230Hz', color: 'accent-cyan-400' },
                  { key: 'mid' as const, label: 'صدای خواننده (Mid)', freq: '910Hz', color: 'accent-purple-400' },
                  { key: 'presence' as const, label: 'شفافیت و وضوح (Presence)', freq: '3.6kHz', color: 'accent-pink-400' },
                  { key: 'treble' as const, label: 'زیر و تیزی صدا (Treble)', freq: '14kHz', color: 'accent-amber-400' },
                ].map((band) => {
                  const val = audioSettings.bands[band.key];
                  return (
                    <div key={band.key} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-200">
                          {band.label} <span className="text-gray-500 font-mono">({band.freq})</span>
                        </span>
                        <span className={`font-mono font-bold ${val > 0 ? 'text-cyan-300' : val < 0 ? 'text-rose-300' : 'text-gray-400'}`} dir="ltr">
                          {val > 0 ? `+${val} dB` : `${val} dB`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={val}
                        onChange={(e) => handleBandChange(band.key, parseInt(e.target.value, 10))}
                        className={`w-full h-1.5 bg-white/10 rounded-lg cursor-pointer ${band.color}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Extra Audio Enhancements: Bass Boost, Compressor & Stereo Balance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onUpdateAudioSettings({ ...audioSettings, bassBoost: !audioSettings.bassBoost })}
                className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                  audioSettings.bassBoost
                    ? 'bg-cyan-500/15 border-cyan-400/50 text-white'
                    : 'bg-black/25 border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">تقویت بیس اضافه (Bass Boost)</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">کوبش عمیق‌تر برای هدفون و اسپیکر</div>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${audioSettings.bassBoost ? 'bg-cyan-400' : 'bg-white/15'}`}>
                  <div className={`w-4 h-4 rounded-full bg-gray-950 transition-transform ${audioSettings.bassBoost ? '-translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>

              <button
                type="button"
                onClick={() => onUpdateAudioSettings({ ...audioSettings, compressor: !audioSettings.compressor })}
                className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                  audioSettings.compressor
                    ? 'bg-emerald-500/15 border-emerald-400/50 text-white'
                    : 'bg-black/25 border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">محافظ صدا (Compressor)</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">جلوگیری از خش‌خش و یکنواختی ولوم</div>
                </div>
                <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${audioSettings.compressor ? 'bg-emerald-400' : 'bg-white/15'}`}>
                  <div className={`w-4 h-4 rounded-full bg-gray-950 transition-transform ${audioSettings.compressor ? '-translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>

            {/* Stereo Balance (Left / Right) */}
            <div className="p-3 rounded-xl bg-black/25 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-200 font-semibold">تعادل اسپیکر چپ و راست (Balance):</span>
                <span className="font-mono text-cyan-300 text-[11px]" dir="ltr">
                  {audioSettings.stereoPan === 0
                    ? 'مرکز (0)'
                    : audioSettings.stereoPan < 0
                    ? `چپ ${Math.round(Math.abs(audioSettings.stereoPan) * 100)}%`
                    : `راست ${Math.round(audioSettings.stereoPan * 100)}%`}
                </span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={audioSettings.stereoPan}
                onChange={(e) => onUpdateAudioSettings({ ...audioSettings, stereoPan: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-white/10 rounded-lg cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Sleep Timer */}
            <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  تایمر خواب (توقف خودکار پخش):
                </span>
                {sleepRemainingSeconds !== null && (
                  <span className="text-xs font-mono text-cyan-300 bg-cyan-500/15 px-2.5 py-0.5 rounded-full animate-pulse">
                    باقی‌مانده: {formatCountdown(sleepRemainingSeconds)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-[11px]">
                {[
                  { label: 'خاموش', val: null },
                  { label: '۱۵ دقیقه', val: 15 },
                  { label: '۳۰ دقیقه', val: 30 },
                  { label: '۴۵ دقیقه', val: 45 },
                  { label: '۶۰ دقیقه', val: 60 },
                ].map((opt) => {
                  const isActive = opt.val === null ? sleepRemainingSeconds === null : false;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => onSetSleepTimer(opt.val)}
                      className={`py-1.5 rounded-lg border transition-all ${
                        isActive
                          ? 'bg-indigo-500/25 border-indigo-400 text-white font-bold'
                          : 'bg-black/30 border-white/10 text-gray-300 hover:border-indigo-400/50 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visualizer Settings */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 font-farsi flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-purple-400" />
                رنگ‌بندی رقص‌نور صوتی (Visualizer Theme):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cyan-purple', name: 'سایان و بنفش', grad: 'from-cyan-400 to-purple-500' },
                  { id: 'emerald-gold', name: 'زمرد و طلا', grad: 'from-emerald-400 to-amber-400' },
                  { id: 'neon-amber', name: 'نئون آتشین', grad: 'from-rose-500 to-amber-300' },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() =>
                      onUpdateVisualizer({
                        ...visualizerSettings,
                        colorTheme: th.id as any,
                      })
                    }
                    className={`p-2 rounded-xl border text-xs font-farsi flex flex-col items-center gap-1 transition-all ${
                      visualizerSettings.colorTheme === th.id
                        ? 'border-cyan-400 bg-white/10 text-white shadow-md shadow-cyan-500/20'
                        : 'border-white/5 bg-black/20 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className={`w-full h-2.5 rounded bg-gradient-to-r ${th.grad}`} />
                    <span>{th.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-xs transition-all shadow-lg"
              >
                بستن و اعمال
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 font-farsi animate-fadeIn">
            {/* Google Translate Only Card */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Google Translate (رایگان و خودکار)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                  فعال
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                ترجمه خودکار متن آهنگ‌ها به فارسی منحصراً توسط موتور <strong>Google Translate</strong> انجام می‌شود. این سرویس ۱۰۰٪ رایگان است، نیاز به هیچ کلید API یا ثبت‌نامی ندارد و زبان اصلی آهنگ (انگلیسی، ترکی، فرانسوی، کره‌ای، اسپانیایی و...) را به صورت خودکار تشخیص داده و به فارسی ترجمه می‌کند.
              </p>
            </div>

            {/* Test Connection Button & Status */}
            <div className="flex flex-col gap-2 text-xs border-y border-white/5 py-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleTestAPI}
                  disabled={testingStatus.status === 'testing'}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-all active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{testingStatus.status === 'testing' ? 'در حال تست...' : 'تست اتصال به Google Translate'}</span>
                </button>

                {testingStatus.status === 'success' && (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {testingStatus.message}
                  </span>
                )}
              </div>

              {testingStatus.status === 'error' && (
                <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/25 text-rose-300 text-xs flex items-start gap-2 leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{testingStatus.message}</span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/10 flex items-start gap-2 text-xs text-cyan-200/80">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
              <span>
                تمامی ترجمه‌ها پس از دریافت، به صورت خودکار و دائمی روی آهنگ در حافظه مرورگر ذخیره می‌شوند.
              </span>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSave}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  savedSuccess
                    ? 'bg-emerald-500 text-black'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-gray-950 shadow-lg shadow-cyan-500/25 active:scale-95'
                }`}
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    تایید شد!
                  </>
                ) : (
                  'تایید و بستن'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
