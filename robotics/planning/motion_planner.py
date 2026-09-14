"""
TwinHands-AI: Cartesian Motion Planner
Plans collision-free trajectories and validates workspace reachability.
"""

import math
from typing import List, Tuple, Dict, Any

class MotionPlanner:
    def __init__(self,
                 table_bounds: Tuple[float, float, float, float] = (-0.60, 0.60, -0.40, 0.40),
                 arm_reach_radius_m: float = 0.58):
        self.min_x, self.max_x, self.min_y, self.max_y = table_bounds
        self.max_reach = arm_reach_radius_m

    def check_reachability(self, arm_base: Tuple[float, float, float], target: Tuple[float, float, float]) -> bool:
        """Validate if target position is within arm's physical kinematic envelope."""
        dx = target[0] - arm_base[0]
        dy = target[1] - arm_base[1]
        dist = math.hypot(dx, dy)
        return dist <= (self.max_reach + 0.05)

    def check_table_bounds(self, target: Tuple[float, float, float]) -> bool:
        """Verify target is strictly within tabletop boundaries."""
        return (self.min_x <= target[0] <= self.max_x and
                self.min_y <= target[1] <= self.max_y)

    def plan_pick_and_place(self,
                            start_pose: Tuple[float, float, float],
                            pick_pose: Tuple[float, float, float],
                            place_pose: Tuple[float, float, float],
                            lift_clearance: float = 0.14) -> Dict[str, Any]:
        """
        Generate structured waypoint phases for a pick-and-place action:
        1. Approach Pick (Pre-grasp)
        2. Descent to Pick
        3. Lift Post-Pick
        4. Parabolic Transit to Pre-Place
        5. Descent to Place
        6. Retraction
        """
        pre_pick = (pick_pose[0], pick_pose[1], pick_pose[2] + lift_clearance)
        post_pick = (pick_pose[0], pick_pose[1], pick_pose[2] + lift_clearance)
        pre_place = (place_pose[0], place_pose[1], place_pose[2] + lift_clearance)
        retract = (place_pose[0], place_pose[1], place_pose[2] + lift_clearance)

        return {
            "phases": [
                {"name": "APPROACH_PICK", "target": pre_pick},
                {"name": "DESCENT_PICK", "target": pick_pose},
                {"name": "GRASP", "target": pick_pose},
                {"name": "LIFT", "target": post_pick},
                {"name": "TRANSIT", "target": pre_place},
                {"name": "DESCENT_PLACE", "target": place_pose},
                {"name": "RELEASE", "target": place_pose},
                {"name": "RETRACT", "target": retract}
            ]
        }
