import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Settings, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

type VoiceCommand = {
  phrase: string;
  action: string;
  description: string;
  category: 'navigation' | 'trading' | 'system' | 'query';
};

type SpeechRecognitionAlternative = {
  transcript: string;
  confidence: number;
};

type SpeechRecognitionResult = {
  length: number;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
};

type SpeechRecognitionResultList = {
  readonly length: number;
  readonly [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionEvent = Event & {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEvent = Event & {
  readonly error: string;
  readonly message: string;
};

type SpeechRecognitionType = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type VoiceCommandsProps = {
  onCommand?: (cmd: string) => void;
  onNavigate?: (path: string) => void;
  className?: string;
};

export const VoiceCommands = ({ onCommand, onNavigate, className }: VoiceCommandsProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [showCommands, setShowCommands] = useState(false);
  
  // TTS State
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speechQueue, setSpeechQueue] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const commands: VoiceCommand[] = React.useMemo(() => [
    // Navigation
    { phrase: 'show dashboard', action: 'NAVIGATE:/dashboard', description: 'Open dashboard', category: 'navigation' },
    { phrase: 'show portfolio', action: 'NAVIGATE:/portfolio', description: 'Open portfolio', category: 'navigation' },
    { phrase: 'show logs', action: 'NAVIGATE:/logs', description: 'Open system logs', category: 'navigation' },
    { phrase: 'show ai brain', action: 'NAVIGATE:/ai-brain', description: 'Open AI brain', category: 'navigation' },

    // Trading
    { phrase: 'start trading', action: 'START', description: 'Start bot', category: 'trading' },
    { phrase: 'stop trading', action: 'STOP', description: 'Stop bot', category: 'trading' },
    { phrase: 'pause trading', action: 'PAUSE', description: 'Pause bot', category: 'trading' },
    { phrase: 'emergency stop', action: 'KILL', description: 'Emergency kill switch', category: 'trading' },
    { phrase: 'close all positions', action: 'CLOSE_ALL', description: 'Close all positions', category: 'trading' },

    // System
    { phrase: 'refresh data', action: 'REFRESH', description: 'Refresh all data', category: 'system' },
    { phrase: 'clear cache', action: 'CLEAR_CACHE', description: 'Clear cache', category: 'system' },
    { phrase: 'show help', action: 'HELP', description: 'Show help menu', category: 'system' },
    { phrase: 'export data', action: 'EXPORT', description: 'Export trading data', category: 'system' },

    // Queries
    { phrase: 'what is my balance', action: 'QUERY:BALANCE', description: 'Check balance', category: 'query' },
    { phrase: 'what is my pnl', action: 'QUERY:PNL', description: 'Check P&L', category: 'query' },
    { phrase: 'how many positions', action: 'QUERY:POSITIONS', description: 'Count positions', category: 'query' },
    { phrase: 'what is the win rate', action: 'QUERY:WIN_RATE', description: 'Check win rate', category: 'query' },
  ], []);

  // Initialize Voices
  useEffect(() => {
    if ('speechSynthesis' in globalThis) {
      synthRef.current = globalThis.speechSynthesis;
      
      const loadVoices = () => {
        const availableVoices = synthRef.current?.getVoices() || [];
        setVoices(availableVoices);
        // Prefer a female Google/Microsoft voice or just the first one
        const preferred = availableVoices.find(v => 
          v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira')
        );
        setSelectedVoice(preferred || availableVoices[0] || null);
      };

      loadVoices();
      if (synthRef.current?.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // Process Speech Queue
  useEffect(() => {
    if (!isSpeechEnabled || !synthRef.current || speechQueue.length === 0 || isSpeaking) return;

    const nextText = speechQueue[0];
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(nextText);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = 1.05; // Slightly faster for efficiency
    utterance.pitch = 1;
    utterance.volume = 0.9;

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeechQueue(prev => prev.slice(1));
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeechQueue(prev => prev.slice(1));
    };

    synthRef.current.speak(utterance);
  }, [speechQueue, isSpeaking, isSpeechEnabled, selectedVoice]);

  const speak = useCallback((text: string) => {
    if (!isSpeechEnabled) return;
    setSpeechQueue(prev => [...prev, text]);
  }, [isSpeechEnabled]);

  const processCommand = useCallback((text: string) => {
    const lowercaseText = text.toLowerCase().trim();

    // Find matching command
    const matchedCommand = commands.find((cmd) =>
      lowercaseText.includes(cmd.phrase) || cmd.phrase.includes(lowercaseText)
    );

    if (matchedCommand) {
      speak(`Executing ${matchedCommand.description}`);

      if (matchedCommand.action.startsWith('NAVIGATE:')) {
        const path = matchedCommand.action.replace('NAVIGATE:', '');
        if (onNavigate) {
          onNavigate(path);
        }
      } else if (onCommand) {
        onCommand(matchedCommand.action);
      }

      toast.success(`Voice command: ${matchedCommand.description}`);
    } else {
      speak('Command not recognized');
      toast('Command not recognized. Say "show help" for available commands.', { icon: '🎤' });
    }
  }, [commands, onNavigate, onCommand, speak]);

  useEffect(() => {
    // Initialize Web Speech API
    const GlobalSpeechRecognition = 
      (globalThis as unknown as { SpeechRecognition?: new () => SpeechRecognitionType }).SpeechRecognition || 
      (globalThis as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionType }).webkitSpeechRecognition;

    if (GlobalSpeechRecognition) {
      const recognition = new GlobalSpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1];
        const transcriptText = result[0].transcript;
        const confidenceScore = result[0].confidence;

        setTranscript(transcriptText);
        setConfidence(confidenceScore);

        if (result.isFinal) {
          processCommand(transcriptText);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        toast.error(`Voice error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [processCommand]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not available on this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setTranscript('');
        speak('Listening');
      } catch (error) {
        console.error('Error starting recognition:', error);
        toast.error('Could not start voice recognition');
      }
    }
  };

  const groupedCommands = commands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, VoiceCommand[]>);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Voice Control Button */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={toggleListening}
          className={`relative p-3 rounded-full transition-all border-2 ${
            isListening
              ? 'bg-neon-red text-white border-neon-red'
              : 'bg-transparent text-neon-cyan border-neon-cyan hover:bg-neon-cyan/10'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isListening ? (
            <Mic className="fill-current w-6 h-6" />
          ) : (
            <MicOff className="w-6 h-6" />
          )}
        </motion.button>

        <button
          onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
          className={`p-2 border rounded-lg transition-colors ${
             isSpeechEnabled 
             ? 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan' 
             : 'bg-white/5 border-white/10 text-gray-500'
          }`}
          title={isSpeechEnabled ? 'Disable voice feedback' : 'Enable voice feedback'}
        >
          {isSpeechEnabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={() => setShowCommands(!showCommands)}
          className={`p-2 border rounded-lg transition-colors ${
            showCommands
            ? 'bg-white/10 border-white/30 text-white'
            : 'bg-white/5 border-white/10 text-gray-400'
          }`}
          title="Voice Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Transcript Display */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-black/90 mt-3 p-4 border border-white/20 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                className="bg-neon-red rounded-full w-2 h-2"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
              <span className="text-[10px] text-gray-400 uppercase tracking-wider translate-y-[1px]">Listening...</span>
            </div>
            {transcript && (
              <div className="mt-1">
                <p className="font-medium text-white leading-snug">{transcript}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 bg-white/10 rounded-full h-1 overflow-hidden">
                    <motion.div
                      className="bg-neon-cyan h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${confidence * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-gray-500">{(confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings & Commands Panel */}
      <AnimatePresence>
        {showCommands && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/90 mt-4 border border-white/20 rounded-xl overflow-hidden"
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="flex items-center gap-2 font-bold text-white text-lg">
                  <Zap className="w-5 h-5 text-neon-cyan" />
                  Voice Configuration
                </h3>
              </div>
              
              {/* Voice Selector */}
              <div className="mb-6">
                <label htmlFor="voice-select" className="block mb-1 font-semibold text-[10px] text-gray-400 uppercase tracking-wider">Agent Voice</label>
                <select
                   id="voice-select"
                   value={selectedVoice?.name || ''}
                   onChange={(e) => {
                     const voice = voices.find(v => v.name === e.target.value);
                     if (voice) {
                        setSelectedVoice(voice);
                        // Instant preview
                        const u = new SpeechSynthesisUtterance("Voice activated.");
                        u.voice = voice;
                        synthRef.current?.speak(u);
                     }
                   }}
                   className="bg-white/5 px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-neon-cyan/50 w-full text-white text-sm"
                >
                  {voices.map(v => (
                    <option key={v.name} value={v.name} className="bg-black text-gray-300">
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4 border-white/10 border-t" />

              <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar">
                {Object.entries(groupedCommands).map(([category, cmds]) => (
                  <div key={category}>
                    <h4 className="mb-2 font-bold text-gray-400 text-xs uppercase tracking-wider">
                      {category}
                    </h4>
                    <div className="space-y-1">
                      {cmds.map((cmd, idx) => (
                        <div
                          key={cmd.phrase}
                          className="flex justify-between items-center bg-white/5 hover:bg-white/10 p-2 rounded transition-colors"
                        >
                          <div>
                            <div className="font-medium text-white text-sm">"{cmd.phrase}"</div>
                            <div className="text-gray-500 text-xs">{cmd.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
