"""
Unit Tests: Perception, Detection & Localization
"""

import unittest
from perception.object_detection import TablewareDetector
from perception.localization import SpatialLocalizer
from perception.verification import OpticalVerificationEngine

class TestPerceptionSubsystem(unittest.TestCase):
    def setUp(self):
        self.detector = TablewareDetector(model_precision="INT8")
        self.localizer = SpatialLocalizer(camera_pos=(0.0, 0.0, 2.2))
        self.verifier = OpticalVerificationEngine(max_allowed_deviation_m=0.015)

    def test_detector_classes(self):
        dets = self.detector.detect_tableware()
        self.assertGreaterEqual(len(dets), 4)
        labels = [d["class"] for d in dets]
        self.assertIn("plate", labels)
        self.assertIn("bowl", labels)
        self.assertIn("cup", labels)
        self.assertIn("spoon", labels)

    def test_spatial_projection(self):
        # Pixel center (320, 240) looking straight down at table z=0.75m (depth = 1.45m)
        coords = self.localizer.project_to_table_frame(320.0, 240.0, depth_m=1.45)
        self.assertAlmostEqual(coords[0], 0.0, places=2)
        self.assertAlmostEqual(coords[1], 0.0, places=2)
        self.assertAlmostEqual(coords[2], 0.75, places=2)

    def test_optical_verification(self):
        target = (-0.20, 0.05, 0.76)
        # Case 1: 5mm deviation (Pass)
        observed_pass = (-0.203, 0.052, 0.761)
        res_pass = self.verifier.verify_placed_item(target, observed_pass)
        self.assertTrue(res_pass["passed"])
        self.assertLessEqual(res_pass["deviation_mm"], 15.0)

        # Case 2: 25mm deviation (Fail)
        observed_fail = (-0.220, 0.065, 0.76)
        res_fail = self.verifier.verify_placed_item(target, observed_fail)
        self.assertFalse(res_fail["passed"])
        self.assertGreater(res_fail["deviation_mm"], 15.0)

if __name__ == "__main__":
    unittest.main()
