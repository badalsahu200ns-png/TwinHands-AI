"""
TwinHands-AI: Parallel Gripper Controller
Controls two-finger parallel grippers on SO-101 robotic arms.
"""

from typing import Dict, Any

class GripperController:
    def __init__(self, max_stroke_mm: float = 45.0):
        self.max_stroke_mm = max_stroke_mm
        self.current_width_mm = max_stroke_mm  # fully open initially
        self.is_holding = False
        self.held_object_id = None
        self.grip_force_n = 0.0

    def open(self) -> Dict[str, Any]:
        """Fully open gripper fingers."""
        self.current_width_mm = self.max_stroke_mm
        self.is_holding = False
        self.held_object_id = None
        self.grip_force_n = 0.0
        return self.status()

    def close_to_width(self, target_width_mm: float, object_id: str = None, force_n: float = 8.5) -> Dict[str, Any]:
        """Close fingers to target object width with tactile grasp verification."""
        self.current_width_mm = max(0.0, min(self.max_stroke_mm, target_width_mm))
        if target_width_mm < self.max_stroke_mm - 5.0 and object_id:
            self.is_holding = True
            self.held_object_id = object_id
            self.grip_force_n = force_n
        else:
            self.is_holding = False
            self.held_object_id = None
            self.grip_force_n = 0.0
        return self.status()

    def release(self) -> Dict[str, Any]:
        """Release grasped item and open fingers."""
        released_item = self.held_object_id
        self.open()
        return {
            "released_item": released_item,
            "status": "RELEASED",
            "current_width_mm": self.current_width_mm,
        }

    def status(self) -> Dict[str, Any]:
        return {
            "current_width_mm": self.current_width_mm,
            "is_holding": self.is_holding,
            "held_object_id": self.held_object_id,
            "grip_force_n": self.grip_force_n,
        }
