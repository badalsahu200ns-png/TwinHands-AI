/**
 * Robotics Telemetry Panel
 * Real-time Cartesian End-Effector Poses and 6-DOF Joint Angles for Dual SO-101 Arms
 */

import React from 'react';
import { Bot, Gauge, Compass, Disc, Zap, ArrowRightLeft } from 'lucide-react';
import { SO101ArmTelemetry } from '../types';

interface RoboticsTelemetryPanelProps {
  leftArm: SO101ArmTelemetry;
  rightArm: SO101ArmTelemetry;
}

export const RoboticsTelemetryPanel: React.FC<RoboticsTelemetryPanelProps> = ({
  leftArm,
  rightArm,
}) => {
  const renderArmCard = (arm: SO101ArmTelemetry) => {
    const isLeft = arm.id === 'left';
    const borderColor = isLeft ? 'border-red-500/40' : 'border-blue-500/40';
    const bgHeader = isLeft ? 'bg-red-950/40 text-red-300' : 'bg-blue-950/40 text-blue-300';
    const accentText = isLeft ? 'text-red-400' : 'text-blue-400';
    const badgeBg = isLeft ? 'bg-red-500/20 border-red-500/30' : 'bg-blue-500/20 border-blue-500/30';

    return (
      <div className={`bg-slate-900/80 border ${borderColor} rounded-xl p-4 shadow-xl flex-1 flex flex-col justify-between`}>
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isLeft ? 'bg-red-500' : 'bg-blue-500'}`} />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                {arm.name}
              </h3>
            </div>
            <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${badgeBg} ${accentText}`}>
              {arm.status}
            </span>
          </div>

          {/* Cartesian End-Effector Pose (XYZ + RPY) */}
          <div className="mb-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 mb-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cartesian Tool Center Point (TCP)</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
              <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">X: </span>
                <span className="text-slate-200 font-bold">{arm.eePose.x.toFixed(3)}m</span>
              </div>
              <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">Y: </span>
                <span className="text-slate-200 font-bold">{arm.eePose.y.toFixed(3)}m</span>
              </div>
              <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px]">Z: </span>
                <span className="text-slate-200 font-bold">{arm.eePose.z.toFixed(3)}m</span>
              </div>
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800 text-[11px]">
                <span className="text-slate-500 text-[10px]">R: </span>
                <span className="text-slate-300">{arm.eePose.roll}°</span>
              </div>
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800 text-[11px]">
                <span className="text-slate-500 text-[10px]">P: </span>
                <span className="text-slate-300">{arm.eePose.pitch}°</span>
              </div>
              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800 text-[11px]">
                <span className="text-slate-500 text-[10px]">Y: </span>
                <span className="text-slate-300">{arm.eePose.yaw}°</span>
              </div>
            </div>
          </div>

          {/* 6-DOF Joint Angles (q1 - q6) */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 text-indigo-400" />
                <span>6-DOF Joint Actuation (q1–q6)</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Gripper: {Math.round(arm.gripperState * 100)}%
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1 font-mono text-center text-[10px]">
              {arm.jointAnglesDeg.map((q, idx) => (
                <div key={idx} className="bg-slate-950/80 py-1 px-0.5 rounded border border-slate-800">
                  <span className="text-slate-500 text-[9px] block">q{idx + 1}</span>
                  <span className={`font-bold ${Math.abs(q) > 80 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {q}°
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Joint Torques */}
          <div className="mb-3">
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 mb-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Actuator Torques (Nm):</span>
            </div>
            <div className="flex gap-1 text-[10px] font-mono text-slate-300">
              {arm.jointTorquesNm.map((t, idx) => (
                <span key={idx} className="flex-1 bg-slate-950/60 text-center py-0.5 rounded border border-slate-800/80">
                  {t.toFixed(1)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action & Stats Footer */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
          <div className="text-slate-400 truncate max-w-[200px]" title={arm.currentActionDescription}>
            Action: <span className="text-slate-200">{arm.currentActionDescription}</span>
          </div>
          <div className="text-slate-400">
            Dist: <span className="text-cyan-300 font-bold">{arm.totalDistanceMovedM.toFixed(2)}m</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {renderArmCard(leftArm)}
      {renderArmCard(rightArm)}
    </div>
  );
};
