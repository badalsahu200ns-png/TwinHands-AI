/**
 * TwinHands-AI: Integrated 3D Central Simulation Workspace & HUD
 * Implements the full-screen interactive 3D table environment with integrated dashboard controls.
 * 
 * Layout:
 * ┌──────────────────────────────────────────────────────────────┐
 * │ TWINHANDS-AI                         ● SIMULATION CONNECTED │
 * ├──────────────┬───────────────────────────────────┬───────────┤
 * │              │                                   │           │
 * │ AI COMMAND   │                                   │ ROBOT     │
 * │              │          3D TABLE                 │ STATUS    │
 * │ 🎤           │                                   │           │
 * │              │       🤖          🤖              │ LEFT      │
 * │ "Prepare     │          🍽️ 🥣 🥛                │ ● ONLINE  │
 * │  table for 4"│                                   │           │
 * │              │        🍴     🫗                  │ RIGHT     │
 * │              │                                   │ ● ONLINE  │
 * ├──────────────┤                                   │           │
 * │ TASK QUEUE   │                                   │ JOINTS    │
 * │              │                                   │ J1  32°   │
 * │ ✓ Plates     │                                   │ J2  48°   │
 * │ ● Bowls      │                                   │ J3  21°   │
 * │ ○ Glasses    │                                   │           │
 * │ ○ Cutlery    │                                   │           │
 * └──────────────┴───────────────────────────────────┴───────────┘
 */

import React, { useState } from 'react';
import { 
  Play, Pause, SkipForward, RotateCcw, Mic, MicOff, Send, 
  CheckCircle2, AlertTriangle, Shield, Cpu, Gauge, Eye, Camera, 
  Sparkles, Layers, Sliders, ChevronRight, Activity, Zap, Check
} from 'lucide-react';
import { 
  TableLayoutPlan, 
  SO101ArmTelemetry, 
  TablewareItem, 
  PipelineStage, 
  OpenVINOBenchmark 
} from '../types';
import { ThreeWorkspace3D, CameraPreset } from './ThreeWorkspace3D';

interface Integrated3DWorkspaceProps {
  plan: TableLayoutPlan | null;
  stage: PipelineStage;
  isProcessing: boolean;
  leftArm: SO101ArmTelemetry;
  rightArm: SO101ArmTelemetry;
  activeItem: TablewareItem | null;
  completedItems: TablewareItem[];
  isPlaying: boolean;
  simSpeed: number;
  openVinoBenchmark: OpenVINOBenchmark;
  onExecuteCommand: (cmd: string) => void;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onChangeSpeed: (spd: number) => void;
  onEmergencyStop: () => void;
  onChangeQuantization: (quant: 'INT8' | 'FP16' | 'FP32') => void;
  onSelectGroupSize: (n: number) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

export const Integrated3DWorkspace: React.FC<Integrated3DWorkspaceProps> = ({
  plan,
  stage,
  isProcessing,
  leftArm,
  rightArm,
  activeItem,
  completedItems,
  isPlaying,
  simSpeed,
  openVinoBenchmark,
  onExecuteCommand,
  onTogglePlay,
  onStepForward,
  onReset,
  onChangeSpeed,
  onEmergencyStop,
  onChangeQuantization,
  onSelectGroupSize,
  voiceEnabled,
  onToggleVoice,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedArm, setSelectedArm] = useState<'left' | 'right' | null>('left');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('ORBIT');
  const [isListening, setIsListening] = useState(false);

  // Quick Command Presets (Supported Dinner Configurations)
  const quickPresets = [
    { label: 'Single Place', cmd: 'Set the dinner table for 1 person' },
    { label: 'Dinner for 2', cmd: 'Prepare a romantic dinner table for two' },
    { label: 'Dinner for 4', cmd: 'Prepare the dinner table for 4 people' },
    { label: 'Dinner for 6', cmd: 'Prepare the dinner table for 6 people' },
    { label: 'Banquet for 8', cmd: 'Prepare a banquet dinner table for 8' },
    { label: 'Dinner for 10', cmd: 'Prepare the dinner table for 10 people' },
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onExecuteCommand(inputText);
    setInputText('');
  };

  const handleVoiceToggle = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome/Edge or text input.');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        onExecuteCommand(transcript);
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  // Group size and progress (1 person = 5 tableware items)
  const people = plan?.isValid ? plan.groupSize : 4;
  const totalItems = plan?.isValid ? plan.allItems.length : (people * 5);
  const doneCount = completedItems.length;

  // Task item completion counts by type (5 tableware objects per setting)
  const platesDone = completedItems.filter(i => i.type === 'plate').length;
  const bowlsDone = completedItems.filter(i => i.type === 'bowl').length;
  const cupsDone = completedItems.filter(i => i.type === 'cup').length;
  const spoonsDone = completedItems.filter(i => i.type === 'spoon').length;
  const addSpoonsDone = completedItems.filter(i => i.type === 'additional_spoon').length;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[720px] w-full bg-[#070a12] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden relative font-sans">
      
      {/* 1. TOP STATUS & SIMULATION CONTROL BAR */}
      <div className="h-14 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-600 to-blue-600 flex items-center justify-center shadow-md shadow-rose-600/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wider text-white">TWINHANDS-AI</span>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-800/50">v2.4</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                Bimanual Physical AI · MuJoCo 3.X Simulation
              </p>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Connection Status */}
          <div className="hidden sm:flex items-center gap-2 bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 px-2.5 py-1 rounded-full text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>SIMULATION CONNECTED</span>
          </div>
        </div>

        {/* Global Sim Controls */}
        <div className="flex items-center gap-2">
          {/* Speed Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            {[1, 2, 5].map(spd => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`px-2 py-0.5 rounded font-mono font-medium transition-all ${
                  simSpeed === spd ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Play / Pause */}
          <button
            onClick={onTogglePlay}
            disabled={!plan?.isValid || stage === 'REJECTED'}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'PAUSE' : 'RUN'}</span>
          </button>

