import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react';
import { useTradingStore } from './TradingContext';

interface AudioContextType {
  playAudio: (url: string) => void;
  stopAudio: () => void;
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  volume: number;
  setVolume: (v: number) => void;
  isMuted: boolean;
  setIsMuted: (m: boolean) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setTtsPlaying } = useTradingStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMutedState] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)));
  }, []);

  const setIsMuted = useCallback((m: boolean) => {
    setIsMutedState(m);
  }, []);

  // Initialize AudioContext and Analyser
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256; // Good balance for visualizer
        analyserRef.current.smoothingTimeConstant = 0.8;
      }
    }
    return audioContextRef.current;
  }, []);

  const lastPlayedRef = useRef<{ url: string; time: number } | null>(null);

  const playAudio = useCallback(
    (url: string) => {
      // Debounce: Ignore if same URL played within 500ms
      const now = Date.now();
      if (
        lastPlayedRef.current &&
        lastPlayedRef.current.url === url &&
        now - lastPlayedRef.current.time < 500
      ) {
        console.warn('🔇 Debounced duplicate audio playback:', url);
        return;
      }
      lastPlayedRef.current = { url, time: now };

      // Ensure AudioContext is initialized (must be after user interaction usually, but we'll try)
      const ctx = initAudioContext();

      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.crossOrigin = 'anonymous'; // Important for canvas visualization if audio is from different origin
        audioRef.current.volume = isMuted ? 0 : volume;

        // Event listeners
        audioRef.current.onplay = () => {
          setIsPlaying(true);
          setTtsPlaying(true);
          // Resume context if suspended (browser policy)
          if (ctx?.state === 'suspended') {
            ctx.resume();
          }
        };

        audioRef.current.onended = () => {
          setIsPlaying(false);
          setTtsPlaying(false);
        };

        audioRef.current.onerror = (e) => {
          console.error('Audio playback error:', e);
          setIsPlaying(false);
          setTtsPlaying(false);
        };

        audioRef.current.onpause = () => {
          setIsPlaying(false);
          setTtsPlaying(false);
        };
      }

      // Connect to AudioContext if not already connected
      if (ctx && analyserRef.current && !sourceRef.current && audioRef.current) {
        try {
          sourceRef.current = ctx.createMediaElementSource(audioRef.current);
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(ctx.destination);
        } catch (err) {
          console.warn('Error connecting audio source:', err);
          // Fallback: just play without visualization if connection fails
        }
      }

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch((err) => {
          console.warn('❌ Failed to play audio:', err);
          setIsPlaying(false);
          setTtsPlaying(false);
        });
      }
    },
    [initAudioContext, setTtsPlaying, isMuted, volume]
  );

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  // Cleanup and Global Unlock
  useEffect(() => {
    const handleGlobalClick = () => {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume().then(() => {
          console.log('🔊 AudioContext unlocked via user interaction');
        });
      }
    };

    globalThis.addEventListener('click', handleGlobalClick, { once: true });

    return () => {
      globalThis.removeEventListener('click', handleGlobalClick);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const value = React.useMemo(() => ({
    playAudio,
    stopAudio,
    analyser: analyserRef.current,
    isPlaying,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
  }), [playAudio, stopAudio, isPlaying, volume, setVolume, isMuted, setIsMuted]);

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};
