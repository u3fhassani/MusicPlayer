import React, { useEffect, useRef } from 'react';
import type { AudioSettings, VisualizerType } from '../types/lyrics';
import { DEFAULT_AUDIO_SETTINGS } from '../utils/audioPresets';

export const VISUALIZER_LABELS: Record<VisualizerType, string> = {
  bars: 'میله‌های نئونی',
  mirror: 'اکولایزر آینه‌ای',
  wave: 'موج زنده',
  dots: 'ذرات کهکشانی',
  pulse: 'پالس دایره‌ای',
};

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  theme?: 'cyan-purple' | 'emerald-gold' | 'crimson-violet' | 'neon-amber';
  type?: VisualizerType;
  onCycleType?: () => void;
  height?: number;
  audioSettings?: AudioSettings;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioElement,
  isPlaying,
  theme = 'cyan-purple',
  type = 'bars',
  onCycleType,
  height = 70,
  audioSettings = DEFAULT_AUDIO_SETTINGS,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<{
    subBass: BiquadFilterNode;
    bass: BiquadFilterNode;
    mid: BiquadFilterNode;
    presence: BiquadFilterNode;
    treble: BiquadFilterNode;
    panner: StereoPannerNode;
    compressor: DynamicsCompressorNode;
  } | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioElement) return;

    // Connect Web Audio API once with full 5-band Equalizer + Panner + Compressor + Analyser
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const subBass = ctx.createBiquadFilter();
        subBass.type = 'lowshelf';
        subBass.frequency.value = 60;

        const bass = ctx.createBiquadFilter();
        bass.type = 'peaking';
        bass.frequency.value = 230;
        bass.Q.value = 1.0;

        const mid = ctx.createBiquadFilter();
        mid.type = 'peaking';
        mid.frequency.value = 910;
        mid.Q.value = 1.0;

        const presence = ctx.createBiquadFilter();
        presence.type = 'peaking';
        presence.frequency.value = 3600;
        presence.Q.value = 1.0;

        const treble = ctx.createBiquadFilter();
        treble.type = 'highshelf';
        treble.frequency.value = 14000;

        const panner = ctx.createStereoPanner();
        const compressor = ctx.createDynamicsCompressor();
        compressor.knee.value = 12;
        compressor.attack.value = 0.005;
        compressor.release.value = 0.2;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        filtersRef.current = {
          subBass,
          bass,
          mid,
          presence,
          treble,
          panner,
          compressor,
        };

        try {
          const source = ctx.createMediaElementSource(audioElement);
          source
            .connect(subBass)
            .connect(bass)
            .connect(mid)
            .connect(presence)
            .connect(treble)
            .connect(panner)
            .connect(compressor)
            .connect(analyser);
          analyser.connect(ctx.destination);
          sourceRef.current = source;
        } catch (e) {
          console.warn('Audio source connection note:', e);
        }
      }
    } catch (err) {
      console.warn('Web Audio API not allowed or supported:', err);
    }

    if (isPlaying && audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, [audioElement, isPlaying]);

  // Apply real-time EQ, Bass Boost, Stereo Pan, and Compressor updates
  useEffect(() => {
    const ctx = audioCtxRef.current;
    const nodes = filtersRef.current;
    if (!ctx || !nodes) return;

    const now = ctx.currentTime;
    const boostSub = audioSettings.bassBoost ? 4 : 0;
    const boostLow = audioSettings.bassBoost ? 2.5 : 0;

    nodes.subBass.gain.setTargetAtTime(
      Math.min(14, audioSettings.bands.subBass + boostSub),
      now,
      0.03
    );
    nodes.bass.gain.setTargetAtTime(
      Math.min(14, audioSettings.bands.bass + boostLow),
      now,
      0.03
    );
    nodes.mid.gain.setTargetAtTime(audioSettings.bands.mid, now, 0.03);
    nodes.presence.gain.setTargetAtTime(audioSettings.bands.presence, now, 0.03);
    nodes.treble.gain.setTargetAtTime(audioSettings.bands.treble, now, 0.03);
    nodes.panner.pan.setTargetAtTime(audioSettings.stereoPan, now, 0.03);

    if (audioSettings.compressor) {
      nodes.compressor.threshold.setTargetAtTime(-18, now, 0.03);
      nodes.compressor.ratio.setTargetAtTime(4, now, 0.03);
    } else {
      nodes.compressor.threshold.setTargetAtTime(0, now, 0.03);
      nodes.compressor.ratio.setTargetAtTime(1, now, 0.03);
    }
  }, [audioSettings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const getPalette = () => {
      if (theme === 'emerald-gold') return ['#34d399', '#fbbf24', '#f59e0b'];
      if (theme === 'crimson-violet') return ['#f43f5e', '#a855f7', '#4f46e5'];
      if (theme === 'neon-amber') return ['#f43f5e', '#fb923c', '#facc15'];
      return ['#38bdf8', '#818cf8', '#c084fc'];
    };

    const makeGradient = (x0: number, y0: number, x1: number, y1: number) => {
      const [c1, c2, c3] = getPalette();
      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, c1);
      grad.addColorStop(0.55, c2);
      grad.addColorStop(1, c3);
      return grad;
    };

    const render = () => {
      const width = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, width, h);
      phase += isPlaying ? 0.08 : 0.03;

      const palette = getPalette();
      const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : 36;
      const freqData = new Uint8Array(bufferLength);
      const timeData = new Uint8Array(bufferLength);

      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(freqData);
        analyserRef.current.getByteTimeDomainData(timeData);
      } else {
        // Gentle idle breathing values when paused
        for (let i = 0; i < bufferLength; i++) {
          freqData[i] = Math.round(28 + 20 * Math.sin(phase + i * 0.35));
          timeData[i] = Math.round(128 + 12 * Math.sin(phase + i * 0.4));
        }
      }

      if (type === 'bars') {
        const barCount = 36;
        const barWidth = width / barCount - 3;
        const step = Math.max(1, Math.floor(bufferLength / barCount));

        for (let i = 0; i < barCount; i++) {
          const val = freqData[i * step] || 0;
          const percent = val / 255;
          const barHeight = Math.max(4, percent * h * 0.9);
          const x = i * (barWidth + 3);
          const y = h - barHeight;

          ctx.fillStyle = makeGradient(0, y, 0, h);
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
          ctx.fill();
        }
      } else if (type === 'mirror') {
        const barCount = 34;
        const barWidth = width / barCount - 3;
        const step = Math.max(1, Math.floor(bufferLength / barCount));
        const midY = h / 2;

        for (let i = 0; i < barCount; i++) {
          const val = freqData[i * step] || 0;
          const halfH = Math.max(3, (val / 255) * (h * 0.44));
          const x = i * (barWidth + 3);

          ctx.fillStyle = makeGradient(0, midY - halfH, 0, midY + halfH);
          ctx.beginPath();
          ctx.roundRect(x, midY - halfH, barWidth, halfH * 2, 4);
          ctx.fill();
        }
      } else if (type === 'wave') {
        // Dual layered glowing waveform
        for (let layer = 0; layer < 2; layer++) {
          ctx.beginPath();
          ctx.lineWidth = layer === 0 ? 2.5 : 1.5;
          ctx.strokeStyle = layer === 0 ? makeGradient(0, 0, width, 0) : `${palette[2]}88`;

          const sliceWidth = width / (bufferLength - 1);
          for (let i = 0; i < bufferLength; i++) {
            const v = (timeData[i] - 128) / 128;
            const amp = isPlaying ? 1.8 : 0.6;
            const offset = layer === 1 ? Math.sin(phase + i * 0.2) * 4 : 0;
            const y = h / 2 + v * (h * 0.42) * amp + offset;
            const x = i * sliceWidth;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (type === 'dots') {
        const dotCount = 28;
        const spacing = width / dotCount;
        const step = Math.max(1, Math.floor(bufferLength / dotCount));

        for (let i = 0; i < dotCount; i++) {
          const val = freqData[i * step] || 0;
          const percent = val / 255;
          const x = i * spacing + spacing / 2;
          const y = h - 8 - percent * (h - 18);
          const radius = 2.5 + percent * 4;

          // Subtle vertical stem
          ctx.strokeStyle = `${palette[1]}44`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, h - 4);
          ctx.lineTo(x, y);
          ctx.stroke();

          // Glowing orb
          ctx.fillStyle = i % 2 === 0 ? palette[0] : palette[2];
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === 'pulse') {
        const cx = width / 2;
        const cy = h / 2;
        const avgBass =
          (freqData[1] + freqData[2] + freqData[3] + freqData[4]) / (4 * 255);
        const maxR = Math.min(cx, cy) - 4;

        // Concentric beat rings
        for (let r = 0; r < 3; r++) {
          const ringR = Math.max(4, ((maxR * (r + 1)) / 3) * (0.7 + avgBass * 0.5));
          ctx.strokeStyle = `${palette[r % 3]}${r === 0 ? 'cc' : '66'}`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Side wings radiating from center
        const wings = 14;
        for (let i = 0; i < wings; i++) {
          const val = (freqData[i + 2] || 0) / 255;
          const barLen = 6 + val * 18;
          const offsetX = 32 + i * 9;
          ctx.fillStyle = makeGradient(cx - offsetX, 0, cx + offsetX, 0);
          ctx.beginPath();
          ctx.roundRect(cx + offsetX, cy - barLen / 2, 4, barLen, 2);
          ctx.roundRect(cx - offsetX - 4, cy - barLen / 2, 4, barLen, 2);
          ctx.fill();
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isPlaying, theme, type]);

  return (
    <div
      onClick={onCycleType}
      className="w-full flex flex-col justify-center items-center py-1.5 cursor-pointer group select-none"
      title="برای تغییر انیمیشن پخش کلیک کنید"
    >
      <canvas
        ref={canvasRef}
        width={340}
        height={height}
        className="rounded-xl opacity-90 transition-all duration-300 group-hover:opacity-100 group-active:scale-[0.98]"
      />
      <span className="text-[10px] font-farsi text-gray-400/80 group-hover:text-cyan-300 transition-colors mt-1">
        ✨ انیمیشن: {VISUALIZER_LABELS[type]} (کلیک برای تغییر)
      </span>
    </div>
  );
};