          {/* Step Forward */}
          <button
            onClick={onStepForward}
            disabled={isPlaying || !plan?.isValid}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-50"
            title="Step One Object"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* E-Stop */}
          <button
            onClick={onEmergencyStop}
            className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1 shadow-lg shadow-red-600/30 transition-all active:scale-95"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">E-STOP</span>
          </button>
        </div>
      </div>

      {/* 2. THREE-PANE MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT PANE: AI COMMAND & FLOATING TASK PANEL */}
        <div className="w-80 max-w-[320px] bg-slate-950/80 backdrop-blur-md border-r border-slate-800/80 flex flex-col p-3 gap-3 z-10 shrink-0 overflow-y-auto">
          
          {/* DINNER TABLE CONFIGURATION SELECTOR (Section 12) */}
          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80 shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 font-mono flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>DINNER TABLE CONFIGURATION</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                {people} {people === 1 ? 'Person' : 'People'}
              </span>
            </div>

            {/* Radio-style configuration options */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              {[
                { count: 1, label: 'Single Place', desc: '1 Place · 5 Items' },
                { count: 2, label: 'Dinner for 2', desc: '2 Places · 10 Items' },
                { count: 4, label: 'Dinner for 4', desc: '4 Places · 20 Items' },
                { count: 6, label: 'Dinner for 6', desc: '6 Places · 30 Items' },
                { count: 8, label: 'Banquet for 8', desc: '8 Places · 40 Items' },
                { count: 10, label: 'Dinner for 10', desc: '10 Places · 50 Items' },
              ].map(cfg => {
                const isSelected = people === cfg.count;
                return (
                  <button
                    key={cfg.count}
                    onClick={() => onSelectGroupSize(cfg.count)}
                    className={`flex items-start gap-1.5 p-2 rounded-lg text-left transition-all border ${
                      isSelected
                        ? 'bg-cyan-950/70 border-cyan-500/80 text-cyan-200 shadow-sm shadow-cyan-950/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className={`text-xs mt-0.5 ${isSelected ? 'text-cyan-400 font-bold' : 'text-slate-600'}`}>
                      {isSelected ? '◉' : '○'}
                    </span>
                    <div className="min-w-0">
                      <div className={`text-[11px] font-bold font-mono truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {cfg.label}
                      </div>
                      <div className="text-[9px] font-mono text-slate-500 truncate">
                        {cfg.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Command & Voice Card */}
          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI COMMAND LAYER</span>
              </div>
              <button
                onClick={handleVoiceToggle}
                className={`p-1.5 rounded-lg transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
                title="Voice Input"
              >
                {isListening ? <Mic className="w-3.5 h-3.5 text-white" /> : <MicOff className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Natural Language Input Form */}
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="e.g. Prepare dinner for 4"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-3 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
              <button
                type="submit"
                disabled={isProcessing}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-cyan-400 hover:text-cyan-300 disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick Presets */}
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-slate-400">QUICK PROMPTS:</div>
              <div className="flex flex-wrap gap-1">
                {quickPresets.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => onExecuteCommand(preset.cmd)}
                    className="text-[10px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-1 rounded border border-slate-700/60 transition-all font-mono"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pipeline Flow Badges */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-[9px] font-mono text-slate-400 mb-1">REASONING PIPELINE:</div>
              <div className="flex items-center text-[10px] font-mono gap-1 text-slate-400 overflow-x-auto pb-1">
                <span className="text-cyan-400 font-semibold">Voice</span>
                <span>→</span>
                <span className="text-blue-400 font-semibold">AI Planner</span>
                <span>→</span>
                <span className="text-purple-400 font-semibold">Task Graph</span>
                <span>→</span>
                <span className="text-rose-400 font-semibold">Dual Arms</span>
                <span>→</span>
                <span className="text-emerald-400 font-semibold">3D Exec</span>
              </div>
            </div>

            {/* Active Dual-Arm Motion Step Animation */}
            {isPlaying && activeItem && (
              <div className="bg-slate-950/90 rounded-lg p-2 border border-slate-800 text-[11px] font-mono space-y-1">
                <div className="text-slate-400 text-[10px]">CURRENT ACTION:</div>
                <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>{activeItem.assignedArm === 'left' ? '🔴 LEFT ARM:' : '🔵 RIGHT ARM:'}</span>
                </div>
                <div className="pl-3 text-slate-300 text-[10px]">
                  Pick {activeItem.label} → Move Arc → Place P{activeItem.personId}
                </div>
              </div>
            )}
          </div>

          {/* 3D FLOATING TASK PANEL & LIVE OBJECT COUNT SUMMARY (Section 13) */}
          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80 shadow-lg space-y-2.5 flex-1">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>TASK: Dinner for {people}</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                {doneCount}/{totalItems} ({Math.round((doneCount / totalItems) * 100)}%)
              </span>
            </div>

            {/* Section 13 Live Object Count Display Card */}
            <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 font-mono space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {people === 1 ? 'SINGLE PLACE' : people === 8 ? 'BANQUET FOR 8' : `DINNER FOR ${people}`}
                </span>
                <span className="text-[10px] text-cyan-400 font-semibold">
                  Place Settings: {people}
                </span>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Dinner Plates</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold">{platesDone}/{people}</span>
                    {platesDone === people && <Check className="w-3 h-3 text-emerald-400" />}
                  </div>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Soup Bowls</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold">{bowlsDone}/{people}</span>
                    {bowlsDone === people && <Check className="w-3 h-3 text-emerald-400" />}
                  </div>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Ceramic Cups</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold">{cupsDone}/{people}</span>
                    {cupsDone === people && <Check className="w-3 h-3 text-emerald-400" />}
                  </div>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Cutlery Spoons</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold">{spoonsDone}/{people}</span>
                    {spoonsDone === people && <Check className="w-3 h-3 text-emerald-400" />}
                  </div>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Additional Spoons</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold">{addSpoonsDone}/{people}</span>
                    {addSpoonsDone === people && <Check className="w-3 h-3 text-emerald-400" />}
                  </div>
                </div>
              </div>

              <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                <span className="text-cyan-400">Total Tableware:</span>
                <span className="text-white font-mono bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
                  {doneCount}/{people * 5}
                </span>
              </div>
            </div>

            {/* Subtask Status Checklist */}
            <div className="space-y-1.5 text-xs font-mono pt-1">
              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Table Scaled</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">
                  {plan?.tableDimensions ? `${plan.tableDimensions.widthM.toFixed(2)}m × ${plan.tableDimensions.depthM.toFixed(2)}m` : '1.40m × 0.90m'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  {platesDone === people ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                  <span>Dinner Plates</span>
                </div>
                <span className="text-[10px] text-slate-400">{platesDone}/{people}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  {bowlsDone === people ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : bowlsDone > 0 ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full border border-slate-600" />
                  )}
                  <span>Soup Bowls (Layer 1)</span>
                </div>
                <span className="text-[10px] text-slate-400">{bowlsDone}/{people}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  {cupsDone === people ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : cupsDone > 0 ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full border border-slate-600" />
                  )}
                  <span>Ceramic Cups</span>
                </div>
                <span className="text-[10px] text-slate-400">{cupsDone}/{people}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  {spoonsDone === people ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : spoonsDone > 0 ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full border border-slate-600" />
                  )}
                  <span>Cutlery Spoons</span>
                </div>
                <span className="text-[10px] text-slate-400">{spoonsDone}/{people}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  {addSpoonsDone === people ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : addSpoonsDone > 0 ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full border border-slate-600" />
                  )}
                  <span>Additional Spoons</span>
                </div>
                <span className="text-[10px] text-slate-400">{addSpoonsDone}/{people}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  {doneCount === totalItems ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full border border-slate-600" />
                  )}
                  <span>Final Inspection</span>
                </div>
                <span className="text-[10px] text-cyan-400 font-bold">
                  {doneCount === totalItems ? 'PASSED' : 'PENDING'}
                </span>
              </div>
            </div>

            {/* Unsupported Notice alert */}
            {stage === 'REJECTED' && plan?.rejectionNotice && (
              <div className="p-2.5 bg-rose-950/90 border border-rose-800/80 rounded-lg text-rose-300 text-xs font-mono space-y-1">
                <div className="font-bold flex items-center gap-1 text-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>REQUEST NOT SUPPORTED</span>
                </div>
                <p className="text-[11px]">{plan.rejectionNotice}</p>
              </div>
            )}
          </div>
        </div>

        {/* CENTER PANE: FULL-SCREEN INTERACTIVE 3D TABLE WORKSPACE */}
        <div className="flex-1 h-full relative bg-[#080c14]">
          <ThreeWorkspace3D
            plan={plan}
            leftArm={leftArm}
            rightArm={rightArm}
            activeItem={activeItem}
            completedItems={completedItems}
            isPlaying={isPlaying}
            simSpeed={simSpeed}
            selectedArm={selectedArm}
            onSelectArm={setSelectedArm}
            cameraPreset={cameraPreset}
            onCameraPresetChange={setCameraPreset}
          />
        </div>

        {/* RIGHT PANE: ROBOT STATUS & REAL-TIME JOINT VISUALIZATION */}
        <div className="w-80 max-w-[320px] bg-slate-950/80 backdrop-blur-md border-l border-slate-800/80 flex flex-col p-3 gap-3 z-10 shrink-0 overflow-y-auto">
          
          {/* ROBOT STATUS HEADER */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>ROBOT STATUS & JOINTS</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">60 Hz FEEDBACK</span>
          </div>

          {/* 🔴 RED LEFT ARM STATUS */}
          <div className={`bg-slate-900/90 rounded-xl p-3 border transition-all ${
            selectedArm === 'left' ? 'border-rose-500/80 shadow-lg shadow-rose-600/10' : 'border-slate-800/80'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-xs font-bold text-rose-400 font-mono">LEFT ARM (SO-101)</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                ● ONLINE
              </span>
            </div>

            {/* TCP Position */}
            <div className="text-[11px] font-mono text-slate-300 bg-slate-950 p-1.5 rounded border border-slate-800 mb-2">
              <span className="text-slate-400">TCP: </span>
              <span>X:{leftArm.eePose.x.toFixed(2)} Y:{leftArm.eePose.y.toFixed(2)} Z:{leftArm.eePose.z.toFixed(2)}</span>
            </div>

            {/* Joints Progress Gauges */}
            <div className="space-y-1 text-[10px] font-mono">
              {[
                { name: 'J1 (Waist)', val: leftArm.jointAnglesDeg[0], min: -180, max: 180 },
                { name: 'J2 (Shoulder)', val: leftArm.jointAnglesDeg[1], min: -45, max: 135 },
                { name: 'J3 (Elbow)', val: leftArm.jointAnglesDeg[2], min: -120, max: 90 },
                { name: 'J4 (Wrist P)', val: leftArm.jointAnglesDeg[3], min: -90, max: 90 },
                { name: 'J5 (Wrist R)', val: leftArm.jointAnglesDeg[4], min: -180, max: 180 },
              ].map(j => {
                const pct = Math.max(0, Math.min(100, ((j.val - j.min) / (j.max - j.min)) * 100));
                return (
                  <div key={j.name} className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 w-20">{j.name}</span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-500 rounded-full transition-all duration-75"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-slate-200 w-9 text-right">{j.val.toFixed(0)}°</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Gripper:</span>
              <span className={(leftArm.gripperState || 0) > 0.5 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                {(leftArm.gripperState || 0) > 0.5 ? 'GRASPING (100%)' : 'OPEN'}
              </span>
            </div>
          </div>

          {/* 🔵 BLUE RIGHT ARM STATUS */}
          <div className={`bg-slate-900/90 rounded-xl p-3 border transition-all ${
            selectedArm === 'right' ? 'border-blue-500/80 shadow-lg shadow-blue-600/10' : 'border-slate-800/80'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs font-bold text-blue-400 font-mono">RIGHT ARM (SO-101)</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                ● ONLINE
              </span>
            </div>

            {/* TCP Position */}
            <div className="text-[11px] font-mono text-slate-300 bg-slate-950 p-1.5 rounded border border-slate-800 mb-2">
              <span className="text-slate-400">TCP: </span>
              <span>X:{rightArm.eePose.x.toFixed(2)} Y:{rightArm.eePose.y.toFixed(2)} Z:{rightArm.eePose.z.toFixed(2)}</span>
            </div>

            {/* Joints Progress Gauges */}
            <div className="space-y-1 text-[10px] font-mono">
              {[
                { name: 'J1 (Waist)', val: rightArm.jointAnglesDeg[0], min: -180, max: 180 },
                { name: 'J2 (Shoulder)', val: rightArm.jointAnglesDeg[1], min: -45, max: 135 },
                { name: 'J3 (Elbow)', val: rightArm.jointAnglesDeg[2], min: -120, max: 90 },
                { name: 'J4 (Wrist P)', val: rightArm.jointAnglesDeg[3], min: -90, max: 90 },
                { name: 'J5 (Wrist R)', val: rightArm.jointAnglesDeg[4], min: -180, max: 180 },
              ].map(j => {
                const pct = Math.max(0, Math.min(100, ((j.val - j.min) / (j.max - j.min)) * 100));
                return (
                  <div key={j.name} className="flex items-center justify-between gap-2">
                    <span className="text-slate-400 w-20">{j.name}</span>
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-75"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-slate-200 w-9 text-right">{j.val.toFixed(0)}°</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Gripper:</span>
              <span className={(rightArm.gripperState || 0) > 0.5 ? 'text-blue-400 font-bold' : 'text-slate-300'}>
                {(rightArm.gripperState || 0) > 0.5 ? 'GRASPING (100%)' : 'OPEN'}
              </span>
            </div>
          </div>

          {/* INTEL OPENVINO EDGE AI CARD */}
          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80 shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 font-mono">
                <Cpu className="w-3.5 h-3.5" />
                <span>INTEL® OPENVINO™</span>
              </div>
              {/* Quantization Buttons */}
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 text-[10px] font-mono">
                {(['INT8', 'FP16', 'FP32'] as const).map(q => (
                  <button
                    key={q}
                    onClick={() => onChangeQuantization(q)}
                    className={`px-1.5 py-0.5 rounded transition-all ${
                      openVinoBenchmark.quantization === q
                        ? 'bg-purple-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                <div className="text-[9px] text-slate-400">LATENCY:</div>
                <div className="text-emerald-400 font-bold text-xs">{openVinoBenchmark.inferenceLatencyMs} ms</div>
              </div>
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                <div className="text-[9px] text-slate-400">THROUGHPUT:</div>
                <div className="text-cyan-400 font-bold text-xs">{openVinoBenchmark.throughputFps} FPS</div>
              </div>
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                <div className="text-[9px] text-slate-400">MEMORY:</div>
                <div className="text-slate-200 font-bold text-xs">{openVinoBenchmark.memoryFootprintMb} MB</div>
              </div>
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                <div className="text-[9px] text-slate-400">ACCURACY:</div>
                <div className="text-purple-400 font-bold text-xs">{(openVinoBenchmark.avgConfidence * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
