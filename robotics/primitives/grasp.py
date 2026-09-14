"""
TwinHands-AI: Grasp Primitive
Actuates parallel gripper to secure tableware object.
"""

from typing import Dict, Any

def execute_grasp(gripper_controller, object_id: str, grasp_width_mm: float = 25.0) -> Dict[str, Any]:
    res = gripper_controller.close_to_width(grasp_width_mm, object_id=object_id)
    return {
        "primitive": "grasp",
        "object_id": object_id,
        "width_mm": res["current_width_mm"],
        "is_holding": res["is_holding"],
        "status": "SUCCESS" if res["is_holding"] else "FAILED",
    }
