/**
 * TwinHands-AI: Photorealistic Interactive 3D Simulation Workspace
 * Built with Three.js for real-time bimanual robotic manipulation.
 * 
 * Features:
 * - Real-time animated dual SO-101 robotic arms (🔴 Red Left & 🔵 Blue Right)
 * - Articulated links (J1-J5) and parallel gripper finger mechanics
 * - Complete tableware collection (plates, bowls, cups, spoons, glasses, water jug, benchmark cube)
 * - Click/select arm or joints with emissive highlight
 * - Drag/click table to command target end-effector coordinates
 * - Camera modes: ORBIT, TOP, FRONT, LEFT, RIGHT, ROBOT POV, TASK POV
 * - Shadows, ambient occlusion, PBR materials, and coordinate grids
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Camera, Eye, Layers, Crosshair, Sparkles, Sliders, Maximize2, 
  RotateCcw, Compass, CheckCircle2, AlertTriangle, Shield, Info, Move
} from 'lucide-react';
import { TableLayoutPlan, SO101ArmTelemetry, TablewareItem } from '../types';

export type CameraPreset = 'ORBIT' | 'TOP' | 'FRONT' | 'LEFT' | 'RIGHT' | 'ROBOT_POV' | 'TASK_POV';

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
}

/**
 * Generates an ultra-crisp, procedural Spider-Man inspired texture for the water jug.
 * Features:
 * - Deep Spider-Man crimson background (#c8102e / #991b1b) with subtle gradient lighting
 * - Fine-pitch carbon tech micro-grid
 * - Black spider-web radiating spokes from front and rear nodes
 * - Scalloped catenary curves forming concentric webs
 * - Stylized metallic geometric spider emblem on the front chest
 * - Royal blue tech accent bands at top and bottom edges with black pin-stripes
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
  bgGrad.addColorStop(0.5, '#c8102e'); // Deep Spider-Man red
  bgGrad.addColorStop(0.8, '#991b1b');
  bgGrad.addColorStop(1.0, '#7f1d1d');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. High-tech micro-weave / carbon grid
  ctx.fillStyle = 'rgba(0, 0, 0, 0.09)';
  for (let y = 0; y < h; y += 6) {
    for (let x = 0; x < w; x += 6) {
      if ((x / 6 + y / 6) % 2 === 0) {
        ctx.fillRect(x, y, 3, 3);
      }
    }
  }

  // 3. Web Nodes: Front center (u = 0.50), Left quadrant (u = 0.25), Right quadrant (u = 0.75)
  const webCenters = [
    { x: w * 0.25, y: h * 0.50, isMain: false },
    { x: w * 0.50, y: h * 0.48, isMain: true }, // Front chest center
    { x: w * 0.75, y: h * 0.50, isMain: false },
  ];

  ctx.strokeStyle = '#0a0e17'; // Rich deep black web lines
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';

  webCenters.forEach((wc) => {
    const spokesCount = 16;
    const maxRadius = 380;
    const spokes: { x: number; y: number; angle: number }[] = [];

    // Radiating spokes
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

    // Concentric web arches (scalloped catenary curves)
    const radii = [24, 52, 86, 126, 172, 224, 280, 342];
    radii.forEach((r) => {
      ctx.beginPath();
      for (let i = 0; i < spokesCount; i++) {
        const next = (i + 1) % spokesCount;
        const x1 = wc.x + spokes[i].x * r;
        const y1 = wc.y + spokes[i].y * r;
        const x2 = wc.x + spokes[next].x * r;
        const y2 = wc.y + spokes[next].y * r;

        // Inward catenary sag towards web center
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

    // Front Chest Stylized Spider Insignia
    if (wc.isMain) {
      ctx.save();
      ctx.translate(wc.x, wc.y);

      // Black background shadow/casing
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

      // Metallic chrome / silver core
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

      // Sharp stylized geometric spider legs (4 on each side)
      ctx.strokeStyle = '#05070c';
      ctx.lineWidth = 3.6;
      ctx.lineJoin = 'miter';
      const legPaths = [
        // Upward pairs
        [ [6, -9], [22, -26], [34, -18] ],
        [ [-6, -9], [-22, -26], [-34, -18] ],
        [ [7, -3], [28, -12], [40, 2] ],
        [ [-7, -3], [-28, -12], [-40, 2] ],
        // Downward pairs
        [ [6, 6], [26, 14], [32, 32] ],
        [ [-6, 6], [-26, 14], [-32, 32] ],
        [ [4, 12], [18, 26], [24, 42] ],
        [ [-4, 12], [-18, 26], [-24, 42] ],
      ];

      legPaths.forEach(pts => {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        ctx.lineTo(pts[1][0], pts[1][1]);
        ctx.lineTo(pts[2][0], pts[2][1]);
        ctx.stroke();
      });

      ctx.restore();
    }
  });

  // 4. Dark Royal Blue & Carbon Tech Trim Bands at top and bottom edges
  ctx.fillStyle = '#1d4ed8'; // Dark royal blue
  ctx.fillRect(0, 0, w, 22);
  ctx.fillRect(0, h - 22, w, 22);

  ctx.fillStyle = '#0f172a'; // Carbon accent divider line
  ctx.fillRect(0, 22, w, 4);
  ctx.fillRect(0, h - 26, w, 4);

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
  cameraPreset = 'ORBIT',
  onCameraPresetChange,
  showReachRings = true,
  showTrajectories = true,
  showOpenVinoHUD = true,
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
  const tableElementsRef = useRef<{
    tabletop?: THREE.Mesh;
    edgeLine?: THREE.LineSegments;
    legs?: THREE.Mesh[];
  }>({});

  const [activeCamMode, setActiveCamMode] = useState<CameraPreset>(cameraPreset);
  const [tableTargetCoord, setTableTargetCoord] = useState<{ x: number; y: number; z: number } | null>(null);
  const [fps, setFps] = useState<number>(60);

  // Camera preset destinations
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.8, 1.9));
  const targetCamLook = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.75, 0));

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Robust width & height resolution (prevent zero-dimension failure)
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
    scene.background = new THREE.Color(0x080c14);
    scene.fog = new THREE.FogExp2(0x080c14, 0.12);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 50);
    camera.position.set(0, 1.8, 1.9);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.75, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't clip beneath floor
    controls.minDistance = 0.4;
    controls.maxDistance = 4.5;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.HemisphereLight(0x94a3b8, 0x0f172a, 0.75);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.6);
    mainLight.position.set(1.2, 3.2, 2.0);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 10;
    mainLight.shadow.bias = -0.0005;
    const d = 1.6;
    mainLight.shadow.camera.left = -d;
    mainLight.shadow.camera.right = d;
    mainLight.shadow.camera.top = d;
    mainLight.shadow.camera.bottom = -d;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    fillLight.position.set(-2, 2, -1.5);
    scene.add(fillLight);

    // Spot light over center workcell
    const spot = new THREE.SpotLight(0xffffff, 1.2, 8, Math.PI / 4, 0.4, 1);
    spot.position.set(0, 2.5, 0);
    spot.target.position.set(0, 0.75, 0);
    scene.add(spot);
    scene.add(spot.target);

    // 6. Floor & Coordinate Grid
    const floorGeo = new THREE.PlaneGeometry(10, 10);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x070b12,
      roughness: 0.85,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(8, 32, 0x1e293b, 0x0f172a);
    grid.position.y = 0.002;
    scene.add(grid);

    // 7. Dining Table (Scales dynamically based on plan)
    const tableGroup = new THREE.Group();
    tableGroup.name = 'dining_table';

    const initDims = plan?.tableDimensions || { widthM: 1.40, depthM: 0.90, heightM: 0.75 };
    const topThick = 0.032;
    const tabletopGeo = new THREE.BoxGeometry(initDims.widthM, topThick, initDims.depthM);
    const tabletopMat = new THREE.MeshStandardMaterial({
      color: 0x0e1420,
      roughness: 0.4,
      metalness: 0.6,
    });
    const tabletop = new THREE.Mesh(tabletopGeo, tabletopMat);
    tabletop.position.set(0, 0.75 - topThick / 2, 0);
    tabletop.castShadow = true;
    tabletop.receiveShadow = true;
    tableGroup.add(tabletop);

    // Tabletop border outline
    const edgeGeo = new THREE.EdgesGeometry(tabletopGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x1e293b, linewidth: 1 });
    const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
    edgeLine.position.copy(tabletop.position);
    tableGroup.add(edgeLine);

    // Four Legs
    const legGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.734, 16);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.8,
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
      tableGroup.add(leg);
      legMeshes.push(leg);
    });

    tableElementsRef.current = {
      tabletop,
      edgeLine,
      legs: legMeshes,
    };

    scene.add(tableGroup);

    // 8. Build Articulated Dual SO-101 Arms
    const createSO101Arm = (isLeft: boolean) => {
      const armGroup = new THREE.Group();
      armGroup.name = isLeft ? 'left_arm' : 'right_arm';

      // Base coordinates: [-0.38, 0.75, 0.42] or [0.38, 0.75, 0.42]
      const basePos = new THREE.Vector3(isLeft ? -0.38 : 0.38, 0.75, 0.42);
      armGroup.position.copy(basePos);

      const primaryColor = isLeft ? 0xdc2626 : 0x2563eb; // 🔴 Red Left / 🔵 Blue Right
      const secondaryColor = isLeft ? 0x1e3a8a : 0xb91c1c; // Spider-Man contrast
      const metallicBlack = 0x111827;

      const armMat = new THREE.MeshStandardMaterial({
        color: primaryColor,
        roughness: 0.35,
        metalness: 0.5,
      });

      const darkMat = new THREE.MeshStandardMaterial({
        color: secondaryColor,
        roughness: 0.4,
        metalness: 0.6,
      });

      const jointMat = new THREE.MeshStandardMaterial({
        color: metallicBlack,
        roughness: 0.3,
        metalness: 0.85,
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
        opacity: 0.7,
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
          opacity: 0.06,
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

    // 9. Tableware Group
    const tablewareGroup = new THREE.Group();
    tablewareGroup.name = 'tableware_collection';
    tablewareGroupRef.current = tablewareGroup;
    scene.add(tablewareGroup);

    // 10. Animation & Render Loop
    let lastTime = performance.now();
    let frameCount = 0;
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // FPS measurement
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }

      // Smooth camera tweening to target positions
      camera.position.lerp(targetCamPos.current, 0.06);
      controls.target.lerp(targetCamLook.current, 0.06);
      controls.update();

      renderer.render(scene, camera);
    };

    animate();

    // 11. Dynamic ResizeObserver for robust layout adaptation
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

  // Update Joint Angles in 3D Hierarchy safely
  useEffect(() => {
    // Left Arm Joints: [q1, q2, q3, q4, q5, gripper]
    const l = leftArmRefs.current;
    if (l.turret && l.upper && l.forearm && l.wrist && l.palm && l.fingerL && l.fingerR && leftArm?.jointAnglesDeg) {
      l.turret.rotation.y = THREE.MathUtils.degToRad(-(leftArm.jointAnglesDeg[0] || 0));
      l.upper.rotation.x = THREE.MathUtils.degToRad(leftArm.jointAnglesDeg[1] || 0);
      l.forearm.rotation.x = THREE.MathUtils.degToRad(leftArm.jointAnglesDeg[2] || 0);
      l.wrist.rotation.x = THREE.MathUtils.degToRad(leftArm.jointAnglesDeg[3] || 0);
      l.palm.rotation.y = THREE.MathUtils.degToRad(leftArm.jointAnglesDeg[4] || 0);

      // Gripper stroke (gripperState > 0.5 is grasped)
      const lGrasping = (leftArm.gripperState || 0) > 0.5;
      const lStroke = lGrasping ? 0.008 : 0.024;
      l.fingerL.position.x = -lStroke;
      l.fingerR.position.x = lStroke;

      // Target marker
      if (l.targetMarker) {
        const tx = leftArm.targetPose?.x ?? leftArm.eePose?.x ?? -0.20;
        const ty = leftArm.targetPose?.y ?? leftArm.eePose?.y ?? 0.05;
        l.targetMarker.position.set(tx, 0.755, -ty);
      }
    }

    // Right Arm Joints: [q1, q2, q3, q4, q5, gripper]
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

  // Update Dynamic Tableware Objects safely
  useEffect(() => {
    const group = tablewareGroupRef.current;
    if (!group) return;

    // Clear old items
    group.clear();

    const ceramicMat = new THREE.MeshStandardMaterial({
      color: 0xfafafa,
      roughness: 0.18,
      metalness: 0.08,
    });

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.12,
      metalness: 0.95,
    });

    // High-clarity optical borosilicate glass material for drinking glasses
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xf0f9ff,
      transmission: 0.94,
      opacity: 1.0,
      transparent: true,
      roughness: 0.02,
      metalness: 0.02,
      ior: 1.52, // Borosilicate optical glass refractive index
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      depthWrite: false,
    });

    // Realistic transparent liquid water with 1.333 physical refractive index
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0xc7ebfd,            // Subtle crystal cyan tint
      transmission: 0.94,         // Crystal clear transparency
      opacity: 1.0,
      transparent: true,
      roughness: 0.02,            // Mirror-smooth fluid body
      metalness: 0.02,
      ior: 1.333,                 // Exact physical index of refraction for water at 20°C
      attenuationColor: 0x0284c7, // Light absorption path color
      attenuationDistance: 0.22,  // Natural fluid absorption
      depthWrite: false,          // Essential for proper transparency sorting with outer glass
      side: THREE.DoubleSide,
    });

    // Specular top water surface plane with reflections and meniscus
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

    // Meniscus border material hugging glass/cup wall
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
      color: 0x1d4ed8, // Dark royal blue
      roughness: 0.20,
      metalness: 0.25,
      clearcoat: 0.85,
    });

    const blackAccentMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Deep slate black
      roughness: 0.35,
      metalness: 0.45,
    });

    const silverEmblemMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Polished chrome / silver
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

    // Helper: Create single tableware item mesh
    const createTablewareMesh = (type: string, isCompleted: boolean) => {
      const objGroup = new THREE.Group();

      if (type === 'plate') {
        // Realistic Ceramic Dinner Plate
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.095, 0.010, 32), ceramicMat);
        base.position.y = 0.005;
        base.castShadow = true;
        base.receiveShadow = true;
        objGroup.add(base);

        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.102, 0.008, 12, 32), ceramicMat);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 0.009;
        rim.castShadow = true;
        objGroup.add(rim);
      } else if (type === 'bowl') {
        // Soup Bowl nested appropriately atop / inside the plate
        const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.068, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), ceramicMat);
        bowl.rotation.x = Math.PI;
        bowl.position.y = 0.040;
        bowl.castShadow = true;
        objGroup.add(bowl);

        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.006, 24), ceramicMat);
        foot.position.y = 0.003;
        foot.castShadow = true;
        objGroup.add(foot);
      } else if (type === 'cup') {
        // --- CERAMIC CUP WITH 90% WATER LEVEL ---
        // Formula: waterHeight = cavityHeight * 0.90
        // Empty space: 10% below the top rim
        const cupTotalHeight = 0.076;
        const cupBaseThickness = 0.008;
        const cupWallThickness = 0.003;
        const cupCavityHeight = cupTotalHeight - cupBaseThickness; // 0.068m
        const cupWaterHeight = cupCavityHeight * 0.90; // 0.0612m (90% capacity)

        // Outer ceramic cup body
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.032, cupTotalHeight, 32), ceramicMat);
        cup.position.y = cupTotalHeight / 2;
        cup.castShadow = true;
        cup.receiveShadow = true;
        objGroup.add(cup);

        // Ceramic Handle
        const handle = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 8, 16, Math.PI), ceramicMat);
        handle.rotation.z = -Math.PI / 2;
        handle.position.set(0.038, 0.038, 0);
        handle.castShadow = true;
        objGroup.add(handle);

        // 90% Water Column inside Cup
        const cupInnerBotRadius = 0.032 - cupWallThickness; // 0.029m
        const cupInnerTopRadius = 0.036 - cupWallThickness; // 0.033m
        const cupWaterTopRadius = cupInnerBotRadius + (cupInnerTopRadius - cupInnerBotRadius) * 0.90; // 0.0326m

        const cupWaterMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(cupWaterTopRadius, cupInnerBotRadius, cupWaterHeight, 24),
          waterMat
        );
        cupWaterMesh.position.y = cupBaseThickness + cupWaterHeight / 2;
        objGroup.add(cupWaterMesh);

        // Horizontal Water Surface Disc at 90% (10% empty space below 0.076m rim)
        const cupWaterSurface = new THREE.Mesh(
          new THREE.CircleGeometry(cupWaterTopRadius - 0.0003, 24),
          waterSurfaceMat
        );
        cupWaterSurface.rotation.x = -Math.PI / 2;
        cupWaterSurface.position.y = cupBaseThickness + cupWaterHeight;
        objGroup.add(cupWaterSurface);

        // Capillary Meniscus Ring
        const cupMeniscus = new THREE.Mesh(
          new THREE.TorusGeometry(cupWaterTopRadius - 0.0006, 0.0006, 8, 24),
          waterMeniscusMat
        );
        cupMeniscus.rotation.x = Math.PI / 2;
        cupMeniscus.position.y = cupBaseThickness + cupWaterHeight;
        objGroup.add(cupMeniscus);

      } else if (type === 'spoon') {
        // Metallic Cutlery Spoon
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
        // Additional Spoon (companion spoon placed parallel)
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
      } else if (type === 'glass' || type === 'drinking_glass') {
        // --- REALISTIC DRINKING GLASS WITH EXACT 90% WATER LEVEL ---
        // Formula: waterHeight = cavityHeight * 0.90
        // Empty space: 10% below the top rim
        const totalGlassHeight = 0.110;
        const baseThickness = 0.012;
        const wallThickness = 0.0025;
        const topRadius = 0.035;
        const botRadius = 0.028;

        const cavityHeight = totalGlassHeight - baseThickness; // 0.098m
        const waterHeight = cavityHeight * 0.90; // 0.0882m (exactly 90%)

        // (a) Solid weighted optical glass base
        const glassBase = new THREE.Mesh(
          new THREE.CylinderGeometry(botRadius, botRadius - 0.001, baseThickness, 32),
          glassMat
        );
        glassBase.position.y = baseThickness / 2;
        glassBase.castShadow = true;
        glassBase.receiveShadow = true;
        objGroup.add(glassBase);

        // (b) Outer Borosilicate Glass Cylinder Body
        const glassWall = new THREE.Mesh(
          new THREE.CylinderGeometry(topRadius, botRadius, totalGlassHeight, 32, 1, true),
          glassMat
        );
        glassWall.position.y = totalGlassHeight / 2;
        glassWall.castShadow = true;
        objGroup.add(glassWall);

        // (c) Fire-Polished Rounded Glass Rim
        const rimTorus = new THREE.Mesh(
          new THREE.TorusGeometry(topRadius - wallThickness / 2, wallThickness / 2, 8, 32),
          glassMat
        );
        rimTorus.rotation.x = Math.PI / 2;
        rimTorus.position.y = totalGlassHeight;
        objGroup.add(rimTorus);

        // (d) Realistic 3D Water Volume (Transparent, Refractive ior 1.333, 90% Filled)
        const innerBotRadius = botRadius - wallThickness; // 0.0255m
        const innerTopRadius = topRadius - wallThickness; // 0.0325m
        const waterTopRadius = innerBotRadius + (innerTopRadius - innerBotRadius) * 0.90; // 0.0318m

        const waterMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(waterTopRadius, innerBotRadius, waterHeight, 32),
          waterMat
        );
        waterMesh.position.y = baseThickness + waterHeight / 2;
        objGroup.add(waterMesh);

        // (e) Horizontal Flat Water Surface Disc at 90% Level (10% Below Rim)
        const waterSurfaceDisc = new THREE.Mesh(
          new THREE.CircleGeometry(waterTopRadius - 0.0004, 32),
          waterSurfaceMat
        );
        waterSurfaceDisc.rotation.x = -Math.PI / 2;
        waterSurfaceDisc.position.y = baseThickness + waterHeight; // 0.1002m (10% below 0.110m rim)
        objGroup.add(waterSurfaceDisc);

        // (f) Natural Capillary Meniscus Ring near the Glass Wall
        const meniscusRing = new THREE.Mesh(
          new THREE.TorusGeometry(waterTopRadius - 0.0008, 0.0008, 8, 32),
          waterMeniscusMat
        );
        meniscusRing.rotation.x = Math.PI / 2;
        meniscusRing.position.y = baseThickness + waterHeight;
        objGroup.add(meniscusRing);

      } else if (type === 'jug' || type === 'water_jug') {
        // --- SPIDER-MAN THEMED WATER JUG WITH 90% WATER ---
        // Dominant deep Spider-Man red body with black spider-web pattern,
        // royal blue secondary sections, subtle black detailing, stylized metallic spider emblem,
        // and internal transparent water filled to 90% capacity!

        // (a) Dark Royal Blue Pedestal Base
        const baseCollar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.066, 0.068, 0.014, 32),
          royalBlueMat
        );
        baseCollar.position.y = 0.007;
        baseCollar.castShadow = true;
        baseCollar.receiveShadow = true;
        objGroup.add(baseCollar);

        // Black accent divider ring at base
        const baseBlackRing = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0665, 0.0665, 0.003, 32),
          blackAccentMat
        );
        baseBlackRing.position.y = 0.015;
        objGroup.add(baseBlackRing);

        // (b) Transparent Interior Borosilicate Glass Core
        // Allows water inside the jug to refract light and remain visible through viewing windows
        const innerGlassCore = new THREE.Mesh(
          new THREE.CylinderGeometry(0.062, 0.062, 0.145, 32),
          jugGlassMat
        );
        innerGlassCore.position.y = 0.082;
        objGroup.add(innerGlassCore);

        // (c) Dominant Deep Spider-Man Red Body with Black Spider-Web Pattern
        const bodyWeb = new THREE.Mesh(
          new THREE.CylinderGeometry(0.065, 0.065, 0.120, 32, 1, true),
          spidermanRedMat
        );
        bodyWeb.position.y = 0.076;
        bodyWeb.castShadow = true;
        objGroup.add(bodyWeb);

        // Transparent vertical gauge / level windows letting light pass to display internal 90% water
        const gaugeGlass = new THREE.Mesh(
          new THREE.BoxGeometry(0.014, 0.108, 0.132),
          jugGlassMat
        );
        gaugeGlass.position.set(0, 0.076, 0);
        objGroup.add(gaugeGlass);

        // Black accent divider ring at neck
        const neckBlackRing = new THREE.Mesh(
          new THREE.CylinderGeometry(0.052, 0.0652, 0.004, 32),
          blackAccentMat
        );
        neckBlackRing.position.y = 0.138;
        objGroup.add(neckBlackRing);

        // (d) Dark Royal Blue Neck Collar & Spout
        const neckCollar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.048, 0.052, 0.026, 32),
          royalBlueMat
        );
        neckCollar.position.y = 0.151;
        neckCollar.castShadow = true;
        objGroup.add(neckCollar);

        // Aerodynamic dripless pouring spout
        const spoutLip = new THREE.Mesh(
          new THREE.ConeGeometry(0.018, 0.024, 16),
          royalBlueMat
        );
        spoutLip.rotation.x = -Math.PI / 3;
        spoutLip.position.set(0, 0.162, 0.052);
        spoutLip.castShadow = true;
        objGroup.add(spoutLip);

        // Subtle black spout accent tip
        const spoutTip = new THREE.Mesh(
          new THREE.ConeGeometry(0.008, 0.012, 16),
          blackAccentMat
        );
        spoutTip.rotation.x = -Math.PI / 3;
        spoutTip.position.set(0, 0.167, 0.060);
        objGroup.add(spoutTip);

        // (e) Ergonomic Royal Blue D-Handle with Matte Black Grip (42mm clearance for SO-101)
        const handle = new THREE.Mesh(
          new THREE.TorusGeometry(0.040, 0.008, 16, 32, Math.PI),
          royalBlueMat
        );
        handle.rotation.z = Math.PI / 2;
        handle.position.set(0, 0.082, -0.068);
        handle.castShadow = true;
        objGroup.add(handle);

        // Matte black inner anti-slip grip lining
        const innerGrip = new THREE.Mesh(
          new THREE.TorusGeometry(0.036, 0.004, 12, 32, Math.PI),
          blackAccentMat
        );
        innerGrip.rotation.z = Math.PI / 2;
        innerGrip.position.set(0, 0.082, -0.068);
        objGroup.add(innerGrip);

        // (f) 3D Stylized Metallic Spider Emblem on Front Chest
        const emblemBody = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.008, 1),
          silverEmblemMat
        );
        emblemBody.scale.set(0.6, 1.4, 0.3);
        emblemBody.position.set(0, 0.080, 0.066);
        objGroup.add(emblemBody);

        // Angular metallic spider legs
        [-1, 1].forEach((side) => {
          const upperLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.0012, 0.0012, 0.018, 8),
            blackAccentMat
          );
          upperLeg.rotation.z = side * Math.PI / 3;
          upperLeg.position.set(side * 0.011, 0.088, 0.066);
          objGroup.add(upperLeg);

          const lowerLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.0012, 0.0012, 0.018, 8),
            blackAccentMat
          );
          lowerLeg.rotation.z = side * -Math.PI / 3;
          lowerLeg.position.set(side * 0.011, 0.072, 0.066);
          objGroup.add(lowerLeg);
        });

        // (g) REALISTIC WATER INSIDE JUG — 90% CAPACITY
        // Jug cavity height: 0.150m. 90% water height: 0.135m. Empty space: 0.015m (10%) below rim at 0.164m.
        const jugWaterHeight = 0.150 * 0.90; // 0.135m
        const jugWaterRadius = 0.059;
        const jugWaterMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(jugWaterRadius, jugWaterRadius, jugWaterHeight, 32),
          waterMat
        );
        // Base is at 0.014m, center is at 0.014 + 0.135 / 2 = 0.0815m
        jugWaterMesh.position.y = 0.014 + jugWaterHeight / 2;
        objGroup.add(jugWaterMesh);

        // Top horizontal water surface disc at 90% capacity
        const jugWaterSurface = new THREE.Mesh(
          new THREE.CircleGeometry(jugWaterRadius - 0.0005, 32),
          waterSurfaceMat
        );
        jugWaterSurface.rotation.x = -Math.PI / 2;
        jugWaterSurface.position.y = 0.014 + jugWaterHeight;
        objGroup.add(jugWaterSurface);

        // Capillary meniscus ring contouring the jug glass wall
        const jugMeniscus = new THREE.Mesh(
          new THREE.TorusGeometry(jugWaterRadius - 0.001, 0.0015, 8, 32),
          waterMeniscusMat
        );
        jugMeniscus.rotation.x = Math.PI / 2;
        jugMeniscus.position.y = 0.014 + jugWaterHeight;
        objGroup.add(jugMeniscus);

      } else {
        const cubeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
        const cube = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), cubeMat);
        cube.position.y = 0.015;
        cube.castShadow = true;
        objGroup.add(cube);
      }

      // Add green verified glow ring if completed
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

    // Render Completed, Active, and Staged Items
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
          // Idle / Completed preview
          pos = item.targetPos;
        }

        if (pos) {
          const itemMesh = createTablewareMesh(item.type, isDone);
          const arcZ = pos.z || 0;
          itemMesh.position.set(pos.x, 0.750 + arcZ, -pos.y);
          if (item.orientation !== undefined) {
            itemMesh.rotation.y = THREE.MathUtils.degToRad(-item.orientation);
          }
          group.add(itemMesh);
        }
      });
    }

    // Default static centerpiece: Spider-Man Themed Water Jug (90% Water)
    const jugMesh = createTablewareMesh('jug', true);
    jugMesh.position.set(0.0, 0.751, -0.06);
    group.add(jugMesh);

    // Left Drinking Glass (90% Water, 10% Empty Headspace)
    const glassMeshLeft = createTablewareMesh('glass', true);
    glassMeshLeft.position.set(-0.16, 0.751, -0.06);
    group.add(glassMeshLeft);

    // Right Drinking Glass (90% Water, 10% Empty Headspace)
    const glassMeshRight = createTablewareMesh('glass', true);
    glassMeshRight.position.set(0.16, 0.751, -0.06);
    group.add(glassMeshRight);

  }, [plan, completedItems, activeItem, isPlaying]);

  // Camera Mode Transitions safely
  const handleCameraChange = useCallback((mode: CameraPreset) => {
    setActiveCamMode(mode);
    if (onCameraPresetChange) onCameraPresetChange(mode);

    switch (mode) {
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
        // Over-the-shoulder POV of Left or Right arm
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

    // Check hit on Tabletop or Arms
    const intersects = raycaster.intersectObjects(scene.children, true);
    for (const hit of intersects) {
      // Clicked left arm
      if (hit.object.name.includes('left') || hit.object.parent?.name.includes('left')) {
        onSelectArm('left');
        return;
      }
      // Clicked right arm
      if (hit.object.name.includes('right') || hit.object.parent?.name.includes('right')) {
        onSelectArm('right');
        return;
      }
      // Clicked tabletop: send target position to selected arm
      if (hit.point && Math.abs(hit.point.y - 0.75) < 0.05) {
        const targetX = hit.point.x;
        const targetY = -hit.point.z; // Convert Three.js Z to Table frame Y
        setTableTargetCoord({ x: targetX, y: targetY, z: 0.78 });

        if (selectedArm && onSetTargetPos) {
          onSetTargetPos(selectedArm, { x: targetX, y: targetY, z: 0.78 });
        }
        return;
      }
    }
  };

  return (
    <div className="relative w-full h-full min-h-[580px] flex flex-col bg-[#080c14] overflow-hidden select-none">
      {/* 3D WebGL Canvas Container */}
      <div 
        ref={mountRef} 
        onPointerDown={handlePointerDown}
        className="w-full flex-1 min-h-[520px] cursor-grab active:cursor-grabbing"
      />

      {/* Top Floating Simulation Bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/60 shadow-xl pointer-events-auto">
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
        </div>

        {/* Selected Arm Pill */}
        <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-xl pointer-events-auto">
          <span className="text-xs text-slate-400">Selected Arm:</span>
          <button
            onClick={() => onSelectArm(selectedArm === 'left' ? null : 'left')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              selectedArm === 'left'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            🔴 Red Left
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
            🔵 Blue Right
          </button>
        </div>
      </div>

      {/* Floating Camera Presets Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/70 shadow-2xl z-20 pointer-events-auto">
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 px-2">
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>VIEW:</span>
        </div>
        {(['ORBIT', 'TOP', 'FRONT', 'LEFT', 'RIGHT', 'ROBOT_POV', 'TASK_POV'] as CameraPreset[]).map((mode) => (
          <button
            key={mode}
            onClick={() => handleCameraChange(mode)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all ${
              activeCamMode === mode
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {mode.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table Interaction Hint */}
      {selectedArm && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-amber-500/90 text-slate-950 text-xs font-semibold px-3 py-1 rounded-full shadow-lg pointer-events-none flex items-center gap-1.5 animate-pulse">
          <Move className="w-3.5 h-3.5" />
          Click anywhere on tabletop to command {selectedArm.toUpperCase()} arm target
        </div>
      )}
    </div>
  );
};
