/**
 * Natural Language & Voice Command Input Component
 * Normalizes commands into { task: "prepare_dinner_table", people: N }
 * Handles supported range (1-10) and safely rejects 11+ (US-011, AC-11)
 */

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Send, Sparkles, Users, AlertTriangle, CheckCircle2, Play } from 'lucide-react';
import { TableLayoutPlan } from '../types';

interface NaturalLanguageInputProps {
  currentPlan: TableLayoutPlan | null;
  isProcessing: boolean;
  onExecuteCommand: (command: string) => Promise<void>;
  onSelectGroupSize: (people: number) => void;
}

const DEMO_PRESETS = [
  { label: 'Single Place', text: 'Set the dinner table for 1 person.', people: 1 },
  { label: 'Dinner for 2', text: 'Prepare dinner table for two people.', people: 2 },
  { label: 'Dinner for 4', text: 'Prepare dinner for four.', people: 4 },
  { label: 'Dinner for 6', text: 'Prepare the dinner table for six people.', people: 6 },
  { label: 'Banquet for 8', text: 'Prepare a banquet for eight.', people: 8 },
  { label: 'Dinner for 10', text: 'Prepare the dinner table for ten people.', people: 10 },
];

export const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({
  currentPlan,
  isProcessing,
  onExecuteCommand,
  onSelectGroupSize,
}) => {
  const [inputText, setInputText] = useState('Prepare the dinner table for 4 people.');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Initialize Speech Recognition if browser supports it
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setSpeechSupported(true);
    }
  }, []);

  const handleStartVoice = () => {
    if (!speechSupported) {
      // Simulated voice prompt for demo fallback
      setIsListening(true);
      setTimeout(() => {
        setInputText('Prepare dinner for 4.');
        setIsListening(false);
      }, 1400);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        onExecuteCommand(transcript);
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isProcessing) {
      onExecuteCommand(inputText.trim());
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Natural Language / Voice-to-Action (VLA)
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Supported Group Range: <span className="text-cyan-400 font-bold">1–10 People</span>
        </span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder='e.g. "Prepare the dinner table for 4 people."'
            className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-sans transition-all"
            disabled={isProcessing}
          />
          {isListening && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-red-400 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Listening...</span>
            </div>
          )}
        </div>

        {/* Microphone Voice Button */}
        <button
          type="button"
          onClick={handleStartVoice}
          disabled={isProcessing}
          title={isListening ? "Listening for speech..." : "Speak command"}
          className={`p-2.5 rounded-lg border transition-all ${
            isListening
              ? "bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/30 animate-pulse"
              : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700"
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Submit Execution Button */}
        <button
          type="submit"
          disabled={isProcessing || !inputText.trim()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Plan & Setup</span>
        </button>
      </form>

      {/* Quick Demo Presets */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
          <Users className="w-3 h-3 text-slate-400" /> Presets:
        </span>
        {DEMO_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setInputText(preset.text);
              onExecuteCommand(preset.text);
            }}
            disabled={isProcessing}
            className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${
              preset.people === 12
                ? 'bg-red-950/40 border-red-800/60 text-red-300 hover:bg-red-900/60'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-cyan-300'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Interactive Group Size Slider (1 - 10) */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            Direct Variable Adjustment: <span className="font-mono text-cyan-300 font-bold">N = {currentPlan?.groupSize || 4}</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Plates: {currentPlan?.summary.plates || 4} • Bowls: {currentPlan?.summary.bowls || 4} • Cups: {currentPlan?.summary.cups || 4} • Spoons: {currentPlan?.summary.spoons || 4}
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={currentPlan?.isValid ? currentPlan.groupSize : 4}
          onChange={(e) => onSelectGroupSize(parseInt(e.target.value, 10))}
          disabled={isProcessing}
          className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1 px-1">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
          <span>6</span>
          <span>7</span>
          <span>8</span>
          <span>9</span>
          <span>10 (Max)</span>
        </div>
      </div>

      {/* Rejection Notice Banner (US-011, AC-11) */}
      {currentPlan && !currentPlan.isValid && (
        <div className="mt-3 p-3.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold uppercase tracking-wider text-red-300 mb-1">
              Group Size Not Supported
            </p>
            <p className="whitespace-pre-line font-mono text-slate-300 text-[11px] leading-relaxed">
              {currentPlan.rejectionNotice || "TwinHands-AI currently supports 1–10 people. Please specify a group size between 1 and 10."}
            </p>
          </div>
        </div>
      )}

      {/* Normalized Task Plan Box */}
      {currentPlan && currentPlan.isValid && (
        <div className="mt-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Normalized:</span>
            <span className="text-cyan-300 font-bold">
              {`{ task: "prepare_dinner_table", people: ${currentPlan.groupSize} }`}
            </span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Objects: <span className="text-white font-bold">{currentPlan.summary.totalObjects}</span> (4 items × {currentPlan.groupSize} place settings)
          </div>
        </div>
      )}
    </div>
  );
};
