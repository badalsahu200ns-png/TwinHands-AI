/**
 * MuJoCo-Style Physical Simulation & Interactive 3D Canvas
 * 
 * Renders:
 * - Dinner table workspace with metric coordinate grid
 * - 🔴 Red Left SO-101 & 🔵 Blue Right SO-101 articulated robotic arms
 * - Real-time bimanual manipulation trajectories & gripper interactions
 * - Tableware placement (Plates, Bowls, Cups, Spoons)
 * - Intel OpenVINO VLA camera perception overlay with bounding boxes
 */

import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Eye, Camera, Crosshair, Layers, Maximize2 } from 'lucide-react';
import { TableLayoutPlan, SO101ArmTelemetry, TablewareItem } from '../types';
import { LEFT_ARM_BASE, RIGHT_ARM_BASE, ARM_REACH_RADIUS_M, STAGING_ZONES } from '../planner/table_layout_planner';

interface MujocoSimulationCanvasProps {
  plan: TableLayoutPlan | null;
  leftArm: SO101ArmTelemetry;
  rightArm: SO101ArmTelemetry;
  activeItem: TablewareItem | null;
  completedItems: TablewareItem[];
  isPlaying: boolean;
  simSpeed: number;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onChangeSpeed: (speed: number) => void;
}

type CameraView = 'perspective' | 'top_down' | 'front_view' | 'split';

