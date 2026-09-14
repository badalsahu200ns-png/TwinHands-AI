"""
TwinHands-AI: Optical Verification Engine
Verifies placed objects against intended positions using optical sensor tolerance checks.
"""

import math
from typing import Tuple, Dict, Any

class OpticalVerificationEngine:
    def __init__(self, max_allowed_deviation_m: float = 0.015):
        self.max_deviation = max_allowed_deviation_m

    def verify_placed_item(self,
                           target_pos: Tuple[float, float, float],
                           detected_pos: Tuple[float, float, float]) -> Dict[str, Any]:
        """Compute deviation and pass/fail verification status."""
        dx = detected_pos[0] - target_pos[0]
        dy = detected_pos[1] - target_pos[1]
        dz = detected_pos[2] - target_pos[2]
        deviation = math.sqrt(dx*dx + dy*dy + dz*dz)
        passed = (deviation <= self.max_deviation)

        return {
            "passed": passed,
            "deviation_mm": round(deviation * 1000.0, 1),
            "max_allowed_mm": round(self.max_deviation * 1000.0, 1),
            "status": "PASS" if passed else "FAIL_DEVIATION",
        }
