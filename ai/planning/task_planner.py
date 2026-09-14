"""
TwinHands-AI: High-Level Task Planner
Decomposes high-level intent into required place settings, inventory, and structured task JSON.
"""

from typing import Dict, Any, List

class TaskPlanner:
    def __init__(self):
        pass

    def plan_tasks_for_group(self, group_size: int) -> Dict[str, Any]:
        """Decompose group size into required items and structured task actions."""
        if group_size < 1 or group_size > 10:
            raise ValueError(f"Group size {group_size} outside supported boundary (1-10).")

        required_inventory = {
            "plates": group_size,
            "bowls": group_size,
            "cups": group_size,
            "spoons": group_size,
            "additional_spoons": group_size,
            "total_objects": group_size * 5,
        }

        actions: List[Dict[str, Any]] = []
        action_id = 1

        for p in range(1, group_size + 1):
            # Plates
            actions.append({
                "id": action_id,
                "person": p,
                "object": "plate",
                "action": "place",
                "layer": 0,
            })
            action_id += 1

            # Bowls
            actions.append({
                "id": action_id,
                "person": p,
                "object": "bowl",
                "action": "place",
                "layer": 1,
            })
            action_id += 1

            # Cups
            actions.append({
                "id": action_id,
                "person": p,
                "object": "cup",
                "action": "place",
                "layer": 0,
            })
            action_id += 1

            # Spoons
            actions.append({
                "id": action_id,
                "person": p,
                "object": "spoon",
                "action": "place",
                "layer": 0,
            })
            action_id += 1

            # Additional Spoons
            actions.append({
                "id": action_id,
                "person": p,
                "object": "additional_spoon",
                "action": "place",
                "layer": 0,
            })
            action_id += 1

        return {
            "task": "prepare_dinner_table",
            "target_people": group_size,
            "objects_per_person": {"plate": 1, "bowl": 1, "cup": 1, "spoon": 1, "additional_spoon": 1},
            "inventory_summary": required_inventory,
            "actions": actions,
        }
