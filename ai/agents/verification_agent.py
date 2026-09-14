"""
TwinHands-AI: Verification Agent
Validates whether placed tableware objects are within Euclidean tolerance (<= 15mm).
"""

import math
from typing import Dict, Any, List, Tuple

class VerificationAgent:
    def __init__(self, tolerance_m: float = 0.015):
        self.tolerance_m = tolerance_m

    def verify_placement(self,
                         target_pos: Tuple[float, float, float],
                         observed_pos: Tuple[float, float, float]) -> Dict[str, Any]:
        """Check if Euclidean distance between observed and target is within 15mm."""
        dx = observed_pos[0] - target_pos[0]
        dy = observed_pos[1] - target_pos[1]
        dz = observed_pos[2] - target_pos[2]
        error_m = math.sqrt(dx*dx + dy*dy + dz*dz)
        is_success = (error_m <= self.tolerance_m)

        return {
            "is_success": is_success,
            "error_mm": round(error_m * 1000.0, 1),
            "tolerance_mm": round(self.tolerance_m * 1000.0, 1),
            "status": "VERIFIED_PASS" if is_success else "OUT_OF_TOLERANCE",
        }

    def verify_place_settings(self,
                              settings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Aggregate verification report across all place settings."""
        total_items = 0
        passed_items = 0

        for setting in settings:
            for item in setting.get("items", []):
                total_items += 1
                if item.get("status") in ["placed", "verified"]:
                    passed_items += 1

        all_passed = (total_items > 0 and passed_items == total_items)
        return {
            "all_passed": all_passed,
            "total_items": total_items,
            "completed_items": passed_items,
            "completion_rate_pct": round((passed_items / max(1, total_items)) * 100, 1),
            "status": "SUCCESS" if all_passed else "IN_PROGRESS",
        }
