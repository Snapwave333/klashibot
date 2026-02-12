import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '../../context/AudioContext';

interface AudioWaveformProps {
  isPlaying?: boolean;
  color?: string;
  bars?: number;
  height?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isPlaying: propIsPlaying,
  color = 'rgba(0, 255, 255, 0.8)',
  bars = 64,
  height = 60,
}) => {
  const { analyser, isPlaying: contextIsPlaying } = useAudio();
  const isPlaying = propIsPlaying ?? contextIsPlaying;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const prevDataRef = useRef<Float32Array>(new Float32Array(bars).fill(0));
  const gradientsRef = useRef<Map<string, CanvasGradient>>(new Map());
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const canvas = canvasRef.current;
    // Explicit return to satisfy TS7030
      if (!canvas) return undefined;

    const ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true // Optimization: allow desynchronized rendering
    });
    if (!ctx) return undefined;

    // Resize handler with debouncing
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(() => {
        const dpr = globalThis.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        gradientsRef.current.clear(); // Clear gradient cache on resize
      }, 100);
    };

    // Initial size setup
    const dpr = globalThis.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const barWidth = rect.width / bars;
    const maxBarHeight = height;

    // Buffer for frequency data
    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    // Add resize listener
    globalThis.addEventListener('resize', handleResize);

    // Simulate audio waveform animation
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Get real data if playing
      if (isPlaying && analyser) {
        analyser.getByteFrequencyData(dataArray);
      } else if (!isPlaying) {
        // Decay
        for (let i = 0; i < dataArray.length; i++) dataArray[i] = 0;
      }

      // Map frequency bins to bars
      const step = Math.floor(bufferLength / bars);

      // Update bars
      for (let i = 0; i < bars; i++) {
        // Calculate average value for this bar's frequency range
        let value = 0;
        if (isPlaying && analyser) {
          let sum = 0;
          let count = 0;
          for (let j = 0; j < step && i * step + j < bufferLength; j++) {
            sum += dataArray[i * step + j];
            count++;
          }
          value = count > 0 ? sum / count : 0;

          // Boost high frequencies slightly as they tend to be lower energy
          if (i > bars * 0.5) value *= 1.2;
        } else if (isPlaying && !analyser) {
          // Fallback simulation if no analyser
          const time = Date.now() / 1000;
          const baseWave = Math.sin(time * 5 + i * 0.2) * 0.5 + 0.5;
          value = baseWave * 100 + Math.random() * 50;
        }

        // Smoothing with previous frame
        const prev = prevDataRef.current[i] || 0;
        const smoothed = prev + (value - prev) * (isPlaying ? 0.4 : 0.1);
        prevDataRef.current[i] = smoothed;

        // Calculate bar height (normalized)
        const barHeight = Math.max(2, (smoothed / 255) * maxBarHeight);

        const x = i * barWidth;
        const y = (maxBarHeight - barHeight) / 2;

        // Cached gradient optimization
        const gradientKey = `${isPlaying ? 'playing' : 'idle'}-${Math.floor(y)}-${Math.floor(barHeight)}`;
        let gradient = gradientsRef.current.get(gradientKey);

        if (!gradient) {
          gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
          if (isPlaying) {
            // Playing: cyan to green gradient
            gradient.addColorStop(0, 'rgba(0, 255, 255, 0.9)');
            gradient.addColorStop(0.5, 'rgba(0, 255, 200, 0.7)');
            gradient.addColorStop(1, 'rgba(0, 255, 136, 0.5)');
          } else {
            // Idle: gray gradient
            gradient.addColorStop(0, 'rgba(100, 100, 120, 0.4)');
            gradient.addColorStop(1, 'rgba(80, 80, 100, 0.2)');
          }
          // Cache the gradient
          gradientsRef.current.set(gradientKey, gradient);
        }

        ctx.fillStyle = gradient;

        // Draw rounded bar
        const barDrawWidth = barWidth * 0.6; // Gap between bars
        ctx.beginPath();
        ctx.roundRect(x + barWidth * 0.2, y, barDrawWidth, barHeight, barDrawWidth / 2);
        ctx.fill();

        // Add glow effect when playing and loud
        if (isPlaying && barHeight > maxBarHeight * 0.5) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      globalThis.removeEventListener('resize', handleResize);
      gradientsRef.current.clear();
    };
  }, [isPlaying, bars, height, color, analyser]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative w-full"
      style={{ height: `${height}px` }}
    >
      {/* Canvas for waveform */}
      <canvas ref={canvasRef} className="w-full h-full" style={{ width: '100%', height: '100%' }} />

      {/* Subtle background glow */}
      {isPlaying && (
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="-z-10 absolute inset-0 bg-gradient-to-r from-neon-cyan/20 via-neon-green/20 to-neon-cyan/20 blur-xl rounded-xl"
        />
      )}

      {/* Border frame */}
      <div
        className={`absolute inset-0 rounded-xl border transition-all ${
          isPlaying ? 'border-neon-cyan/40 shadow-lg shadow-neon-cyan/20' : 'border-white/10'
        }`}
      />
    </motion.div>
  );
};
