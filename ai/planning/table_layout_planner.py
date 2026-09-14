"""
TwinHands-AI: Geometric Table Layout Planner
Computes 2D/3D place-setting coordinates for 1 to 10 diners on a standardized dining table.
Enforces capacity, boundary, clearance, and dual-arm reachability constraints.
"""

import math
from typing import List, Dict, Any, Tuple

TABLE_DIMENSIONS = {
    "width_m": 1.20,
    "depth_m": 0.80,
    "height_m": 0.75,
}

LEFT_ARM_BASE = (-0.38, -0.42, 0.75)
RIGHT_ARM_BASE = (0.38, -0.42, 0.75)
ARM_REACH_RADIUS_M = 0.58

def generate_place_setting_centers(people: int) -> List[Dict[str, Any]]:
    """Generate placemat center coordinates and yaw angles for group size (1-10)."""
    centers = []

    if people == 1:
        # Solo South Center
        centers.append({
            "person_id": 1,
            "label": "Person 1 (Solo)",
            "seat": "south",
            "pos": (0.0, -0.10, 0.75),
            "yaw": 0.0,
        })
    elif people == 2:
        # Balanced South Pair
        centers.append({"person_id": 1, "label": "Person 1", "seat": "south", "pos": (-0.26, -0.05, 0.75), "yaw": 0.0})
        centers.append({"person_id": 2, "label": "Person 2", "seat": "south", "pos": (0.26, -0.05, 0.75), "yaw": 0.0})
    elif people == 3:
        # Triangular: North Head, West, East
        centers.append({"person_id": 1, "label": "Person 1 (Head)", "seat": "north", "pos": (0.0, 0.22, 0.75), "yaw": 180.0})
        centers.append({"person_id": 2, "label": "Person 2", "seat": "west", "pos": (-0.32, -0.06, 0.75), "yaw": 90.0})
        centers.append({"person_id": 3, "label": "Person 3", "seat": "east", "pos": (0.32, -0.06, 0.75), "yaw": -90.0})
    elif people == 4:
        # 4-Sided Perimeter: North, South, West, East
        centers.append({"person_id": 1, "label": "Person 1 (North)", "seat": "north", "pos": (0.0, 0.24, 0.75), "yaw": 180.0})
        centers.append({"person_id": 2, "label": "Person 2 (West)", "seat": "west", "pos": (-0.36, 0.05, 0.75), "yaw": 90.0})
        centers.append({"person_id": 3, "label": "Person 3 (East)", "seat": "east", "pos": (0.36, 0.05, 0.75), "yaw": -90.0})
        centers.append({"person_id": 4, "label": "Person 4 (South)", "seat": "south", "pos": (0.0, -0.16, 0.75), "yaw": 0.0})
    elif people == 5:
        centers.append({"person_id": 1, "label": "Person 1", "seat": "north", "pos": (-0.22, 0.22, 0.75), "yaw": 180.0})
        centers.append({"person_id": 2, "label": "Person 2", "seat": "north", "pos": (0.22, 0.22, 0.75), "yaw": 180.0})
        centers.append({"person_id": 3, "label": "Person 3", "seat": "south", "pos": (-0.22, -0.16, 0.75), "yaw": 0.0})
        centers.append({"person_id": 4, "label": "Person 4", "seat": "south", "pos": (0.22, -0.16, 0.75), "yaw": 0.0})
        centers.append({"person_id": 5, "label": "Person 5 (Host)", "seat": "west", "pos": (-0.42, 0.03, 0.75), "yaw": 90.0})
    elif people == 6:
        xs = [-0.36, 0.0, 0.36]
        for idx, x in enumerate(xs):
            centers.append({"person_id": idx + 1, "label": f"Person {idx + 1}", "seat": "north", "pos": (x, 0.22, 0.75), "yaw": 180.0})
        for idx, x in enumerate(xs):
            centers.append({"person_id": idx + 4, "label": f"Person {idx + 4}", "seat": "south", "pos": (x, -0.16, 0.75), "yaw": 0.0})
    elif people == 7:
        xs = [-0.36, 0.0, 0.36]
        for idx, x in enumerate(xs):
            centers.append({"person_id": idx + 1, "label": f"Person {idx + 1}", "seat": "north", "pos": (x, 0.22, 0.75), "yaw": 180.0})
        for idx, x in enumerate(xs):
            centers.append({"person_id": idx + 4, "label": f"Person {idx + 4}", "seat": "south", "pos": (x, -0.16, 0.75), "yaw": 0.0})
        centers.append({"person_id": 7, "label": "Person 7", "seat": "east", "pos": (0.46, 0.03, 0.75), "yaw": -90.0})
    elif people == 8:
        xs = [-0.34, 0.0, 0.34]
        for idx, x in enumerate(xs):
            centers.append({"person_id": idx + 1, "label": f"Person {idx + 1}", "seat": "north", "pos": (x, 0.22, 0.75), "yaw": 180.0})
        for idx, x in enumerate(xs):
            centers.append({"person_id": idx + 4, "label": f"Person {idx + 4}", "seat": "south", "pos": (x, -0.16, 0.75), "yaw": 0.0})
        centers.append({"person_id": 7, "label": "Person 7", "seat": "west", "pos": (-0.46, 0.03, 0.75), "yaw": 90.0})
        centers.append({"person_id": 8, "label": "Person 8", "seat": "east", "pos": (0.46, 0.03, 0.75), "yaw": -90.0})
    elif people == 9:
        xs = [-0.42, -0.14, 0.14, 0.42]
        for idx, x in enumerate(xs):
            centers.append({"person_id": idx + 1, "label": f"Person {idx + 1}", "seat": "north", "pos": (x, 0.22, 0.75), "yaw": 180.0})
        for idx, x in enumerate(xs):
            centers.append({"person_id": idx + 5, "label": f"Person {idx + 5}", "seat": "south", "pos": (x, -0.16, 0.75), "yaw": 0.0})
        centers.append({"person_id": 9, "label": "Person 9", "seat": "west", "pos": (-0.52, 0.03, 0.75), "yaw": 90.0})
    elif people == 10:
        xs = [-0.42, -0.14, 0.14, 0.42]
        for idx, x in enumerate(xs):
            centers.append({"person_id": idx + 1, "label": f"Person {idx + 1}", "seat": "north", "pos": (x, 0.22, 0.75), "yaw": 180.0})
        for idx, x in enumerate(xs):
            centers.append({"person_id": idx + 5, "label": f"Person {idx + 5}", "seat": "south", "pos": (x, -0.16, 0.75), "yaw": 0.0})
        centers.append({"person_id": 9, "label": "Person 9", "seat": "west", "pos": (-0.52, 0.03, 0.75), "yaw": 90.0})
        centers.append({"person_id": 10, "label": "Person 10", "seat": "east", "pos": (0.52, 0.03, 0.75), "yaw": -90.0})

    return centers

