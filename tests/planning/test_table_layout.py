"""
Unit Tests: Table Layout Planner & Bimanual Optimization
"""

import unittest
from ai.planning.table_layout_planner import TableLayoutPlanner
from robotics.planning.bimanual_planner import BimanualPlanner

class TestTableLayoutPlanning(unittest.TestCase):
    def setUp(self):
        self.planner = TableLayoutPlanner()
        self.bimanual = BimanualPlanner()

    def test_single_person_layout(self):
        plan = self.planner.plan_table(1)
        self.assertTrue(plan["is_valid"])
        self.assertEqual(len(plan["place_settings"]), 1)
        self.assertEqual(plan["total_objects"], 5)
        self.assertEqual(plan["summary"]["plates"], 1)
        self.assertEqual(plan["summary"]["additional_spoons"], 1)

    def test_four_person_layout(self):
        plan = self.planner.plan_table(4)
        self.assertTrue(plan["is_valid"])
        self.assertEqual(len(plan["place_settings"]), 4)
        self.assertEqual(plan["total_objects"], 20)
        self.assertEqual(plan["summary"]["plates"], 4)
        self.assertEqual(plan["summary"]["spoons"], 4)
        self.assertEqual(plan["summary"]["additional_spoons"], 4)

    def test_ten_person_banquet_layout(self):
        plan = self.planner.plan_table(10)
        self.assertTrue(plan["is_valid"])
        self.assertEqual(len(plan["place_settings"]), 10)
        self.assertEqual(plan["total_objects"], 50)

    def test_invalid_group_rejection(self):
        plan_zero = self.planner.plan_table(0)
        self.assertFalse(plan_zero["is_valid"])
        self.assertIn("GROUP SIZE NOT SUPPORTED", plan_zero["rejection_notice"])

        plan_twelve = self.planner.plan_table(12)
        self.assertFalse(plan_twelve["is_valid"])
        self.assertIn("GROUP SIZE NOT SUPPORTED", plan_twelve["rejection_notice"])

    def test_bimanual_clearance_and_collision(self):
        # Case 1: Far apart (safe)
        left_tcp = (-0.30, 0.0, 0.78)
        right_tcp = (0.30, 0.0, 0.78)
        is_col, dist = self.bimanual.check_collision(left_tcp, right_tcp)
        self.assertFalse(is_col)
        self.assertGreaterEqual(dist, 0.18)

        # Case 2: Close (collision risk)
        left_tcp_near = (0.05, 0.0, 0.78)
        right_tcp_near = (-0.05, 0.0, 0.78)
        is_col_near, dist_near = self.bimanual.check_collision(left_tcp_near, right_tcp_near)
        self.assertTrue(is_col_near)
        self.assertLess(dist_near, 0.18)

    def test_bimanual_speedup(self):
        tasks = [
            {"id": f"item_{i}", "target": (-0.2 + (i % 5) * 0.1, 0.05, 0.76)}
            for i in range(16)
        ]
        alloc = self.bimanual.allocate_tasks(tasks)
        self.assertEqual(alloc["left_count"] + alloc["right_count"], 16)
        self.assertGreater(alloc["bimanual_speedup"], 1.2)

if __name__ == "__main__":
    unittest.main()
