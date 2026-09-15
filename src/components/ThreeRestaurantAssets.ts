/**
 * TwinHands-AI: 3D Restaurant Assets, Decor, Architecture & Robotic Pet
 * 
 * Provides:
 * 1. Procedural textures (dark polished hardwood floor, architectural slatted wood, Spider-Man web, cloth napkins)
 * 2. Restaurant Room Architecture (floors, acoustic slat walls, ambient Spider-Man red/blue strips, framed art, planters, ceiling downlights)
 * 3. Large Centerpiece Candle (tall ivory pillar, 3D flame, flickering warm PointLight casting soft shadows)
 * 4. Realistic Modern Dining Chairs (cushioned, ergonomic backrest, red/blue piping accents, dynamic positioning)
 * 5. Cutlery (Stainless steel dinner forks, knives, spoons) & Folded Napkins
 * 6. Autonomous Quadruped Robot Companion Pet (chassis, glowing visor, 4 articulated legs, alternating gait walking cycle, navigation waypoints, idle scanning behavior)
 */

import * as THREE from 'three';
import { RobotPetTelemetry } from '../types';

// =========================================================================
// 1. PROCEDURAL TEXTURES
// =========================================================================

let cachedFloorTex: THREE.CanvasTexture | null = null;
export function getDarkWoodFloorTexture(): THREE.CanvasTexture {
  if (cachedFloorTex) return cachedFloorTex;
  if (typeof document === 'undefined') return new THREE.CanvasTexture({} as HTMLCanvasElement);

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Dark rich walnut base with warm chestnut undertones
  ctx.fillStyle = '#1c1511';
  ctx.fillRect(0, 0, 1024, 1024);

  // Parquet / Plank pattern
  const plankH = 32;
  const plankW = 128;
  ctx.lineWidth = 1;

  for (let y = 0; y < 1024; y += plankH) {
    const row = Math.floor(y / plankH);
    const xOffset = (row % 2) * (plankW / 2);
    for (let x = -plankW; x < 1024 + plankW; x += plankW) {
      const plankX = x + xOffset;
      // Rich walnut plank variations: warm amber/chestnut values
      const baseR = 42 + Math.floor(Math.sin(row * 13 + x * 7) * 9);
      const baseG = 30 + Math.floor(Math.sin(row * 17 + x * 5) * 7);
      const baseB = 22 + Math.floor(Math.sin(row * 19 + x * 11) * 6);
      ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
      ctx.fillRect(plankX, y, plankW - 2, plankH - 2);

      // Fine golden-wood grain lines
      ctx.strokeStyle = `rgba(212, 175, 55, 0.045)`;
      for (let g = 0; g < 4; g++) {
        const gy = y + 4 + g * 7;
        ctx.beginPath();
        ctx.moveTo(plankX, gy);
        ctx.lineTo(plankX + plankW - 2, gy);
        ctx.stroke();
      }

      // Plank gap shadow
      ctx.strokeStyle = '#0e0a08';
      ctx.strokeRect(plankX, y, plankW - 2, plankH - 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.anisotropy = 8;
  cachedFloorTex = texture;
  return texture;
}

let cachedSlattedTex: THREE.CanvasTexture | null = null;
export function getSlattedWallTexture(): THREE.CanvasTexture {
  if (cachedSlattedTex) return cachedSlattedTex;
  if (typeof document === 'undefined') return new THREE.CanvasTexture({} as HTMLCanvasElement);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#111622'; // Dark acoustic felt backing
  ctx.fillRect(0, 0, 512, 512);

  // Vertical acoustic wooden slats
  const slatW = 16;
  for (let x = 0; x < 512; x += slatW) {
    const slatR = 52 + Math.floor(Math.sin(x * 0.4) * 8);
    const slatG = 38 + Math.floor(Math.sin(x * 0.4) * 6);
    const slatB = 28 + Math.floor(Math.sin(x * 0.4) * 5);
    ctx.fillStyle = `rgb(${slatR}, ${slatG}, ${slatB})`;
    ctx.fillRect(x, 0, slatW - 4, 512);

    // Slat warm edge highlight
    ctx.fillStyle = 'rgba(255, 235, 205, 0.07)';
    ctx.fillRect(x, 0, 2, 512);

    // Slat shadow gap
    ctx.fillStyle = '#080a10';
    ctx.fillRect(x + slatW - 4, 0, 4, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 2);
  texture.anisotropy = 8;
  cachedSlattedTex = texture;
  return texture;
}

let cachedNapkinTex: THREE.CanvasTexture | null = null;
export function getNapkinTexture(): THREE.CanvasTexture {
  if (cachedNapkinTex) return cachedNapkinTex;
  if (typeof document === 'undefined') return new THREE.CanvasTexture({} as HTMLCanvasElement);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = '#111827'; // Dark charcoal fabric
  ctx.fillRect(0, 0, 256, 256);

  // Fine fabric weave
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 256; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  // Subtle web lattice watermark
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
  ctx.lineWidth = 1.2;
  const cx = 128, cy = 128;
  for (let r = 20; r <= 100; r += 24) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let a = 0; a < 8; a++) {
    const rad = (a * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(rad) * 110, cy + Math.sin(rad) * 110);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  cachedNapkinTex = texture;
  return texture;
}

// =========================================================================
function createSpiderWebWallArt(): THREE.Group {
  const webGroup = new THREE.Group();
  webGroup.name = 'spider_web_wall_decor';
  webGroup.position.set(0, 0, 0.06);

  const webMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.25,
  });

  const spokes = 16;
  const maxR = 1.7;
  const points: THREE.Vector3[] = [];

  for (let s = 0; s < spokes; s++) {
    const angle = (s / spokes) * Math.PI * 2;
    points.push(new THREE.Vector3(0, 0, 0));
    points.push(new THREE.Vector3(Math.cos(angle) * maxR, Math.sin(angle) * maxR, 0));
  }

  const rings = [0.25, 0.55, 0.90, 1.30, 1.65];
  rings.forEach((r) => {
    for (let s = 0; s < spokes; s++) {
      const a1 = (s / spokes) * Math.PI * 2;
      const a2 = (((s + 1) % spokes) / spokes) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a1) * r, Math.sin(a1) * r, 0));
      points.push(new THREE.Vector3(Math.cos(a2) * r, Math.sin(a2) * r, 0));
    }
  });

  const geom = new THREE.BufferGeometry().setFromPoints(points);
  const lines = new THREE.LineSegments(geom, webMat);
  webGroup.add(lines);

  // Subtle red nodes at alternate vertices
  const redNodeMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.35 });
  const nodeGeo = new THREE.CircleGeometry(0.018, 8);
  rings.forEach((r, idx) => {
    if (idx % 2 === 1) {
      for (let s = 0; s < spokes; s += 2) {
        const a = (s / spokes) * Math.PI * 2;
        const node = new THREE.Mesh(nodeGeo, redNodeMat);
        node.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.001);
        webGroup.add(node);
      }
    }
  });

  return webGroup;
}

