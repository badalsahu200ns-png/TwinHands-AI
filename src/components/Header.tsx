/**
 * TwinHands-AI Header Component
 * Displays system status, robot identities, and master safety controls
 */

import React from 'react';
import { Bot, Volume2, VolumeX, ShieldAlert, Cpu, Activity, RefreshCw, Sparkles } from 'lucide-react';
import { SO101ArmTelemetry, PipelineStage } from '../types';

interface HeaderProps {
  leftArm: SO101ArmTelemetry;
  rightArm: SO101ArmTelemetry;
  stage: PipelineStage;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onEmergencyStop: () => void;
  onResetSystem: () => void;
  onOpenCreatorProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  leftArm,
  rightArm,
  stage,
  voiceEnabled,
  onToggleVoice,
  onEmergencyStop,
  onResetSystem,
  onOpenCreatorProfile,
}) => {
  const isOperating = stage === 'MUJOCO_EXECUTION' || stage === 'OPENVINO_INSPECTION';

  return (
    <header className="relative bg-[#070b14]/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 sm:px-6 overflow-hidden select-none">
      {/* Spider-Man Inspired Animated Web & HUD Background Accent Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        {/* Subtle Web/HUD SVG Lines */}
        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="spiderWebGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
            </linearGradient>
            <pattern id="spiderHex" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 60 17.32 L 60 51.96 L 30 69.28 L 0 51.96 L 0 17.32 Z" fill="none" stroke="url(#spiderWebGrad)" strokeWidth="0.6" strokeDasharray="3 3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#spiderHex)" />
        </svg>

        {/* Ambient Red & Blue Light Streaks */}
        <div className="absolute -top-12 -left-12 w-64 h-24 bg-red-600/25 blur-3xl rounded-full transform -rotate-12" />
        <div className="absolute -top-12 -right-12 w-64 h-24 bg-blue-600/25 blur-3xl rounded-full transform rotate-12" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-1 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 z-10">
        
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl bg-gradient-to-tr from-red-600 via-rose-600 to-blue-600 flex items-center justify-center p-0.5 shadow-lg shadow-red-500/20 group">
            <div className="w-full h-full bg-[#080d1a] rounded-[10px] flex items-center justify-center relative overflow-hidden">
              {/* Spider Emblem Detail */}
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-blue-500/10" />
              <Bot className="w-5 h-5 text-slate-100 group-hover:scale-110 transition-transform relative z-10" />
            </div>
            {/* Small Glowing Corner Nodes */}
            <span className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 rounded-full bg-red-400 shadow-sm shadow-red-400" />
            <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-sm shadow-blue-400" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black tracking-wider text-white font-mono flex items-center gap-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-white to-blue-400">
                  TWINHANDS-AI
                </span>
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-red-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 font-mono shadow-sm">
                Physical AI / VLA
              </span>

              {/* Creator attribution badge */}
              {onOpenCreatorProfile && (
                <button
                  type="button"
                  onClick={onOpenCreatorProfile}
                  aria-label="View Badal Kumar Sahu creator profile and contact information"
                  className="group inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 transition-all text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer shadow-sm"
                >
                  <span className="text-slate-400 font-normal text-[11px]">By</span>
                  <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-200 to-cyan-300 group-hover:brightness-125 transition-all text-[11px]">
                    Badal Kumar Sahu
                  </span>
                  <Sparkles className="w-3 h-3 text-cyan-400 group-hover:rotate-12 transition-transform" />
                </button>
              )}
            </div>

            <p className="text-xs text-slate-300 font-medium">
              AI-Powered Bimanual Restaurant Automation
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Multimodal Physical AI • Dual SO-101 • MuJoCo • OpenVINO
            </p>
          </div>
        </div>

        {/* Live System & Robot Status Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Red Left Arm Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-red-950/60 to-red-900/30 border border-red-500/40 text-red-300 shadow-sm shadow-red-950/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="font-mono font-bold text-[11px]">LEFT SO-101:</span>
            <span className="font-mono font-black text-red-200 text-[11px]">
              {leftArm.status === 'IDLE' ? 'READY' : leftArm.status}
            </span>
          </div>

          {/* Blue Right Arm Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-950/60 to-blue-900/30 border border-blue-500/40 text-blue-300 shadow-sm shadow-blue-950/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <span className="font-mono font-bold text-[11px]">RIGHT SO-101:</span>
            <span className="font-mono font-black text-blue-200 text-[11px]">
              {rightArm.status === 'IDLE' ? 'READY' : rightArm.status}
            </span>
          </div>

          {/* Subsystem status pills */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-400 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse" />
              <span>MUJOCO:</span>
              <span className="text-emerald-300 font-bold">ONLINE</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>OPENVINO:</span>
              <span className="text-cyan-300 font-bold">INT8 READY</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Voice Audio Toggle */}
            <button
              onClick={onToggleVoice}
              title={voiceEnabled ? "Mute Voice Audio Feedback" : "Enable Voice Audio Feedback"}
              className={`p-2 rounded-lg border transition-all ${
                voiceEnabled
                  ? "bg-slate-900 text-cyan-400 border-cyan-500/40 hover:bg-slate-800 shadow-sm shadow-cyan-500/20"
                  : "bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300"
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Reset Button */}
            <button
              onClick={onResetSystem}
              title="Reset Table & Robots to Staging Poses"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 transition-colors text-xs font-mono font-medium shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>

            {/* E-Stop Button */}
            <button
              onClick={onEmergencyStop}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-mono font-bold text-xs transition-all shadow-md active:scale-95 ${
                isOperating
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/40 animate-pulse ring-2 ring-red-500/50"
                  : "bg-red-950/70 hover:bg-red-900/80 text-red-200 border border-red-700/60 shadow-inner"
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-red-300" />
              <span>E-STOP</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