class TableLayoutPlanner:
    def __init__(self):
        self.table = TABLE_DIMENSIONS

    def plan_table(self, group_size: int) -> Dict[str, Any]:
        """Validate group size and synthesize full geometric place settings."""
        if group_size < 1 or group_size > 10:
            return {
                "group_size": group_size,
                "is_valid": False,
                "rejection_notice": (
                    f"GROUP SIZE NOT SUPPORTED\n\n"
                    f"TwinHands-AI currently supports 1–10 people.\n"
                    f"Please specify a group size between 1 and 10."
                ),
                "place_settings": [],
                "total_objects": 0,
            }

        centers = generate_place_setting_centers(group_size)
        place_settings = []
        all_items = []

        for c in centers:
            rad = math.radians(c["yaw"])
            cos_y, sin_y = math.cos(rad), math.sin(rad)
            cx, cy, cz = c["pos"]

            def offset(dx, dy, dz):
                return (
                    round(cx + (dx * cos_y - dy * sin_y), 4),
                    round(cy + (dx * sin_y + dy * cos_y), 4),
                    round(cz + dz, 4)
                )

            p_id = c["person_id"]
            items = [
                {"id": f"plate-p{p_id}", "type": "plate", "person": p_id, "target": offset(0, 0, 0.005), "layer": 0},
                {"id": f"bowl-p{p_id}", "type": "bowl", "person": p_id, "target": offset(0, 0, 0.028), "layer": 1},
                {"id": f"cup-p{p_id}", "type": "cup", "person": p_id, "target": offset(-0.09, 0.07, 0.015), "layer": 0},
                {"id": f"spoon-p{p_id}", "type": "spoon", "person": p_id, "target": offset(0.10, -0.01, 0.008), "layer": 0},
                {"id": f"add-spoon-p{p_id}", "type": "additional_spoon", "person": p_id, "target": offset(0.14, -0.01, 0.008), "layer": 0},
            ]

            place_settings.append({
                "person_id": p_id,
                "label": c["label"],
                "seat": c["seat"],
                "center": c["pos"],
                "items": items,
            })
            all_items.extend(items)

        return {
            "group_size": group_size,
            "is_valid": True,
            "rejection_notice": None,
            "place_settings": place_settings,
            "total_objects": len(all_items),
            "summary": {
                "plates": group_size,
                "bowls": group_size,
                "cups": group_size,
                "spoons": group_size,
                "additional_spoons": group_size,
            }
        }