export interface RestaurantLightingRig {
  roomGroup: THREE.Group;
  candleLight: THREE.PointLight;
  flameMesh: THREE.Mesh;
  overheadSpot: THREE.SpotLight;
  leftRedWash: THREE.PointLight;
  rightBlueWash: THREE.PointLight;
  leftArmKeySpot: THREE.SpotLight;
  rightArmKeySpot: THREE.SpotLight;
  leftArmRimLight: THREE.DirectionalLight;
  rightArmRimLight: THREE.DirectionalLight;
  ceilingDownlights: THREE.PointLight[];
}

export type LightingPreset = 'CINEMATIC' | 'RESTAURANT' | 'ROBOT_LAB' | 'SPIDER_NIGHT';

export function applyLightingPreset(
  rig: RestaurantLightingRig,
  hemiLight: THREE.HemisphereLight | null,
  ambientLight: THREE.AmbientLight | null,
  preset: LightingPreset
) {
  switch (preset) {
    case 'RESTAURANT':
      // Warm, intimate dining ambience, prominent candle glow, subtle accents
      if (hemiLight) {
        hemiLight.color.setHex(0xfde047);
        hemiLight.groundColor.setHex(0x271911);
        hemiLight.intensity = 0.45;
      }
      if (ambientLight) {
        ambientLight.color.setHex(0x292524);
        ambientLight.intensity = 0.40;
      }
      rig.overheadSpot.color.setHex(0xffedd5);
      rig.overheadSpot.intensity = 2.8;
      rig.candleLight.color.setHex(0xffa040);
      rig.candleLight.intensity = 3.2;
      rig.leftRedWash.color.setHex(0xdc2626);
      rig.leftRedWash.intensity = 0.8;
      rig.rightBlueWash.color.setHex(0x2563eb);
      rig.rightBlueWash.intensity = 0.8;
      rig.leftArmKeySpot.color.setHex(0xfff1f2);
      rig.leftArmKeySpot.intensity = 1.3;
      rig.rightArmKeySpot.color.setHex(0xf0f9ff);
      rig.rightArmKeySpot.intensity = 1.3;
      rig.leftArmRimLight.intensity = 0.5;
      rig.rightArmRimLight.intensity = 0.5;
      rig.ceilingDownlights.forEach(dl => {
        dl.color.setHex(0xffedd5);
        dl.intensity = 1.4;
      });
      break;

    case 'ROBOT_LAB':
      // High-visibility studio lighting, neutral white, maximized robot joint visibility
      if (hemiLight) {
        hemiLight.color.setHex(0x38bdf8);
        hemiLight.groundColor.setHex(0x1e293b);
        hemiLight.intensity = 0.70;
      }
      if (ambientLight) {
        ambientLight.color.setHex(0x334155);
        ambientLight.intensity = 0.55;
      }
      rig.overheadSpot.color.setHex(0xffffff);
      rig.overheadSpot.intensity = 2.2;
      rig.candleLight.color.setHex(0xff9933);
      rig.candleLight.intensity = 1.8;
      rig.leftRedWash.color.setHex(0xef4444);
      rig.leftRedWash.intensity = 1.6;
      rig.rightBlueWash.color.setHex(0x3b82f6);
      rig.rightBlueWash.intensity = 1.6;
      rig.leftArmKeySpot.color.setHex(0xffffff);
      rig.leftArmKeySpot.intensity = 2.4;
      rig.rightArmKeySpot.color.setHex(0xffffff);
      rig.rightArmKeySpot.intensity = 2.4;
      rig.leftArmRimLight.intensity = 1.2;
      rig.rightArmRimLight.intensity = 1.2;
      rig.ceilingDownlights.forEach(dl => {
        dl.color.setHex(0xf8fafc);
        dl.intensity = 1.6;
      });
      break;

    case 'SPIDER_NIGHT':
      // Dramatic superhero noir: vibrant red and blue neon rim lights, high contrast
      if (hemiLight) {
        hemiLight.color.setHex(0x1d4ed8);
        hemiLight.groundColor.setHex(0x450a0a);
        hemiLight.intensity = 0.45;
      }
      if (ambientLight) {
        ambientLight.color.setHex(0x0f172a);
        ambientLight.intensity = 0.25;
      }
      rig.overheadSpot.color.setHex(0xffedd5);
      rig.overheadSpot.intensity = 2.0;
      rig.candleLight.color.setHex(0xff7700);
      rig.candleLight.intensity = 2.8;
      rig.leftRedWash.color.setHex(0xff0000);
      rig.leftRedWash.intensity = 2.4;
      rig.rightBlueWash.color.setHex(0x0066ff);
      rig.rightBlueWash.intensity = 2.4;
      rig.leftArmKeySpot.color.setHex(0xff3344);
      rig.leftArmKeySpot.intensity = 2.0;
      rig.rightArmKeySpot.color.setHex(0x0088ff);
      rig.rightArmKeySpot.intensity = 2.0;
      rig.leftArmRimLight.intensity = 1.6;
      rig.rightArmRimLight.intensity = 1.6;
      rig.ceilingDownlights.forEach(dl => {
        dl.color.setHex(0x1e293b);
        dl.intensity = 0.7;
      });
      break;

    case 'CINEMATIC':
    default:
      // Balanced cinematic look: warm table + Spider-Man red/blue accents + soft shadows
      if (hemiLight) {
        hemiLight.color.setHex(0x38bdf8);
        hemiLight.groundColor.setHex(0x1c1917);
        hemiLight.intensity = 0.55;
      }
      if (ambientLight) {
        ambientLight.color.setHex(0x1e293b);
        ambientLight.intensity = 0.35;
      }
      rig.overheadSpot.color.setHex(0xfff1e0);
      rig.overheadSpot.intensity = 2.4;
      rig.candleLight.color.setHex(0xff9933);
      rig.candleLight.intensity = 2.6;
      rig.leftRedWash.color.setHex(0xef4444);
      rig.leftRedWash.intensity = 1.4;
      rig.rightBlueWash.color.setHex(0x3b82f6);
      rig.rightBlueWash.intensity = 1.4;
      rig.leftArmKeySpot.color.setHex(0xffe4e6);
      rig.leftArmKeySpot.intensity = 1.6;
      rig.rightArmKeySpot.color.setHex(0xdbeafe);
      rig.rightArmKeySpot.intensity = 1.6;
      rig.leftArmRimLight.intensity = 0.8;
      rig.rightArmRimLight.intensity = 0.8;
      rig.ceilingDownlights.forEach(dl => {
        dl.color.setHex(0xffeedd);
        dl.intensity = 1.2;
      });
      break;
  }
}

