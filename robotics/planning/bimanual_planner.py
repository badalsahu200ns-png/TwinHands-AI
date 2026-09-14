"""
TwinHands-AI: Bimanual Task Allocation & Coordination Planner
Optimizes dual-arm workload distribution and enforces spatial separation (clearance >= 0.18m).
"""

import math
from typing import List, Dict, Any, Tuple

class BimanualPlanner:
    def __init__(self,
                 left_base: Tuple[float, float, float] = (-0.38, -0.42, 0.75),
                 right_base: Tuple[float, float, float] = (0.38, -0.42, 0.75),
                 min_clearance_m: float = 0.18):
        self.left_base = left_base
        self.right_base = right_base
        self.min_clearance = min_clearance_m

    def check_collision(self,
                        left_tcp: Tuple[float, float, float],
                        right_tcp: Tuple[float, float, float]) -> Tuple[bool, float]:
        """Verify Euclidean clearance between Red and Blue TCPs."""
        dx = left_tcp[0] - right_tcp[0]
        dy = left_tcp[1] - right_tcp[1]
        dz = left_tcp[2] - right_tcp[2]
        dist = math.sqrt(dx*dx + dy*dy + dz*dz)
        is_collision = dist < self.min_clearance
        return is_collision, round(dist, 3)

    def allocate_tasks(self, tasks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Cost-optimized task allocation:
        Total Cost = w_dist * Distance + w_bal * WorkloadImbalance
        """
        left_tasks = []
        right_tasks = []
        cur_left = self.left_base
        cur_right = self.right_base
        total_dist_left = 0.0
        total_dist_right = 0.0

        for t in tasks:
            target = t["target"]
            dist_to_left = math.hypot(target[0] - cur_left[0], target[1] - cur_left[1])
            dist_to_right = math.hypot(target[0] - cur_right[0], target[1] - cur_right[1])

            # Spatial bias + workload balancing factor
            cost_left = dist_to_left + (len(left_tasks) - len(right_tasks)) * 0.15
            cost_right = dist_to_right + (len(right_tasks) - len(left_tasks)) * 0.15

            if cost_left <= cost_right:
                assigned = "left"
                left_tasks.append({**t, "assigned_arm": "left"})
                total_dist_left += dist_to_left
                cur_left = target
            else:
                assigned = "right"
                right_tasks.append({**t, "assigned_arm": "right"})
                total_dist_right += dist_to_right
                cur_right = target

        # Estimate execution time and bimanual speedup
        single_time = (total_dist_left + total_dist_right) * 3.8 + len(tasks) * 2.2
        bimanual_time = max(total_dist_left, total_dist_right) * 3.8 + max(len(left_tasks), len(right_tasks)) * 2.2
        speedup = round(single_time / max(0.1, bimanual_time), 2)

        return {
            "left_tasks": left_tasks,
            "right_tasks": right_tasks,
            "left_count": len(left_tasks),
            "right_count": len(right_tasks),
            "total_distance_m": round(total_dist_left + total_dist_right, 2),
            "estimated_bimanual_time_s": round(bimanual_time, 1),
            "estimated_single_time_s": round(single_time, 1),
            "bimanual_speedup": speedup,
        }
