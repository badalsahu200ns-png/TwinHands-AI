"""
TwinHands-AI: Reach Controller & Parabolic Trajectory Generator
Computes smooth minimum-jerk waypoints with parabolic Z-axis clearance arcs.
"""

import math
from typing import List, Tuple

class ReachTrajectoryController:
    def __init__(self, default_lift_height_m: float = 0.14):
        self.default_lift_height = default_lift_height_m

    def generate_parabolic_arc(self,
                               start: Tuple[float, float, float],
                               end: Tuple[float, float, float],
                               num_steps: int = 30,
                               lift_height: float = 0.14) -> List[Tuple[float, float, float]]:
        """
        Generate a 3D parabolic transit arc between start and target coordinates.
        Equation: p(s) = (1 - s)*start + s*end + [0, 0, lift_height * sin(pi * s)]
        """
        waypoints = []
        for i in range(num_steps + 1):
            s = float(i) / float(num_steps)
            # Minimum-jerk polynomial smoothing: s_smooth = 10*s^3 - 15*s^4 + 6*s^5
            s_smooth = 10.0 * (s ** 3) - 15.0 * (s ** 4) + 6.0 * (s ** 5)

            arc_z = lift_height * math.sin(s * math.pi)

            x = start[0] + (end[0] - start[0]) * s_smooth
            y = start[1] + (end[1] - start[1]) * s_smooth
            z = start[2] + (end[2] - start[2]) * s_smooth + arc_z

            waypoints.append((round(x, 4), round(y, 4), round(z, 4)))

        return waypoints

    def compute_cartesian_error(self,
                                current: Tuple[float, float, float],
                                target: Tuple[float, float, float]) -> Tuple[float, Tuple[float, float, float]]:
        """Compute Euclidean distance error and direction vector."""
        dx = target[0] - current[0]
        dy = target[1] - current[1]
        dz = target[2] - current[2]
        dist = math.sqrt(dx*dx + dy*dy + dz*dz)
        return dist, (dx, dy, dz)