// 2. RESTAURANT ARCHITECTURE & INTERIOR
// =========================================================================

export function createRestaurantRoom(): RestaurantLightingRig {
  const roomGroup = new THREE.Group();
  roomGroup.name = 'restaurant_interior';

  // Materials
  const floorTex = getDarkWoodFloorTexture();
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.28,
    metalness: 0.12,
  });

  const slatTex = getSlattedWallTexture();
  const wallMat = new THREE.MeshStandardMaterial({
    map: slatTex,
    roughness: 0.55,
    metalness: 0.15,
  });

  const featureWallMat = new THREE.MeshStandardMaterial({
    color: 0x141a29,
    roughness: 0.45,
    metalness: 0.25,
  });

  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0x0a0e1a,
    roughness: 0.8,
    metalness: 0.1,
  });

  const brassTrimMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.3,
    metalness: 0.85,
  });

  const neonRedMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
  });

  const neonBlueMat = new THREE.MeshBasicMaterial({
    color: 0x3b82f6,
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.3,
    metalness: 0.8,
  });

  // A. Floor (14m x 14m)
  const floorGeo = new THREE.PlaneGeometry(14, 14);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  roomGroup.add(floor);

  // Subtle coordinate ambient ground ring (Spider-Man tech aesthetic)
  const ringGeo = new THREE.RingGeometry(2.4, 2.44, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.18,
  });
  const techRing = new THREE.Mesh(ringGeo, ringMat);
  techRing.rotation.x = -Math.PI / 2;
  techRing.position.y = 0.001;
  roomGroup.add(techRing);

  // B. North Wall (Behind Dining Table, Z = -4.5m)
  const northWallGroup = new THREE.Group();
  northWallGroup.position.set(0, 2.25, -4.5);

  const northWall = new THREE.Mesh(new THREE.BoxGeometry(14, 4.5, 0.2), wallMat);
  northWall.receiveShadow = true;
  northWallGroup.add(northWall);

  // Center Feature Panel (Wood + Dark Stone)
  const featurePanel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.8, 0.08), featureWallMat);
  featurePanel.position.set(0, 0, 0.12);
  northWallGroup.add(featurePanel);

  // Subtle Spider-Web Wall Motif inside feature panel
  const spiderWebDecor = createSpiderWebWallArt();
  featurePanel.add(spiderWebDecor);

  // Gold Trim Border for Feature Panel
  const panelFrame = new THREE.Mesh(new THREE.BoxGeometry(5.3, 3.9, 0.04), brassTrimMat);
  panelFrame.position.set(0, 0, 0.08);
  northWallGroup.add(panelFrame);

  // Illuminated Restaurant Signboard: "ATELIER WEBSPINNER"
  const signBacking = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.45, 0.06), darkMetalMat);
  signBacking.position.set(0, 1.4, 0.2);
  northWallGroup.add(signBacking);

  // Framed Artwork / Architectural Schematics on Feature Wall
  [-1.4, 1.4].forEach((xOff, idx) => {
    const artFrame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.04), brassTrimMat);
    artFrame.position.set(xOff, 0.1, 0.2);
    northWallGroup.add(artFrame);

    const artCanvas = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 1.5),
      new THREE.MeshStandardMaterial({
        color: idx === 0 ? 0x1e1b4b : 0x450a0a,
        roughness: 0.4,
        metalness: 0.2,
      })
    );
    artCanvas.position.set(xOff, 0.1, 0.23);
    northWallGroup.add(artCanvas);

    // Small accent picture light above frame
    const picLight = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 16), brassTrimMat);
    picLight.rotation.z = Math.PI / 2;
    picLight.position.set(xOff, 1.0, 0.32);
    northWallGroup.add(picLight);
  });

  // Recessed Neon Strip along North Wall Top & Baseboard
  const neonTopNorth = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.02, 0.04), neonBlueMat);
  neonTopNorth.position.set(0, 2.15, 0.15);
  northWallGroup.add(neonTopNorth);

  const neonBotNorth = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.02, 0.04), neonRedMat);
  neonBotNorth.position.set(0, -2.15, 0.15);
  northWallGroup.add(neonBotNorth);

  roomGroup.add(northWallGroup);

  // C. West Wall (Left Side, X = -6.5m)
  const westWallGroup = new THREE.Group();
  westWallGroup.position.set(-6.5, 2.25, 0);
  westWallGroup.rotation.y = Math.PI / 2;

  const westWall = new THREE.Mesh(new THREE.BoxGeometry(14, 4.5, 0.2), wallMat);
  westWall.receiveShadow = true;
  westWallGroup.add(westWall);

  // Spider-Man Red Accent Cove Strip
  const westRedCove = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.03, 0.04), neonRedMat);
  westRedCove.position.set(0, 1.2, 0.12);
  westWallGroup.add(westRedCove);

  // Wall Sconces (Left)
  [-3.0, 0.0, 3.0].forEach(z => {
    const sconceBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.28, 16), brassTrimMat);
    sconceBase.position.set(z, 0.2, 0.16);
    westWallGroup.add(sconceBase);

    const sconceLight = new THREE.PointLight(0xffedd5, 0.4, 4, 2);
    sconceLight.position.set(z, 0.2, 0.25);
    westWallGroup.add(sconceLight);
  });

  roomGroup.add(westWallGroup);

  // D. East Wall (Right Side, X = +6.5m)
  const eastWallGroup = new THREE.Group();
  eastWallGroup.position.set(6.5, 2.25, 0);
  eastWallGroup.rotation.y = -Math.PI / 2;

  const eastWall = new THREE.Mesh(new THREE.BoxGeometry(14, 4.5, 0.2), wallMat);
  eastWall.receiveShadow = true;
  eastWallGroup.add(eastWall);

  // Spider-Man Blue Accent Cove Strip
  const eastBlueCove = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.03, 0.04), neonBlueMat);
  eastBlueCove.position.set(0, 1.2, 0.12);
  eastWallGroup.add(eastBlueCove);

  // Wall Sconces (Right)
  [-3.0, 0.0, 3.0].forEach(z => {
    const sconceBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.28, 16), brassTrimMat);
    sconceBase.position.set(z, 0.2, 0.16);
    eastWallGroup.add(sconceBase);

    const sconceLight = new THREE.PointLight(0xdbeafe, 0.4, 4, 2);
    sconceLight.position.set(z, 0.2, 0.25);
    eastWallGroup.add(sconceLight);
  });

  roomGroup.add(eastWallGroup);

  // E. Ceiling (Y = 4.5m)
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 4.5;
  roomGroup.add(ceiling);

  // Recessed warm ceiling spotlight fixtures
  const spotGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16);
  [
    [-1.2, -1.0], [1.2, -1.0],
    [-1.2, 1.0],  [1.2, 1.0],
    [0.0, 0.0],
  ].forEach(([sx, sz]) => {
    const fixture = new THREE.Mesh(spotGeo, brassTrimMat);
    fixture.position.set(sx, 4.48, sz);
    roomGroup.add(fixture);
  });

  // F. Modern Indoor Restaurant Planters with Lush Greenery (Placed in corners)
  const plantPositions: [number, number][] = [
    [-4.8, -3.6],
    [4.8, -3.6],
    [-4.8, 3.2],
    [4.8, 3.2],
  ];

  const plantLeafMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.35,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  plantPositions.forEach(([px, pz]) => {
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.18, 0.72, 24),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.5 })
    );
    pot.position.set(px, 0.36, pz);
    pot.castShadow = true;
    pot.receiveShadow = true;
    roomGroup.add(pot);

    // Brass accent rim around planter
    const potRim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.015, 8, 24), brassTrimMat);
    potRim.rotation.x = Math.PI / 2;
    potRim.position.set(px, 0.72, pz);
    roomGroup.add(potRim);

    // Stylized broad leaves (Monstera / Fiddle Leaf)
    for (let l = 0; l < 8; l++) {
      const leafGeo = new THREE.SphereGeometry(0.26, 8, 8);
      leafGeo.scale(1.0, 0.1, 1.8);
      const leaf = new THREE.Mesh(leafGeo, plantLeafMat);
      const angle = (l * Math.PI * 2) / 8;
      leaf.position.set(
        px + Math.cos(angle) * 0.18,
        0.82 + (l % 3) * 0.14,
        pz + Math.sin(angle) * 0.18
      );
      leaf.rotation.x = 0.4 + (l % 2) * 0.2;
      leaf.rotation.y = angle;
      leaf.castShadow = true;
      roomGroup.add(leaf);
    }
  });

  // G. Dynamic Multi-Point Cinematic Lighting Architecture
  // 1. 4 Overhead Restaurant Downlights (creating warm light pools on floor & chairs)
  const ceilingDownlights: THREE.PointLight[] = [];
  const downlightPositions: [number, number, number][] = [
    [-2.2, 4.35, -1.5],
    [2.2, 4.35, -1.5],
    [-2.2, 4.35, 1.8],
    [2.2, 4.35, 1.8],
  ];
  downlightPositions.forEach(([dx, dy, dz]) => {
    const dl = new THREE.PointLight(0xffeedd, 1.2, 7.5, 1.6);
    dl.position.set(dx, dy, dz);
    roomGroup.add(dl);
    ceilingDownlights.push(dl);
  });

  // 2. Left Arm Red Atmospheric Wash
  const leftRedWash = new THREE.PointLight(0xef4444, 1.4, 8.5, 2.0);
  leftRedWash.position.set(-3.2, 1.8, 0.2);
  roomGroup.add(leftRedWash);

  // 3. Right Arm Blue Atmospheric Wash
  const rightBlueWash = new THREE.PointLight(0x3b82f6, 1.4, 8.5, 2.0);
  rightBlueWash.position.set(3.2, 1.8, 0.2);
  roomGroup.add(rightBlueWash);

  // 4. Overhead Key Dining Table Spotlight (Focused bright hero light on table)
  const overheadSpot = new THREE.SpotLight(0xfff1e0, 2.4, 9.0, Math.PI / 4, 0.45, 1.2);
  overheadSpot.position.set(0, 4.3, 0);
  overheadSpot.target.position.set(0, 0.75, 0);
  overheadSpot.castShadow = true;
  overheadSpot.shadow.mapSize.width = 2048;
  overheadSpot.shadow.mapSize.height = 2048;
  overheadSpot.shadow.bias = -0.0003;
  roomGroup.add(overheadSpot);
  roomGroup.add(overheadSpot.target);

  // 5. Left SO-101 Dedicated Key Light (Soft pink/cool-white key)
  const leftArmKeySpot = new THREE.SpotLight(0xffe4e6, 1.6, 5.0, Math.PI / 4.5, 0.4);
  leftArmKeySpot.position.set(-1.4, 2.4, 1.4);
  leftArmKeySpot.target.position.set(-0.38, 0.85, 0.42);
  roomGroup.add(leftArmKeySpot);
  roomGroup.add(leftArmKeySpot.target);

  // 6. Right SO-101 Dedicated Key Light (Soft sky-blue/cool-white key)
  const rightArmKeySpot = new THREE.SpotLight(0xdbeafe, 1.6, 5.0, Math.PI / 4.5, 0.4);
  rightArmKeySpot.position.set(1.4, 2.4, 1.4);
  rightArmKeySpot.target.position.set(0.38, 0.85, 0.42);
  roomGroup.add(rightArmKeySpot);
  roomGroup.add(rightArmKeySpot.target);

  // 7. Left SO-101 Red Rim Light (Backlight highlight)
  const leftArmRimLight = new THREE.DirectionalLight(0xef4444, 0.8);
  leftArmRimLight.position.set(-0.6, 1.4, 1.4);
  roomGroup.add(leftArmRimLight);

  // 8. Right SO-101 Blue Rim Light (Backlight highlight)
  const rightArmRimLight = new THREE.DirectionalLight(0x3b82f6, 0.8);
  rightArmRimLight.position.set(0.6, 1.4, 1.4);
  roomGroup.add(rightArmRimLight);

  // =========================================================================
  // 3. LARGE CENTERPIECE CANDLE (Visual Hero on Table)
  // =========================================================================
  const candleGroup = new THREE.Group();
  candleGroup.name = 'center_candle';
  candleGroup.position.set(0, 0.75, 0); // Directly at table surface center

  // Turned brass/obsidian candelabra holder base
  const candleBaseMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    metalness: 0.9,
    roughness: 0.25,
  });
  const candlePedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.055, 0.035, 32),
    candleBaseMat
  );
  candlePedestal.position.y = 0.0175;
  candlePedestal.castShadow = true;
  candlePedestal.receiveShadow = true;
  candleGroup.add(candlePedestal);

  const candleDripPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.050, 0.008, 32),
    brassTrimMat
  );
  candleDripPlate.position.y = 0.035;
  candleDripPlate.castShadow = true;
  candleGroup.add(candleDripPlate);

  // Tall ivory wax pillar candle
  const waxMat = new THREE.MeshStandardMaterial({
    color: 0xfffbf0,
    roughness: 0.4,
    metalness: 0.05,
  });
  const candlePillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.16, 32),
    waxMat
  );
  candlePillar.position.y = 0.035 + 0.08;
  candlePillar.castShadow = true;
  candlePillar.receiveShadow = true;
  candleGroup.add(candlePillar);

  // Black thread wick
  const wickMat = new THREE.MeshBasicMaterial({ color: 0x1c1917 });
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.014, 8), wickMat);
  wick.position.y = 0.195 + 0.007;
  candleGroup.add(wick);

  // 3D Glowing Teardrop Flame Mesh
  const flameGeo = new THREE.ConeGeometry(0.009, 0.026, 16);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0xffa500,
  });
  const flameMesh = new THREE.Mesh(flameGeo, flameMat);
  flameMesh.position.y = 0.202 + 0.013;
  candleGroup.add(flameMesh);

  // Inner bright yellow flame core
  const innerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.0045, 0.016, 12),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  innerFlame.position.y = 0.202 + 0.008;
  candleGroup.add(innerFlame);

  // Soft spherical aura glow around flame
  const auraGeo = new THREE.SphereGeometry(0.032, 16, 16);
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0xff9900,
    transparent: true,
    opacity: 0.25,
  });
  const flameAura = new THREE.Mesh(auraGeo, auraMat);
  flameAura.position.copy(flameMesh.position);
  candleGroup.add(flameAura);

  // WARM CANDLE LIGHT (Dynamic falloff onto plates, glassware, cutlery & robots)
  const candleLight = new THREE.PointLight(0xff9933, 2.6, 4.2, 1.8);
  candleLight.position.set(0, 0.75 + 0.21, 0);
  candleLight.castShadow = true;
  candleLight.shadow.mapSize.width = 1024;
  candleLight.shadow.mapSize.height = 1024;
  candleLight.shadow.bias = -0.0005;
  candleGroup.add(candleLight);

  roomGroup.add(candleGroup);

  return {
    roomGroup,
    candleLight,
    flameMesh,
    overheadSpot,
    leftRedWash,
    rightBlueWash,
    leftArmKeySpot,
    rightArmKeySpot,
    leftArmRimLight,
    rightArmRimLight,
    ceilingDownlights,
  };
}

