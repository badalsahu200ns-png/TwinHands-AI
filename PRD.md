# TwinHands-AI: Product Requirements Document (PRD)

> **Adaptive Multimodal Physical AI for Coordinated Bimanual Dinner-Table Preparation**

---

| Attribute | Specification |
| :--- | :--- |
| **Product Category** | Physical AI / Vision-Language-Action (VLA) / Bimanual Robotics |
| **Primary Robots** | Dual SO-101 robotic arms — 🔴 Red Left Arm + 🔵 Blue Right Arm |
| **Simulation Engine** | MuJoCo 3.x Physics Runtime (MJCF) |
| **AI Architecture** | Multimodal Vision-Language-Action (VLA) + Closed-Loop Reasoning |
| **Edge AI Acceleration** | Intel® OpenVINO™ 2024.5 (INT8 / FP16 / FP32 Runtime) |
| **Primary Scenario** | Adaptive dinner-table preparation |
| **Supported Group Size** | 1–10 people (Continuous planning variable) |
| **Control Interface** | Web-based Robotics Control & Digital Twin Dashboard |
| **Core Execution Loop** | Voice/Text → Vision → Reasoning → Planning → Bimanual Action → Verification |

---

## 1. Executive Summary

TwinHands-AI is an adaptive multimodal Physical AI system that translates natural-language instructions into coordinated bimanual robotic manipulation. Instead of specifying robot coordinates, joint angles, or fixed trajectories, a user simply commands:

> *"Prepare the dinner table for 4 people."*

The system interprets the request, determines the number of place settings required, analyzes the visual environment, generates an optimal table layout, assigns manipulation tasks across two SO-101 arms, executes the plan in MuJoCo simulation, and verifies the outcome.

**The core product breakthrough**: the number of diners is a dynamic planning variable, not a collection of hardcoded routines.

```
Human Instruction → Language Understanding → Group-Size Extraction → Scene Understanding
→ Table Layout Planning → Task Decomposition → Bimanual Task Allocation
→ Cartesian/Jacobian Control → 🔴 Left SO-101 + 🔵 Right SO-101 → Object Manipulation
→ Vision-Based Verification → Success / Autonomous Recovery
```

---

## 2. Vision

Enable humans to command coordinated robotic manipulation through natural language rather than low-level robot programming. TwinHands-AI demonstrates a practical Physical AI architecture where robots:
1. Understand human intent from voice or text.
2. Perceive their spatial environment and table state.
3. Reason about objects, geometry, and physical relationships.
4. Generate collision-aware, reach-bounded task plans.
5. Coordinate two robotic arms simultaneously.
6. Execute manipulation actions using Cartesian and Jacobian control.
7. Verify outcomes via computer vision.
8. Recover autonomously from manageable physical failures.

While the dinner table serves as the initial demonstration environment, the underlying architecture generalizes to medical preparation, assembly, laboratory chemistry, and household automation.

---

## 3. Problem Statement

Traditional robotic manipulation relies on static coordinates, pre-recorded trajectories, rigid task-specific scripts, independent uncoordinated arms, and zero environmental adaptability. They describe *how to move a robot*, not *what the human wants accomplished*.

| Feature | Traditional Robotics | TwinHands-AI |
| :--- | :--- | :--- |
| **Command Paradigms** | Coordinates, Joint Angles, Fixed Waypoints | Human Intent, Natural Language, Voice |
| **Planning Approach** | Hardcoded routines (`table_for_four()`) | Parameterized layout solver ($1 \le N \le 10$) |
| **Arm Coordination** | Independent or single-arm execution | Bimanual cost optimization & sync envelope |
| **Perception** | Calibrated optical markers | Zero-shot Intel OpenVINO Edge AI perception |
| **Verification** | Blind open-loop dispatch | Closed-loop CV verification & retry loop |

---

## 4. Core Product Concept

```
"Prepare the dinner table for 4 people."
                 ↓
            People = 4
                 ↓
4 place settings → 4 plates, 4 bowls, 4 cups, 4 spoons
                 ↓
       16 object-placement actions
                 ↓
Table-layout generation → Bimanual task allocation → Robot execution → Verification
```

