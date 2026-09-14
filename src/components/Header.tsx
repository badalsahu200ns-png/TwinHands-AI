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
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-purple-600 to-blue-600 flex items-center justify-center p-0.5 shadow-lg shadow-blue-500/10">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-slate-100" />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                TwinHands-AI
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Physical AI / VLA
              </span>

              {/* Exact creator attribution button */}
              {onOpenCreatorProfile && (
                <button
                  type="button"
                  onClick={onOpenCreatorProfile}
                  aria-label="View Badal Kumar Sahu creator profile and contact information"
                  className="group inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 transition-all text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer shadow-sm"
                >
                  <span className="text-slate-400 font-normal">By</span>
                  <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-200 to-cyan-300 group-hover:brightness-125 transition-all">
                    Badal Kumar Sahu
                  </span>
                  <Sparkles className="w-3 h-3 text-cyan-400 group-hover:rotate-12 transition-transform" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Coordinated Bimanual Dinner-Table Preparation • Dual SO-101 Arms • MuJoCo • Intel OpenVINO
            </p>
          </div>
        </div>

        {/* Live System & Robot Status Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Red Left Arm Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono font-semibold">🔴 LEFT SO-101:</span>
            <span className="font-bold text-red-200">
              {leftArm.status === 'IDLE' ? 'READY' : leftArm.status}
            </span>
          </div>

          {/* Blue Right Arm Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-mono font-semibold">🔵 RIGHT SO-101:</span>
            <span className="font-bold text-blue-200">
              {rightArm.status === 'IDLE' ? 'READY' : rightArm.status}
            </span>
          </div>

          {/* Subsystem status pills */}
          <div className="hidden lg:flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>MUJOCO:</span>
              <span className="text-emerald-300 font-mono font-semibold">ONLINE</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>OPENVINO:</span>
              <span className="text-cyan-300 font-mono font-semibold">INT8 READY</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Voice Audio Toggle */}
            <button
              onClick={onToggleVoice}
              title={voiceEnabled ? "Mute Voice Audio Feedback" : "Enable Voice Audio Feedback"}
              className={`p-1.5 rounded-lg border transition-colors ${
                voiceEnabled
                  ? "bg-slate-800 text-cyan-400 border-cyan-500/40 hover:bg-slate-700"
                  : "bg-slate-900 text-slate-500 border-slate-700 hover:text-slate-300"
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Reset Button */}
            <button
              onClick={onResetSystem}
              title="Reset Table & Robots to Staging Poses"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="text-xs">Reset</span>
            </button>

            {/* E-Stop Button */}
            <button
              onClick={onEmergencyStop}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-md ${
                isOperating
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 animate-pulse"
                  : "bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/60"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>E-STOP</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
