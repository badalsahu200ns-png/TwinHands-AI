/**
 * Intel OpenVINO Edge AI Perception & Model Optimization Benchmark
 * Quantization: INT8 (Default) vs FP16 vs FP32
 * Measurable latency, throughput, memory, and confidence scores
 */

import React, { useState } from 'react';
import { Cpu, Zap, Activity, HardDrive, Award, ShieldCheck, Check } from 'lucide-react';
import { OpenVINOBenchmark } from '../types';

interface OpenVINOBenchmarkCardProps {
  benchmark: OpenVINOBenchmark;
  onChangeQuantization: (quant: 'INT8' | 'FP16' | 'FP32') => void;
}

export const OpenVINOBenchmarkCard: React.FC<OpenVINOBenchmarkCardProps> = ({
  benchmark,
  onChangeQuantization,
}) => {
  const [quantMode, setQuantMode] = useState<'INT8' | 'FP16' | 'FP32'>('INT8');

  const handleSelectQuant = (mode: 'INT8' | 'FP16' | 'FP32') => {
    setQuantMode(mode);
    onChangeQuantization(mode);
  };

  // Speedup multiplier calculation
  const speedup = (benchmark.baselineLatencyMs / benchmark.inferenceLatencyMs).toFixed(1);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              Intel® OpenVINO™ Edge AI Perception
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Target: Intel Core Ultra NPU & Xeon Scalable • Model: {benchmark.activeModel}
            </p>
          </div>
        </div>

        {/* Quantization Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          {(['INT8', 'FP16', 'FP32'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleSelectQuant(mode)}
              className={`px-2 py-1 rounded transition-colors ${
                quantMode === mode
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 font-mono">
        
        {/* Latency */}
        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
            <span>Inference Latency</span>
            <Zap className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="text-base font-bold text-white flex items-baseline gap-1">
            <span>{benchmark.inferenceLatencyMs.toFixed(1)}</span>
            <span className="text-[10px] text-cyan-400">ms</span>
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">
            {speedup}x speedup vs FP32
          </div>
        </div>

        {/* Throughput */}
        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
            <span>Throughput</span>
            <Activity className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-white flex items-baseline gap-1">
            <span>{benchmark.throughputFps.toFixed(0)}</span>
            <span className="text-[10px] text-emerald-400">FPS</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Real-time VLA stream
          </div>
        </div>

        {/* Memory Footprint */}
        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
            <span>Memory Footprint</span>
            <HardDrive className="w-3 h-3 text-indigo-400" />
          </div>
          <div className="text-base font-bold text-white flex items-baseline gap-1">
            <span>{benchmark.memoryFootprintMb.toFixed(1)}</span>
            <span className="text-[10px] text-indigo-400">MB</span>
          </div>
          <div className="text-[10px] text-indigo-300 mt-0.5">
            NPU cache resident
          </div>
        </div>

        {/* Detection Accuracy */}
        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
            <span>Detection Conf</span>
            <Award className="w-3 h-3 text-amber-400" />
          </div>
          <div className="text-base font-bold text-white flex items-baseline gap-1">
            <span>{(benchmark.avgConfidence * 100).toFixed(1)}</span>
            <span className="text-[10px] text-amber-400">%</span>
          </div>
          <div className="text-[10px] text-amber-300 mt-0.5">
            ±2mm localization
          </div>
        </div>

      </div>

      {/* Tableware Object Detection Classes */}
      <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Active Vision Classes:
        </span>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">
            🍽️ Plate [98.4%]
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">
            🍲 Bowl [97.2%]
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">
            🥤 Cup [96.8%]
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">
            🥄 Spoon [95.5%]
          </span>
        </div>
      </div>
    </div>
  );
};
