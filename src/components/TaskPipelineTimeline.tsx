/**
 * TwinHands-AI 9-Stage Physical AI Task Pipeline
 * Reflects end-to-end transformation:
 * Natural Language -> Group Size -> Scene Understanding -> Layout Planning ->
 * Bimanual Planning -> MuJoCo Manipulation -> OpenVINO Verification -> Ready
 */

import React from 'react';
import { 
  Mic, Brain, Eye, Maximize, LayoutGrid, ArrowRightLeft, 
  Play, CheckCircle2, ShieldCheck, Check
} from 'lucide-react';
import { PipelineStage } from '../types';

interface TaskPipelineTimelineProps {
  currentStage: PipelineStage;
  groupSize: number;
  totalObjects: number;
  completedObjects: number;
}

const PIPELINE_STAGES = [
  { id: 'NLP_REASONING', label: '1. Human Voice/Text', icon: Mic },
  { id: 'TABLE_CAPACITY_CHECK', label: '2. Group Extraction', icon: Brain },
  { id: 'LAYOUT_PLANNING', label: '3. Scene & Capacity', icon: Eye },
  { id: 'BIMANUAL_DISPATCH', label: '4. Layout Planner', icon: LayoutGrid },
  { id: 'MUJOCO_EXECUTION', label: '5. Bimanual Plan', icon: ArrowRightLeft },
  { id: 'OPENVINO_INSPECTION', label: '6. MuJoCo Cartesian', icon: Play },
  { id: 'VERIFICATION_PASSED', label: '7. Edge Verification', icon: ShieldCheck },
  { id: 'COMPLETE', label: '8. Table Ready', icon: CheckCircle2 },
];

export const TaskPipelineTimeline: React.FC<TaskPipelineTimelineProps> = ({
  currentStage,
  groupSize,
  totalObjects,
  completedObjects,
}) => {
  const getStageIndex = (stage: PipelineStage): number => {
    switch (stage) {
      case 'IDLE':
      case 'LISTENING':
      case 'NLP_REASONING':
        return 0;
      case 'TABLE_CAPACITY_CHECK':
        return 1;
      case 'LAYOUT_PLANNING':
        return 3;
      case 'BIMANUAL_DISPATCH':
        return 4;
      case 'MUJOCO_EXECUTION':
        return 5;
      case 'OPENVINO_INSPECTION':
        return 6;
      case 'VERIFICATION_PASSED':
        return 7;
      case 'REJECTED':
        return -1;
      default:
        return 0;
    }
  };

  const activeIdx = getStageIndex(currentStage);

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Physical AI Execution Pipeline
          </h3>
        </div>
        <div className="font-mono text-xs text-slate-300">
          Progress: <span className="text-cyan-400 font-bold">{completedObjects}/{totalObjects}</span> Objects Placed ({groupSize > 0 ? Math.round((completedObjects / Math.max(totalObjects, 1)) * 100) : 0}%)
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 rounded-full h-2 mb-4 overflow-hidden border border-slate-800">
        <div 
          className="bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${groupSize > 0 ? Math.round((completedObjects / Math.max(totalObjects, 1)) * 100) : 0}%` }}
        />
      </div>

      {/* Pipeline Stage Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {PIPELINE_STAGES.map((st, idx) => {
          const Icon = st.icon;
          const isCompleted = activeIdx > idx;
          const isCurrent = activeIdx === idx;

          let badgeStyle = "bg-slate-950/60 border-slate-800 text-slate-500";
          if (isCurrent) {
            badgeStyle = "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold shadow-lg shadow-cyan-500/10 animate-pulse";
          } else if (isCompleted) {
            badgeStyle = "bg-emerald-950/40 border-emerald-500/30 text-emerald-300";
          }

          return (
            <div
              key={st.id}
              className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-1 ${badgeStyle}`}
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center">
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="text-[10px] font-mono leading-tight">
                {st.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
