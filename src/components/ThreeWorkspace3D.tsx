/**
 * TwinHands-AI: Photorealistic Interactive 3D Simulation Workspace
 * Built with Three.js for real-time bimanual robotic manipulation in a Spider-Man themed restaurant.
 * 
 * Features:
 * - Spider-Man inspired futuristic luxury restaurant environment (hardwood floor, slatted acoustic walls, red/blue neon coves, framed art, planters, ceiling downlights)
 * - Real-time animated dual SO-101 robotic arms (🔴 Red Left & 🔵 Blue Right) with articulated links (J1-J5) and parallel gripper finger mechanics
 * - Large centerpiece candle on dining table with realistic 3D flame and warm dynamic flickering PointLight casting soft shadows
 * - Dynamic restaurant dining table (dark walnut finish, rounded beveled edges, metal/wood legs) scaling to guest count
 * - Dynamic dining chairs automatically matching guest count (1, 2, 4, 6, 8, 10) positioned collision-free around the table
 * - Full restaurant place settings: dinner plates with coordinated red/blue/platinum rims, soup bowls, transparent glasses (90% water level + meniscus), cups, metallic cutlery (fork, knife, spoon), folded cloth napkins
 * - Spider-Man themed water pitcher jug with 90% water level and chrome spider insignia
 * - Autonomous quadruped robot companion pet with true alternating gait walk cycle, vertical body bob, obstacle-free restaurant waypoint patrol, idle inspection behaviors (looking at candle & SO-101 arms)
 * - Camera modes: CINEMATIC, TABLE_VIEW, ROBOT_VIEW, DINNER_VIEW, INSPECTOR, PET_CAM, and ORBIT
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Camera, Eye, Layers, Crosshair, Sparkles, Sliders, Maximize2, 
  RotateCcw, Compass, CheckCircle2, AlertTriangle, Shield, Info, Move,
  Bot, Flame
} from 'lucide-react';
import { TableLayoutPlan, SO101ArmTelemetry, TablewareItem, RobotPetTelemetry } from '../types';
import { generatePlaceSettingCenters } from '../planner/table_layout_planner';
import {
  createRestaurantRoom,
  createDiningChair,
  createDinnerFork,
  createDinnerKnife,
  createFoldedNapkin,
  createRobotPet,
  createInitialPetState,
  updateRobotPetKinematics,
  RobotPetHierarchy,
  RobotPetState,
  RestaurantLightingRig,
  LightingPreset,
  applyLightingPreset,
} from './ThreeRestaurantAssets';

export type { LightingPreset };

export type CameraPreset = 
  | 'CINEMATIC' 
  | 'TABLE_VIEW' 
  | 'ROBOT_VIEW' 
  | 'DINNER_VIEW' 
  | 'INSPECTOR' 
  | 'PET_CAM' 
  | 'ORBIT' 
  | 'TOP' 
  | 'FRONT' 
  | 'LEFT' 
  | 'RIGHT' 
  | 'ROBOT_POV' 
  | 'TASK_POV';

interface ThreeWorkspace3DProps {
  plan: TableLayoutPlan | null;
  leftArm: SO101ArmTelemetry;
  rightArm: SO101ArmTelemetry;
  activeItem: TablewareItem | null;
  completedItems: TablewareItem[];
  isPlaying: boolean;
  simSpeed: number;
  selectedArm: 'left' | 'right' | null;
  onSelectArm: (arm: 'left' | 'right' | null) => void;
  onSetTargetPos?: (arm: 'left' | 'right', pos: { x: number; y: number; z: number }) => void;
  cameraPreset?: CameraPreset;
  onCameraPresetChange?: (preset: CameraPreset) => void;
  showReachRings?: boolean;
  showTrajectories?: boolean;
  showOpenVinoHUD?: boolean;
  petActive?: boolean;
  petMode?: 'PATROL' | 'IDLE';
  onPetTelemetryChange?: (telemetry: RobotPetTelemetry) => void;
  lightingPreset?: LightingPreset;
}

/**
 * Generates an ultra-crisp procedural Spider-Man inspired texture for the water jug.
 */
let cachedSpiderWebTexture: THREE.CanvasTexture | null = null;
function getSpiderWebTexture(): THREE.CanvasTexture {
  if (cachedSpiderWebTexture) return cachedSpiderWebTexture;
  if (typeof document === 'undefined') {
    return new THREE.CanvasTexture({} as HTMLCanvasElement);
  }
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const w = canvas.width;
  const h = canvas.height;

  // 1. Rich Spider-Man Deep Crimson Red gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0.0, '#7f1d1d');
  bgGrad.addColorStop(0.2, '#991b1b');
  bgGrad.addColorStop(0.5, '#c8102e');
  bgGrad.addColorStop(0.8, '#991b1b');
  bgGrad.addColorStop(1.0, '#7f1d1d');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. High-tech micro-weave carbon grid
  ctx.fillStyle = 'rgba(0, 0, 0, 0.09)';
  for (let y = 0; y < h; y += 6) {
    for (let x = 0; x < w; x += 6) {
      if ((x / 6 + y / 6) % 2 === 0) {
        ctx.fillRect(x, y, 3, 3);
      }
    }
  }

  // 3. Web Nodes
  const webCenters = [
    { x: w * 0.25, y: h * 0.50, isMain: false },
    { x: w * 0.50, y: h * 0.48, isMain: true },
    { x: w * 0.75, y: h * 0.50, isMain: false },
  ];

  ctx.strokeStyle = '#0a0e17';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';

  webCenters.forEach((wc) => {
    const spokesCount = 16;
    const maxRadius = 380;
    const spokes: { x: number; y: number; angle: number }[] = [];

    for (let i = 0; i < spokesCount; i++) {
      const angle = (i / spokesCount) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      spokes.push({ x: cos, y: sin, angle });

      ctx.beginPath();
      ctx.moveTo(wc.x, wc.y);
      ctx.lineTo(wc.x + cos * maxRadius, wc.y + sin * maxRadius);
      ctx.stroke();
    }

    const radii = [24, 52, 86, 126, 172, 224, 280, 342];
    radii.forEach((r) => {
      ctx.beginPath();
      for (let i = 0; i < spokesCount; i++) {
        const next = (i + 1) % spokesCount;
        const x1 = wc.x + spokes[i].x * r;
        const y1 = wc.y + spokes[i].y * r;
        const x2 = wc.x + spokes[next].x * r;
        const y2 = wc.y + spokes[next].y * r;

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const pull = 0.82;
        const cpX = wc.x + (midX - wc.x) * pull;
        const cpY = wc.y + (midY - wc.y) * pull;

        if (i === 0) ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cpX, cpY, x2, y2);
      }
      ctx.stroke();
    });

    // Stylized Spider Insignia on chest
    if (wc.isMain) {
      ctx.save();
      ctx.translate(wc.x, wc.y);
      ctx.fillStyle = '#05070c';
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(8, -10);
      ctx.lineTo(6, 0);
      ctx.lineTo(10, 16);
      ctx.lineTo(0, 26);
      ctx.lineTo(-10, 16);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-8, -10);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(6, -8);
      ctx.lineTo(4, 0);
      ctx.lineTo(7, 13);
      ctx.lineTo(0, 21);
      ctx.lineTo(-7, 13);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-6, -8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  });

  // Dark Royal Blue tech trim bands
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(0, 0, w, 22);
  ctx.fillRect(0, h - 22, w, 22);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  cachedSpiderWebTexture = texture;
  return texture;
}

