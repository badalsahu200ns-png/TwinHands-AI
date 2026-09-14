"""
Integration Tests: End-to-End Physical AI Execution Loop
Voice/Text -> Vision -> Reasoning -> Planning -> Bimanual Action -> Verification
"""

import unittest
from ai.agents.task_agent import TaskAgent
from ai.planning.table_layout_planner import TableLayoutPlanner
from robotics.planning.bimanual_planner import BimanualPlanner
from simulation.mujoco.dual_arm_env import SO101DualArmEnv
from perception.verification import OpticalVerificationEngine

class TestEndToEndPipeline(unittest.TestCase):
    def setUp(self):
        self.task_agent = TaskAgent()
        self.layout_planner = TableLayoutPlanner()
        self.bimanual_planner = BimanualPlanner()
        self.env = SO101DualArmEnv()
        self.verifier = OpticalVerificationEngine()

    def test_end_to_end_four_person_setup(self):
        # Step 1: Natural Language Command
        command = "Prepare the dinner table for 4 people."
        parsed = self.task_agent.parse_instruction(command)
        self.assertTrue(parsed["is_valid"])
        self.assertEqual(parsed["extracted_people"], 4)

        # Step 2: Table Layout Planning
        plan = self.layout_planner.plan_table(parsed["extracted_people"])
        self.assertTrue(plan["is_valid"])
        self.assertEqual(len(plan["place_settings"]), 4)
        self.assertEqual(plan["total_objects"], 20)

        # Step 3: Bimanual Task Allocation
        raw_tasks = []
        for ps in plan["place_settings"]:
            for it in ps["items"]:
                raw_tasks.append({"id": it["id"], "target": it["target"]})

        allocation = self.bimanual_planner.allocate_tasks(raw_tasks)
        self.assertEqual(allocation["left_count"] + allocation["right_count"], 20)
        self.assertGreater(allocation["bimanual_speedup"], 1.1)

        # Step 4: Simulated Cartesian Execution Step
        obs, col = self.env.step(
            left_target=allocation["left_tasks"][0]["target"],
            right_target=allocation["right_tasks"][0]["target"]
        )
        self.assertFalse(col)  # Safe clearance maintained

        # Step 5: Closed-Loop Verification
        target_pos = allocation["left_tasks"][0]["target"]
        simulated_placed_pos = (target_pos[0] + 0.003, target_pos[1] - 0.002, target_pos[2])
        verif_result = self.verifier.verify_placed_item(target_pos, simulated_placed_pos)
        self.assertTrue(verif_result["passed"])
        self.assertEqual(verif_result["status"], "PASS")

    def test_unsupported_group_safe_rejection(self):
        command = "Prepare the dinner table for 14 people."
        parsed = self.task_agent.parse_instruction(command)
        self.assertFalse(parsed["is_valid"])
        self.assertIsNotNone(parsed["rejection_notice"])
        self.assertIn("TwinHands-AI currently supports 1–10 people", parsed["rejection_notice"])

if __name__ == "__main__":
    unittest.main()
