/**
 * TwinHands-AI: Physical AI & Bimanual Robotics Type Definitions
 */

export type TablewareType = 'plate' | 'bowl' | 'cup' | 'spoon' | 'additional_spoon';

export type ArmIdentity = 'left' | 'right';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Orientation3D {
  roll: number;
  pitch: number;
  yaw: number;
}

export interface Pose6D extends Vector3D, Orientation3D {}

export interface TablewareItem {
  id: string;
  type: TablewareType;
  personId: number;
  label: string;
  sourcePos: Vector3D;
  targetPos: Vector3D;
  currentPos: Vector3D;
  orientation: number; // yaw angle in degrees
  status: 'staging' | 'grasped' | 'in_transit' | 'placed' | 'verified';
  assignedArm: ArmIdentity;
  verificationConfidence: number; // 0.0 - 1.0 (from OpenVINO perception)
  layer: number; // 0 = base (plate/cup/spoon), 1 = stacked (bowl on plate)
}

export interface PlaceSetting {
  personId: number;
  label: string;
  seatPosition: 'north' | 'south' | 'east' | 'west' | 'custom';
  centerCoordinates: Vector3D;
  items: TablewareItem[];
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
  completionRatio: number; // 0.0 - 1.0
}

export interface SO101ArmTelemetry {
  id: ArmIdentity;
  name: string;
  badgeLabel: string;
  colorHex: string;
  accentClass: string;
  basePosition: Vector3D;
  reachRadiusM: number;
  eePose: Pose6D;
  targetPose: Pose6D | null;
  jointAnglesDeg: [number, number, number, number, number, number]; // 6-DOF: q1..q6
  jointTorquesNm: [number, number, number, number, number, number];
  gripperState: number; // 0.0 (open) to 1.0 (closed)
  status: 'IDLE' | 'PLANNING' | 'APPROACH' | 'GRASP' | 'LIFT' | 'TRANSIT' | 'PLACE' | 'RETREAT' | 'VERIFYING' | 'MANIPULATING' | 'E_STOPPED';
  holdingItem: TablewareItem | null;
  currentActionDescription: string;
  totalDistanceMovedM: number;
  executedActionsCount: number;
}

export type PipelineStage = 
  | 'IDLE'
  | 'LISTENING'
  | 'NLP_REASONING'
  | 'TABLE_CAPACITY_CHECK'
  | 'LAYOUT_PLANNING'
  | 'BIMANUAL_DISPATCH'
  | 'MUJOCO_EXECUTION'
  | 'OPENVINO_INSPECTION'
  | 'VERIFICATION_PASSED'
  | 'REJECTED';

export interface OpenVINOBenchmark {
  engine?: 'Intel OpenVINO Runtime 2024.5' | string;
  deviceTarget?: 'Intel Core Ultra NPU / Xeon' | string;
  quantization: 'INT8' | 'FP16' | 'FP32';
  inferenceLatencyMs: number;
  baselineLatencyMs: number;
  throughputFps: number;
  memoryFootprintMb: number;
  activeModel: 'YOLOv8x-Tableware-VLA' | 'MobileNetV3-OpenVINO-Seg' | 'YOLOv8x-Tableware-OpenVINO-INT8' | string;
  detectedDetections?: number;
  avgConfidence: number;
  inspectionStatus?: string;
}

export interface BimanualOptimizationMetrics {
  totalTravelDistanceM: number;
  collisionRiskScore: number; // 0 (none) to 100
  estimatedExecutionTimeSec: number;
  singleArmExecutionTimeSec: number;
  bimanualSpeedupRatio: number; // single / bimanual (e.g. 1.82x)
  armWorkloadBalance: {
    leftCount: number;
    rightCount: number;
    ratio: number; // e.g. 50/50
  };
}

export interface TableLayoutPlan {
  groupSize: number;
  isValid: boolean;
  rejectionNotice?: string;
  tableDimensions: {
    widthM: number;
    depthM: number;
    heightM: number;
  };
  placeSettings: PlaceSetting[];
  allItems: TablewareItem[];
  summary: {
    plates: number;
    bowls: number;
    cups: number;
    spoons: number;
    additionalSpoons: number;
    totalObjects: number;
  };
  armAllocation: {
    leftArmTasks: number;
    rightArmTasks: number;
  };
  metrics: BimanualOptimizationMetrics;
  plannerLog: string[];
}

export interface VoiceCommandIntent {
  rawCommand: string;
  normalizedTask: string;
  extractedPeople: number | null;
  isValid: boolean;
  rejectionMessage?: string;
  confidence: number;
}

export interface DigitalTwinAsset {
  id: string;
  name: string;
  category: 'robot_arm' | 'system' | 'furniture' | 'tableware' | 'benchmark';
  theme?: string;
  dimensions: {
    primary: string;
    widthMm?: number;
    depthMm?: number;
    heightMm?: number;
    diameterMm?: number;
    thicknessMm?: number;
  };
  material: string;
  geometryDescription: string;
  roboticsCompliance: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    details: string;
  };
  mujocoGeomType: 'box' | 'cylinder' | 'sphere' | 'mesh' | 'composite';
  massKg: number;
  friction: [number, number, number]; // [sliding, torsional, rolling]
  viewsAvailable: ('perspective' | 'front' | 'side' | 'top' | 'rear')[];
  renderImage?: string;
}
