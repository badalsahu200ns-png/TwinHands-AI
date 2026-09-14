"""
TwinHands-AI: Place Primitive
Descends grasped object onto target placemat position.
"""

from typing import Tuple, Dict, Any

def execute_place(env, arm: str, target_pos: Tuple[float, float, float]) -> Dict[str, Any]:
    if arm == "left":
        obs, col = env.step(left_target=target_pos)
    else:
        obs, col = env.step(right_target=target_pos)

    return {
        "primitive": "place",
        "arm": arm,
        "placed_at": target_pos,
        "status": "COMPLETED",
        "collision": col,
    }
