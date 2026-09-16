/**
 * TwinHands-AI: Primary Application Controller
 * Adaptive Multimodal Physical AI for Coordinated Bimanual Dinner-Table Preparation
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { NaturalLanguageInput } from './components/NaturalLanguageInput';
import { MujocoSimulationCanvas } from './components/MujocoSimulationCanvas';
import { RoboticsTelemetryPanel } from './components/RoboticsTelemetryPanel';
import { OpenVINOBenchmarkCard } from './components/OpenVINOBenchmarkCard';
import { TaskPipelineTimeline } from './components/TaskPipelineTimeline';
import { VerificationSummaryModal } from './components/VerificationSummaryModal';
import { ThreatModelSection } from './components/ThreatModelSection';
import { CADReferenceViewer } from './components/CADReferenceViewer';
import { Integrated3DWorkspace } from './components/Integrated3DWorkspace';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CreatorProfileModal } from './components/CreatorProfileModal';

import { 
  TableLayoutPlan, 
  SO101ArmTelemetry, 
  TablewareItem, 
  PipelineStage, 
  OpenVINOBenchmark,
  Vector3D 
} from './types';
import { planTableLayout, LEFT_ARM_BASE, RIGHT_ARM_BASE } from './planner/table_layout_planner';
import { createInitialArmTelemetry, computeSO101IK, interpolateCartesianTrajectory } from './simulation/kinematics';

export default function App() {
  // Core Planning State
  const [currentPlan, setCurrentPlan] = useState<TableLayoutPlan | null>(null);
  const [stage, setStage] = useState<PipelineStage>('IDLE');
  const [isProcessing, setIsProcessing] = useState(false);

  // Robotics Arm Telemetries
  const [leftArm, setLeftArm] = useState<SO101ArmTelemetry>(() => createInitialArmTelemetry('left'));
  const [rightArm, setRightArm] = useState<SO101ArmTelemetry>(() => createInitialArmTelemetry('right'));

  // Simulation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [activeItem, setActiveItem] = useState<TablewareItem | null>(null);
  const [completedItems, setCompletedItems] = useState<TablewareItem[]>([]);
  const [itemQueueIndex, setItemQueueIndex] = useState<number>(0);
  const [transitProgress, setTransitProgress] = useState<number>(0);

  // Intel OpenVINO Benchmark State
  const [openVinoBenchmark, setOpenVinoBenchmark] = useState<OpenVINOBenchmark>({
    quantization: 'INT8',
    inferenceLatencyMs: 3.8,
    baselineLatencyMs: 29.4,
    throughputFps: 263.1,
    memoryFootprintMb: 42.6,
    avgConfidence: 0.974,
    activeModel: 'YOLOv8x-Tableware-OpenVINO-INT8',
    inspectionStatus: 'ONLINE_ACTIVE',
  });

  // Modal & Audio Feedback
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [workspaceMode, setWorkspaceMode] = useState<'simulation' | 'cad_digital_twin' | 'all'>('simulation');

  // Audio Speech Synthesis Helper
  const speakVoice = useCallback((text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis unavailable', e);
    }
  }, [voiceEnabled]);

  // Initialize Default Plan for 4 people on mount (full realistic arrangement)
  useEffect(() => {
    const initial = planTableLayout(4);
    setCurrentPlan(initial);
    setCompletedItems(initial.allItems.map(it => ({ ...it, status: 'verified' as const })));
    setItemQueueIndex(initial.allItems.length);
    setStage('IDLE');
  }, []);

  // Update Intel OpenVINO quantization benchmark metrics
  const handleQuantizationChange = async (quant: 'INT8' | 'FP16' | 'FP32') => {
    try {
      const res = await fetch(`/api/openvino/benchmark?quantization=${quant}`);
      if (res.ok) {
        const data = await res.json();
        setOpenVinoBenchmark({
          quantization: quant,
          inferenceLatencyMs: data.metrics.inferenceLatencyMs,
          baselineLatencyMs: data.metrics.baselineLatencyMs,
          throughputFps: data.metrics.throughputFps,
          memoryFootprintMb: data.metrics.memoryFootprintMb,
          avgConfidence: data.metrics.accuracyRetainedPct / 100,
          activeModel: data.activeModel,
          inspectionStatus: data.inspectionStatus,
        });
      }
    } catch (err) {
      // Fallback local calibration
      const localSpecs = {
        INT8: { latency: 3.8, throughput: 263.1, mem: 42.6, conf: 0.974 },
        FP16: { latency: 7.2, throughput: 138.8, mem: 85.2, conf: 0.988 },
        FP32: { latency: 29.4, throughput: 34.0, mem: 170.4, conf: 0.999 },
      }[quant];
      setOpenVinoBenchmark(prev => ({
        ...prev,
        quantization: quant,
        inferenceLatencyMs: localSpecs.latency,
        throughputFps: localSpecs.throughput,
        memoryFootprintMb: localSpecs.mem,
        avgConfidence: localSpecs.conf,
      }));
    }
  };

  // Execute Natural Language Command
  const handleExecuteCommand = async (command: string) => {
    setIsProcessing(true);
    setStage('NLP_REASONING');
    setIsPlaying(false);

    try {
      // Call server-side intent endpoint
      const response = await fetch('/api/parse-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      let people = 4;
      let rejectionMessage: string | undefined;

      if (response.ok) {
        const data = await response.json();
        if (data.extractedPeople !== undefined && data.extractedPeople !== null) {
          people = data.extractedPeople;
        }
        rejectionMessage = data.rejectionMessage;
      }

      const newPlan = planTableLayout(people);
      if (rejectionMessage) {
        newPlan.rejectionNotice = rejectionMessage;
      }

      setCurrentPlan(newPlan);

      if (!newPlan.isValid) {
        setStage('REJECTED');
        speakVoice("Group size not supported. TwinHands-AI supports one to ten people.");
        setIsProcessing(false);
        return;
      }

      // Valid plan sequence
      setStage('LAYOUT_PLANNING');
      setCompletedItems([]);
      setItemQueueIndex(0);
      setActiveItem(null);
      setTransitProgress(0);

      speakVoice(`TwinHands-AI: Preparing dinner table for ${people} people. Coordinating Red left arm and Blue right arm.`);

      setTimeout(() => {
        setStage('BIMANUAL_DISPATCH');
        setTimeout(() => {
          setStage('MUJOCO_EXECUTION');
          setIsProcessing(false);
          setIsPlaying(true);
        }, 500);
      }, 500);

    } catch (err) {
      console.error('Intent execution error:', err);
      // Fallback to local planner for 4
      const fallback = planTableLayout(4);
      setCurrentPlan(fallback);
      setStage('BIMANUAL_DISPATCH');
      setIsProcessing(false);
    }
  };

  // Direct Selection for Supported Configurations (1, 2, 4, 6, 8, 10)
  const handleSelectGroupSize = (people: number) => {
    setIsPlaying(false);
    const plan = planTableLayout(people);
    setCurrentPlan(plan);
    setCompletedItems(plan.allItems.map(it => ({ ...it, status: 'verified' as const })));
    setItemQueueIndex(plan.allItems.length);
    setActiveItem(null);
    setTransitProgress(0);
    setStage('IDLE');
    speakVoice(`TwinHands-AI: Loaded ${plan.groupSize} place settings layout.`);
  };

  // Toggle Play / Pause Animation
  const handleTogglePlay = () => {
    if (!currentPlan || !currentPlan.isValid) return;
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      // If already at end or idle with full items, reset to animate from scratch
      if (itemQueueIndex >= currentPlan.allItems.length) {
        setCompletedItems([]);
        setItemQueueIndex(0);
        setActiveItem(null);
        setTransitProgress(0);
        setStage('MUJOCO_EXECUTION');
      }
      setIsPlaying(true);
    }
  };

  // Reset System State
  const handleResetSystem = () => {
    setIsPlaying(false);
    setActiveItem(null);
    setCompletedItems([]);
    setItemQueueIndex(0);
    setTransitProgress(0);
    setShowVerificationModal(false);
    setStage('IDLE');

    // Reset arm telemetry to home positions
    setLeftArm(createInitialArmTelemetry('left'));
    setRightArm(createInitialArmTelemetry('right'));

    if (currentPlan && currentPlan.isValid) {
      const refreshed = planTableLayout(currentPlan.groupSize);
      setCurrentPlan(refreshed);
    }
  };

  // Emergency Stop (E-STOP)
  const handleEmergencyStop = () => {
    setIsPlaying(false);
    setStage('IDLE');
    setLeftArm(prev => ({
      ...prev,
      status: 'E_STOPPED',
      currentActionDescription: 'EMERGENCY STOP ENGAGED',
    }));
    setRightArm(prev => ({
      ...prev,
      status: 'E_STOPPED',
      currentActionDescription: 'EMERGENCY STOP ENGAGED',
    }));
    speakVoice("Emergency stop engaged. Actuators frozen.");
  };

  // Step Forward Single Item
  const handleStepForward = () => {
    if (!currentPlan || !currentPlan.isValid) return;
    const items = currentPlan.allItems;
    if (itemQueueIndex < items.length) {
      const itemToComplete = { ...items[itemQueueIndex], status: 'verified' as const };
      setCompletedItems(prev => [...prev, itemToComplete]);
      setItemQueueIndex(prev => prev + 1);

      // Check if place setting is complete (5 items per setting)
      updatePlaceSettingStatus(itemToComplete.personId);
    }
  };

  // Helper to mark place setting verified when all 5 items placed
  const updatePlaceSettingStatus = (personId: number) => {
    if (!currentPlan) return;
    const totalForPerson = completedItems.filter(it => it.personId === personId).length + 1;
    if (totalForPerson >= 5) {
      setCurrentPlan(prev => {
        if (!prev) return prev;
        const updatedSettings = prev.placeSettings.map(ps => 
          ps.personId === personId ? { ...ps, status: 'verified' as const } : ps
        );
        return { ...prev, placeSettings: updatedSettings };
      });
    }
  };

  // Main Simulation Loop
  useEffect(() => {
    if (!isPlaying || !currentPlan || !currentPlan.isValid) return;

    const items = currentPlan.allItems;
    if (itemQueueIndex >= items.length) {
      // All items placed! Verification stage
      setIsPlaying(false);
      setActiveItem(null);
      setStage('VERIFICATION_PASSED');
      setShowVerificationModal(true);
      speakVoice(`Dinner table preparation verified. ${currentPlan.groupSize} place settings completed successfully.`);
      return;
    }

    const currentItem = items[itemQueueIndex];
    const isLeftArm = currentItem.assignedArm === 'left';
    const activeArmBase = isLeftArm ? LEFT_ARM_BASE : RIGHT_ARM_BASE;

    // Advance transit interpolation
    const stepIntervalMs = 30 / simSpeed;
    const interval = setInterval(() => {
      setTransitProgress(prev => {
        const next = prev + 0.05 * simSpeed;
        if (next >= 1.0) {
          // Placement complete for this item
          const placedItem: TablewareItem = {
            ...currentItem,
            status: 'verified',
            currentPos: currentItem.targetPos,
          };

          setCompletedItems(c => [...c, placedItem]);
          setItemQueueIndex(idx => idx + 1);
          updatePlaceSettingStatus(currentItem.personId);

          // Update arm status to returning/idle
          if (isLeftArm) {
            setLeftArm(arm => ({
              ...arm,
              status: 'IDLE',
              holdingItem: null,
              currentActionDescription: `Placed ${currentItem.label} at P${currentItem.personId}`,
              executedActionsCount: arm.executedActionsCount + 1,
              totalDistanceMovedM: arm.totalDistanceMovedM + 0.65,
            }));
          } else {
            setRightArm(arm => ({
              ...arm,
              status: 'IDLE',
              holdingItem: null,
              currentActionDescription: `Placed ${currentItem.label} at P${currentItem.personId}`,
              executedActionsCount: arm.executedActionsCount + 1,
              totalDistanceMovedM: arm.totalDistanceMovedM + 0.65,
            }));
          }

          return 0.0;
        }

        // Interpolate arm TCP position
        const currentPos = interpolateCartesianTrajectory(
          currentItem.sourcePos,
          currentItem.targetPos,
          next
        );

        setActiveItem({
          ...currentItem,
          currentPos,
        });

        const joints = computeSO101IK(activeArmBase, currentPos, isLeftArm);

        if (isLeftArm) {
          setLeftArm(arm => ({
            ...arm,
            status: 'MANIPULATING',
            eePose: {
              x: currentPos.x,
              y: currentPos.y,
              z: currentPos.z,
              roll: 0,
              pitch: -45,
              yaw: Math.round((Math.atan2(currentPos.y - activeArmBase.y, currentPos.x - activeArmBase.x) * 180) / Math.PI),
            },
            jointAnglesDeg: joints,
            gripperState: next > 0.1 && next < 0.9 ? 1.0 : 0.0,
            holdingItem: currentItem,
            currentActionDescription: `Transporting ${currentItem.label} to Setting P${currentItem.personId}`,
          }));
        } else {
          setRightArm(arm => ({
            ...arm,
            status: 'MANIPULATING',
            eePose: {
              x: currentPos.x,
              y: currentPos.y,
              z: currentPos.z,
              roll: 0,
              pitch: -45,
              yaw: Math.round((Math.atan2(currentPos.y - activeArmBase.y, currentPos.x - activeArmBase.x) * 180) / Math.PI),
            },
            jointAnglesDeg: joints,
            gripperState: next > 0.1 && next < 0.9 ? 1.0 : 0.0,
            holdingItem: currentItem,
            currentActionDescription: `Transporting ${currentItem.label} to Setting P${currentItem.personId}`,
          }));
        }

        return next;
      });
    }, stepIntervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, currentPlan, itemQueueIndex, simSpeed]);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Header */}
      <Header
        leftArm={leftArm}
        rightArm={rightArm}
        stage={stage}
        voiceEnabled={voiceEnabled}
        onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
        onEmergencyStop={handleEmergencyStop}
        onResetSystem={handleResetSystem}
        onOpenCreatorProfile={() => setShowCreatorModal(true)}
      />

      {/* Main Workspace Layout */}
      <main className={`flex-1 w-full mx-auto space-y-4 transition-all duration-300 ${
        workspaceMode === 'simulation'
          ? 'max-w-[1920px] px-2 sm:px-4 py-2'
          : 'max-w-7xl px-4 py-4 sm:px-6'
      }`}>
        
        {/* Workspace Mode Switcher */}
        <div className="bg-slate-900/90 p-1.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setWorkspaceMode('simulation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                workspaceMode === 'simulation'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>MuJoCo Simulation Workspace</span>
            </button>
            <button
              onClick={() => setWorkspaceMode('cad_digital_twin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                workspaceMode === 'cad_digital_twin'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>3D CAD & Digital Twin Inspector</span>
            </button>
            <button
              onClick={() => setWorkspaceMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                workspaceMode === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Split Studio View</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400 pr-2">
            <span className="text-red-400 font-semibold">SO-101 Spider-Man Edition</span>
            <span>•</span>
            <span className="text-cyan-400">MuJoCo Kinematics</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowCreatorModal(true)}
              aria-label="View Badal Kumar Sahu creator profile"
              className="text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              By <strong className="text-slate-300 hover:text-cyan-300 font-bold">Badal Kumar Sahu</strong>
            </button>
          </div>
        </div>

        {/* 3D CAD Reference & Digital Twin Asset Inspector */}
        {(workspaceMode === 'cad_digital_twin' || workspaceMode === 'all') && (
          <CADReferenceViewer />
        )}

        {/* Central Real-Time 3D Interactive Robotics Workspace */}
        {(workspaceMode === 'simulation' || workspaceMode === 'all') && (
          <div className="space-y-4">
            <ErrorBoundary fallbackTitle="3D Bimanual Workspace Simulation" onReset={handleResetSystem}>
              <Integrated3DWorkspace
                plan={currentPlan}
                stage={stage}
                isProcessing={isProcessing}
                leftArm={leftArm}
                rightArm={rightArm}
                activeItem={activeItem}
                completedItems={completedItems}
                isPlaying={isPlaying}
                simSpeed={simSpeed}
                openVinoBenchmark={openVinoBenchmark}
                onExecuteCommand={handleExecuteCommand}
                onTogglePlay={handleTogglePlay}
                onStepForward={handleStepForward}
                onReset={handleResetSystem}
                onChangeSpeed={(spd) => setSimSpeed(spd)}
                onEmergencyStop={handleEmergencyStop}
                onChangeQuantization={handleQuantizationChange}
                onSelectGroupSize={handleSelectGroupSize}
                voiceEnabled={voiceEnabled}
                onToggleVoice={() => setVoiceEnabled(!voiceEnabled)}
              />
            </ErrorBoundary>

            {/* Collapsible Secondary Telemetry & 9-Stage Timeline */}
            <div className="pt-2">
              <TaskPipelineTimeline
                currentStage={stage}
                groupSize={currentPlan?.isValid ? currentPlan.groupSize : 0}
                totalObjects={currentPlan?.isValid ? currentPlan.summary.totalObjects : 0}
                completedObjects={completedItems.length}
              />
            </div>
          </div>
        )}

        {/* Threat Model & Comprehensive Verification Walkthroughs */}
        <ThreatModelSection />


      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <div>
            TwinHands-AI Physical Robotics System • Dual SO-101 (🔴 Red + 🔵 Blue) • MuJoCo Physics • Intel OpenVINO Edge AI
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Autonomous Dining AI</span>
            <span className="text-slate-700">•</span>
            <button
              type="button"
              onClick={() => setShowCreatorModal(true)}
              aria-label="View Badal Kumar Sahu creator contact and profile"
              className="group inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer shadow-sm"
            >
              <span>By</span>
              <strong className="font-bold text-slate-200 group-hover:text-cyan-300 underline decoration-cyan-500/40 underline-offset-2">
                Badal Kumar Sahu
              </strong>
            </button>
          </div>
        </div>
      </footer>

      {/* Verification Acceptance Criteria Modal (AC-18, AC-19) */}
      {showVerificationModal && currentPlan && (
        <VerificationSummaryModal
          plan={currentPlan}
          onClose={() => setShowVerificationModal(false)}
          onReset={handleResetSystem}
        />
      )}

      {/* Interactive Creator Profile & Contact Modal */}
      <CreatorProfileModal
        isOpen={showCreatorModal}
        onClose={() => setShowCreatorModal(false)}
      />
    </div>
  );
}