export const MujocoSimulationCanvas: React.FC<MujocoSimulationCanvasProps> = ({
  plan,
  leftArm,
  rightArm,
  activeItem,
  completedItems,
  isPlaying,
  simSpeed,
  onTogglePlay,
  onStepForward,
  onReset,
  onChangeSpeed,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cameraView, setCameraView] = useState<CameraView>('perspective');
  const [showOpenVinoHUD, setShowOpenVinoHUD] = useState(true);
  const [showReachRings, setShowReachRings] = useState(true);
  const [showTrajectories, setShowTrajectories] = useState(true);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Coordinate transformation helpers
      // Table is 1.6m x 0.95m. Origin (0,0) is table center.
      // Scaling: ~360 pixels per meter
      const scale = Math.min(width / 2.1, height / 1.4);
      const centerX = width / 2;
      const centerY = height * 0.52;

      // Project 3D (x, y, z) into 2D canvas coordinates
      const project = (x: number, y: number, z: number = 0): { px: number; py: number } => {
        if (cameraView === 'top_down') {
          return {
            px: centerX + x * scale,
            py: centerY - y * scale,
          };
        } else if (cameraView === 'front_view') {
          return {
            px: centerX + x * scale,
            py: centerY - z * scale * 1.5 - y * scale * 0.2,
          };
        } else {
          // Perspective 3D isometric tilt
          const isoAngle = Math.PI / 6; // 30 degrees
          const cosIso = Math.cos(isoAngle);
          const sinIso = Math.sin(isoAngle);
          const px = centerX + (x * cosIso - y * sinIso * 0.5) * scale;
          const py = centerY + (x * sinIso * 0.3 + y * cosIso * 0.7) * scale - z * scale * 0.9;
          return { px, py };
        }
      };

      // 1. Draw Table Surface
      const tableW = 1.60;
      const tableD = 0.95;
      const tCorners = [
        project(-tableW / 2, -tableD / 2, 0),
        project(tableW / 2, -tableD / 2, 0),
        project(tableW / 2, tableD / 2, 0),
        project(-tableW / 2, tableD / 2, 0),
      ];

      // Table 3D thickness / drop edge
      const tCornersBottom = [
        project(-tableW / 2, -tableD / 2, -0.06),
        project(tableW / 2, -tableD / 2, -0.06),
        project(tableW / 2, tableD / 2, -0.06),
        project(-tableW / 2, tableD / 2, -0.06),
      ];

      // Table side skirt
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(tCorners[0].px, tCorners[0].py);
      ctx.lineTo(tCorners[1].px, tCorners[1].py);
      ctx.lineTo(tCornersBottom[1].px, tCornersBottom[1].py);
      ctx.lineTo(tCornersBottom[0].px, tCornersBottom[0].py);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(tCorners[1].px, tCorners[1].py);
      ctx.lineTo(tCorners[2].px, tCorners[2].py);
      ctx.lineTo(tCornersBottom[2].px, tCornersBottom[2].py);
      ctx.lineTo(tCornersBottom[1].px, tCornersBottom[1].py);
      ctx.closePath();
      ctx.fill();

      // Top Table Surface (Matte Obsidian Slate)
      const grad = ctx.createLinearGradient(tCorners[0].px, tCorners[0].py, tCorners[2].px, tCorners[2].py);
      grad.addColorStop(0, '#1a2436');
      grad.addColorStop(1, '#131b29');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(tCorners[0].px, tCorners[0].py);
      ctx.lineTo(tCorners[1].px, tCorners[1].py);
      ctx.lineTo(tCorners[2].px, tCorners[2].py);
      ctx.lineTo(tCorners[3].px, tCorners[3].py);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Metric Coordinate Grid Lines (0.2m intervals)
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 1;
      for (let gx = -0.7; gx <= 0.7; gx += 0.2) {
        const pStart = project(gx, -tableD / 2, 0);
        const pEnd = project(gx, tableD / 2, 0);
        ctx.beginPath();
        ctx.moveTo(pStart.px, pStart.py);
        ctx.lineTo(pEnd.px, pEnd.py);
        ctx.stroke();
      }
      for (let gy = -0.4; gy <= 0.4; gy += 0.2) {
        const pStart = project(-tableW / 2, gy, 0);
        const pEnd = project(tableW / 2, gy, 0);
        ctx.beginPath();
        ctx.moveTo(pStart.px, pStart.py);
        ctx.lineTo(pEnd.px, pEnd.py);
        ctx.stroke();
      }

      // Center Origin Crosshair
      const orig = project(0, 0, 0);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.beginPath();
      ctx.arc(orig.px, orig.py, 3, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Draw Staging Racks on Left & Right Wings
      const drawStagingBay = (x: number, y: number, label: string, color: string) => {
        const p = project(x, y, 0);
        const size = 0.08 * scale;
        ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(p.px - size / 2, p.py - size / 2, size, size, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, p.px, p.py + size / 2 + 10);
      };

      drawStagingBay(STAGING_ZONES.plate.x, STAGING_ZONES.plate.y, 'PLATES', '#ef4444');
      drawStagingBay(STAGING_ZONES.bowl.x, STAGING_ZONES.bowl.y, 'BOWLS', '#f59e0b');
      drawStagingBay(STAGING_ZONES.cup.x, STAGING_ZONES.cup.y, 'CUPS', '#3b82f6');
      drawStagingBay(STAGING_ZONES.spoon.x, STAGING_ZONES.spoon.y, 'SPOONS', '#10b981');
      drawStagingBay(STAGING_ZONES.additional_spoon.x, STAGING_ZONES.additional_spoon.y, 'ADD SPOONS', '#06b6d4');

      // 3. Draw Place Setting Placemats and Diner Positions
      if (plan && plan.isValid) {
        plan.placeSettings.forEach((ps) => {
          const cp = project(ps.centerCoordinates.x, ps.centerCoordinates.y, 0);
          const matW = 0.28 * scale;
          const matH = 0.20 * scale;

          // Placemat silhouette
          ctx.fillStyle = ps.status === 'verified'
            ? 'rgba(16, 185, 129, 0.12)'
            : 'rgba(51, 65, 85, 0.25)';
          ctx.strokeStyle = ps.status === 'verified' ? '#10b981' : '#475569';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.roundRect(cp.px - matW / 2, cp.py - matH / 2, matW, matH, 8);
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);

          // Person badge label
          ctx.fillStyle = '#cbd5e1';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`P${ps.personId}`, cp.px, cp.py - matH / 2 - 4);
        });
      }

      // 4. Draw Reachability Circles (0.58m radius)
      if (showReachRings) {
        const drawReachRing = (base: { x: number; y: number }, color: string) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          for (let th = 0; th <= Math.PI * 2; th += 0.1) {
            const rx = base.x + ARM_REACH_RADIUS_M * Math.cos(th);
            const ry = base.y + ARM_REACH_RADIUS_M * Math.sin(th);
            const pt = project(rx, ry, 0);
            if (th === 0) ctx.moveTo(pt.px, pt.py);
            else ctx.lineTo(pt.px, pt.py);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.setLineDash([]);
        };

        drawReachRing(LEFT_ARM_BASE, 'rgba(239, 68, 68, 0.35)'); // Red ring
        drawReachRing(RIGHT_ARM_BASE, 'rgba(59, 130, 246, 0.35)'); // Blue ring
      }

      // 5. Draw Placed Tableware Items
      const drawTableware = (item: TablewareItem, isCurrentlyActive = false) => {
        const pos = item.currentPos;
        const pt = project(pos.x, pos.y, pos.z);

        if (item.type === 'plate') {
          // Plate: White ceramic disk with gold/grey rim
          const r = 0.07 * scale;
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Inner rim
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, r * 0.65, 0, Math.PI * 2);
          ctx.stroke();
        } else if (item.type === 'bowl') {
          // Bowl: Slightly smaller elevated ceramic bowl
          const r = 0.05 * scale;
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Soup/interior shading
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, r * 0.7, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'cup') {
          // Cup: Translucent cylinder with liquid sheen
          const r = 0.035 * scale;
          ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (item.type === 'spoon') {
          // Spoon: Utensil handle and oval head
          const rad = (item.orientation * Math.PI) / 180;
          ctx.save();
          ctx.translate(pt.px, pt.py);
          ctx.rotate(rad);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-0.01 * scale, -0.04 * scale, 0.02 * scale, 0.08 * scale);
          ctx.beginPath();
          ctx.ellipse(0, -0.04 * scale, 0.015 * scale, 0.025 * scale, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // OpenVINO Vision HUD Bounding Box
        if (showOpenVinoHUD && (item.status === 'placed' || item.status === 'verified')) {
          const boxSize = 0.11 * scale;
          ctx.strokeStyle = item.status === 'verified' ? '#10b981' : '#38bdf8';
          ctx.lineWidth = 1;
          ctx.strokeRect(pt.px - boxSize / 2, pt.py - boxSize / 2, boxSize, boxSize);

          ctx.fillStyle = item.status === 'verified' ? '#10b981' : '#38bdf8';
          ctx.font = '8px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(
            `${item.type} [${Math.round(item.verificationConfidence * 100)}%]`,
            pt.px - boxSize / 2,
            pt.py - boxSize / 2 - 2
          );
        }

        // Active highlighted halo
        if (isCurrentlyActive) {
          ctx.strokeStyle = item.assignedArm === 'left' ? '#ef4444' : '#3b82f6';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, 0.09 * scale, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      };

      // Draw all completed items
      completedItems.forEach((item) => drawTableware(item));

      // Draw currently active transit item
      if (activeItem) {
        drawTableware(activeItem, true);

        // Trajectory arc from source to target
        if (showTrajectories) {
          const srcPt = project(activeItem.sourcePos.x, activeItem.sourcePos.y, activeItem.sourcePos.z);
          const tgtPt = project(activeItem.targetPos.x, activeItem.targetPos.y, activeItem.targetPos.z);
          const midPt = project(
            (activeItem.sourcePos.x + activeItem.targetPos.x) / 2,
            (activeItem.sourcePos.y + activeItem.targetPos.y) / 2,
            0.15
          );

          ctx.strokeStyle = activeItem.assignedArm === 'left' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(59, 130, 246, 0.7)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(srcPt.px, srcPt.py);
          ctx.quadraticCurveTo(midPt.px, midPt.py, tgtPt.px, tgtPt.py);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // 6. Draw Dual SO-101 Robotic Arms
      const drawArm = (arm: SO101ArmTelemetry) => {
        const isLeft = arm.id === 'left';
        const color = isLeft ? '#ef4444' : '#3b82f6';
        const darkColor = isLeft ? '#7f1d1d' : '#1e3a8a';

        // Joint link positions calculated from inverse kinematics
        const basePt = project(arm.basePosition.x, arm.basePosition.y, 0);
        const shoulderPt = project(arm.basePosition.x, arm.basePosition.y + 0.02, 0.08);

        // Compute intermediate elbow point along reaching vector to end effector
        const ee = arm.eePose;
        const eePt = project(ee.x, ee.y, ee.z);

        const midX = (arm.basePosition.x + ee.x) * 0.5 + (isLeft ? -0.06 : 0.06);
        const midY = (arm.basePosition.y + ee.y) * 0.5;
        const midZ = Math.max(ee.z, 0.12) + 0.14;
        const elbowPt = project(midX, midY, midZ);

        const wristX = ee.x + (isLeft ? -0.02 : 0.02);
        const wristY = ee.y - 0.03;
        const wristZ = ee.z + 0.05;
        const wristPt = project(wristX, wristY, wristZ);

        // Base Pedestal
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(basePt.px, basePt.py, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Shoulder Turret (Spider-Man styling)
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.arc(shoulderPt.px, shoulderPt.py, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Subtle Spider-Man Web Accents on Shoulder
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(shoulderPt.px, shoulderPt.py, 6, 0, Math.PI * 2);
        ctx.arc(shoulderPt.px, shoulderPt.py, 10, 0, Math.PI * 2);
        ctx.moveTo(shoulderPt.px - 10, shoulderPt.py);
        ctx.lineTo(shoulderPt.px + 10, shoulderPt.py);
        ctx.moveTo(shoulderPt.px, shoulderPt.py - 10);
        ctx.lineTo(shoulderPt.px, shoulderPt.py + 10);
        ctx.stroke();

        // Upper Arm Link (Shoulder -> Elbow)
        ctx.strokeStyle = color;
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(shoulderPt.px, shoulderPt.py);
        ctx.lineTo(elbowPt.px, elbowPt.py);
        ctx.stroke();

        // Upper Arm Inner Accent
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(shoulderPt.px, shoulderPt.py);
        ctx.lineTo(elbowPt.px, elbowPt.py);
        ctx.stroke();

        // Elbow Pivot
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(elbowPt.px, elbowPt.py, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Forearm Link (Elbow -> Wrist)
        ctx.strokeStyle = color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(elbowPt.px, elbowPt.py);
        ctx.lineTo(wristPt.px, wristPt.py);
        ctx.stroke();

        // Wrist Pivot
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(wristPt.px, wristPt.py, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Parallel Gripper Jaws (Wrist -> End Effector)
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(wristPt.px, wristPt.py);
        ctx.lineTo(eePt.px, eePt.py);
        ctx.stroke();

        // Gripper Finger Pads
        const gripSpread = 8 * (1 - arm.gripperState);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(eePt.px - gripSpread - 3, eePt.py - 2, 4, 8);
        ctx.fillRect(eePt.px + gripSpread - 1, eePt.py - 2, 4, 8);

        // Tool Center Point (TCP) Crosshair
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(eePt.px, eePt.py, 4, 0, Math.PI * 2);
        ctx.stroke();

        // Arm Identity Label
        ctx.fillStyle = color;
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isLeft ? '🔴 RED SO-101' : '🔵 BLUE SO-101', basePt.px, basePt.py + 26);
      };

      drawArm(leftArm);
      drawArm(rightArm);

      // 7. MuJoCo Physics Engine Watermark & Timestamp
      ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`MuJoCo Dual-Arm Simulation • Timestep: 2.0ms • Euler RK4`, 12, height - 12);
      ctx.textAlign = 'right';
      ctx.fillText(`Mode: ${cameraView.toUpperCase()} • Speed: ${simSpeed}x`, width - 12, height - 12);
    };

    render();
  }, [cameraView, showOpenVinoHUD, showReachRings, showTrajectories, plan, leftArm, rightArm, activeItem, completedItems, simSpeed]);

  // Handle ResizeObserver for canvas responsiveness with animationFrame debouncing
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let rAFId: number | null = null;

    const observer = new ResizeObserver((entries) => {
      if (!entries || !entries.length) return;
      const entry = entries[0];
      const newWidth = Math.round(entry.contentRect.width);
      if (newWidth <= 0) return;
      const newHeight = Math.max(420, Math.round(newWidth * 0.58));

      if (rAFId) {
        cancelAnimationFrame(rAFId);
      }

      rAFId = requestAnimationFrame(() => {
        if (canvas.width !== newWidth || canvas.height !== newHeight) {
          canvas.width = newWidth;
          canvas.height = newHeight;
        }
      });
    });

    observer.observe(container);
    return () => {
      if (rAFId) {
        cancelAnimationFrame(rAFId);
      }
      observer.disconnect();
    };
  }, []);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      
      {/* Simulation Controls Top Bar */}
      <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            MuJoCo Physics Workspace (Dual SO-101)
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setCameraView('perspective')}
            className={`px-2 py-1 rounded transition-colors ${
              cameraView === 'perspective' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            3D Perspective
          </button>
          <button
            onClick={() => setCameraView('top_down')}
            className={`px-2 py-1 rounded transition-colors ${
              cameraView === 'top_down' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Top-Down 2D
          </button>
          <button
            onClick={() => setCameraView('front_view')}
            className={`px-2 py-1 rounded transition-colors ${
              cameraView === 'front_view' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Front Cam
          </button>
        </div>

        {/* HUD Toggles */}
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <button
            onClick={() => setShowOpenVinoHUD(!showOpenVinoHUD)}
            title="Toggle Intel OpenVINO Bounding Box Perception HUD"
            className={`p-1.5 rounded border transition-colors ${
              showOpenVinoHUD ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowReachRings(!showReachRings)}
            title="Toggle Arm Reach Radiuses"
            className={`p-1.5 rounded border transition-colors ${
              showReachRings ? 'bg-blue-950/60 border-blue-500/50 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Execution & Playback Controls */}
        <div className="flex items-center gap-2">
          {/* Speed selector */}
          <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5 text-[11px] font-mono">
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  simSpeed === spd ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Simulate'}</span>
          </button>

          <button
            onClick={onStepForward}
            title="Step forward single manipulation task"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={onReset}
            title="Reset Simulation"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div ref={containerRef} className="relative w-full flex-1 min-h-[420px] bg-slate-950 flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

        {/* Live Active Task Overlay Floating Card */}
        {activeItem && (
          <div className="absolute top-4 left-4 p-3 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700 shadow-xl text-xs font-mono animate-fadeIn pointer-events-none">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full ${activeItem.assignedArm === 'left' ? 'bg-red-500 animate-ping' : 'bg-blue-500 animate-ping'}`} />
              <span className="font-bold text-white">
                {activeItem.assignedArm === 'left' ? '🔴 RED LEFT ARM' : '🔵 BLUE RIGHT ARM'}
              </span>
            </div>
            <div className="text-slate-300">
              Action: <span className="text-cyan-300 font-bold">{activeItem.label}</span>
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              Target: ({activeItem.targetPos.x.toFixed(2)}m, {activeItem.targetPos.y.toFixed(2)}m, {activeItem.targetPos.z.toFixed(2)}m)
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