// =========================================================================
// 4. REALISTIC MODERN DINING CHAIRS
// =========================================================================

export function createDiningChair(accentColor: number = 0xdc2626): THREE.Group {
  const chair = new THREE.Group();

  // Dark bronze legs with subtle specular reflection
  const legMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.35,
    metalness: 0.7,
  });

  // Brass ferrule caps for chair feet (creates a crisp glint on floor)
  const brassFootMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.85,
  });

  // Premium tailored charcoal leather cushion (clearly visible against dark floor)
  const cushionMat = new THREE.MeshStandardMaterial({
    color: 0x2d3748,
    roughness: 0.35,
    metalness: 0.15,
  });

  // Spider-Man Accent Piping
  const pipingMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.25,
    metalness: 0.45,
  });

  // 1. Four Tapered Legs with Brass Foot Ferrules (from Y = 0 to Y = 0.42m)
  const legGeo = new THREE.CylinderGeometry(0.014, 0.010, 0.42, 12);
  const footGeo = new THREE.CylinderGeometry(0.012, 0.010, 0.035, 12);
  const legX = 0.18;
  const legZ = 0.17;
  const legs: [number, number][] = [
    [-legX, -legZ],
    [legX, -legZ],
    [-legX, legZ],
    [legX, legZ],
  ];

  legs.forEach(([lx, lz]) => {
    const legMesh = new THREE.Mesh(legGeo, legMat);
    legMesh.position.set(lx, 0.21, lz);
    // Slight outward splay for realistic dining chair posture
    legMesh.rotation.z = (lx > 0 ? -1 : 1) * 0.04;
    legMesh.rotation.x = (lz > 0 ? 1 : -1) * 0.04;
    legMesh.castShadow = true;
    chair.add(legMesh);

    // Brass foot ferrule glint
    const footMesh = new THREE.Mesh(footGeo, brassFootMat);
    footMesh.position.set(lx, 0.0175, lz);
    footMesh.castShadow = true;
    chair.add(footMesh);
  });

  // 2. Seat Cushion (0.44m W x 0.06m H x 0.42m D at Y = 0.45m)
  const seatMesh = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.06, 0.42), cushionMat);
  seatMesh.position.y = 0.45;
  seatMesh.castShadow = true;
  seatMesh.receiveShadow = true;
  chair.add(seatMesh);

  // Seat Edge Accent Piping
  const seatPiping = new THREE.Mesh(
    new THREE.BoxGeometry(0.445, 0.008, 0.425),
    pipingMat
  );
  seatPiping.position.y = 0.478;
  chair.add(seatPiping);

  // 3. Ergonomic Backrest Uprights & Cushion
  // Rear Uprights
  [-0.17, 0.17].forEach(rx => {
    const upright = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 12), legMat);
    upright.position.set(rx, 0.65, 0.18);
    upright.rotation.x = 0.08; // slight recline
    upright.castShadow = true;
    chair.add(upright);
  });

  // Curved Backrest Cushion
  const backGeo = new THREE.BoxGeometry(0.40, 0.28, 0.045);
  const backMesh = new THREE.Mesh(backGeo, cushionMat);
  backMesh.position.set(0, 0.72, 0.19);
  backMesh.rotation.x = 0.08;
  backMesh.castShadow = true;
  chair.add(backMesh);

  // Accent Spider-Man strip on top of chair back
  const backPiping = new THREE.Mesh(new THREE.BoxGeometry(0.405, 0.012, 0.05), pipingMat);
  backPiping.position.set(0, 0.855, 0.20);
  backPiping.rotation.x = 0.08;
  chair.add(backPiping);

  return chair;
}

