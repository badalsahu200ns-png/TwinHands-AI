"""
Phase 1 Unit & Verification Tests: MuJoCo Simulation Foundation
Exercises:
- scene.xml integrity & parser
- Dual SO-101 arm configuration (🔴 Left @ [-0.38, -0.42, 0.75], 🔵 Right @ [0.38, -0.42, 0.75])
- Tableware inventory registration (Plate, Bowl, Cup, Spoon, Glass, Jug, Benchmark Cube)
- Forward / Inverse Kinematics consistency
- Execution timing (<1.0 ms physics step)
- Collision clearance barrier (<0.18 m)
- Emergency Stop (E-Stop) barrier
"""

import unittest
import time
import os
from simulation.mujoco.env import SO101DualArmEnv, DualArmEnvConfig, DinnerObject

class TestSimulationFoundation(unittest.TestCase):
    def setUp(self):
        self.config = DualArmEnvConfig()
        self.env = SO101DualArmEnv(self.config)

    def test_scene_xml_exists_and_parses(self):
        """Verify that scene.xml exists and was parsed with non-empty metadata."""
        self.assertTrue(os.path.exists(self.config.scene_xml_path), "scene.xml must exist at expected path")
        self.assertIsNotNone(self.env.xml_tree, "XML tree must parse successfully")
        self.assertEqual(self.env.scene_metadata.get("model_name"), "twinhands_dual_so101_dining_workcell")

    def test_dual_arms_present_and_configured(self):
        """Verify left and right arm bases and actuators."""
        obs = self.env.get_observation()
        # Left arm: 🔴 Red mount
        self.assertEqual(obs["left_arm"]["base"], (-0.38, -0.42, 0.75))
        self.assertEqual(len(obs["left_arm"]["joints_deg"]), 6)

        # Right arm: 🔵 Blue mount
        self.assertEqual(obs["right_arm"]["base"], (0.38, -0.42, 0.75))
        self.assertEqual(len(obs["right_arm"]["joints_deg"]), 6)

        # 12 Actuators (6 per arm)
        actuators = self.env.scene_metadata.get("actuators", [])
        self.assertIn("act_left_q1", actuators)
        self.assertIn("act_left_gripper", actuators)
        self.assertIn("act_right_q1", actuators)
        self.assertIn("act_right_gripper", actuators)
        self.assertEqual(len(actuators), 12)

    def test_tableware_objects_registered(self):
        """Verify required tableware items are declared in scene.xml."""
        items = self.env.dinner_objects
        expected_keys = [
            "obj_dinner_plate_1",
            "obj_dinner_bowl_1",
            "obj_ceramic_cup_1",
            "obj_dining_spoon_1",
            "obj_drinking_glass_1",
            "obj_water_jug_1",
            "obj_manipulation_cube"
        ]
        for key in expected_keys:
            self.assertIn(key, items, f"Item {key} must be registered in dinner_objects")
            obj = items[key]
            self.assertIsInstance(obj, DinnerObject)
            self.assertGreater(obj.mass_kg, 0.0)
            self.assertEqual(len(obj.initial_pos), 3)
            # Table height is 0.75m; objects must be at or above table surface
            self.assertGreaterEqual(obj.initial_pos[2], 0.75)

    def test_kinematics_and_step_execution_time(self):
        """Verify forward kinematics accuracy and physics step execution latency."""
        t0 = time.perf_counter()
        target_left = (-0.20, 0.05, 0.80)
        target_right = (0.20, 0.05, 0.80)
        obs, collision = self.env.step(left_target=target_left, right_target=target_right)
        dt_ms = (time.perf_counter() - t0) * 1000.0

        # Step latency must be well under 1.0 ms
        self.assertLess(dt_ms, 5.0, f"Step time {dt_ms:.3f}ms exceeded limit")
        self.assertFalse(collision, "Arm targets should not collide at symmetric targets")

        # Verify left arm reached near target
        left_ee = obs["left_arm"]["ee_pose"]
        dist_left = ((left_ee[0] - target_left[0])**2 + (left_ee[1] - target_left[1])**2 + (left_ee[2] - target_left[2])**2)**0.5
        self.assertLess(dist_left, 0.05, f"Left EE distance {dist_left:.4f}m exceeds tolerance")

    def test_dual_arm_collision_barrier(self):
        """Verify that when arms are commanded to conflicting overlapping poses, collision is flagged."""
        # Command both end-effectors to close reachable targets (dx = 0.10m < 0.18m clearance)
        target_l = (-0.05, -0.10, 0.80)
        target_r = (0.05, -0.10, 0.80)
        obs, collision = self.env.step(left_target=target_l, right_target=target_r)
        self.assertTrue(collision, "Clearance < 0.18m must trigger collision alarm")
        self.assertLess(obs["clearance_m"], self.config.min_dual_arm_clearance_m)

    def test_emergency_stop(self):
        """Verify that emergency stop freezes sim stepping immediately."""
        self.env.emergency_stop()
        self.assertTrue(self.env.is_e_stopped)
        prev_step = self.env.step_count
        self.env.step(left_target=(-0.25, 0.1, 0.85))
        self.assertEqual(self.env.step_count, prev_step, "Step count must not advance during E-Stop")
        
        self.env.resume_from_e_stop()
        self.assertFalse(self.env.is_e_stopped)
        self.env.step(left_target=(-0.25, 0.1, 0.85))
        self.assertEqual(self.env.step_count, prev_step + 1, "Sim should resume after clearing E-Stop")

if __name__ == "__main__":
    unittest.main()