export const ThreeWorkspace3D: React.FC<ThreeWorkspace3DProps> = ({
  plan,
  leftArm,
  rightArm,
  activeItem,
  completedItems,
  isPlaying,
  simSpeed,
  selectedArm,
  onSelectArm,
  onSetTargetPos,
  cameraPreset = 'CINEMATIC',
  onCameraPresetChange,
  showReachRings = true,
  showTrajectories = true,
  showOpenVinoHUD = true,
  petActive = true,
  petMode = 'PATROL',
  onPetTelemetryChange,
  lightingPreset = 'CINEMATIC',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Robot link mesh references for kinematics
  const leftArmRefs = useRef<{
    turret?: THREE.Group;
    upper?: THREE.Group;
    forearm?: THREE.Group;
    wrist?: THREE.Group;
    palm?: THREE.Group;
    fingerL?: THREE.Mesh;
    fingerR?: THREE.Mesh;
    targetMarker?: THREE.Mesh;
  }>({});

  const rightArmRefs = useRef<{
    turret?: THREE.Group;
    upper?: THREE.Group;
    forearm?: THREE.Group;
    wrist?: THREE.Group;
    palm?: THREE.Group;
    fingerL?: THREE.Mesh;
    fingerR?: THREE.Mesh;
    targetMarker?: THREE.Mesh;
  }>({});

  const tablewareGroupRef = useRef<THREE.Group | null>(null);
  const chairsGroupRef = useRef<THREE.Group | null>(null);
  const tableElementsRef = useRef<{
    tabletop?: THREE.Mesh;
    edgeLine?: THREE.LineSegments;
    legs?: THREE.Mesh[];
  }>({});

  // Center candle references for live flickering
  const candleLightRef = useRef<THREE.PointLight | null>(null);
  const flameMeshRef = useRef<THREE.Mesh | null>(null);

  // Cinematic lighting rig and environment fill references
  const lightingRigRef = useRef<RestaurantLightingRig | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);

  // Robot pet references
  const robotPetRef = useRef<RobotPetHierarchy | null>(null);
  const robotPetStateRef = useRef<RobotPetState>(createInitialPetState());

  const [activeCamMode, setActiveCamMode] = useState<CameraPreset>(cameraPreset);
  const [tableTargetCoord, setTableTargetCoord] = useState<{ x: number; y: number; z: number } | null>(null);
  const [fps, setFps] = useState<number>(60);

  // Camera preset destinations
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.9, 2.6));
  const targetCamLook = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.72, 0));

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth;
    let height = container.clientHeight;
    if (!width || !height || width < 100 || height < 100) {
      const parentRect = container.parentElement?.getBoundingClientRect();
      width = parentRect?.width || 900;
      height = parentRect?.height || 620;
    }

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0b1220);
    scene.fog = new THREE.Fog(0x0b1220, 7.5, 24.0);

    // 1b. Layered Environmental Ambient & Fill Lighting
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1c1917, 0.55);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const ambientLight = new THREE.AmbientLight(0x1e293b, 0.35);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 50);
    camera.position.set(0, 1.9, 2.6);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.75, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't clip below floor
    controls.minDistance = 0.4;
    controls.maxDistance = 5.5;
    controlsRef.current = controls;

    // 5. Build Complete Restaurant Interior & Centerpiece Candle Lighting Rig
    const rig = createRestaurantRoom();
    scene.add(rig.roomGroup);
    lightingRigRef.current = rig;
    candleLightRef.current = rig.candleLight;
    flameMeshRef.current = rig.flameMesh;

    // Apply active lighting preset immediately on load
    applyLightingPreset(rig, hemiLight, ambientLight, lightingPreset);

    // 6. Chairs Group
    const chairsGroup = new THREE.Group();
    chairsGroup.name = 'dining_chairs_collection';
    chairsGroupRef.current = chairsGroup;
    scene.add(chairsGroup);

    // 7. Quadruped Robot Companion Pet
    const pet = createRobotPet();
    scene.add(pet.rootGroup);
    robotPetRef.current = pet;
    robotPetStateRef.current = createInitialPetState();

    // 8. Dining Table (Dark Walnut finish with rounded edges and brass/dark legs)
    const tableGroup = new THREE.Group();
    tableGroup.name = 'dining_table';

    const initDims = plan?.tableDimensions || { widthM: 1.40, depthM: 0.90, heightM: 0.75 };
    const topThick = 0.032;
    const tabletopGeo = new THREE.BoxGeometry(initDims.widthM, topThick, initDims.depthM);
    
    // Rich dark walnut tabletop material with warm amber tone and realistic specular sheen
    const tabletopMat = new THREE.MeshStandardMaterial({
      color: 0x2e1e14,
      roughness: 0.28,
      metalness: 0.18,
    });
    const tabletop = new THREE.Mesh(tabletopGeo, tabletopMat);
    tabletop.position.set(0, 0.75 - topThick / 2, 0);
    tabletop.castShadow = true;
    tabletop.receiveShadow = true;
    tableGroup.add(tabletop);

    // Beveled gold/brass accent edge outline
    const edgeGeo = new THREE.EdgesGeometry(tabletopGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0xd4af37, linewidth: 1.5 });
    const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
    edgeLine.position.copy(tabletop.position);
    tableGroup.add(edgeLine);

    // Four Elegant Tapered Walnut/Brass Table Legs
    const legGeo = new THREE.CylinderGeometry(0.026, 0.020, 0.734, 16);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.7,
      roughness: 0.3,
    });
    const legX = initDims.widthM / 2 - 0.06;
    const legZ = initDims.depthM / 2 - 0.06;
    const legPositions: [number, number, number][] = [
      [-legX, 0.734 / 2, -legZ],
      [legX, 0.734 / 2, -legZ],
      [-legX, 0.734 / 2, legZ],
      [legX, 0.734 / 2, legZ],
    ];
    const legMeshes: THREE.Mesh[] = [];
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(...pos);
      leg.castShadow = true;
      leg.receiveShadow = true;
      tableGroup.add(leg);
      legMeshes.push(leg);
    });

    tableElementsRef.current = {
      tabletop,
      edgeLine,
      legs: legMeshes,
    };

    scene.add(tableGroup);

    // 9. Build Articulated Dual SO-101 Arms
    const createSO101Arm = (isLeft: boolean) => {
      const armGroup = new THREE.Group();
      armGroup.name = isLeft ? 'left_arm' : 'right_arm';

      const basePos = new THREE.Vector3(isLeft ? -0.38 : 0.38, 0.75, 0.42);
      armGroup.position.copy(basePos);

      const primaryColor = isLeft ? 0xdc2626 : 0x2563eb; // 🔴 Spider-Red Left / 🔵 Electric-Blue Right
      const secondaryColor = isLeft ? 0x1e3a8a : 0x991b1b;
      const metallicBlack = 0x090d16;

      const armMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.3,
        metalness: 0.65,
      });

      const darkMat = new THREE.MeshStandardMaterial({
        color: secondaryColor,
        roughness: 0.35,
        metalness: 0.7,
      });

      const jointMat = new THREE.MeshStandardMaterial({
        color: metallicBlack,
        roughness: 0.25,
        metalness: 0.9,
      });

      const rubberMat = new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        roughness: 0.8,
        metalness: 0.1,
      });

      // Base Mount
      const baseCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.04, 24), darkMat);
      baseCyl.position.y = 0.02;
      baseCyl.castShadow = true;
      armGroup.add(baseCyl);

      // J1: Turret (Waist yaw)
      const turretGroup = new THREE.Group();
      turretGroup.position.y = 0.04;
      const turretMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08), armMat);
      turretMesh.position.y = 0.03;
      turretMesh.castShadow = true;
      turretGroup.add(turretMesh);
      armGroup.add(turretGroup);

      // J2: Shoulder (Pitch)
      const shoulderGroup = new THREE.Group();
      shoulderGroup.position.y = 0.06;
      const shoulderBearing = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.07, 16), jointMat);
      shoulderBearing.rotation.z = Math.PI / 2;
      shoulderGroup.add(shoulderBearing);

      // Upper Arm Link (0.22m)
      const upperLinkGeo = new THREE.CapsuleGeometry(0.024, 0.17, 8, 16);
      const upperLink = new THREE.Mesh(upperLinkGeo, armMat);
      upperLink.position.y = 0.11;
      upperLink.castShadow = true;
      shoulderGroup.add(upperLink);
      turretGroup.add(shoulderGroup);

      // J3: Elbow (Pitch)
      const elbowGroup = new THREE.Group();
      elbowGroup.position.y = 0.22;
      const elbowBearing = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.065, 16), jointMat);
      elbowBearing.rotation.z = Math.PI / 2;
      elbowGroup.add(elbowBearing);

      // Forearm Link (0.20m)
      const forearmGeo = new THREE.CapsuleGeometry(0.022, 0.15, 8, 16);
      const forearmLink = new THREE.Mesh(forearmGeo, darkMat);
      forearmLink.position.y = 0.10;
      forearmLink.castShadow = true;
      elbowGroup.add(forearmLink);
      shoulderGroup.add(elbowGroup);

      // J4: Wrist Pitch
      const wristGroup = new THREE.Group();
      wristGroup.position.y = 0.20;
      const wristBearing = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.03, 0.045), jointMat);
      wristBearing.castShadow = true;
      wristGroup.add(wristBearing);
      elbowGroup.add(wristGroup);

      // J5: Wrist Roll & Gripper Palm
      const palmGroup = new THREE.Group();
      palmGroup.position.y = 0.03;
      const palmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.04), armMat);
      palmMesh.castShadow = true;
      palmGroup.add(palmMesh);
      wristGroup.add(palmGroup);

      // J6: Parallel Gripper Fingers
      const fingerGeo = new THREE.BoxGeometry(0.012, 0.055, 0.02);
      const fingerL = new THREE.Mesh(fingerGeo, rubberMat);
      fingerL.position.set(-0.022, 0.035, 0);
      fingerL.castShadow = true;
      palmGroup.add(fingerL);

      const fingerR = new THREE.Mesh(fingerGeo, rubberMat);
      fingerR.position.set(0.022, 0.035, 0);
      fingerR.castShadow = true;
      palmGroup.add(fingerR);

      // Target Crosshair / Goal Marker
      const targetGeo = new THREE.RingGeometry(0.02, 0.032, 24);
      const targetMat = new THREE.MeshBasicMaterial({
        color: primaryColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const targetMarker = new THREE.Mesh(targetGeo, targetMat);
      targetMarker.rotation.x = -Math.PI / 2;
      targetMarker.position.set(0, 0.755, 0);
      scene.add(targetMarker);

      // Reach envelope ring on table
      if (showReachRings) {
        const reachRingGeo = new THREE.RingGeometry(0.12, 0.58, 48);
        const reachRingMat = new THREE.MeshBasicMaterial({
          color: primaryColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.07,
        });
        const reachRing = new THREE.Mesh(reachRingGeo, reachRingMat);
        reachRing.rotation.x = -Math.PI / 2;
        reachRing.position.set(basePos.x, 0.751, basePos.z);
        scene.add(reachRing);
      }

      scene.add(armGroup);

      return {
        turret: turretGroup,
        upper: shoulderGroup,
        forearm: elbowGroup,
        wrist: wristGroup,
        palm: palmGroup,
        fingerL,
        fingerR,
        targetMarker,
      };
    };

    leftArmRefs.current = createSO101Arm(true);
    rightArmRefs.current = createSO101Arm(false);

    // 10. Tableware Collection Group
    const tablewareGroup = new THREE.Group();
    tablewareGroup.name = 'tableware_collection';
    tablewareGroupRef.current = tablewareGroup;
    scene.add(tablewareGroup);

    // 11. Main Render & Kinematics Loop
    let lastTime = performance.now();
    let frameCount = 0;
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const now = performance.now();
      const deltaSec = Math.min(0.05, (now - lastTime) / 1000);

      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }

      // Live Center Candle Flame Flicker Animation
      if (candleLightRef.current && flameMeshRef.current) {
        const flicker = 2.4 + Math.sin(now * 0.015) * 0.22 + (Math.random() - 0.5) * 0.08;
        candleLightRef.current.intensity = flicker;
        flameMeshRef.current.scale.set(
          1.0 + Math.sin(now * 0.02) * 0.08,
          1.0 + Math.cos(now * 0.025) * 0.12,
          1.0
        );
      }

      // Update Quadruped Robot Companion Pet Kinematics & Walking Cycle
      if (robotPetRef.current) {
        updateRobotPetKinematics(
          robotPetRef.current,
          robotPetStateRef.current,
          deltaSec,
          petActive,
          petMode,
          onPetTelemetryChange
        );

        // Dynamic Pet Cam Tracking
        if (activeCamMode === 'PET_CAM') {
          const ps = robotPetStateRef.current;
          targetCamPos.current.set(
            ps.pos.x - Math.sin(ps.headingRad) * 1.25,
            0.62,
            ps.pos.z - Math.cos(ps.headingRad) * 1.25
          );
          targetCamLook.current.set(ps.pos.x, 0.25, ps.pos.z);
        }
      }

      // Smooth Camera & Controls Lerp
      camera.position.lerp(targetCamPos.current, 0.06);
      controls.target.lerp(targetCamLook.current, 0.06);
      controls.update();

      renderer.render(scene, camera);
    };

    animate();

    // 12. Dynamic ResizeObserver for robust layout adaptation
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 50 && h > 50) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW > 50 && newH > 50) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  }, []);

  // Synchronize dynamic lighting presets in real time
  useEffect(() => {
    if (lightingRigRef.current) {
      applyLightingPreset(
        lightingRigRef.current,
        hemiLightRef.current,
        ambientLightRef.current,
        lightingPreset
      );
    }
  }, [lightingPreset]);

  // Update Joint Angles in 3D Hierarchy
  useEffect(() => {
    // Left Arm Joints
    const l = leftArmRefs.current;
    if (l.turret && l.upper && l.forearm && l.wrist && l.palm && l.fingerL && l.fingerR && leftArm?.jointAnglesDeg) {
      l.turret.rotation.y = THREE.MathUtils.degToRad(-(leftArm.jointAnglesDeg[0] || 0));
      l.upper.rotation.x = THREE.MathUtils.degToRad(leftArm.jointAnglesDeg[1] || 0);
      l.forearm.rotation.x = THREE.MathUtils.degToRad(leftArm.jointAnglesDeg[2] || 0);
      l.wrist.rotation.x = THREE.MathUtils.degToRad(leftArm.jointAnglesDeg[3] || 0);
      l.palm.rotation.y = THREE.MathUtils.degToRad(leftArm.jointAnglesDeg[4] || 0);

      const lGrasping = (leftArm.gripperState || 0) > 0.5;
      const lStroke = lGrasping ? 0.008 : 0.024;
      l.fingerL.position.x = -lStroke;
      l.fingerR.position.x = lStroke;

      if (l.targetMarker) {
        const tx = leftArm.targetPose?.x ?? leftArm.eePose?.x ?? -0.20;
        const ty = leftArm.targetPose?.y ?? leftArm.eePose?.y ?? 0.05;
        l.targetMarker.position.set(tx, 0.755, -ty);
      }
    }

    // Right Arm Joints
    const r = rightArmRefs.current;
    if (r.turret && r.upper && r.forearm && r.wrist && r.palm && r.fingerL && r.fingerR && rightArm?.jointAnglesDeg) {
      r.turret.rotation.y = THREE.MathUtils.degToRad(-(rightArm.jointAnglesDeg[0] || 0));
      r.upper.rotation.x = THREE.MathUtils.degToRad(rightArm.jointAnglesDeg[1] || 0);
      r.forearm.rotation.x = THREE.MathUtils.degToRad(rightArm.jointAnglesDeg[2] || 0);
      r.wrist.rotation.x = THREE.MathUtils.degToRad(rightArm.jointAnglesDeg[3] || 0);
      r.palm.rotation.y = THREE.MathUtils.degToRad(rightArm.jointAnglesDeg[4] || 0);

      const rGrasping = (rightArm.gripperState || 0) > 0.5;
      const rStroke = rGrasping ? 0.008 : 0.024;
      r.fingerL.position.x = -rStroke;
      r.fingerR.position.x = rStroke;

      if (r.targetMarker) {
        const tx = rightArm.targetPose?.x ?? rightArm.eePose?.x ?? 0.20;
        const ty = rightArm.targetPose?.y ?? rightArm.eePose?.y ?? 0.05;
        r.targetMarker.position.set(tx, 0.755, -ty);
      }
    }
  }, [leftArm, rightArm]);

  // Dynamically scale table dimensions based on guest count profile
  useEffect(() => {
    const { tabletop, edgeLine, legs } = tableElementsRef.current;
    if (!tabletop || !edgeLine || !legs || !plan?.tableDimensions) return;

    const w = plan.tableDimensions.widthM;
    const d = plan.tableDimensions.depthM;
    const h = plan.tableDimensions.heightM || 0.75;
    const topThick = 0.032;

    tabletop.geometry.dispose();
    tabletop.geometry = new THREE.BoxGeometry(w, topThick, d);
    tabletop.position.set(0, h - topThick / 2, 0);

    edgeLine.geometry.dispose();
    edgeLine.geometry = new THREE.EdgesGeometry(tabletop.geometry);
    edgeLine.position.copy(tabletop.position);

    const legX = w / 2 - 0.06;
    const legZ = d / 2 - 0.06;
    const legH = h - topThick;
    const legY = legH / 2;

    const positions = [
      [-legX, legY, -legZ],
      [legX, legY, -legZ],
      [-legX, legY, legZ],
      [legX, legY, legZ],
    ];

    legs.forEach((leg, idx) => {
      if (positions[idx]) {
        leg.position.set(positions[idx][0], positions[idx][1], positions[idx][2]);
      }
    });
  }, [plan?.tableDimensions]);

  // Dynamic Chairs: Automatically scale & position chairs matching guest count
  useEffect(() => {
    const chairsGroup = chairsGroupRef.current;
    if (!chairsGroup || !plan) return;

    chairsGroup.clear();

    const guests = plan.isValid ? plan.groupSize : 4;
    const tableW = plan.tableDimensions?.widthM || 1.40;
    const tableD = plan.tableDimensions?.depthM || 0.90;
    const centers = generatePlaceSettingCenters(guests);

    centers.forEach((seat) => {
      // Determine accent color: Red for left, Blue for right, Platinum for center
      const accent = seat.pos.x < -0.1 ? 0xdc2626 : seat.pos.x > 0.1 ? 0x2563eb : 0xd4af37;
      const chair = createDiningChair(accent);

      // Calculate chair position outside table perimeter facing center
      let chairX = seat.pos.x;
      let chairZ = -seat.pos.y;

      if (seat.seat === 'north') {
        chairX = seat.pos.x;
        chairZ = -(tableD / 2 + 0.28);
      } else if (seat.seat === 'south') {
        chairX = seat.pos.x;
        chairZ = +(tableD / 2 + 0.28);
      } else if (seat.seat === 'east') {
        chairX = +(tableW / 2 + 0.28);
        chairZ = -seat.pos.y;
      } else if (seat.seat === 'west') {
        chairX = -(tableW / 2 + 0.28);
        chairZ = -seat.pos.y;
      } else {
        // Angular / distributed seats (Dinner for 6, Banquet for 8, Dinner for 10):
        // Project ray from table center (0,0) along (chairX, chairZ) to table perimeter
        const absX = Math.abs(chairX);
        const absZ = Math.abs(chairZ);
        const scaleX = absX > 1e-4 ? (tableW / 2) / absX : Infinity;
        const scaleZ = absZ > 1e-4 ? (tableD / 2) / absZ : Infinity;
        const scale = Math.min(scaleX, scaleZ);
        const edgeX = chairX * scale;
        const edgeZ = chairZ * scale;
        const len = Math.hypot(chairX, chairZ);
        chairX = edgeX + (chairX / len) * 0.28;
        chairZ = edgeZ + (chairZ / len) * 0.28;
      }

      // Universal facing direction: every chair faces toward table center (0, 0)
      // Chair forward vector is local -Z, so rotation.y = Math.atan2(chairX, chairZ)
      // perfectly aligns local -Z toward (-chairX, -chairZ) and backrest away from table.
      const chairYaw = Math.atan2(chairX, chairZ);

      // Position chair flush on the floor (Y = 0) with zero tilt
      chair.position.set(chairX, 0, chairZ);
      chair.rotation.set(0, chairYaw, 0);
      chairsGroup.add(chair);
    });
  }, [plan?.groupSize, plan?.tableDimensions]);

  // Update Dynamic Tableware Objects (Plates, Bowls, Cups, Cutlery, Glasses, Napkins, Jug)
  useEffect(() => {
    const group = tablewareGroupRef.current;
    if (!group) return;

    group.clear();

    // Standard Ceramics
    const ceramicMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.18,
      metalness: 0.08,
    });

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.12,
      metalness: 0.95,
    });

    // Optical glass material
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xf0f9ff,
      transmission: 0.94,
      opacity: 1.0,
      transparent: true,
      roughness: 0.02,
      metalness: 0.02,
      ior: 1.52,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      depthWrite: false,
    });

    // Transparent liquid water with 1.333 physical refractive index (90% capacity)
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0xc7ebfd,
      transmission: 0.94,
      opacity: 1.0,
      transparent: true,
      roughness: 0.02,
      metalness: 0.02,
      ior: 1.333,
      attenuationColor: 0x0284c7,
      attenuationDistance: 0.22,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const waterSurfaceMat = new THREE.MeshPhysicalMaterial({
      color: 0xbae6fd,
      transmission: 0.88,
      opacity: 0.96,
      transparent: true,
      roughness: 0.03,
      metalness: 0.04,
      ior: 1.333,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const waterMeniscusMat = new THREE.MeshPhysicalMaterial({
      color: 0x7dd3fc,
      transmission: 0.85,
      opacity: 0.9,
      transparent: true,
      roughness: 0.05,
      ior: 1.333,
      depthWrite: false,
    });

    // Spider-Man Jug Materials
    const spiderWebTex = getSpiderWebTexture();
    const spidermanRedMat = new THREE.MeshPhysicalMaterial({
      map: spiderWebTex,
      color: 0xffffff,
      roughness: 0.16,
      metalness: 0.06,
      clearcoat: 0.88,
      clearcoatRoughness: 0.08,
    });

    const royalBlueMat = new THREE.MeshPhysicalMaterial({
      color: 0x1d4ed8,
      roughness: 0.20,
      metalness: 0.25,
      clearcoat: 0.85,
    });

    const blackAccentMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.45,
    });

    const silverEmblemMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.15,
    });

    const jugGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transmission: 0.92,
      opacity: 1.0,
      transparent: true,
      roughness: 0.04,
      ior: 1.50,
      depthWrite: false,
    });

    // Helper: Create single tableware item mesh with elegant accent rims
    const createTablewareMesh = (type: string, isCompleted: boolean, personX: number = 0) => {
      const objGroup = new THREE.Group();

      // Determine rim accent color based on diner side
      const rimColor = personX < -0.1 ? 0xdc2626 : personX > 0.1 ? 0x2563eb : 0xd4af37;
      const rimAccentMat = new THREE.MeshStandardMaterial({
        color: rimColor,
        roughness: 0.25,
        metalness: 0.6,
      });

      if (type === 'plate') {
        // Ceramic Dinner Plate with Spider-Man Red / Blue Accent Rim
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.095, 0.010, 32), ceramicMat);
        base.position.y = 0.005;
        base.castShadow = true;
        base.receiveShadow = true;
        objGroup.add(base);

        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.104, 0.008, 12, 32), rimAccentMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 0.009;
        rim.castShadow = true;
        objGroup.add(rim);

      } else if (type === 'bowl') {
        // Ceramic Soup Bowl nested atop plate
        const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.068, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), ceramicMat);
        bowl.rotation.x = Math.PI;
        bowl.position.y = 0.040;
        bowl.castShadow = true;
        objGroup.add(bowl);

        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.004, 8, 24), rimAccentMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 0.040;
        objGroup.add(rim);

        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.006, 24), ceramicMat);
        foot.position.y = 0.003;
        foot.castShadow = true;
        objGroup.add(foot);

      } else if (type === 'cup') {
        // Ceramic Cup with 90% Liquid Level
        const cupTotalHeight = 0.076;
        const cupBaseThickness = 0.008;
        const cupWallThickness = 0.003;
        const cupCavityHeight = cupTotalHeight - cupBaseThickness;
        const cupWaterHeight = cupCavityHeight * 0.90;

        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.032, cupTotalHeight, 32), ceramicMat);
        cup.position.y = cupTotalHeight / 2;
        cup.castShadow = true;
        cup.receiveShadow = true;
        objGroup.add(cup);

        const handle = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 8, 16, Math.PI), rimAccentMat);
        handle.rotation.z = -Math.PI / 2;
        handle.position.set(0.038, 0.038, 0);
        handle.castShadow = true;
        objGroup.add(handle);

        const cupInnerBotRadius = 0.032 - cupWallThickness;
        const cupInnerTopRadius = 0.036 - cupWallThickness;
        const cupWaterTopRadius = cupInnerBotRadius + (cupInnerTopRadius - cupInnerBotRadius) * 0.90;

        const cupWaterMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(cupWaterTopRadius, cupInnerBotRadius, cupWaterHeight, 24),
          waterMat
        );
        cupWaterMesh.position.y = cupBaseThickness + cupWaterHeight / 2;
        objGroup.add(cupWaterMesh);

        const cupWaterSurface = new THREE.Mesh(
          new THREE.CircleGeometry(cupWaterTopRadius - 0.0003, 24),
          waterSurfaceMat
        );
        cupWaterSurface.rotation.x = -Math.PI / 2;
        cupWaterSurface.position.y = cupBaseThickness + cupWaterHeight;
        objGroup.add(cupWaterSurface);

      } else if (type === 'spoon') {
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.003, 0.13), steelMat);
        handle.position.y = 0.002;
        handle.position.z = 0.02;
        handle.castShadow = true;

        const scoop = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 12), steelMat);
        scoop.scale.set(1.0, 0.35, 1.4);
        scoop.position.set(0, 0.003, -0.065);
        scoop.castShadow = true;

        objGroup.add(handle);
        objGroup.add(scoop);

      } else if (type === 'additional_spoon') {
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.003, 0.11), steelMat);
        handle.position.y = 0.002;
        handle.position.z = 0.02;
        handle.castShadow = true;

        const scoop = new THREE.Mesh(new THREE.SphereGeometry(0.015, 16, 12), steelMat);
        scoop.scale.set(1.0, 0.35, 1.3);
        scoop.position.set(0, 0.003, -0.055);
        scoop.castShadow = true;

        objGroup.add(handle);
        objGroup.add(scoop);

      } else if (type === 'fork') {
        objGroup.add(createDinnerFork());

      } else if (type === 'knife') {
        objGroup.add(createDinnerKnife());

      } else if (type === 'napkin') {
        objGroup.add(createFoldedNapkin());

      } else if (type === 'glass' || type === 'drinking_glass') {
        // Borosilicate Drinking Glass with 90% Water Level
        const totalGlassHeight = 0.110;
        const baseThickness = 0.012;
        const wallThickness = 0.0025;
        const topRadius = 0.035;
        const botRadius = 0.028;
        const cavityHeight = totalGlassHeight - baseThickness;
        const waterHeight = cavityHeight * 0.90; // Exactly 90%

        const glassBase = new THREE.Mesh(
          new THREE.CylinderGeometry(botRadius, botRadius - 0.001, baseThickness, 32),
          glassMat
        );
        glassBase.position.y = baseThickness / 2;
        glassBase.castShadow = true;
        objGroup.add(glassBase);

        const glassWall = new THREE.Mesh(
          new THREE.CylinderGeometry(topRadius, botRadius, totalGlassHeight, 32, 1, true),
          glassMat
        );
        glassWall.position.y = totalGlassHeight / 2;
        glassWall.castShadow = true;
        objGroup.add(glassWall);

        const rimTorus = new THREE.Mesh(
          new THREE.TorusGeometry(topRadius - wallThickness / 2, wallThickness / 2, 8, 32),
          glassMat
        );
        rimTorus.rotation.x = Math.PI / 2;
        rimTorus.position.y = totalGlassHeight;
        objGroup.add(rimTorus);

        const innerBotRadius = botRadius - wallThickness;
        const innerTopRadius = topRadius - wallThickness;
        const waterTopRadius = innerBotRadius + (innerTopRadius - innerBotRadius) * 0.90;

        const waterMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(waterTopRadius, innerBotRadius, waterHeight, 32),
          waterMat
        );
        waterMesh.position.y = baseThickness + waterHeight / 2;
        objGroup.add(waterMesh);

        const waterSurfaceDisc = new THREE.Mesh(
          new THREE.CircleGeometry(waterTopRadius - 0.0004, 32),
          waterSurfaceMat
        );
        waterSurfaceDisc.rotation.x = -Math.PI / 2;
        waterSurfaceDisc.position.y = baseThickness + waterHeight;
        objGroup.add(waterSurfaceDisc);

        const meniscusRing = new THREE.Mesh(
          new THREE.TorusGeometry(waterTopRadius - 0.0008, 0.0008, 8, 32),
          waterMeniscusMat
        );
        meniscusRing.rotation.x = Math.PI / 2;
        meniscusRing.position.y = baseThickness + waterHeight;
        objGroup.add(meniscusRing);

      } else if (type === 'jug' || type === 'water_jug') {
        // Spider-Man Themed Water Jug with 90% Water Level
        const baseCollar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.066, 0.068, 0.014, 32),
          royalBlueMat
        );
        baseCollar.position.y = 0.007;
        baseCollar.castShadow = true;
        objGroup.add(baseCollar);

        const innerGlassCore = new THREE.Mesh(
          new THREE.CylinderGeometry(0.062, 0.062, 0.145, 32),
          jugGlassMat
        );
        innerGlassCore.position.y = 0.082;
        objGroup.add(innerGlassCore);

        const bodyWeb = new THREE.Mesh(
          new THREE.CylinderGeometry(0.065, 0.065, 0.120, 32, 1, true),
          spidermanRedMat
        );
        bodyWeb.position.y = 0.076;
        bodyWeb.castShadow = true;
        objGroup.add(bodyWeb);

        const gaugeGlass = new THREE.Mesh(
          new THREE.BoxGeometry(0.014, 0.108, 0.132),
          jugGlassMat
        );
        gaugeGlass.position.set(0, 0.076, 0);
        objGroup.add(gaugeGlass);

        const neckCollar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.048, 0.052, 0.026, 32),
          royalBlueMat
        );
        neckCollar.position.y = 0.151;
        neckCollar.castShadow = true;
        objGroup.add(neckCollar);

        const spoutLip = new THREE.Mesh(
          new THREE.ConeGeometry(0.018, 0.024, 16),
          royalBlueMat
        );
        spoutLip.rotation.x = -Math.PI / 3;
        spoutLip.position.set(0, 0.162, 0.052);
        spoutLip.castShadow = true;
        objGroup.add(spoutLip);

        const handle = new THREE.Mesh(
          new THREE.TorusGeometry(0.040, 0.008, 16, 32, Math.PI),
          royalBlueMat
        );
        handle.rotation.z = Math.PI / 2;
        handle.position.set(0, 0.082, -0.068);
        handle.castShadow = true;
        objGroup.add(handle);

        const innerGrip = new THREE.Mesh(
          new THREE.TorusGeometry(0.036, 0.004, 12, 32, Math.PI),
          blackAccentMat
        );
        innerGrip.rotation.z = Math.PI / 2;
        innerGrip.position.set(0, 0.082, -0.068);
        objGroup.add(innerGrip);

        const emblemBody = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.008, 1),
          silverEmblemMat
        );
        emblemBody.scale.set(0.6, 1.4, 0.3);
        emblemBody.position.set(0, 0.080, 0.066);
        objGroup.add(emblemBody);

        // 90% Water inside Jug
        const jugWaterHeight = 0.150 * 0.90;
        const jugWaterRadius = 0.059;
        const jugWaterMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(jugWaterRadius, jugWaterRadius, jugWaterHeight, 32),
          waterMat
        );
        jugWaterMesh.position.y = 0.014 + jugWaterHeight / 2;
        objGroup.add(jugWaterMesh);

        const jugWaterSurface = new THREE.Mesh(
          new THREE.CircleGeometry(jugWaterRadius - 0.0005, 32),
          waterSurfaceMat
        );
        jugWaterSurface.rotation.x = -Math.PI / 2;
        jugWaterSurface.position.y = 0.014 + jugWaterHeight;
        objGroup.add(jugWaterSurface);

      } else {
        const cubeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
        const cube = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), cubeMat);
        cube.position.y = 0.015;
        cube.castShadow = true;
        objGroup.add(cube);
      }

      // Verified glow ring if completed
      if (isCompleted) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.06, 0.07, 24),
          new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.001;
        objGroup.add(ring);
      }

      return objGroup;
    };

    // A. Render Simulated Tableware Items (Plates, Bowls, Cups, Spoons)
    if (plan && plan.allItems && Array.isArray(plan.allItems)) {
      plan.allItems.forEach((item) => {
        const isDone = completedItems.some(c => c.id === item.id);
        const isActive = activeItem && activeItem.id === item.id;

        let pos: { x: number; y: number; z: number } | undefined;
        if (isDone) {
          pos = item.targetPos;
        } else if (isActive) {
          pos = activeItem.currentPos;
        } else if (isPlaying) {
          pos = item.sourcePos;
        } else {
          pos = item.targetPos;
        }

        if (pos) {
          const itemMesh = createTablewareMesh(item.type, isDone, pos.x);
          const arcZ = pos.z || 0;
          itemMesh.position.set(pos.x, 0.750 + arcZ, -pos.y);
          if (item.orientation !== undefined) {
            itemMesh.rotation.y = THREE.MathUtils.degToRad(-item.orientation);
          }
          group.add(itemMesh);
        }
      });
    }

    // B. Render Restaurant Place Setting Complements (Fork on Left, Knife on Right, Drinking Glass, Folded Napkin)
    const guests = plan?.isValid ? plan.groupSize : 4;
    const centers = generatePlaceSettingCenters(guests);

    centers.forEach((seat) => {
      const rad = (seat.yaw * Math.PI) / 180;
      const ux = Math.sin(rad);  // Forward unit vector
      const uy = Math.cos(rad);
      const vx = Math.cos(rad);  // Right unit vector
      const vy = -Math.sin(rad);

      const cx = seat.pos.x;
      const cy = seat.pos.y;

      // 1. Dinner Fork on Diner's Left (-15cm right vector, 0cm forward)
      const forkX = cx - 0.15 * vx;
      const forkY = cy - 0.15 * vy;
      const forkMesh = createTablewareMesh('fork', true, cx);
      forkMesh.position.set(forkX, 0.750, -forkY);
      forkMesh.rotation.y = THREE.MathUtils.degToRad(-seat.yaw);
      group.add(forkMesh);

      // 2. Dinner Knife on Diner's Right (+12cm right vector, 0cm forward)
      const knifeX = cx + 0.12 * vx;
      const knifeY = cy + 0.12 * vy;
      const knifeMesh = createTablewareMesh('knife', true, cx);
      knifeMesh.position.set(knifeX, 0.750, -knifeY);
      knifeMesh.rotation.y = THREE.MathUtils.degToRad(-seat.yaw);
      group.add(knifeMesh);

      // 3. Folded Restaurant Napkin on Diner's Left (-22cm right vector, 0cm forward)
      const napkinX = cx - 0.22 * vx;
      const napkinY = cy - 0.22 * vy;
      const napkinMesh = createTablewareMesh('napkin', true, cx);
      napkinMesh.position.set(napkinX, 0.750, -napkinY);
      napkinMesh.rotation.y = THREE.MathUtils.degToRad(-seat.yaw);
      group.add(napkinMesh);

      // 4. Drinking Glass with 90% Water Level (+12cm right vector, +16cm forward)
      const glassX = cx + 0.12 * vx + 0.16 * ux;
      const glassY = cy + 0.12 * vy + 0.16 * uy;
      const glassMesh = createTablewareMesh('glass', true, cx);
      glassMesh.position.set(glassX, 0.751, -glassY);
      glassMesh.rotation.y = THREE.MathUtils.degToRad(-seat.yaw);
      group.add(glassMesh);
    });

    // C. Centerpiece: Spider-Man Themed Water Jug (with 90% water level) placed near center candle
    const jugMesh = createTablewareMesh('jug', true, 0);
    jugMesh.position.set(0.0, 0.751, -0.16);
    group.add(jugMesh);

  }, [plan, completedItems, activeItem, isPlaying]);

  // Camera Mode Transitions
  const handleCameraChange = useCallback((mode: CameraPreset) => {
    setActiveCamMode(mode);
    if (onCameraPresetChange) onCameraPresetChange(mode);

    switch (mode) {
      case 'CINEMATIC':
        targetCamPos.current.set(0, 1.9, 2.6);
        targetCamLook.current.set(0, 0.72, 0);
        break;
      case 'TABLE_VIEW':
        targetCamPos.current.set(0, 2.2, 1.4);
        targetCamLook.current.set(0, 0.75, 0);
        break;
      case 'ROBOT_VIEW':
        targetCamPos.current.set(0, 1.25, 1.3);
        targetCamLook.current.set(0, 0.80, 0.15);
        break;
      case 'DINNER_VIEW':
        targetCamPos.current.set(0.45, 1.05, 0.65);
        targetCamLook.current.set(0, 0.82, 0);
        break;
      case 'INSPECTOR':
        targetCamPos.current.set(0, 2.8, 0.01);
        targetCamLook.current.set(0, 0.75, 0);
        break;
      case 'PET_CAM':
        // Dynamically updated in render loop
        break;
      case 'ORBIT':
        targetCamPos.current.set(0, 1.8, 1.9);
        targetCamLook.current.set(0, 0.75, 0);
        break;
      case 'TOP':
        targetCamPos.current.set(0, 2.5, 0.01);
        targetCamLook.current.set(0, 0.75, 0);
        break;
      case 'FRONT':
        targetCamPos.current.set(0, 1.15, 1.6);
        targetCamLook.current.set(0, 0.75, 0);
        break;
      case 'LEFT':
        targetCamPos.current.set(-1.4, 1.2, 0.6);
        targetCamLook.current.set(-0.38, 0.85, 0.1);
        break;
      case 'RIGHT':
        targetCamPos.current.set(1.4, 1.2, 0.6);
        targetCamLook.current.set(0.38, 0.85, 0.1);
        break;
      case 'ROBOT_POV':
        if (selectedArm === 'right') {
          const tx = rightArm?.targetPose?.x ?? rightArm?.eePose?.x ?? 0.20;
          const ty = rightArm?.targetPose?.y ?? rightArm?.eePose?.y ?? 0.05;
          targetCamPos.current.set(0.38, 1.15, 0.65);
          targetCamLook.current.set(tx, 0.75, -ty);
        } else {
          const tx = leftArm?.targetPose?.x ?? leftArm?.eePose?.x ?? -0.20;
          const ty = leftArm?.targetPose?.y ?? leftArm?.eePose?.y ?? 0.05;
          targetCamPos.current.set(-0.38, 1.15, 0.65);
          targetCamLook.current.set(tx, 0.75, -ty);
        }
        break;
      case 'TASK_POV':
        if (activeItem && activeItem.targetPos) {
          targetCamPos.current.set(activeItem.targetPos.x + 0.2, 1.05, -activeItem.targetPos.y + 0.3);
          targetCamLook.current.set(activeItem.targetPos.x, 0.76, -activeItem.targetPos.y);
        } else {
          targetCamPos.current.set(0, 1.1, 0.8);
          targetCamLook.current.set(0, 0.75, 0);
        }
        break;
    }
  }, [selectedArm, leftArm, rightArm, activeItem, onCameraPresetChange]);

  // Click Raycaster on Table to Command Selected Arm
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!container || !camera || !scene) return;

    const rect = container.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const intersects = raycaster.intersectObjects(scene.children, true);
    for (const hit of intersects) {
      if (hit.object.name.includes('left') || hit.object.parent?.name.includes('left')) {
        onSelectArm('left');
        return;
      }
      if (hit.object.name.includes('right') || hit.object.parent?.name.includes('right')) {
        onSelectArm('right');
        return;
      }
      if (hit.point && Math.abs(hit.point.y - 0.75) < 0.05) {
        const targetX = hit.point.x;
        const targetY = -hit.point.z;
        setTableTargetCoord({ x: targetX, y: targetY, z: 0.78 });

        if (selectedArm && onSetTargetPos) {
          onSetTargetPos(selectedArm, { x: targetX, y: targetY, z: 0.78 });
        }
        return;
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-[580px] flex flex-col bg-[#0b1220] overflow-hidden select-none">
      {/* 3D WebGL Canvas Container */}
      <div 
        ref={mountRef} 
        onPointerDown={handlePointerDown}
        className="w-full flex-1 min-h-[520px] cursor-grab active:cursor-grabbing"
      />

      {/* Top Floating Digital-Twin HUD Bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/60 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-400 font-mono tracking-wider">
              MUJOCO 3.X REAL-TIME 3D
            </span>
          </div>
          <div className="h-3.5 w-px bg-slate-700 mx-1" />
          <span className="text-xs text-slate-400 font-mono">
            {fps} FPS · 60 Hz Control
          </span>
          <div className="h-3.5 w-px bg-slate-700 mx-1" />
          <div className="flex items-center gap-1 text-xs text-amber-400 font-mono">
            <Flame className="w-3.5 h-3.5 animate-pulse" />
            <span>Candle Centerpiece Lit</span>
          </div>
        </div>

        {/* Selected Arm Pill & Pet Status */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Autonomous Pet Pill */}
          <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-xl">
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono text-slate-300">ROBOT PET:</span>
            <span className={`text-[11px] font-mono font-bold ${petActive ? 'text-cyan-400' : 'text-slate-500'}`}>
              {petActive ? '● ONLINE' : '○ OFF'}
            </span>
          </div>

          {/* Arm Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-xl">
            <span className="text-xs text-slate-400">Arm:</span>
            <button
              onClick={() => onSelectArm(selectedArm === 'left' ? null : 'left')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                selectedArm === 'left'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              🔴 Left
            </button>
            <button
              onClick={() => onSelectArm(selectedArm === 'right' ? null : 'right')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                selectedArm === 'right'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              🔵 Right
            </button>
          </div>
        </div>
      </div>

      {/* Floating Cinematic Camera Presets Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-950/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/70 shadow-2xl z-20 pointer-events-auto">
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 px-2">
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>VIEW:</span>
        </div>
        {[
          { id: 'CINEMATIC', label: 'CINEMATIC' },
          { id: 'TABLE_VIEW', label: 'TABLE VIEW' },
          { id: 'ROBOT_VIEW', label: 'ROBOT VIEW' },
          { id: 'DINNER_VIEW', label: 'DINNER VIEW' },
          { id: 'INSPECTOR', label: 'INSPECTOR' },
          { id: 'PET_CAM', label: 'PET CAM 🐕' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => handleCameraChange(item.id as CameraPreset)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all ${
              activeCamMode === item.id
                ? 'bg-gradient-to-r from-red-600 to-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Table Interaction Hint */}
      {selectedArm && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-amber-500/90 text-slate-950 text-xs font-semibold px-3 py-1 rounded-full shadow-lg pointer-events-none flex items-center gap-1.5 animate-pulse z-10">
          <Move className="w-3.5 h-3.5" />
          Click anywhere on tabletop to command {selectedArm.toUpperCase()} arm target
        </div>
      )}
    </div>
  );
};