The identical architecture scales seamlessly from 1 to 10 diners without requiring new code paths or hardcoded trajectory tables.

---

## 5. Product Differentiator: Adaptive Group-Based Planning

Rather than 10 hardcoded functions (`table_for_one() ... table_for_ten()`), TwinHands-AI exposes a single generalized planning pipeline:

$$\text{prepare\_table}(N), \quad N \in [1, 10]$$

1. **Validate $N$**: Assert $1 \le N \le 10$; reject out-of-bounds requests safely.
2. **Generate $N$ place settings**: Synthesize geometric placemat envelopes.
3. **Determine required objects**: Calculate $N \times 4$ items (plates, bowls, cups, spoons).
4. **Generate table layout**: Evaluate tabletop boundaries, diner clearances, and symmetry.
5. **Check reachability & collisions**: Validate dual-arm kinematics against arm bases.
6. **Assign tasks to arms**: Cost-optimized load balancing between Red and Blue arms.
7. **Execute & Verify**: Real-time Cartesian motion with closed-loop verification.

---

## 6. Supported Group Size Matrix

| People ($N$) | Plates | Bowls | Cups | Spoons | Total Objects | Layout Topology |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | 1 | 1 | 1 | 1 | 4 | Intimate South Center |
| **2** | 2 | 2 | 2 | 2 | 8 | Balanced South Pair (P1 Left, P2 Right) |
| **3** | 3 | 3 | 3 | 3 | 12 | Triangular (North Head, West, East) |
| **4** | 4 | 4 | 4 | 4 | 16 | 4-Sided Perimeter (North, South, West, East) |
| **5** | 5 | 5 | 5 | 5 | 20 | 2 North, 2 South, 1 West (Host) |
| **6** | 6 | 6 | 6 | 6 | 24 | 3 North, 3 South (Conference Banquet) |
| **7** | 7 | 7 | 7 | 7 | 28 | 3 North, 3 South, 1 East |
| **8** | 8 | 8 | 8 | 8 | 32 | 3 North, 3 South, 1 West, 1 East |
| **9** | 9 | 9 | 9 | 9 | 36 | 4 North, 4 South, 1 West |
| **10** | 10 | 10 | 10 | 10 | 40 | 4 North, 4 South, 1 West, 1 East (Full Capacity) |

### Rejection Policy
Requests outside $1 \le N \le 10$ are explicitly rejected:
```
REQUEST NOT SUPPORTED
TwinHands-AI currently supports 1–10 people.
Please specify a group size between 1 and 10.
```

---

## 7. Robot Identity & Color Aesthetics

| Manipulator | Color Identity | Aesthetic Theme | Functional Role |
| :--- | :--- | :--- | :--- |
| **Left SO-101** | 🔴 Deep Red (`#B91C1C`) | Spider-Man Industrial Theme (Red, Navy, Web Etchings, Shoulder Emblem) | Dynamically assigned by cost solver |
| **Right SO-101** | 🔵 Midnight Blue (`#1E293B`) | Mirrored Spider-Man Counterpart | Dynamically assigned by cost solver |

Colors represent persistent physical hardware identity, not rigid object bindings. Both arms share an identical mechanical envelope (6-DOF, two-finger parallel gripper, 0.58m reach).

---

## 8. System Architecture & Safety Boundary

### 8.1 Safety Boundary (Critical Rule)
**The high-level AI model must never directly command robot motor actuators.**

```
CORRECT:
LLM/VLA → Structured Task Plan JSON → Schema Validator → Safety & Collision Checks
→ Motion Planner → Cartesian Velocity Controller (Jacobian) → Joint Servos

INCORRECT:
LLM → Motor PWM / Raw Voltage
```

