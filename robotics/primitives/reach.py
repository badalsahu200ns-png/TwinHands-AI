"""
TwinHands-AI: Reach Primitive
Moves end-effector toward target position with approach clearance.
"""

from typing import Tuple, Dict, Any

def execute_reach(env, arm: str, target: Tuple[float, float, float], approach_offset: float = 0.10) -> Dict[str, Any]:
    pre_target = (target[0], target[1], target[2] + approach_offset)
    if arm == "left":
        obs, col = env.step(left_target=pre_target)
        obs, col = env.step(left_target=target)
    else:
        obs, col = env.step(right_target=pre_target)
        obs, col = env.step(right_target=target)

    return {
        "primitive": "reach",
        "arm": arm,
        "target": target,
        "status": "COMPLETED",
        "collision": col,
    }