// =========================================================================
// 5. METALLIC CUTLERY & NAPKINS
// =========================================================================

export function createDinnerFork(): THREE.Group {
  const fork = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.12,
    metalness: 0.95,
  });

  // Handle
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.003, 0.13), steelMat);
  handle.position.set(0, 0.002, 0.02);
  handle.castShadow = true;
  fork.add(handle);

  // Base of tines
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.003, 0.02), steelMat);
  base.position.set(0, 0.002, -0.05);
  fork.add(base);

  // 4 Tines
  [-0.007, -0.0025, 0.0025, 0.007].forEach(tx => {
    const tine = new THREE.Mesh(new THREE.BoxGeometry(0.0016, 0.0025, 0.035), steelMat);
    tine.position.set(tx, 0.002, -0.075);
    fork.add(tine);
  });

  return fork;
}

export function createDinnerKnife(): THREE.Group {
  const knife = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.12,
    metalness: 0.95,
  });

  // Handle
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.004, 0.10), steelMat);
  handle.position.set(0, 0.002, 0.035);
  handle.castShadow = true;
  knife.add(handle);

  // Blade with single bevel edge (facing left into plate)
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.002, 0.09), steelMat);
  blade.position.set(-0.002, 0.002, -0.055);
  blade.castShadow = true;
  knife.add(blade);

  return knife;
}