### 8.2 Control Hierarchy
- **HIGH LEVEL**: Human Intent Understanding → Normalized Task Plan JSON.
- **MID LEVEL**: Manipulation Primitives (`reach`, `grasp`, `lift`, `place`, `release`).
- **LOW LEVEL**: Cartesian Target Pose → Damped Least Squares Jacobian $\dot{x} = J(q)\dot{q}$ → Joint Angles $\Delta q$ → Actuators.

---

## 9. Product Goals (G1 – G9)

- **G1 — Bimanual Manipulation**: Coordinated collision-free operation using dual SO-101 arms.
- **G2 — Multimodal Reasoning**: Natural-language and voice translation into structured tasks.
- **G3 — Vision-Guided Manipulation**: Real-time object identification and 3D spatial localization.
- **G4 — Adaptive Table Planning**: Geometric placement synthesis for $1 \le N \le 10$ diners.
- **G5 — Dynamic Task Allocation**: Real-time arm assignment based on travel cost, reach, and balance.
- **G6 — Cartesian/Jacobian Control**: Closed-form IK and velocity-resolved inverse kinematics.
- **G7 — Closed-Loop Verification**: Optical confirmation that tableware is within $\pm 15$mm tolerance.
- **G8 — Intel® OpenVINO™ Integration**: Measured INT8 quantization benchmark demonstrating $>4\times$ speedup.
- **G9 — Production-Grade Engineering**: Decoupled, typed, testable simulation and robotics stack.

---

## 10. Target Users & Personas

- **Persona A — Robotics Engineer**: Wants reproducible Cartesian control, Jacobian diagnostics, collision avoidance envelopes, and simulation telemetry without writing tedious manual waypoint loops.
- **Persona B — AI/ML Engineer**: Wants to interface high-level foundation models to verified physical simulation environments with deterministic safety layers.
- **Persona C — Product/Operations Lead**: Needs an intuitive dashboard with voice commands, visual telemetry, and clear completion status.

---

## 11. Functional Requirements

- **FR-01**: Accept natural-language instructions (e.g. *"Set the table for four"*).
- **FR-02**: Support voice commands via Web Speech API.
- **FR-03**: Extract group size $N$ from input text/audio.
- **FR-04**: Validate group size within $1 \le N \le 10$.
- **FR-05**: Detect tableware classes: plate, bowl, cup, spoon, glass, jug, cube.
- **FR-06**: Spatially localize detected items in 3D tabletop coordinates.
- **FR-07**: Calculate required inventory ($N$ plates, $N$ bowls, $N$ cups, $N$ spoons).
- **FR-08**: Synthesize collision-free table geometry and place setting envelopes.
- **FR-09**: Decompose requests into atomic pick-and-place subtasks.
- **FR-10**: Dynamically allocate subtasks across Red and Blue arms.
- **FR-11**: Execute Cartesian end-effector positioning.
- **FR-12**: Map Cartesian velocities to joint rates using Damped Least Squares Jacobian:
  $$\Delta q = J^T (J J^T + \lambda^2 I)^{-1} \Delta x$$
- **FR-13**: Actuate two-finger parallel grippers with pinch force limits.
- **FR-14**: Detect and prevent arm-to-arm collisions ($d_{\text{TCP}} \ge 0.18$m).
- **FR-15**: Verify inverse kinematic reachability for all candidate poses.
- **FR-16**: Optically verify post-placement locations against target envelopes.
- **FR-17**: Autonomous fault recovery (re-localize → reposition → retry → verify).
- **FR-18**: Execute Intel OpenVINO runtime inference for edge perception.
- **FR-19**: Stream real-time telemetry (joint angles, torques, latency, sim FPS, E-stop).
- **FR-20**: Provide a web control dashboard with 3D canvas and CAD digital twin viewer.

---

## 12. Non-Functional Requirements

- **Performance**: MuJoCo physics step $\ge 60$Hz; OpenVINO INT8 perception $\le 5$ms.
- **Reliability**: Deterministic schema validation before robot execution.
- **Safety**: Hardcoded hardware E-stop interlock; minimum 0.18m dual-arm clearance.
- **Maintainability**: Fully decoupled modules (`simulation/`, `robotics/`, `ai/`, `perception/`, `intel/`).
- **Reproducibility**: Clear installation instructions, pinned dependencies, automated tests.

