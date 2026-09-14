"""
TwinHands-AI: Cartesian & Jacobian Controller
Translates desired end-effector Cartesian velocities to joint rate commands
using the Damped Least Squares (DLS) Jacobian pseudo-inverse: dq = J^T (J J^T + lambda^2 I)^(-1) dx
"""

import math
from typing import List, Tuple

class CartesianJacobianController:
    def __init__(self, damping_factor: float = 0.05, max_joint_vel_deg: float = 45.0):
        self.damping_lambda = damping_factor
        self.max_joint_vel_deg = max_joint_vel_deg
        
        # Link lengths
        self.l1 = 0.08  # Base to shoulder
        self.l2 = 0.22  # Upper arm
        self.l3 = 0.20  # Forearm
        self.l4 = 0.12  # Wrist to TCP

    def compute_jacobian(self, joints_deg: List[float]) -> List[List[float]]:
        """
        Compute the 3x3 geometric position Jacobian matrix J(q) = d(pos)/d(q)
        for waist (q1), shoulder (q2), and elbow (q3).
        """
        q1 = math.radians(joints_deg[0])
        q2 = math.radians(joints_deg[1])
        q3 = math.radians(joints_deg[2])

        s1, c1 = math.sin(q1), math.cos(q1)
        s2, c2 = math.sin(q2), math.cos(q2)
        s23, c23 = math.sin(q2 + q3), math.cos(q2 + q3)

        # Planar radial distance from waist axis
        r = self.l2 * c2 + self.l3 * c23 + self.l4

        # Partial derivatives
        # dx/dq1, dx/dq2, dx/dq3
        j11 = -r * s1
        j12 = c1 * (-self.l2 * s2 - self.l3 * s23)
        j13 = c1 * (-self.l3 * s23)

        # dy/dq1, dy/dq2, dy/dq3
        j21 = r * c1
        j22 = s1 * (-self.l2 * s2 - self.l3 * s23)
        j23 = s1 * (-self.l3 * s23)

        # dz/dq1, dz/dq2, dz/dq3
        j31 = 0.0
        j32 = self.l2 * c2 + self.l3 * c23
        j33 = self.l3 * c23

        return [
            [j11, j12, j13],
            [j21, j22, j23],
            [j31, j32, j33]
        ]

    def solve_dls_inverse(self, J: List[List[float]], dx: Tuple[float, float, float]) -> List[float]:
        """
        Solve Damped Least Squares: dq = J^T (J J^T + lambda^2 I)^(-1) dx
        Uses 3x3 matrix inversion with damping to avoid boundary singularities.
        """
        # Compute JJ^T (3x3)
        JJT = [[0.0 for _ in range(3)] for _ in range(3)]
        for i in range(3):
            for j in range(3):
                JJT[i][j] = sum(J[i][k] * J[j][k] for k in range(3))
                if i == j:
                    JJT[i][j] += self.damping_lambda ** 2

        # Invert 3x3 matrix JJT
        det = (
            JJT[0][0] * (JJT[1][1] * JJT[2][2] - JJT[1][2] * JJT[2][1]) -
            JJT[0][1] * (JJT[1][0] * JJT[2][2] - JJT[1][2] * JJT[2][0]) +
            JJT[0][2] * (JJT[1][0] * JJT[2][1] - JJT[1][1] * JJT[2][0])
        )

        if abs(det) < 1e-7:
            det = 1e-7

        invDet = 1.0 / det
        invJJT = [
            [
                (JJT[1][1] * JJT[2][2] - JJT[1][2] * JJT[2][1]) * invDet,
                (JJT[0][2] * JJT[2][1] - JJT[0][1] * JJT[2][2]) * invDet,
                (JJT[0][1] * JJT[1][2] - JJT[0][2] * JJT[1][1]) * invDet,
            ],
            [
                (JJT[1][2] * JJT[2][0] - JJT[1][0] * JJT[2][2]) * invDet,
                (JJT[0][0] * JJT[2][2] - JJT[0][2] * JJT[2][0]) * invDet,
                (JJT[0][2] * JJT[1][0] - JJT[0][0] * JJT[1][2]) * invDet,
            ],
            [
                (JJT[1][0] * JJT[2][1] - JJT[1][1] * JJT[2][0]) * invDet,
                (JJT[0][1] * JJT[2][0] - JJT[0][0] * JJT[2][1]) * invDet,
                (JJT[0][0] * JJT[1][1] - JJT[0][1] * JJT[1][0]) * invDet,
            ]
        ]

        # temp = invJJT * dx
        temp = [sum(invJJT[i][j] * dx[j] for j in range(3)) for i in range(3)]

        # dq = J^T * temp
        dq_rad = [sum(J[j][i] * temp[j] for j in range(3)) for i in range(3)]
        dq_deg = [math.degrees(val) for val in dq_rad]

        # Velocity saturation
        for i in range(3):
            dq_deg[i] = max(-self.max_joint_vel_deg, min(self.max_joint_vel_deg, dq_deg[i]))

        return dq_deg