export function createFoldedNapkin(): THREE.Mesh {
  const napkinTex = getNapkinTexture();
  const napkinMat = new THREE.MeshStandardMaterial({
    map: napkinTex,
    roughness: 0.85,
    metalness: 0.05,
  });

  // Crisp rectangular folded fabric
  const napkinGeo = new THREE.BoxGeometry(0.07, 0.008, 0.16);
  const napkin = new THREE.Mesh(napkinGeo, napkinMat);
  napkin.position.y = 0.004;
  napkin.castShadow = true;
  napkin.receiveShadow = true;
  return napkin;
}

// =========================================================================
// 6. AUTONOMOUS QUADRUPED ROBOT COMPANION PET
// =========================================================================

export interface RobotPetHierarchy {
  rootGroup: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  eyeL: THREE.Mesh;
  eyeR: THREE.Mesh;
  legs: {
    hip: THREE.Group;
    upper: THREE.Group;
    knee: THREE.Group;
    foot: THREE.Mesh;
  }[];
  shadowDecal: THREE.Mesh;
}

export function createRobotPet(): RobotPetHierarchy {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'robot_companion_pet';

  // Materials
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x111827, // Dark slate metallic
    roughness: 0.25,
    metalness: 0.85,
  });

  const spiderRedMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Spider-Man red
    roughness: 0.3,
    metalness: 0.5,
  });

  const spiderBlueMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb, // Spider-Man blue
    roughness: 0.3,
    metalness: 0.5,
  });

  const jointMat = new THREE.MeshStandardMaterial({
    color: 0x030712,
    roughness: 0.4,
    metalness: 0.9,
  });

  const footRubberMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.85,
    metalness: 0.1,
  });

  const eyeGlowMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff, // Glowing cyan sensor eyes
  });

  // 1. Floating Body Group (Base Height at Y = 0.22m)
  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.22;
  rootGroup.add(bodyGroup);

  // Main Carbon Chassis (0.32m L x 0.14m W x 0.08m H)
  const torsoGeo = new THREE.BoxGeometry(0.15, 0.08, 0.30);
  const torso = new THREE.Mesh(torsoGeo, chassisMat);
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Left Side Red Racing Armor
  const leftArmor = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.065, 0.26), spiderRedMat);
  leftArmor.position.set(-0.08, 0.005, 0);
  leftArmor.castShadow = true;
  bodyGroup.add(leftArmor);

  // Right Side Blue Racing Armor
  const rightArmor = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.065, 0.26), spiderBlueMat);
  rightArmor.position.set(0.08, 0.005, 0);
  rightArmor.castShadow = true;
  bodyGroup.add(rightArmor);

  // Top Spine Insignia & Vent Plate
  const spinePlate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.22), jointMat);
  spinePlate.position.set(0, 0.045, 0);
  bodyGroup.add(spinePlate);

  // Stylized Spider Emblem (Chrome Octahedron)
  const emblem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.015, 0),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 })
  );
  emblem.scale.set(0.8, 0.3, 1.2);
  emblem.position.set(0, 0.055, 0);
  bodyGroup.add(emblem);

  // Communication Antenna / Scanner Probe
  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.002, 0.002, 0.08, 8),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
  );
  antenna.position.set(0.03, 0.08, 0.11);
  antenna.rotation.x = -0.3;
  bodyGroup.add(antenna);

  // 2. Articulated Head Group (Pivot at front: Z = -0.16m, Y = 0.02m)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.02, -0.16);
  bodyGroup.add(headGroup);

  // Head Chassis
  const headGeo = new THREE.BoxGeometry(0.10, 0.065, 0.09);
  const headMesh = new THREE.Mesh(headGeo, chassisMat);
  headMesh.position.set(0, 0.02, -0.04);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Glowing Sensor Eyes / Visor
  const eyeGeo = new THREE.BoxGeometry(0.022, 0.012, 0.008);
  const eyeL = new THREE.Mesh(eyeGeo, eyeGlowMat);
  eyeL.position.set(-0.028, 0.022, -0.088);
  headGroup.add(eyeL);

  const eyeR = new THREE.Mesh(eyeGeo, eyeGlowMat);
  eyeR.position.set(0.028, 0.022, -0.088);
  headGroup.add(eyeR);

  // 3. Four Articulated Legs (FL, FR, RL, RR)
  const legOffsets = [
    { name: 'FL', x: -0.085, z: -0.11, isLeft: true },
    { name: 'FR', x: 0.085,  z: -0.11, isLeft: false },
    { name: 'RL', x: -0.085, z: 0.11,  isLeft: true },
    { name: 'RR', x: 0.085,  z: 0.11,  isLeft: false },
  ];

  const legs: RobotPetHierarchy['legs'] = [];

  legOffsets.forEach((cfg) => {
    // Hip joint group attached to body
    const hip = new THREE.Group();
    hip.position.set(cfg.x, 0, cfg.z);
    bodyGroup.add(hip);

    // Hip casing cylinder
    const hipCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.03, 16),
      cfg.isLeft ? spiderRedMat : spiderBlueMat
    );
    hipCap.rotation.z = Math.PI / 2;
    hip.add(hipCap);

    // Upper leg group (Shoulder Pitch)
    const upper = new THREE.Group();
    hip.add(upper);

    // Upper leg bone (Length 0.12m)
    const upperBone = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.09, 8, 12), chassisMat);
    upperBone.position.set(0, -0.055, 0);
    upperBone.castShadow = true;
    upper.add(upperBone);

    // Knee joint group
    const knee = new THREE.Group();
    knee.position.set(0, -0.11, 0);
    upper.add(knee);

    const kneeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.025, 12), jointMat);
    kneeCap.rotation.z = Math.PI / 2;
    knee.add(kneeCap);

    // Lower leg bone (Length 0.11m)
    const lowerBone = new THREE.Mesh(new THREE.CapsuleGeometry(0.010, 0.085, 8, 12), chassisMat);
    lowerBone.position.set(0, -0.055, 0);
    lowerBone.castShadow = true;
    lowerBone.add(kneeCap);

    // Foot pad
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), footRubberMat);
    foot.position.set(0, -0.11, 0);
    foot.castShadow = true;
    knee.add(foot);

    legs.push({ hip, upper, knee, foot });
  });

  // Soft contact shadow underneath pet
  const shadowDecal = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32, 0.44),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    })
  );
  shadowDecal.rotation.x = -Math.PI / 2;
  shadowDecal.position.y = 0.002;
  rootGroup.add(shadowDecal);

  return {
    rootGroup,
    bodyGroup,
    headGroup,
    eyeL,
    eyeR,
    legs,
    shadowDecal,
  };
}