---

## 13. Structured Task Plan Schema

```json
{
  "task": "prepare_dinner_table",
  "target_people": 4,
  "objects_per_person": {
    "plate": 1,
    "bowl": 1,
    "cup": 1,
    "spoon": 1
  },
  "actions": [
    { "id": 1, "person": 1, "object": "plate", "action": "place", "arm": "left", "target": [-0.36, 0.05, 0.005] },
    { "id": 2, "person": 1, "object": "bowl",  "action": "place", "arm": "left", "target": [-0.36, 0.05, 0.028] },
    { "id": 3, "person": 3, "object": "cup",   "action": "place", "arm": "right", "target": [0.27, 0.12, 0.015] },
    { "id": 4, "person": 3, "object": "spoon", "action": "place", "arm": "right", "target": [0.46, 0.04, 0.008] }
  ]
}
```

---

## 14. Table Layout Planning & Bimanual Optimization

### Objective Function
$$\min \left( w_{\text{dist}} \cdot D_{\text{travel}} + w_{\text{coll}} \cdot C_{\text{risk}} + w_{\text{time}} \cdot T_{\text{cycle}} + w_{\text{bal}} \cdot |L_{\text{count}} - R_{\text{count}}| \right)$$

Subject to:
- End-effector reachability: $\|\mathbf{p}_{\text{target}} - \mathbf{p}_{\text{base}}\| \le R_{\text{max}} = 0.58\text{m}$.
- Dual-arm clearance: $\|\mathbf{p}_{\text{left}} - \mathbf{p}_{\text{right}}\| \ge 0.18\text{m}$.
- Object dependencies: Plates placed before bowls (layer ordering).

---

## 15. Manipulation Primitives

- `reach(target_pose, approach_vector)`: Moves TCP to pre-grasp pose with parabolic clearance.
- `grasp(width_mm, force_limit_N)`: Closes fingers until contact threshold.
- `lift(height_m)`: Ascends vertically along $+Z$ to prevent scraping.
- `place(target_pose)`: Descends smoothly onto placemat target.
- `release()`: Opens fingers to release width and retracts along post-place vector.

---

## 16. Roadmap Stages (MVP, V1, V2)

- **MVP**: Single-person pipeline verification: *"Move spoon beside bowl"*.
- **V1**: Full 1-person place setting with AI intent parsing: *"Prepare dinner table for one person"*.
- **V2**: Adaptive 1–10 diner multi-arm coordination, OpenVINO benchmarking, closed-loop verification, and autonomous fault recovery.

---

## 17. Metrics & Benchmarking Targets

- **North Star Metric**: Autonomous Table Preparation Rate $= \frac{\text{Successful Setups}}{\text{Total Attempts}} \times 100 \ge 98\%$.
- **Placement Accuracy**: Euclidean error $\le 15$mm.
- **Bimanual Speedup**: $\ge 1.7\times$ vs single-arm sequential execution.
- **Intel OpenVINO Performance**:
  - FP32 Baseline: $29.4$ms ($34.0$ FPS)
  - FP16: $7.2$ms ($138.8$ FPS)
  - INT8 Quantized: $3.8$ms ($263.1$ FPS, $7.7\times$ speedup, $99.4\%$ accuracy retention)

---

## 18. Definition of Done

1. Voice and text commands correctly extract group size $N \in [1, 10]$.
2. Out-of-bounds group sizes ($N < 1$ or $N > 10$) are safely rejected with guidance.
3. MuJoCo dual SO-101 simulation runs smoothly with Cartesian and Jacobian control.
4. Parabolic transit arcs maintain tabletop and arm-to-arm clearance.
5. Verification engine confirms placement accuracy before issuing completion report.
6. OpenVINO edge AI benchmark is live and interactive.
7. Web dashboard exposes 3D simulation, CAD digital twin assets, and live telemetry.
