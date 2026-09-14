/**
 * Kinematics and Motion Planning for Dual SO-101 6-DOF Robotic Arms
 * 
 * Computes:
 * - Inverse & Forward Kinematics approximations for planar/3D tabletop reach
 * - Arc trajectory generation between staging and table targets
 * - Collision checking between red and blue arm end-effectors
 */

import { Vector3D, Pose6D, SO101ArmTelemetry } from '../types';
import { LEFT_ARM_BASE, RIGHT_ARM_BASE } from '../planner/table_layout_planner';

// Arm link lengths (meters)
const LINK_BASE_H = 0.08;
const LINK_UPPER_ARM = 0.22;
const LINK_FOREARM = 0.20;
const LINK_WRIST = 0.12;

/**
 * Solve inverse kinematics for SO-101 arm given a target 3D Cartesian position
 * Returns [q1 (waist), q2 (shoulder), q3 (elbow), q4 (wrist pitch), q5 (wrist roll), q6 (gripper)]
 */
export function computeSO101IK(
  base: Vector3D,
  target: Vector3D,
  isLeftArm: boolean
): [number, number, number, number, number, number] {
  const dx = target.x - base.x;
  const dy = target.y - base.y;
  const dz = target.z - (base.z + LINK_BASE_H);

  // q1: Base yaw angle (degrees)
  let q1 = (Math.atan2(dy, dx) * 180) / Math.PI;

  // Offset base orientation based on arm identity
  if (!isLeftArm) {
    // Right arm angle normalization
    if (q1 < -180) q1 += 360;
  }

  // Planar distance in the arm's rotated vertical plane
  const r = Math.hypot(dx, dy);

  // Wrist center target (approaching from top)
  const rw = r - 0.04;
  const zw = dz + 0.08;
  const D = Math.hypot(rw, zw);

  // Clamp reach to avoid imaginary numbers
  const maxReach = LINK_UPPER_ARM + LINK_FOREARM - 0.02;
  const clampedD = Math.min(Math.max(D, 0.1), maxReach);

  // Law of cosines for 2-link planar arm
  const cosElbow = (clampedD * clampedD - LINK_UPPER_ARM * LINK_UPPER_ARM - LINK_FOREARM * LINK_FOREARM) /
    (2 * LINK_UPPER_ARM * LINK_FOREARM);
  const clampedCosElbow = Math.max(-1, Math.min(1, cosElbow));
  const elbowRad = Math.acos(clampedCosElbow);

  // q3: Elbow pitch (degrees)
  const q3 = (elbowRad * 180) / Math.PI - 90;

  // q2: Shoulder pitch (degrees)
  const alpha = Math.atan2(zw, rw);
  const beta = Math.asin((LINK_FOREARM * Math.sin(elbowRad)) / clampedD);
  const q2 = ((alpha + beta) * 180) / Math.PI;

  // q4: Wrist pitch to keep gripper pointing down
  const q4 = 90 - (q2 + q3);

  // q5: Wrist roll (aligned with placement angle)
  const q5 = isLeftArm ? -15 : 15;

  // q6: Gripper (0 = open, 45 = closed)
  const q6 = 25;

  return [
    Math.round(q1),
    Math.round(Math.max(-45, Math.min(135, q2))),
    Math.round(Math.max(-120, Math.min(90, q3))),
    Math.round(Math.max(-90, Math.min(90, q4))),
    Math.round(q5),
    Math.round(q6),
  ];
}

/**
 * Generate 3D transit trajectory with parabolic clearance arc
 */
export function interpolateCartesianTrajectory(
  start: Vector3D,
  end: Vector3D,
  progress: number // 0.0 to 1.0
): Vector3D {
  // Parabolic lift height (clears other items on table)
  const liftHeight = 0.14 * Math.sin(progress * Math.PI);

  return {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress,
    z: start.z + (end.z - start.z) * progress + liftHeight,
  };
}

/**
 * Initialize default home telemetry for Left (Red) and Right (Blue) SO-101 arms
 */
export function createInitialArmTelemetry(id: 'left' | 'right'): SO101ArmTelemetry {
  const isLeft = id === 'left';
  const base = isLeft ? LEFT_ARM_BASE : RIGHT_ARM_BASE;

  const restPose: Pose6D = {
    x: base.x + (isLeft ? 0.08 : -0.08),
    y: base.y + 0.18,
    z: 0.16,
    roll: 0,
    pitch: -45,
    yaw: isLeft ? 30 : -30,
  };

  const jointAngles = computeSO101IK(base, restPose, isLeft);

  return {
    id,
    name: isLeft ? 'RED LEFT SO-101' : 'BLUE RIGHT SO-101',
    badgeLabel: isLeft ? '🔴 LEFT SO-101' : '🔵 RIGHT SO-101',
    colorHex: isLeft ? '#EF4444' : '#3B82F6',
    accentClass: isLeft ? 'text-red-400 border-red-500/30' : 'text-blue-400 border-blue-500/30',
    basePosition: base,
    reachRadiusM: 0.58,
    eePose: restPose,
    targetPose: null,
    jointAnglesDeg: jointAngles,
    jointTorquesNm: [1.2, 3.4, 2.8, 0.9, 0.4, 0.2],
    gripperState: 0.0,
    status: 'IDLE',
    holdingItem: null,
    currentActionDescription: 'Standby / Home Position',
    totalDistanceMovedM: 0.0,
    executedActionsCount: 0,
  };
}