// =========================================================================
// 7. ROBOT PET KINEMATICS & PATROL CONTROLLER
// =========================================================================

// Waypoint Route patrolling around the restaurant floor
export const PET_PATROL_WAYPOINTS = [
  { x: 1.8,  z: 1.4,  action: 'WALK', targetFocus: 'ENTRANCE' },
  { x: 2.1,  z: 0.0,  action: 'LOOK_RIGHT_ARM', targetFocus: 'RIGHT_SO101' },
  { x: 1.5,  z: -1.8, action: 'WALK', targetFocus: 'NORTH_EAST_WING' },
  { x: 0.0,  z: -2.0, action: 'LOOK_CANDLE', targetFocus: 'CENTER_CANDLE' },
  { x: -1.5, z: -1.8, action: 'WALK', targetFocus: 'NORTH_WEST_WING' },
  { x: -2.1, z: 0.0,  action: 'LOOK_LEFT_ARM', targetFocus: 'LEFT_SO101' },
  { x: -1.8, z: 1.4,  action: 'WALK', targetFocus: 'SOUTH_WEST_WING' },
  { x: 0.0,  z: 1.8,  action: 'WALK', targetFocus: 'DINING_FRONT' },
];

export interface RobotPetState {
  currentWaypointIdx: number;
  pauseTimerSec: number;
  walkTimerSec: number;
  pos: THREE.Vector3;
  headingRad: number;
  batteryPct: number;
}

export function createInitialPetState(): RobotPetState {
  return {
    currentWaypointIdx: 0,
    pauseTimerSec: 0,
    walkTimerSec: 0,
    pos: new THREE.Vector3(1.8, 0, 1.4),
    headingRad: 0,
    batteryPct: 94,
  };
}

