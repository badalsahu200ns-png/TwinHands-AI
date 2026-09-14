"""
TwinHands-AI: Release Primitive
Opens parallel gripper fingers and retracts along post-place vector.
"""

from typing import Tuple, Dict, Any

def execute_release(gripper_controller, env, arm: str, current_pos: Tuple[float, float, float], retract_h: float = 0.10) -> Dict[str, Any]:
    gripper_res = gripper_controller.release()
    retract_target = (current_pos[0], current_pos[1], current_pos[2] + retract_h)

    if arm == "left":
        obs, col = env.step(left_target=retract_target)
    else:
        obs, col = env.step(right_target=retract_target)

    return {
        "primitive": "release",
        "arm": arm,
        "gripper_status": gripper_res["status"],
        "retracted_to": retract_target,
        "collision": col,
    }
