"""
TwinHands-AI: MuJoCo Dual SO-101 Robotics Simulation Foundation Environment
Phase 1 Foundation: scene.xml parser, dual-arm kinematic/dynamic model, tableware assets, and telemetry.
"""

import os
import math
import time
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any

@dataclass
class DualArmEnvConfig:
    table_width_m: float = 1.20
    table_depth_m: float = 0.80
    table_height_m: float = 0.75
    left_arm_base: Tuple[float, float, float] = (-0.38, -0.42, 0.75)
    right_arm_base: Tuple[float, float, float] = (0.38, -0.42, 0.75)
    max_reach_m: float = 0.58
    min_dual_arm_clearance_m: float = 0.18
    physics_timestep_s: float = 0.002
    control_frequency_hz: float = 60.0
    scene_xml_path: str = field(
        default_factory=lambda: os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "scene.xml"
        )
    )

@dataclass
class DinnerObject:
    name: str
    object_type: str
    initial_pos: Tuple[float, float, float]
    mass_kg: float
    material: str
    geoms: List[Dict[str, Any]] = field(default_factory=list)

class SO101DualArmEnv:
    """
    Simulation Environment for Coordinated Dual SO-101 Manipulators.
    Encapsulates MuJoCo scene definition, dual-arm forward/inverse kinematics,
    dinner tableware inventory, and collision/clearance diagnostics.
    """
    def __init__(self, config: Optional[DualArmEnvConfig] = None):
        self.config = config or DualArmEnvConfig()
        self.step_count = 0
        self.sim_time = 0.0
        self.is_e_stopped = False

        # Link dimensions (meters) matching SO-101 specification
        self.link_base_h = 0.08
        self.link_upper_arm = 0.22
        self.link_forearm = 0.20
        self.link_wrist = 0.12

        # State dictionaries for 6-DOF joint angles (degrees)
        # [q1_waist, q2_shoulder, q3_elbow, q4_wrist_pitch, q5_wrist_roll, gripper_slide]
        self.left_joints = [0.0, 25.0, -40.0, 15.0, -15.0, 0.0]
        self.right_joints = [0.0, 25.0, -40.0, 15.0, 15.0, 0.0]
        
        self.left_ee_pose = self.forward_kinematics(self.config.left_arm_base, self.left_joints, is_left=True)
        self.right_ee_pose = self.forward_kinematics(self.config.right_arm_base, self.right_joints, is_left=False)

        # Parse scene XML and register dinner objects
        self.xml_tree = None
        self.scene_metadata: Dict[str, Any] = {}
        self.dinner_objects: Dict[str, DinnerObject] = {}
        self._load_and_parse_scene_xml()

        self.reset()

    def _load_and_parse_scene_xml(self) -> None:
        """Parse MuJoCo scene.xml to extract verified geometry, objects, and arm bases."""
        if os.path.exists(self.config.scene_xml_path):
            try:
                self.xml_tree = ET.parse(self.config.scene_xml_path)
                root = self.xml_tree.getroot()
                self.scene_metadata["model_name"] = root.attrib.get("model", "twinhands_scene")
                
                # Verify actuators
                actuators = root.findall(".//actuator/position")
                self.scene_metadata["actuator_count"] = len(actuators)
                self.scene_metadata["actuators"] = [act.attrib.get("name") for act in actuators]

                # Extract dinner object bodies
                for body in root.findall(".//worldbody/body"):
                    name = body.attrib.get("name", "")
                    pos_str = body.attrib.get("pos", "0 0 0")
                    pos = tuple(float(p) for p in pos_str.split())
                    
                    if name.startswith("obj_"):
                        obj_type = name.replace("obj_", "").rsplit("_", 1)[0]
                        geoms = []
                        total_mass = 0.0
                        mat = "default"
                        for geom in body.findall("geom"):
                            g_mass = float(geom.attrib.get("mass", "0.1"))
                            total_mass += g_mass
                            mat = geom.attrib.get("material", mat)
                            geoms.append({
                                "name": geom.attrib.get("name"),
                                "type": geom.attrib.get("type"),
                                "size": geom.attrib.get("size"),
                                "mass": g_mass
                            })
                        self.dinner_objects[name] = DinnerObject(
                            name=name,
                            object_type=obj_type,
                            initial_pos=pos,
                            mass_kg=round(total_mass, 3),
                            material=mat,
                            geoms=geoms
                        )
            except Exception as e:
                self.scene_metadata["parse_error"] = str(e)

    def reset(self) -> Dict[str, Any]:
        """Reset environment to standard initial home pose."""
        self.step_count = 0
        self.sim_time = 0.0
        self.is_e_stopped = False
        self.left_joints = [0.0, 25.0, -40.0, 15.0, -15.0, 0.0]
        self.right_joints = [0.0, 25.0, -40.0, 15.0, 15.0, 0.0]
        self.left_ee_pose = self.forward_kinematics(self.config.left_arm_base, self.left_joints, is_left=True)
        self.right_ee_pose = self.forward_kinematics(self.config.right_arm_base, self.right_joints, is_left=False)
        return self.get_observation()

    def emergency_stop(self) -> None:
        """Trigger instantaneous hardware/sim E-Stop."""
        self.is_e_stopped = True

    def resume_from_e_stop(self) -> None:
        """Release E-Stop after operator confirmation."""
        self.is_e_stopped = False

    def forward_kinematics(self, base: Tuple[float, float, float], joints: List[float], is_left: bool) -> Tuple[float, float, float]:
        """Compute end-effector Cartesian position from joint angles."""
        q1_rad = math.radians(joints[0])
        q2_rad = math.radians(joints[1])
        q3_rad = math.radians(joints[2])
        q4_rad = math.radians(joints[3])

        # Planar reach along arm elevation profile
        r = (self.link_upper_arm * math.cos(q2_rad) +
             self.link_forearm * math.cos(q2_rad + q3_rad) +
             self.link_wrist * math.cos(q2_rad + q3_rad + q4_rad))
        
        z = (base[2] + self.link_base_h +
             self.link_upper_arm * math.sin(q2_rad) +
             self.link_forearm * math.sin(q2_rad + q3_rad) +
             self.link_wrist * math.sin(q2_rad + q3_rad + q4_rad))

        x = base[0] + r * math.cos(q1_rad)
        y = base[1] + r * math.sin(q1_rad)
        return (round(x, 4), round(y, 4), round(z, 4))

    def inverse_kinematics(self, base: Tuple[float, float, float], target: Tuple[float, float, float], is_left: bool, phi_deg: float = -15.0) -> List[float]:
        """Analytical Inverse Kinematics solver for 6-DOF SO-101 arm."""
        dx = target[0] - base[0]
        dy = target[1] - base[1]
        dz = target[2] - (base[2] + self.link_base_h)

        q1 = math.degrees(math.atan2(dy, dx))
        if not is_left and q1 < -180:
            q1 += 360

        r_target = math.hypot(dx, dy)
        phi_rad = math.radians(phi_deg)
        rw = r_target - self.link_wrist * math.cos(phi_rad)
        zw = dz - self.link_wrist * math.sin(phi_rad)

        D = math.hypot(rw, zw)
        max_D = self.link_upper_arm + self.link_forearm - 0.001
        min_D = abs(self.link_upper_arm - self.link_forearm) + 0.01
        D_clamped = max(min_D, min(D, max_D))

        cos_q3 = (D_clamped**2 - self.link_upper_arm**2 - self.link_forearm**2) / (2 * self.link_upper_arm * self.link_forearm)
        cos_q3 = max(-1.0, min(1.0, cos_q3))
        q3_rad = -math.acos(cos_q3)

        gamma = math.atan2(zw, rw)
        cos_psi = (self.link_upper_arm**2 + D_clamped**2 - self.link_forearm**2) / (2 * self.link_upper_arm * D_clamped)
        cos_psi = max(-1.0, min(1.0, cos_psi))
        psi = math.acos(cos_psi)

        q2_rad = gamma + psi
        q4_rad = phi_rad - (q2_rad + q3_rad)

        q1_deg = q1
        q2_deg = math.degrees(q2_rad)
        q3_deg = math.degrees(q3_rad)
        q4_deg = math.degrees(q4_rad)
        q5_deg = -15.0 if is_left else 15.0
        q6_deg = 0.0

        return [round(q1_deg, 2), round(q2_deg, 2), round(q3_deg, 2), round(q4_deg, 2), round(q5_deg, 2), round(q6_deg, 2)]

    def compute_jacobian(self, base: Tuple[float, float, float], joints: List[float], is_left: bool) -> List[List[float]]:
        """Compute the 3x3 position Jacobian matrix J(q) via finite difference."""
        eps = 1e-4
        ee_nominal = self.forward_kinematics(base, joints, is_left)
        J = []
        for i in range(3):  # x, y, z
            J.append([])
        for j_idx in range(3):  # first 3 joints primary positioning
            perturbed = list(joints)
            perturbed[j_idx] += math.degrees(eps)
            ee_pert = self.forward_kinematics(base, perturbed, is_left)
            for i in range(3):
                J[i].append((ee_pert[i] - ee_nominal[i]) / eps)
        return J

    def step(self, left_target: Optional[Tuple[float, float, float]] = None,
                   right_target: Optional[Tuple[float, float, float]] = None) -> Tuple[Dict[str, Any], bool]:
        """Execute one simulation control step at control_frequency_hz."""
        if self.is_e_stopped:
            return self.get_observation(), False

        # Update left arm
        if left_target:
            self.left_joints = self.inverse_kinematics(self.config.left_arm_base, left_target, is_left=True)
            self.left_ee_pose = self.forward_kinematics(self.config.left_arm_base, self.left_joints, is_left=True)

        # Update right arm
        if right_target:
            self.right_joints = self.inverse_kinematics(self.config.right_arm_base, right_target, is_left=False)
            self.right_ee_pose = self.forward_kinematics(self.config.right_arm_base, self.right_joints, is_left=False)

        self.step_count += 1
        self.sim_time += 1.0 / self.config.control_frequency_hz

        # Verify dual-arm clearance
        dx = self.left_ee_pose[0] - self.right_ee_pose[0]
        dy = self.left_ee_pose[1] - self.right_ee_pose[1]
        dz = self.left_ee_pose[2] - self.right_ee_pose[2]
        clearance = math.sqrt(dx*dx + dy*dy + dz*dz)
        collision = clearance < self.config.min_dual_arm_clearance_m

        return self.get_observation(), collision

    def get_observation(self) -> Dict[str, Any]:
        """Return full physical telemetry snapshot."""
        dx = self.left_ee_pose[0] - self.right_ee_pose[0]
        dy = self.left_ee_pose[1] - self.right_ee_pose[1]
        dz = self.left_ee_pose[2] - self.right_ee_pose[2]
        clearance = math.sqrt(dx*dx + dy*dy + dz*dz)

        return {
            "step": self.step_count,
            "sim_time": round(self.sim_time, 3),
            "is_e_stopped": self.is_e_stopped,
            "clearance_m": round(clearance, 4),
            "left_arm": {
                "base": self.config.left_arm_base,
                "joints_deg": self.left_joints,
                "ee_pose": self.left_ee_pose,
            },
            "right_arm": {
                "base": self.config.right_arm_base,
                "joints_deg": self.right_joints,
                "ee_pose": self.right_ee_pose,
            },
            "table_dimensions": {
                "width": self.config.table_width_m,
                "depth": self.config.table_depth_m,
                "height": self.config.table_height_m,
            },
            "dinner_objects_count": len(self.dinner_objects),
            "dinner_objects": {k: v.initial_pos for k, v in self.dinner_objects.items()}
        }