export function updateRobotPetKinematics(
  pet: RobotPetHierarchy,
  state: RobotPetState,
  deltaSec: number,
  isPetActive: boolean,
  petMode: 'PATROL' | 'IDLE',
  onTelemetry?: (t: RobotPetTelemetry) => void
) {
  if (!isPetActive) {
    pet.rootGroup.visible = false;
    if (onTelemetry) {
      onTelemetry({
        status: 'OFFLINE',
        activity: 'IDLE',
        batteryPct: state.batteryPct,
        location: 'REST BAY',
        mode: petMode,
        targetFocus: 'NONE',
      });
    }
    return;
  }

  pet.rootGroup.visible = true;

  // Battery slow decay
  state.batteryPct = Math.max(10, state.batteryPct - deltaSec * 0.01);

  const targetWp = PET_PATROL_WAYPOINTS[state.currentWaypointIdx];
  const dx = targetWp.x - state.pos.x;
  const dz = targetWp.z - state.pos.z;
  const dist = Math.hypot(dx, dz);

  let activity: RobotPetTelemetry['activity'] = 'WALKING';
  let targetFocus = targetWp.targetFocus;
  const targetHeading = Math.atan2(dx, dz);

  // 1. Navigation / State Machine
  if (petMode === 'IDLE') {
    // Pure stationary idle
    activity = 'IDLE';
    state.pauseTimerSec += deltaSec;
    // Gentle head scanning
    pet.headGroup.rotation.y = Math.sin(state.pauseTimerSec * 1.5) * 0.35;
    pet.headGroup.rotation.x = Math.sin(state.pauseTimerSec * 0.8) * 0.1;
  } else if (dist < 0.18) {
    // Arrived at waypoint: execute waypoint pause action if applicable
    if (targetWp.action === 'LOOK_RIGHT_ARM') {
      activity = 'SCANNING';
      state.pauseTimerSec += deltaSec;
      // Turn head toward Right SO-101 base: (+0.38, 0.75, 0.42)
      pet.headGroup.rotation.y = -Math.PI / 3 + Math.sin(state.pauseTimerSec * 2) * 0.1;
      pet.headGroup.rotation.x = -0.25;
      if (state.pauseTimerSec > 3.0) {
        state.pauseTimerSec = 0;
        state.currentWaypointIdx = (state.currentWaypointIdx + 1) % PET_PATROL_WAYPOINTS.length;
      }
    } else if (targetWp.action === 'LOOK_CANDLE') {
      activity = 'SCANNING';
      state.pauseTimerSec += deltaSec;
      // Turn head up toward center candle flame (0, 0.95, 0)
      pet.headGroup.rotation.y = Math.sin(state.pauseTimerSec * 1.2) * 0.15;
      pet.headGroup.rotation.x = -0.4;
      if (state.pauseTimerSec > 2.5) {
        state.pauseTimerSec = 0;
        state.currentWaypointIdx = (state.currentWaypointIdx + 1) % PET_PATROL_WAYPOINTS.length;
      }
    } else if (targetWp.action === 'LOOK_LEFT_ARM') {
      activity = 'SCANNING';
      state.pauseTimerSec += deltaSec;
      // Turn head toward Left SO-101 base: (-0.38, 0.75, 0.42)
      pet.headGroup.rotation.y = Math.PI / 3 + Math.sin(state.pauseTimerSec * 2) * 0.1;
      pet.headGroup.rotation.x = -0.25;
      if (state.pauseTimerSec > 3.0) {
        state.pauseTimerSec = 0;
        state.currentWaypointIdx = (state.currentWaypointIdx + 1) % PET_PATROL_WAYPOINTS.length;
      }
    } else {
      // Regular transition
      state.currentWaypointIdx = (state.currentWaypointIdx + 1) % PET_PATROL_WAYPOINTS.length;
    }
  } else {
    // Walking toward waypoint
    activity = 'WALKING';
    state.walkTimerSec += deltaSec;

    // Smooth heading rotation
    let angleDiff = targetHeading - state.headingRad;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    state.headingRad += angleDiff * Math.min(1, deltaSec * 3.5);

    // Forward translation
    const speed = 0.44; // 0.44 m/s (natural realistic quadruped trot)
    state.pos.x += Math.sin(state.headingRad) * speed * deltaSec;
    state.pos.z += Math.cos(state.headingRad) * speed * deltaSec;

    // Look in direction of travel
    pet.headGroup.rotation.y = Math.sin(state.walkTimerSec * 4) * 0.08;
    pet.headGroup.rotation.x = 0;
  }

  // Position root group on floor
  pet.rootGroup.position.set(state.pos.x, 0, state.pos.z);
  pet.rootGroup.rotation.y = state.headingRad;

  // 2. Articulated Alternating Quadruped Gait Kinematics
  if (activity === 'WALKING') {
    const gaitFreq = 3.6; // Stride cycles per second
    const phase = (state.walkTimerSec * gaitFreq) % 1.0;
    const isPhaseA = phase < 0.5;
    const subPhase = isPhaseA ? phase * 2 : (phase - 0.5) * 2;

    // Vertical body bobbing & gentle roll
    pet.bodyGroup.position.y = 0.22 + Math.abs(Math.sin(phase * Math.PI * 2)) * 0.014;
    pet.bodyGroup.rotation.z = Math.sin(phase * Math.PI * 2) * 0.035;

    // Alternating Diagonal Legs:
    // Pair A: Front-Left (0) & Rear-Right (3)
    // Pair B: Front-Right (1) & Rear-Left (2)
    const strideAngle = 0.45; // Max leg swing angle (rad)

    // Swing vs Stance calculations
    const swingPitch = -strideAngle + subPhase * (2 * strideAngle);
    const stancePitch = strideAngle - subPhase * (2 * strideAngle);
    const swingKnee = Math.sin(subPhase * Math.PI) * 0.65; // knee flex during swing

    if (isPhaseA) {
      // Pair A swings, Pair B stands
      // FL (0)
      pet.legs[0].upper.rotation.x = swingPitch;
      pet.legs[0].knee.rotation.x = swingKnee;
      // RR (3)
      pet.legs[3].upper.rotation.x = swingPitch;
      pet.legs[3].knee.rotation.x = swingKnee;

      // FR (1)
      pet.legs[1].upper.rotation.x = stancePitch;
      pet.legs[1].knee.rotation.x = 0.05;
      // RL (2)
      pet.legs[2].upper.rotation.x = stancePitch;
      pet.legs[2].knee.rotation.x = 0.05;
    } else {
      // Pair B swings, Pair A stands
      // FR (1)
      pet.legs[1].upper.rotation.x = swingPitch;
      pet.legs[1].knee.rotation.x = swingKnee;
      // RL (2)
      pet.legs[2].upper.rotation.x = swingPitch;
      pet.legs[2].knee.rotation.x = swingKnee;

      // FL (0)
      pet.legs[0].upper.rotation.x = stancePitch;
      pet.legs[0].knee.rotation.x = 0.05;
      // RR (3)
      pet.legs[3].upper.rotation.x = swingPitch;
      pet.legs[3].knee.rotation.x = 0.05;
    }
  } else {
    // Idle standing posture
    pet.bodyGroup.position.y = 0.22 + Math.sin(state.pauseTimerSec * 2) * 0.003;
    pet.bodyGroup.rotation.z = 0;
    pet.legs.forEach(leg => {
      leg.upper.rotation.x = THREE.MathUtils.lerp(leg.upper.rotation.x, 0.05, 0.1);
      leg.knee.rotation.x = THREE.MathUtils.lerp(leg.knee.rotation.x, 0.02, 0.1);
    });
  }

  // 3. Eye Glow Pulse
  const eyeIntensity = 0.8 + Math.sin(performance.now() * 0.006) * 0.2;
  (pet.eyeL.material as THREE.MeshBasicMaterial).color.setRGB(0, 0.94 * eyeIntensity, eyeIntensity);
  (pet.eyeR.material as THREE.MeshBasicMaterial).color.setRGB(0, 0.94 * eyeIntensity, eyeIntensity);

  // 4. Report Telemetry to UI
  if (onTelemetry) {
    onTelemetry({
      status: 'ONLINE',
      activity,
      batteryPct: Math.round(state.batteryPct),
      location: targetWp.targetFocus.replace(/_/g, ' '),
      mode: petMode,
      targetFocus,
    });
  }
}
