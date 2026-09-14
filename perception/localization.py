"""
TwinHands-AI: 3D Spatial Localization
Projects 2D camera detections and depth maps into 3D tabletop coordinate frame.
"""

from typing import Tuple, Dict, Any

class SpatialLocalizer:
    def __init__(self, camera_pos: Tuple[float, float, float] = (0.0, 0.0, 2.2)):
        self.cam_pos = camera_pos
        self.table_z = 0.75

    def project_to_table_frame(self, u: float, v: float, depth_m: float) -> Tuple[float, float, float]:
        """Project pixel coordinate (u, v) and depth into world metric coordinates (x, y, z)."""
        # Calibrated pinhole projection for overhead camera
        focal_length = 640.0
        cx = 320.0
        cy = 240.0

        x_cam = (u - cx) * depth_m / focal_length
        y_cam = (v - cy) * depth_m / focal_length
        z_world = self.cam_pos[2] - depth_m

        return (round(x_cam, 4), round(y_cam, 4), round(z_world, 4))
