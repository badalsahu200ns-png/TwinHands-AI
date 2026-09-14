"""
Unit Tests: Robotics Kinematics & Controllers
"""

import unittest
import math
from simulation.mujoco.dual_arm_env import SO101DualArmEnv, DualArmEnvConfig
from robotics.controllers.cartesian_controller import CartesianJacobianController
from robotics.controllers.reach_controller import ReachTrajectoryController

class TestRoboticsKinematics(unittest.TestCase):
    def setUp(self):
        self.env = SO101DualArmEnv()
        self.controller = CartesianJacobianController()
        self.reach_ctrl = ReachTrajectoryController()

    def test_forward_kinematics_consistency(self):
        base = (-0.38, -0.42, 0.75)
        joints = [0.0, 30.0, -45.0, 15.0, -15.0, 0.0]
        ee_pos = self.env.forward_kinematics(base, joints, is_left=True)
        self.assertEqual(len(ee_pos), 3)
        self.assertGreater(ee_pos[2], 0.75)  # Must be above table surface

    def test_inverse_kinematics_reaches_target(self):
        base = (-0.38, -0.42, 0.75)
        target = (-0.20, -0.10, 0.78)
        joints = self.env.inverse_kinematics(base, target, is_left=True)
        self.assertEqual(len(joints), 6)
        recovered_ee = self.env.forward_kinematics(base, joints, is_left=True)
        dx = recovered_ee[0] - target[0]
        dy = recovered_ee[1] - target[1]
        err_planar = math.hypot(dx, dy)
        self.assertLess(err_planar, 0.08)  # Within 8cm tolerance

    def test_jacobian_computation(self):
        joints = [0.0, 30.0, -45.0, 15.0, -15.0, 0.0]
        J = self.controller.compute_jacobian(joints)
        self.assertEqual(len(J), 3)
        self.assertEqual(len(J[0]), 3)

    def test_dls_inverse_velocity(self):
        joints = [0.0, 30.0, -45.0, 15.0, -15.0, 0.0]
        J = self.controller.compute_jacobian(joints)
        dx = (0.02, 0.0, 0.0)  # 2cm Cartesian movement
        dq = self.controller.solve_dls_inverse(J, dx)
        self.assertEqual(len(dq), 3)
        for q_vel in dq:
            self.assertLessEqual(abs(q_vel), self.controller.max_joint_vel_deg)

    def test_parabolic_arc_height(self):
        start = (-0.30, -0.20, 0.76)
        end = (-0.10, 0.10, 0.76)
        arc = self.reach_ctrl.generate_parabolic_arc(start, end, num_steps=20, lift_height=0.14)
        self.assertEqual(len(arc), 21)
        midpoint = arc[10]
        # Midpoint z should be higher than start z due to arc lift
        self.assertGreater(midpoint[2], start[2] + 0.10)

if __name__ == "__main__":
    unittest.main()
