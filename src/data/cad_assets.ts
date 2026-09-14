/**
 * TwinHands-AI 3D CAD & Digital Twin Specifications
 * Engineering dimensions, materials, and MuJoCo MJCF physics definitions
 */

import { DigitalTwinAsset } from '../types';

export const CAD_DIGITAL_TWIN_ASSETS: DigitalTwinAsset[] = [
  {
    id: 'so101_left',
    name: 'SO-101 Robotic Arm (Left Arm - Spider-Man Edition)',
    category: 'robot_arm',
    theme: 'Spider-Man Industrial Theme (Deep Red #B91C1C, Dark Navy #1E293B, Black Web Detailing)',
    dimensions: {
      primary: 'Height: 425 mm • Base: 120 × 120 mm • Reach: 580 mm',
      widthMm: 120,
      depthMm: 120,
      heightMm: 425,
      thicknessMm: 45,
    },
    material: 'Engineering-grade 3D printed polymer (PA12-CF Nylon) / Aluminum 6061 joints',
    geometryDescription: '6-DOF articulated robotic arm: Base pan, Shoulder lift, Elbow flex, Wrist flex, Wrist roll, and a 2-finger parallel gripper (70-90mm wide, 50mm finger stroke). Outer polymer shells feature laser-etched black Spider-Man web geometric lines with a stylized spider emblem on the primary shoulder servo turret.',
    roboticsCompliance: 'MuJoCo XML (MJCF) & ROS2 URDF compatible. Joint limits: q1[-180°, 180°], q2[-45°, 135°], q3[-120°, 90°], q4[-90°, 90°], q5[-180°, 180°], q6[0mm, 45mm].',
    colorScheme: {
      primary: '#B91C1C', // Deep Spider-Man Red
      secondary: '#0F172A', // Dark Navy / Blue
      accent: '#1E293B', // Metallic Charcoal
      details: '#000000', // Black web etchings
    },
    mujocoGeomType: 'composite',
    massKg: 1.85,
    friction: [1.2, 0.05, 0.001],
    viewsAvailable: ['perspective', 'front', 'side', 'top', 'rear'],
    renderImage: '/assets/renders/so101_left_arm.jpg',
  },
  {
    id: 'so101_right',
    name: 'SO-101 Robotic Arm (Right Arm - Spider-Man Mirror)',
    category: 'robot_arm',
    theme: 'Spider-Man Industrial Theme (Mirror Configuration)',
    dimensions: {
      primary: 'Height: 425 mm • Base: 120 × 120 mm • Reach: 580 mm',
      widthMm: 120,
      depthMm: 120,
      heightMm: 425,
      thicknessMm: 45,
    },
    material: 'Engineering-grade 3D printed polymer (PA12-CF Nylon) / Aluminum 6061 joints',
    geometryDescription: 'Mirrored 6-DOF articulated robotic manipulator. Opposite-hand kinematics with matching Spider-Man red and dark navy livery, web-etched shell covers, high-torque coreless servos, and textured rubberized gripper fingertips.',
    roboticsCompliance: 'Symmetrical kinematic twin. Bimanual collision avoidance envelope certified at 0.18m clearance.',
    colorScheme: {
      primary: '#B91C1C',
      secondary: '#0F172A',
      accent: '#1E293B',
      details: '#000000',
    },
    mujocoGeomType: 'composite',
    massKg: 1.85,
    friction: [1.2, 0.05, 0.001],
    viewsAvailable: ['perspective', 'front', 'side', 'top', 'rear'],
    renderImage: '/assets/renders/so101_right_arm.jpg',
  },
  {
    id: 'twinhands_bimanual',
    name: 'TwinHands-AI Coordinated Bimanual Workcell',
    category: 'system',
    theme: 'Dual SO-101 Coordinated Preparation System',
    dimensions: {
      primary: 'Workcell: 1600 × 1100 × 850 mm • Table: 1200 × 800 mm',
      widthMm: 1600,
      depthMm: 1100,
      heightMm: 850,
    },
    material: 'Extruded aluminum framing (4040 T-slot) + Matte dark-gray phenolic tabletop',
    geometryDescription: 'Dual SO-101 arm mounting at (-0.38m, -0.42m) and (+0.38m, -0.42m) relative to table center. Overlapping central workspace of 0.45m width, flanked by dedicated staging dispensers and place setting envelopes.',
    roboticsCompliance: 'MuJoCo multi-body world model with dual kinematic trees, synchronised joint actuation, and Intel OpenVINO overhead RGB-D camera frustum.',
    colorScheme: {
      primary: '#1E293B',
      secondary: '#0F172A',
      accent: '#38BDF8',
      details: '#EF4444',
    },
    mujocoGeomType: 'composite',
    massKg: 38.5,
    friction: [0.8, 0.01, 0.001],
    viewsAvailable: ['perspective', 'front', 'side', 'top'],
    renderImage: '/assets/renders/twinhands_bimanual.jpg',
  },
  {
    id: 'demonstration_table',
    name: 'Robotic Dining Demonstration Table',
    category: 'furniture',
    dimensions: {
      primary: '1200 × 800 × 750 mm • Thickness: 32 mm',
      widthMm: 1200,
      depthMm: 800,
      heightMm: 750,
      thicknessMm: 32,
    },
    material: 'Matte dark-gray industrial phenolic resin / Powder-coated steel tubular legs',
    geometryDescription: 'Rigid flat tabletop with 15mm rounded safety perimeter fillets. Non-reflective dark surface calibrated for OpenVINO edge vision segmentation. Four heavy-duty adjustable leveling feet with dampening pads.',
    roboticsCompliance: 'MuJoCo rigid box geom: size="0.6 0.4 0.016" with 4 cylinder leg geoms. High stability coefficient (mass: 24kg).',
    colorScheme: {
      primary: '#1E293B',
      secondary: '#0F172A',
      accent: '#475569',
      details: '#334155',
    },
    mujocoGeomType: 'box',
    massKg: 24.0,
    friction: [0.65, 0.005, 0.001],
    viewsAvailable: ['perspective', 'top', 'front', 'side'],
    renderImage: '/assets/renders/demonstration_table.jpg',
  },
  {
    id: 'dinner_plate',
    name: 'Standard Ceramic Dinner Plate',
    category: 'tableware',
    dimensions: {
      primary: 'Diameter: 260 mm • Height: 24 mm • Rim: 28 mm',
      diameterMm: 260,
      heightMm: 24,
      thicknessMm: 4,
    },
    material: 'High-density vitrified white ceramic with semi-gloss glaze',
    geometryDescription: 'Circular dinner plate with flat 180mm center eating well, contoured transition wall, and elevated 28mm wide perimeter rim. Stable planar base ring optimized for parallel gripper edge grasp and overhead suction.',
    roboticsCompliance: 'MuJoCo composite cylinder/mesh geom. Balanced center of mass (Z = 0.008m). Mass: 480g.',
    colorScheme: {
      primary: '#F8FAFC',
      secondary: '#E2E8F0',
      accent: '#CBD5E1',
      details: '#94A3B8',
    },
    mujocoGeomType: 'cylinder',
    massKg: 0.48,
    friction: [0.7, 0.01, 0.001],
    viewsAvailable: ['perspective', 'top', 'side'],
    renderImage: '/assets/renders/tableware_collection.jpg',
  },
  {
    id: 'dinner_bowl',
    name: 'Standard Ceramic Dinner Bowl',
    category: 'tableware',
    dimensions: {
      primary: 'Diameter: 165 mm • Height: 68 mm • Wall: 3.8 mm',
      diameterMm: 165,
      heightMm: 68,
      thicknessMm: 3.8,
    },
    material: 'Vitrified white ceramic with smooth glazed interior and matte bottom foot',
    geometryDescription: 'Rotationally symmetrical soup/salad bowl. Deep concave parabolic interior cavity with 8mm raised base foot. Designed for top-down gripper pinch grasping on the rim or stacking inside dinner plate.',
    roboticsCompliance: 'MuJoCo hollow mesh approximation with contact margins. Mass: 320g.',
    colorScheme: {
      primary: '#F1F5F9',
      secondary: '#CBD5E1',
      accent: '#94A3B8',
      details: '#64748B',
    },
    mujocoGeomType: 'mesh',
    massKg: 0.32,
    friction: [0.72, 0.01, 0.001],
    viewsAvailable: ['perspective', 'top', 'side'],
    renderImage: '/assets/renders/tableware_collection.jpg',
  },
  {
    id: 'ceramic_cup',
    name: 'Cylindrical Ceramic Drinking Cup',
    category: 'tableware',
    dimensions: {
      primary: 'Height: 110 mm • Diameter: 80 mm • Capacity: 330 ml',
      diameterMm: 80,
      heightMm: 110,
      thicknessMm: 3.2,
    },
    material: 'White ceramic, semi-gloss exterior, food-grade thermal coating',
    geometryDescription: 'Straight-walled cylindrical drinking vessel. Handle-free minimalist silhouette allowing 360-degree approach angles for the SO-101 two-finger gripper. Flat bottom with internal hollow volume.',
    roboticsCompliance: 'MuJoCo cylinder geom: size="0.04 0.055". Graspable at any azimuthal orientation. Mass: 260g.',
    colorScheme: {
      primary: '#F8FAFC',
      secondary: '#E2E8F0',
      accent: '#38BDF8',
      details: '#94A3B8',
    },
    mujocoGeomType: 'cylinder',
    massKg: 0.26,
    friction: [0.75, 0.015, 0.002],
    viewsAvailable: ['perspective', 'front', 'top'],
    renderImage: '/assets/renders/tableware_collection.jpg',
  },
  {
    id: 'drinking_glass',
    name: 'Drinking Tumbler Glass (90% Water Level)',
    category: 'tableware',
    dimensions: {
      primary: 'Height: 130 mm • Diameter: 72 mm • 90% Water Level (10% Headspace)',
      diameterMm: 72,
      heightMm: 130,
      thicknessMm: 2.4,
    },
    material: 'Borosilicate clear optical glass (Refractive Index: 1.52) + Liquid Water (Refractive Index: 1.333)',
    geometryDescription: 'Transparent cylindrical drinking glass with weighted 12mm thick base for dynamic stability during robotic rapid deceleration. Filled to exactly 90% water capacity with 10% empty headspace below the fire-polished rim.',
    roboticsCompliance: 'MuJoCo optical transparent material shader + cylinder collision geom. Low center of mass prevents tipping. Mass: 210g tare / 490g filled.',
    colorScheme: {
      primary: 'rgba(56, 189, 248, 0.45)',
      secondary: 'rgba(255, 255, 255, 0.85)',
      accent: '#0284C7',
      details: '#BAE6FD',
    },
    mujocoGeomType: 'cylinder',
    massKg: 0.49,
    friction: [0.68, 0.01, 0.001],
    viewsAvailable: ['perspective', 'front', 'top'],
    renderImage: '/assets/renders/tableware_collection.jpg',
  },
  {
    id: 'dining_spoon',
    name: 'Stainless-Steel Dining Spoon',
    category: 'tableware',
    dimensions: {
      primary: 'Length: 192 mm • Bowl: 58 × 42 mm • Handle: 18 mm',
      widthMm: 42,
      depthMm: 192,
      heightMm: 14,
      thicknessMm: 2.8,
    },
    material: 'Grade 304 (18/10) brushed stainless steel',
    geometryDescription: 'Traditional dining spoon featuring an oval concave front bowl, curved neck, and ergonomic tapered flat handle. Satin brushed metallic surface minimizes optical glare for OpenVINO keypoint tracking.',
    roboticsCompliance: 'Multi-box collision approximation for handle and bowl. Graspable along handle shank. Mass: 52g.',
    colorScheme: {
      primary: '#94A3B8',
      secondary: '#CBD5E1',
      accent: '#E2E8F0',
      details: '#64748B',
    },
    mujocoGeomType: 'composite',
    massKg: 0.052,
    friction: [0.55, 0.008, 0.001],
    viewsAvailable: ['perspective', 'top', 'side'],
    renderImage: '/assets/renders/tableware_collection.jpg',
  },
  {
    id: 'water_jug',
    name: 'Spider-Man Themed Water Jug (90% Full)',
    category: 'tableware',
    dimensions: {
      primary: 'Height: 255 mm • Body Dia: 135 mm • 90% Water Fill (1.62L)',
      diameterMm: 135,
      heightMm: 255,
      thicknessMm: 3.5,
    },
    material: 'Spider-Man crimson clearcoat shell, dark royal blue collar, black web detailing, chrome emblem, borosilicate glass core',
    geometryDescription: 'Spider-Man-inspired 1.8L water pitcher featuring a dominant deep crimson red body with black spider-web surface pattern, dark royal blue pedestal base and neck trim, stylized geometric spider emblem on front chest, and a prominent 22mm thick D-shaped side handle engineered with 42mm clearance for SO-101 gripper finger insertion. Contains transparent liquid water filled to exactly 90% capacity.',
    roboticsCompliance: 'MuJoCo composite body with dedicated handle collision geom and body cylinder. Dry tare mass: 620g / Filled mass: 2.24kg.',
    colorScheme: {
      primary: '#C8102E', // Deep Spider-Man Red
      secondary: '#1D4ED8', // Dark Royal Blue
      accent: '#0F172A', // Carbon Slate Black
      details: '#E2E8F0', // Polished Chrome Emblem
    },
    mujocoGeomType: 'composite',
    massKg: 2.24,
    friction: [0.7, 0.015, 0.002],
    viewsAvailable: ['perspective', 'front', 'side', 'top'],
    renderImage: '/assets/renders/tableware_collection.jpg',
  },
  {
    id: 'manipulation_cube',
    name: 'Physical Benchmark Manipulation Cube',
    category: 'benchmark',
    dimensions: {
      primary: '30.0 × 30.0 × 30.0 mm • Chamfer: 1.5 mm',
      widthMm: 30,
      depthMm: 30,
      heightMm: 30,
      thicknessMm: 30,
    },
    material: 'Rigid high-friction polyurethane elastomer (Shore 75D)',
    geometryDescription: 'Precision 30mm calibration cube with 1.5mm edge fillets. High-contrast vivid safety orange/yellow matte finish for instant zero-shot segmentation by Intel OpenVINO. Textured micro-grooves enhance tactile gripper grip.',
    roboticsCompliance: 'Standard NIST/YCB robotic manipulation benchmark object. Box geom: size="0.015 0.015 0.015". Mass: 32g.',
    colorScheme: {
      primary: '#F59E0B', // Safety Amber/Orange
      secondary: '#D97706',
      accent: '#FDE68A',
      details: '#B45309',
    },
    mujocoGeomType: 'box',
    massKg: 0.032,
    friction: [1.4, 0.08, 0.005], // High friction for stable grasping
    viewsAvailable: ['perspective', 'front', 'top', 'side'],
    renderImage: '/assets/renders/tableware_collection.jpg',
  },
];

