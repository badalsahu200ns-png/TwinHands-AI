"""
TwinHands-AI: Lift Primitive
Raises gripped object vertically along +Z axis.
"""

from typing import Tuple, Dict, Any

def execute_lift(env, arm: str, current_pos: Tuple[float, float, float], lift_height_m: float = 0.14) -> Dict[str, Any]:
    lift_target = (current_pos[0], current_pos[1], current_pos[2] + lift_height_m)
    if arm == "left":
        obs, col = env.step(left_target=lift_target)
    else:
        obs, col = env.step(right_target=lift_target)

    return {
        "primitive": "lift",
        "arm": arm,
        "lifted_to": lift_target,
        "status": "COMPLETED",
        "collision": col,
    }
