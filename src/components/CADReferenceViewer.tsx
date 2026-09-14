/**
 * TwinHands-AI: 3D CAD Reference & Digital Twin Asset Inspector
 * Renders high-precision industrial CAD orthographic and perspective views:
 * - 🔴 SO-101 Left Arm (Spider-Man Edition: deep red, dark navy, black web pattern, spider emblem)
 * - 🔵 SO-101 Right Arm (Spider-Man Mirror)
 * - 🤖 Coordinated Bimanual Workspace
 * - 🍽️ Demonstration Table & Digital Twin Tableware Assets
 */

import React, { useRef, useEffect, useState } from 'react';
import { 
  Box, Eye, Layers, Compass, Sliders, Copy, Check, 
  Rotate3d, Download, Maximize2, Shield, Info, Sparkles 
} from 'lucide-react';
import { DigitalTwinAsset } from '../types';
import { CAD_DIGITAL_TWIN_ASSETS, generateMuJoCoXML } from '../data/cad_assets';

type ViewAngle = 'perspective' | 'front' | 'side' | 'top' | 'rear';
type RenderShader = 'shaded' | 'wireframe' | 'kinematics';

export const CADReferenceViewer: React.FC = () => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('so101_left');
  const [viewAngle, setViewAngle] = useState<ViewAngle>('perspective');
  const [renderShader, setRenderShader] = useState<RenderShader>('shaded');
  const [copiedXML, setCopiedXML] = useState(false);
  const [showDimensions, setShowDimensions] = useState(true);
  const [activeTab, setActiveTab] = useState<'cad_view' | 'photo_render' | 'specs' | 'mujoco_xml'>('cad_view');

  // Interactive Joint Articulation Sliders (for arm assets)
  const [joints, setJoints] = useState({
    q1: 15, // Base yaw
    q2: 30, // Shoulder pitch
    q3: -45, // Elbow pitch
    q4: 15, // Wrist pitch
    q5: -10, // Wrist roll
    q6: 25, // Gripper stroke (mm)
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentAsset = CAD_DIGITAL_TWIN_ASSETS.find(a => a.id === selectedAssetId) || CAD_DIGITAL_TWIN_ASSETS[0];

  const handleCopyXML = () => {
    const xml = generateMuJoCoXML(selectedAssetId);
    navigator.clipboard.writeText(xml);
    setCopiedXML(true);
    setTimeout(() => setCopiedXML(false), 2000);
  };

  // Canvas Drawing Routine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2 + 30;

    // Background
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // Grid Floor
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = -200; x <= 200; x += 40) {
      ctx.beginPath();
      ctx.moveTo(cx + x, cy + 120);
      ctx.lineTo(cx + x * 1.5, height);
      ctx.stroke();
    }
    for (let y = cy + 120; y <= height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Coordinate Projector based on viewAngle
    const project = (x: number, y: number, z: number): { px: number; py: number } => {
      const scale = 0.85;
      if (viewAngle === 'front') {
        return { px: cx + x * scale, py: cy - z * scale };
      } else if (viewAngle === 'side') {
        return { px: cx + y * scale, py: cy - z * scale };
      } else if (viewAngle === 'top') {
        return { px: cx + x * scale, py: cy + y * scale };
      } else if (viewAngle === 'rear') {
        return { px: cx - x * scale, py: cy - z * scale };
      } else {
        // 3/4 Front Isometric Perspective
        const isoX = (x - y * 0.7) * 0.866 * scale;
        const isoY = ((x + y * 0.7) * 0.5 - z) * scale;
        return { px: cx + isoX, py: cy + isoY };
      }
    };

    // ==========================================
    // RENDER LOGIC FOR ASSETS
    // ==========================================

    if (currentAsset.category === 'robot_arm') {
      const isLeft = currentAsset.id === 'so101_left';
      const redColor = '#B91C1C';
      const navyColor = '#0F172A';
      const jointRing = '#334155';
      const isWire = renderShader === 'wireframe';
      const isKin = renderShader === 'kinematics';

      // Base Plate (120x120mm)
      const bW = 60;
      const bD = 60;
      const bH = 20;

      const drawBox = (x: number, y: number, z: number, w: number, d: number, h: number, fill: string, stroke = '#1e293b') => {
        const c1 = project(x - w / 2, y - d / 2, z);
        const c2 = project(x + w / 2, y - d / 2, z);
        const c3 = project(x + w / 2, y + d / 2, z);
        const c4 = project(x - w / 2, y + d / 2, z);

        const t1 = project(x - w / 2, y - d / 2, z + h);
        const t2 = project(x + w / 2, y - d / 2, z + h);
        const t3 = project(x + w / 2, y + d / 2, z + h);
        const t4 = project(x - w / 2, y + d / 2, z + h);

        if (!isWire) {
          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.moveTo(t1.px, t1.py);
          ctx.lineTo(t2.px, t2.py);
          ctx.lineTo(t3.px, t3.py);
          ctx.lineTo(t4.px, t4.py);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#0a0f1d';
          ctx.beginPath();
          ctx.moveTo(c1.px, c1.py);
          ctx.lineTo(c2.px, c2.py);
          ctx.lineTo(t2.px, t2.py);
          ctx.lineTo(t1.px, t1.py);
          ctx.closePath();
          ctx.fill();
        }

        ctx.strokeStyle = isWire ? '#38bdf8' : stroke;
        ctx.lineWidth = isWire ? 1.5 : 2;
        ctx.stroke();
      };

      // 1. Base pedestal
      drawBox(0, 0, 0, bW, bD, bH, navyColor, '#334155');

      // 2. Shoulder Turret (Joint 1 + 2)
      const turretZ = 45;
      const turretP = project(0, 0, turretZ);

      // Spider-Man Red Shoulder Turret
      ctx.fillStyle = redColor;
      ctx.beginPath();
      ctx.arc(turretP.px, turretP.py, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Spider-Man Web Detailing on Shoulder
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      // Concentric web rings
      ctx.arc(turretP.px, turretP.py, 12, 0, Math.PI * 2);
      ctx.arc(turretP.px, turretP.py, 22, 0, Math.PI * 2);
      // Radial spokes
      for (let th = 0; th < Math.PI * 2; th += Math.PI / 4) {
        ctx.moveTo(turretP.px, turretP.py);
        ctx.lineTo(turretP.px + Math.cos(th) * 28, turretP.py + Math.sin(th) * 28);
      }
      ctx.stroke();

      // Stylized Spider Emblem in Center
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(turretP.px, turretP.py, 4, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Spider legs
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(turretP.px - 3, turretP.py - 2);
      ctx.lineTo(turretP.px - 8, turretP.py - 6);
      ctx.moveTo(turretP.px + 3, turretP.py - 2);
      ctx.lineTo(turretP.px + 8, turretP.py - 6);
      ctx.moveTo(turretP.px - 3, turretP.py + 2);
      ctx.lineTo(turretP.px - 8, turretP.py + 6);
      ctx.moveTo(turretP.px + 3, turretP.py + 2);
      ctx.lineTo(turretP.px + 8, turretP.py + 6);
      ctx.stroke();

      // 3. Upper Arm Link (220mm)
      const q2Rad = ((joints.q2 - 90) * Math.PI) / 180;
      const upperLen = 140;
      const elbowX = Math.cos(q2Rad) * upperLen * (isLeft ? -1 : 1);
      const elbowZ = turretZ + Math.sin(-q2Rad) * upperLen;
      const elbowP = project(elbowX, 0, elbowZ);

      // Upper arm link body (Red with Dark Navy accents)
      ctx.strokeStyle = redColor;
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(turretP.px, turretP.py);
      ctx.lineTo(elbowP.px, elbowP.py);
      ctx.stroke();

      // Navy inlay
      ctx.strokeStyle = navyColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(turretP.px, turretP.py);
      ctx.lineTo(elbowP.px, elbowP.py);
      ctx.stroke();

      // 4. Elbow Joint (Joint 3)
      ctx.fillStyle = jointRing;
      ctx.beginPath();
      ctx.arc(elbowP.px, elbowP.py, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 5. Forearm Link (200mm)
      const q3Rad = q2Rad + (joints.q3 * Math.PI) / 180;
      const foreLen = 120;
      const wristX = elbowX + Math.cos(q3Rad) * foreLen * (isLeft ? -1 : 1);
      const wristZ = elbowZ + Math.sin(-q3Rad) * foreLen;
      const wristP = project(wristX, 0, wristZ);

      ctx.strokeStyle = navyColor;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(elbowP.px, elbowP.py);
      ctx.lineTo(wristP.px, wristP.py);
      ctx.stroke();

      // Red web accent cover
      ctx.strokeStyle = redColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(elbowP.px, elbowP.py);
      ctx.lineTo(wristP.px, wristP.py);
      ctx.stroke();

      // 6. Wrist Assembly (Joint 4 & 5)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(wristP.px, wristP.py, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 7. Parallel Two-Finger Gripper
      const gripAngle = q3Rad + (joints.q4 * Math.PI) / 180;
      const gripLen = 45;
      const tcpX = wristX + Math.cos(gripAngle) * gripLen * (isLeft ? -1 : 1);
      const tcpZ = wristZ + Math.sin(-gripAngle) * gripLen;
      const tcpP = project(tcpX, 0, tcpZ);

      // Gripper crossbar
      ctx.strokeStyle = redColor;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(wristP.px, wristP.py);
      ctx.lineTo(tcpP.px, tcpP.py);
      ctx.stroke();

      // Two Opposing Parallel Fingers (40-60mm)
      const fingerSpread = joints.q6 * 0.45;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;

      // Finger 1
      ctx.fillRect(tcpP.px - fingerSpread - 5, tcpP.py, 6, 25);
      ctx.strokeRect(tcpP.px - fingerSpread - 5, tcpP.py, 6, 25);
      // Rubber textured contact pad
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(tcpP.px - fingerSpread + 1, tcpP.py + 4, 2, 18);

      // Finger 2
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(tcpP.px + fingerSpread, tcpP.py, 6, 25);
      ctx.strokeRect(tcpP.px + fingerSpread, tcpP.py, 6, 25);
      // Rubber contact pad
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(tcpP.px + fingerSpread - 2, tcpP.py + 4, 2, 18);

      // Measurement Overlays
      if (showDimensions) {
        ctx.strokeStyle = '#38bdf8';
        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px monospace';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);

        // Overall height dimension line
        const topH = Math.max(turretP.py, elbowP.py, tcpP.py) - 30;
        ctx.beginPath();
        ctx.moveTo(cx + 140, cy + 20);
        ctx.lineTo(cx + 140, topH);
        ctx.stroke();
        ctx.fillText('H: 400–450 mm', cx + 148, (cy + topH) / 2);

        // Base width dimension
        ctx.beginPath();
        ctx.moveTo(cx - bW, cy + 30);
        ctx.lineTo(cx + bW, cy + 30);
        ctx.stroke();
        ctx.fillText('Base: 120 × 120 mm', cx - 45, cy + 45);

        // Gripper width
        ctx.beginPath();
        ctx.moveTo(tcpP.px - fingerSpread - 10, tcpP.py - 10);
        ctx.lineTo(tcpP.px + fingerSpread + 10, tcpP.py - 10);
        ctx.stroke();
        ctx.fillText('Gripper: 70–90 mm', tcpP.px - 40, tcpP.py - 16);

        ctx.setLineDash([]);
      }

    } else if (currentAsset.id === 'demonstration_table') {
      // 1200x800x750 mm Table
      const tW = 240;
      const tD = 160;
      const tH = 150;

      const p1 = project(-tW / 2, -tD / 2, 0);
      const p2 = project(tW / 2, -tD / 2, 0);
      const p3 = project(tW / 2, tD / 2, 0);
      const p4 = project(-tW / 2, tD / 2, 0);

      // Matte dark-gray tabletop
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.lineTo(p3.px, p3.py);
      ctx.lineTo(p4.px, p4.py);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Steel legs
      const drawLeg = (lx: number, ly: number) => {
        const topL = project(lx, ly, 0);
        const botL = project(lx, ly, -tH);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(topL.px, topL.py);
        ctx.lineTo(botL.px, botL.py);
        ctx.stroke();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();
      };

      drawLeg(-tW / 2 + 15, -tD / 2 + 15);
      drawLeg(tW / 2 - 15, -tD / 2 + 15);
      drawLeg(tW / 2 - 15, tD / 2 - 15);
      drawLeg(-tW / 2 + 15, tD / 2 - 15);

      if (showDimensions) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px monospace';
        ctx.fillText('Width: 1200 mm', cx - 35, p1.py - 10);
        ctx.fillText('Depth: 800 mm', p2.px + 10, (p2.py + p3.py) / 2);
        ctx.fillText('Height: 750 mm', cx + tW / 2 + 20, cy + 40);
      }

    } else if (currentAsset.id === 'dinner_plate') {
      // 260mm Ceramic Plate
      const pCenter = project(0, 0, 0);
      const rOuter = 100;
      const rInner = 68;

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(pCenter.px, pCenter.py, rOuter, rOuter * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Eating well
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.ellipse(pCenter.px, pCenter.py + 4, rInner, rInner * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (showDimensions) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px monospace';
        ctx.fillText('Diameter: 260 mm • Height: 24 mm • Rim: 28 mm', cx - 120, pCenter.py + 65);
      }

    } else if (currentAsset.id === 'dinner_bowl') {
      // 165mm Ceramic Bowl
      const pCenter = project(0, 0, 0);
      const r = 70;

      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.ellipse(pCenter.px, pCenter.py, r, r * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Hollow interior cavity
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.ellipse(pCenter.px, pCenter.py, r * 0.8, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (showDimensions) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px monospace';
        ctx.fillText('Diameter: 165 mm • Height: 68 mm • Wall: 3.8 mm', cx - 110, pCenter.py + 65);
      }

    } else if (currentAsset.id === 'ceramic_cup' || currentAsset.id === 'drinking_glass') {
      // Cylindrical Cup / Glass with 90% Water Level
      const isGlass = currentAsset.id === 'drinking_glass';
      const pCenter = project(0, 0, 0);
      const r = 40;
      const h = 90;

      // Outer Vessel Body
      ctx.fillStyle = isGlass ? 'rgba(224, 242, 254, 0.45)' : '#f8fafc';
      ctx.fillRect(pCenter.px - r, pCenter.py - h, r * 2, h);
      ctx.strokeStyle = isGlass ? '#38bdf8' : '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(pCenter.px - r, pCenter.py - h, r * 2, h);

      // Realistic 90% Water Level (10% Empty Headspace below rim)
      const waterH = h * 0.90; // 81px
      const waterY = pCenter.py - waterH;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.fillRect(pCenter.px - r + 3, waterY, (r - 3) * 2, waterH - 4);

      // Water Surface Meniscus Line
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(pCenter.px, waterY, r - 3, 6, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Top rim
      ctx.beginPath();
      ctx.ellipse(pCenter.px, pCenter.py - h, r, 12, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Bottom foot
      ctx.beginPath();
      ctx.ellipse(pCenter.px, pCenter.py, r, 12, 0, 0, Math.PI * 2);
      ctx.stroke();

      if (showDimensions) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px monospace';
        ctx.fillText(
          isGlass 
            ? 'Height: 130 mm • Dia: 72 mm • 90% Water Level (10% Empty Space)' 
            : 'Height: 110 mm • Dia: 80 mm • 90% Water Level', 
          cx - 130, 
          pCenter.py + 35
        );
      }

    } else if (currentAsset.id === 'dining_spoon') {
      // 192mm Stainless Steel Spoon
      const pCenter = project(0, 0, 0);
      
      // Handle
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(pCenter.px - 8, pCenter.py - 80, 16, 120);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(pCenter.px - 8, pCenter.py - 80, 16, 120);

      // Oval Spoon Bowl
      ctx.beginPath();
      ctx.ellipse(pCenter.px, pCenter.py - 100, 24, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (showDimensions) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px monospace';
        ctx.fillText('Length: 192 mm • Bowl: 58 × 42 mm • Stainless Steel 304', cx - 130, pCenter.py + 65);
      }

    } else if (currentAsset.id === 'water_jug') {
      // Spider-Man Inspired Water Jug with 90% Water Level
      const pCenter = project(0, 0, 0);
      const r = 55;
      const h = 130;

      // Dark Royal Blue Pedestal Base
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(pCenter.px - r - 4, pCenter.py - 12, (r + 4) * 2, 12);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(pCenter.px - r - 4, pCenter.py - 12, (r + 4) * 2, 12);

      // Deep Spider-Man Red Body
      const redGrad = ctx.createLinearGradient(pCenter.px - r, 0, pCenter.px + r, 0);
      redGrad.addColorStop(0, '#991b1b');
      redGrad.addColorStop(0.5, '#c8102e');
      redGrad.addColorStop(1, '#991b1b');
      ctx.fillStyle = redGrad;
      ctx.fillRect(pCenter.px - r, pCenter.py - h + 18, r * 2, h - 30);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.strokeRect(pCenter.px - r, pCenter.py - h + 18, r * 2, h - 30);

      // Integrated Black Spider-Web Pattern
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.lineWidth = 1.2;
      // Web spokes
      for (let angle = -0.6; angle <= 0.6; angle += 0.3) {
        ctx.beginPath();
        ctx.moveTo(pCenter.px, pCenter.py - h / 2);
        ctx.lineTo(pCenter.px + Math.sin(angle) * (r + 10), pCenter.py - h / 2 + Math.cos(angle) * 45);
        ctx.stroke();
      }
      // Concentric web scallops
      [14, 28, 42].forEach(rw => {
        ctx.beginPath();
        ctx.arc(pCenter.px, pCenter.py - h / 2, rw, 0.2, Math.PI - 0.2);
        ctx.stroke();
      });

      // Stylized Silver / Chrome Spider Insignia
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(pCenter.px, pCenter.py - h / 2 - 10);
      ctx.lineTo(pCenter.px + 5, pCenter.py - h / 2);
      ctx.lineTo(pCenter.px, pCenter.py - h / 2 + 10);
      ctx.lineTo(pCenter.px - 5, pCenter.py - h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      // Transparent Viewing Level Window showing 90% Water
      const waterH = (h - 30) * 0.90;
      const waterY = pCenter.py - 12 - waterH;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.fillRect(pCenter.px - 6, waterY, 12, waterH);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(pCenter.px - 6, pCenter.py - h + 22, 12, h - 38);

      // Dark Royal Blue Neck Collar
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(pCenter.px - r * 0.8, pCenter.py - h, r * 1.6, 18);
      ctx.strokeStyle = '#0f172a';
      ctx.strokeRect(pCenter.px - r * 0.8, pCenter.py - h, r * 1.6, 18);

      // Ergonomic Royal Blue D-shaped Handle with Matte Black Inner Grip
      ctx.lineWidth = 9;
      ctx.strokeStyle = '#1d4ed8';
      ctx.beginPath();
      ctx.arc(pCenter.px + r + 15, pCenter.py - h / 2, 28, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      // Matte Black Inner Grip
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(pCenter.px + r + 13, pCenter.py - h / 2, 25, -Math.PI / 2.2, Math.PI / 2.2);
      ctx.stroke();

      // Pouring Spout with Black Tip
      ctx.beginPath();
      ctx.moveTo(pCenter.px - r * 0.8, pCenter.py - h);
      ctx.lineTo(pCenter.px - r * 0.8 - 14, pCenter.py - h - 10);
      ctx.lineTo(pCenter.px - r * 0.8 + 8, pCenter.py - h);
      ctx.fillStyle = '#1d4ed8';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      if (showDimensions) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px monospace';
        ctx.fillText('Height: 255 mm • Spider-Man Red/Blue/Web Pitcher • 90% Water Level', cx - 170, pCenter.py + 40);
      }

    } else if (currentAsset.id === 'manipulation_cube') {
      // 30mm Benchmark Cube
      const pCenter = project(0, 0, 0);
      const size = 70;

      ctx.fillStyle = '#f59e0b'; // Safety Amber
      ctx.fillRect(pCenter.px - size / 2, pCenter.py - size / 2, size, size);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.strokeRect(pCenter.px - size / 2, pCenter.py - size / 2, size, size);

      // Micro-texture friction ridges
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1;
      for (let i = -size / 2 + 10; i < size / 2; i += 12) {
        ctx.beginPath();
        ctx.moveTo(pCenter.px + i, pCenter.py - size / 2);
        ctx.lineTo(pCenter.px + i, pCenter.py + size / 2);
        ctx.stroke();
      }

      if (showDimensions) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px monospace';
        ctx.fillText('30.0 × 30.0 × 30.0 mm • High-Friction Polyurethane (Shore 75D)', cx - 150, pCenter.py + 65);
      }
    }

    // Viewport HUD Watermark
    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.font = '10px monospace';
    ctx.fillText(`Asset: ${currentAsset.id.toUpperCase()} • View: ${viewAngle.toUpperCase()} • Shader: ${renderShader.toUpperCase()}`, 12, height - 12);

  }, [selectedAssetId, viewAngle, renderShader, showDimensions, joints, currentAsset]);

  // Handle ResizeObserver with animationFrame debouncing
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
      const newHeight = Math.max(400, Math.round(newWidth * 0.52));

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
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header & Asset Navigation */}
      <div className="bg-slate-950/90 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
            <Rotate3d className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              3D CAD Reference & Digital Twin Asset Inspector
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              SO-101 Spider-Man Edition • MuJoCo Simulation Assets • Metric Calibrations
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('cad_view')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'cad_view' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            3D CAD View
          </button>
          <button
            onClick={() => setActiveTab('photo_render')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'photo_render'
                ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white font-bold shadow-md shadow-red-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>3D Photo Render</span>
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'specs' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Engineering Specs
          </button>
          <button
            onClick={() => setActiveTab('mujoco_xml')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'mujoco_xml' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            MuJoCo XML (MJCF)
          </button>
        </div>
      </div>

      {/* Asset Selection Carousel */}
      <div className="bg-slate-950/60 px-4 py-2 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-xs font-mono scrollbar-thin">
        {CAD_DIGITAL_TWIN_ASSETS.map((asset) => {
          const isArm = asset.category === 'robot_arm';
          const isSelected = asset.id === selectedAssetId;

          return (
            <button
              key={asset.id}
              onClick={() => setSelectedAssetId(asset.id)}
              className={`px-2.5 py-1.5 rounded-lg border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? isArm
                    ? 'bg-red-950/60 border-red-500/60 text-red-300 font-bold shadow-md shadow-red-500/10'
                    : 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 font-bold shadow-md shadow-cyan-500/10'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {isArm && <span className="w-2 h-2 rounded-full bg-red-500" />}
              {asset.id === 'so101_right' && <span className="w-2 h-2 rounded-full bg-blue-500" />}
              <span>{asset.name.split(' (')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab: 3D CAD View */}
      {activeTab === 'cad_view' && (
        <div>
          {/* Viewport Control Bar */}
          <div className="bg-slate-950/70 px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Orthographic Views */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500 text-[11px] mr-1 font-mono">View:</span>
              {(['perspective', 'front', 'side', 'top', 'rear'] as ViewAngle[]).map((angle) => (
                <button
                  key={angle}
                  onClick={() => setViewAngle(angle)}
                  className={`px-2 py-0.5 rounded capitalize transition-colors ${
                    viewAngle === angle ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {angle}
                </button>
              ))}
            </div>

            {/* Shaders & Overlays */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800 text-[11px]">
                <button
                  onClick={() => setRenderShader('shaded')}
                  className={`px-2 py-0.5 rounded ${renderShader === 'shaded' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'}`}
                >
                  CAD Shaded
                </button>
                <button
                  onClick={() => setRenderShader('wireframe')}
                  className={`px-2 py-0.5 rounded ${renderShader === 'wireframe' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'}`}
                >
                  Wireframe
                </button>
              </div>

              <button
                onClick={() => setShowDimensions(!showDimensions)}
                className={`px-2 py-1 rounded border text-[11px] font-mono transition-colors ${
                  showDimensions ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                Dimensions {showDimensions ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Interactive Canvas Viewport */}
          <div ref={containerRef} className="relative w-full bg-[#0b0f19] min-h-[400px] overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* Spider-Man Visual Theme Badge Overlay */}
            {currentAsset.category === 'robot_arm' && (
              <div className="absolute top-3 left-3 p-2.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-red-500/30 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-red-400 font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Spider-Man Visual Theme</span>
                </div>
                <div className="text-[11px] text-slate-300 space-y-0.5">
                  <div>• Primary: Deep Spider-Man Red (#B91C1C)</div>
                  <div>• Secondary: Dark Navy Shell Panels (#0F172A)</div>
                  <div>• Outer Covers: Subtle laser-etched black web lines</div>
                  <div>• Shoulder Turret: Stylized spider emblem</div>
                  <div>• Gripper: Parallel jaws with high-friction pads</div>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Kinematic Slider Controls (for robot arms) */}
          {currentAsset.category === 'robot_arm' && (
            <div className="bg-slate-950/90 p-4 border-t border-slate-800 font-mono text-xs">
              <div className="flex items-center gap-1.5 mb-2.5 text-slate-300 font-bold">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>6-DOF Interactive Joint Articulation & Gripper Stroke</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>q1 (Waist)</span>
                    <span className="text-white font-bold">{joints.q1}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={joints.q1}
                    onChange={(e) => setJoints({ ...joints, q1: parseInt(e.target.value, 10) })}
                    className="w-full accent-cyan-400 h-1 bg-slate-800 rounded"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>q2 (Shoulder)</span>
                    <span className="text-white font-bold">{joints.q2}°</span>
                  </div>
                  <input
                    type="range"
                    min="-45"
                    max="135"
                    value={joints.q2}
                    onChange={(e) => setJoints({ ...joints, q2: parseInt(e.target.value, 10) })}
                    className="w-full accent-red-500 h-1 bg-slate-800 rounded"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>q3 (Elbow)</span>
                    <span className="text-white font-bold">{joints.q3}°</span>
                  </div>
                  <input
                    type="range"
                    min="-120"
                    max="90"
                    value={joints.q3}
                    onChange={(e) => setJoints({ ...joints, q3: parseInt(e.target.value, 10) })}
                    className="w-full accent-blue-500 h-1 bg-slate-800 rounded"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>q4 (Wrist Flex)</span>
                    <span className="text-white font-bold">{joints.q4}°</span>
                  </div>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    value={joints.q4}
                    onChange={(e) => setJoints({ ...joints, q4: parseInt(e.target.value, 10) })}
                    className="w-full accent-cyan-400 h-1 bg-slate-800 rounded"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>q5 (Wrist Roll)</span>
                    <span className="text-white font-bold">{joints.q5}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={joints.q5}
                    onChange={(e) => setJoints({ ...joints, q5: parseInt(e.target.value, 10) })}
                    className="w-full accent-purple-400 h-1 bg-slate-800 rounded"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>q6 (Gripper)</span>
                    <span className="text-amber-400 font-bold">{joints.q6} mm</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="45"
                    value={joints.q6}
                    onChange={(e) => setJoints({ ...joints, q6: parseInt(e.target.value, 10) })}
                    className="w-full accent-amber-400 h-1 bg-slate-800 rounded"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Tab: 3D Photorealistic Render */}
      {activeTab === 'photo_render' && (
        <div className="p-4 bg-slate-950/80 font-mono text-xs space-y-4">
          <div className="relative w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center">
            {/* Image Preview Container */}
            <div className="w-full md:w-3/5 bg-black/60 p-4 flex items-center justify-center relative group min-h-[380px]">
              {currentAsset.renderImage ? (
                <img
                  src={currentAsset.renderImage}
                  alt={currentAsset.name}
                  className="max-h-[380px] w-auto object-contain rounded-lg shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="text-slate-500 text-xs">Render preview loading...</div>
              )}
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <span className="px-2 py-1 rounded bg-slate-950/80 backdrop-blur-md border border-slate-700 text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>4K Render Available</span>
                </span>
              </div>
            </div>

            {/* Technical Detail Card */}
            <div className="w-full md:w-2/5 p-5 space-y-3.5 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-950">
              <div>
                <span className="text-[10px] text-cyan-400 font-bold tracking-wider uppercase">
                  {currentAsset.category.replace('_', ' ')}
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">
                  {currentAsset.name}
                </h4>
                {currentAsset.theme && (
                  <p className="text-[11px] text-red-400 font-sans mt-0.5">
                    {currentAsset.theme}
                  </p>
                )}
              </div>

              <div className="space-y-2 text-xs font-sans text-slate-300">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Dimensions</div>
                  <div className="font-mono text-slate-200 text-[11px] mt-0.5">{currentAsset.dimensions.primary}</div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Material & Finish</div>
                  <div className="text-slate-300 text-[11px] mt-0.5">{currentAsset.material}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">MASS</span>
                    <span className="text-amber-300 font-bold">{currentAsset.massKg} kg</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">MUJOCO GEOM</span>
                    <span className="text-cyan-300 font-bold uppercase">{currentAsset.mujocoGeomType}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('cad_view')}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Rotate3d className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Switch to 3D Wireframe / CAD</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Engineering Specs Tab */}
      {activeTab === 'specs' && (
        <div className="p-5 font-mono text-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Box className="w-4 h-4 text-cyan-400" />
                <span>Physical & Mechanical Dimensions</span>
              </h4>
              <div className="text-slate-300 space-y-1.5 font-sans">
                <div><strong className="font-mono text-slate-400">Primary:</strong> {currentAsset.dimensions.primary}</div>
                <div><strong className="font-mono text-slate-400">Material:</strong> {currentAsset.material}</div>
                <div><strong className="font-mono text-slate-400">Mass:</strong> {currentAsset.massKg} kg ({Math.round(currentAsset.massKg * 1000)} g)</div>
                <div><strong className="font-mono text-slate-400">Friction Coefficients:</strong> Sliding: {currentAsset.friction[0]} • Torsional: {currentAsset.friction[1]} • Rolling: {currentAsset.friction[2]}</div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Robotics & MuJoCo Compliance</span>
              </h4>
              <p className="text-slate-300 leading-relaxed font-sans">
                {currentAsset.roboticsCompliance}
              </p>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                Compatible with MuJoCo XML, ROS2 URDF, and exportable to OBJ / GLB / FBX pipelines.
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400" />
              <span>Geometry & Design Description</span>
            </h4>
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              {currentAsset.geometryDescription}
            </p>
          </div>
        </div>
      )}

      {/* MuJoCo XML Tab */}
      {activeTab === 'mujoco_xml' && (
        <div className="p-4 bg-slate-950 font-mono text-xs relative">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-slate-400">MuJoCo XML (MJCF) Rigid Body Kinematics Definition</span>
            <button
              onClick={handleCopyXML}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] border border-slate-700 transition-colors"
            >
              {copiedXML ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedXML ? 'Copied' : 'Copy XML'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-emerald-300 overflow-x-auto max-h-96 text-[11px] leading-relaxed">
            {generateMuJoCoXML(selectedAssetId)}
          </pre>
        </div>
      )}
    </div>
  );
};