/**
 * Generate MuJoCo XML (MJCF) snippet for any digital twin asset
 */
export function generateMuJoCoXML(assetId: string): string {
  switch (assetId) {
    case 'so101_left':
      return `<!-- MuJoCo Model: SO-101 Left Arm (Spider-Man Edition) -->
<mujoco model="so101_left_arm">
  <compiler angle="degree" coordinate="local" inertiafromgeom="true"/>
  <asset>
    <material name="spiderman_red" rgba="0.72 0.11 0.11 1.0" specular="0.4" shininess="0.3"/>
    <material name="spiderman_navy" rgba="0.06 0.09 0.16 1.0" specular="0.2"/>
    <material name="metallic_black" rgba="0.12 0.12 0.14 1.0" specular="0.8"/>
    <material name="rubber_pads" rgba="0.2 0.2 0.2 1.0" friction="1.4 0.05 0.001"/>
  </asset>
  <worldbody>
    <body name="base_link" pos="-0.38 -0.42 0">
      <geom name="base_geom" type="cylinder" size="0.06 0.04" material="spiderman_navy"/>
      <!-- Joint 1: Waist Pan -->
      <body name="shoulder_turret" pos="0 0 0.08">
        <joint name="q1_waist_pan" type="hinge" axis="0 0 1" range="-180 180" damping="0.5"/>
        <geom name="turret_geom" type="box" size="0.045 0.045 0.03" material="spiderman_red"/>
        <!-- Joint 2: Shoulder Lift -->
        <body name="upper_arm" pos="0 0 0.04">
          <joint name="q2_shoulder_lift" type="hinge" axis="0 1 0" range="-45 135" damping="0.8"/>
          <geom name="upper_arm_link" type="capsule" fromto="0 0 0 0 0 0.22" size="0.024" material="spiderman_red"/>
          <!-- Joint 3: Elbow Flex -->
          <body name="forearm" pos="0 0 0.22">
            <joint name="q3_elbow_flex" type="hinge" axis="0 1 0" range="-120 90" damping="0.6"/>
            <geom name="forearm_link" type="capsule" fromto="0 0 0 0 0 0.20" size="0.020" material="spiderman_navy"/>
            <!-- Joint 4: Wrist Flex -->
            <body name="wrist_pitch" pos="0 0 0.20">
              <joint name="q4_wrist_flex" type="hinge" axis="0 1 0" range="-90 90" damping="0.3"/>
              <geom name="wrist_geom" type="box" size="0.02 0.025 0.02" material="metallic_black"/>
              <!-- Joint 5: Wrist Roll -->
              <body name="wrist_roll" pos="0 0 0.03">
                <joint name="q5_wrist_roll" type="hinge" axis="0 0 1" range="-180 180" damping="0.2"/>
                <geom name="gripper_base" type="box" size="0.04 0.02 0.02" material="spiderman_red"/>
                <!-- Parallel Gripper Left Finger -->
                <body name="left_finger" pos="-0.025 0 0.03">
                  <joint name="gripper_left" type="slide" axis="1 0 0" range="-0.025 0"/>
                  <geom type="box" size="0.005 0.015 0.03" material="rubber_pads"/>
                </body>
                <!-- Parallel Gripper Right Finger -->
                <body name="right_finger" pos="0.025 0 0.03">
                  <joint name="gripper_right" type="slide" axis="-1 0 0" range="-0.025 0"/>
                  <geom type="box" size="0.005 0.015 0.03" material="rubber_pads"/>
                </body>
              </body>
            </body>
          </body>
        </body>
      </body>
    </body>
  </worldbody>
</mujoco>`;

    case 'demonstration_table':
      return `<!-- MuJoCo Model: Robotic Dining Demonstration Table (1200x800x750mm) -->
<mujoco model="dining_table">
  <asset>
    <material name="tabletop_dark" rgba="0.12 0.16 0.23 1.0" specular="0.1" roughness="0.8"/>
    <material name="steel_legs" rgba="0.08 0.1 0.15 1.0" specular="0.5"/>
  </asset>
  <worldbody>
    <body name="table" pos="0 0 0">
      <!-- Tabletop: 1.2m width x 0.8m depth x 0.032m thickness, top surface at z=0 -->
      <geom name="top_plate" type="box" pos="0 0 -0.016" size="0.60 0.40 0.016" material="tabletop_dark"/>
      <!-- Four Legs (0.734m length) -->
      <geom name="leg_nw" type="cylinder" pos="-0.54 -0.34 -0.383" size="0.025 0.367" material="steel_legs"/>
      <geom name="leg_ne" type="cylinder" pos="0.54 -0.34 -0.383" size="0.025 0.367" material="steel_legs"/>
      <geom name="leg_sw" type="cylinder" pos="-0.54 0.34 -0.383" size="0.025 0.367" material="steel_legs"/>
      <geom name="leg_se" type="cylinder" pos="0.54 0.34 -0.383" size="0.025 0.367" material="steel_legs"/>
    </body>
  </worldbody>
</mujoco>`;

    case 'dinner_plate':
      return `<!-- MuJoCo Model: Ceramic Dinner Plate (260mm diameter) -->
<mujoco model="dinner_plate">
  <asset>
    <material name="white_ceramic" rgba="0.97 0.98 0.99 1.0" specular="0.6" shininess="0.5"/>
  </asset>
  <worldbody>
    <body name="plate" pos="0 0 0.012">
      <freejoint/>
      <!-- Base Eating Well -->
      <geom name="plate_base" type="cylinder" size="0.095 0.005" pos="0 0 -0.007" material="white_ceramic" mass="0.22"/>
      <!-- Elevated Outer Rim (Diameter 0.26m) -->
      <geom name="plate_rim" type="cylinder" size="0.130 0.006" pos="0 0 0.006" material="white_ceramic" mass="0.26"/>
    </body>
  </worldbody>
</mujoco>`;

    case 'manipulation_cube':
      return `<!-- MuJoCo Model: Rigid Manipulation Benchmark Cube (30x30x30mm) -->
<mujoco model="manipulation_cube">
  <asset>
    <material name="safety_orange" rgba="0.96 0.62 0.07 1.0" specular="0.3" roughness="0.6"/>
  </asset>
  <worldbody>
    <body name="cube_30mm" pos="0 0 0.015">
      <freejoint/>
      <!-- High friction 30mm cube for SO-101 gripper benchmark -->
      <geom name="cube_geom" type="box" size="0.015 0.015 0.015" material="safety_orange" mass="0.032" friction="1.4 0.08 0.005"/>
    </body>
  </worldbody>
</mujoco>`;

    case 'water_jug':
      return `<!-- MuJoCo Model: Transparent Water Jug (1.8L) -->
<mujoco model="water_jug">
  <asset>
    <material name="clear_glass" rgba="0.6 0.85 0.95 0.35" specular="0.9" shininess="0.9"/>
    <material name="handle_grip" rgba="0.1 0.4 0.7 0.9" specular="0.5"/>
  </asset>
  <worldbody>
    <body name="jug" pos="0 0 0.125">
      <freejoint/>
      <!-- Main Cylinder Body -->
      <geom name="jug_body" type="cylinder" size="0.067 0.120" material="clear_glass" mass="0.48"/>
      <!-- Pouring Spout & Neck -->
      <geom name="jug_neck" type="cylinder" pos="0 0 0.11" size="0.045 0.02" material="clear_glass" mass="0.06"/>
      <!-- Ergonomic D-Handle with SO-101 Gripper Clearance -->
      <geom name="handle" type="box" pos="0.085 0 0.01" size="0.012 0.01 0.065" material="handle_grip" mass="0.08"/>
    </body>
  </worldbody>
</mujoco>`;

    default:
      return `<!-- MuJoCo Generic Collision Mesh: ${assetId} -->
<mujoco model="${assetId}">
  <worldbody>
    <body name="${assetId}_body" pos="0 0 0">
      <freejoint/>
      <geom name="${assetId}_geom" type="box" size="0.05 0.05 0.05" mass="0.2"/>
    </body>
  </worldbody>
</mujoco>`;
  }
}
