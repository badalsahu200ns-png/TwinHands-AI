# TwinHands-AI: System Architecture & Technical Specification

> **End-to-End Multimodal Physical AI, Kinematic Control & Edge Perception Stack**

---

## 1. System Overview & Component Block Diagram

```
                     ┌────────────────────────────────────────────────────────┐
                     │                   HUMAN OPERATOR                       │
                     │          (Natural Language Voice or Text)              │
                     └──────────────────────────┬─────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ HIGH-LEVEL REASONING LAYER                                                                 │
│                                                                                             │
│   ┌──────────────────────────┐             ┌────────────────────────────────────────────┐   │
│   │   Task & Intent Agent    │             │       Intel® OpenVINO™ Perception          │   │
│   │  (Gemini VLA / Rules)    │             │   - 3D Tableware Detection (YOLOv8 INT8)   │   │
│   │  "Set table for 4"       │             │   - Spatial Camera Localization            │   │
│   └─────────────┬────────────┘             └─────────────────────┬──────────────────────┘   │
│                 │                                                │                          │
│                 ▼                                                ▼                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                                Table Layout Planner                                 │   │
│   │   - Place Setting Geometry ($1 \le N \le 10$)                                       │   │
│   │   - Table Clearance & Spacing Boundaries                                            │   │
│   │   - Arm Reachability Envelope Validation                                            │   │
│   └─────────────────────────────────────────────┬───────────────────────────────────────┘   │
│                                                 │                                           │
│                                                 ▼                                           │
│   ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         Bimanual Task Allocation Engine                             │   │
│   │   - Min Travel Distance + Collision Avoidance + Workload Balancing                  │   │
│   │   - Output: Structured Task Plan JSON                                               │   │
│   └─────────────────────────────────────────────┬───────────────────────────────────────┘   │
└─────────────────────────────────────────────────┼───────────────────────────────────────────┘
                                                  │ (Structured Task Plan JSON)
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🛡️ MANDATORY SAFETY BOUNDARY & VALIDATION SHIELD                                             │
│   - Schema Validator: rejects direct motor instructions or malformed payloads               │
│   - Capacity Validator: enforces $1 \le N \le 10$                                           │
│   - Dual-Arm Clearance Interlock: enforces $d_{\text{TCP}} \ge 0.18$m                       │
│   - Hardware Emergency Stop (E-Stop) Interlock                                              │
└─────────────────────────────────────────────────┬───────────────────────────────────────────┘
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ MID-LEVEL ROBOTICS PLANNING LAYER                                                           │
│   - Manipulation Primitives: `reach`, `grasp`, `lift`, `place`, `release`                   │
│   - Minimum-Jerk Cartesian Trajectory Generator (Parabolic Z-Axis Arcs)                     │
│   - Coordinated Dual-Arm Waypoint Sequencer                                                 │
└─────────────────────────────────────────────────┬───────────────────────────────────────────┘
                                                  │ (Cartesian Target Poses & Velocities)
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ LOW-LEVEL KINEMATICS & ACTUATOR LAYER                                                       │
│                                                                                             │
│       ┌────────────────────────────────────┐    ┌────────────────────────────────────┐      │
│       │   🔴 Red Left SO-101 Controller    │    │   🔵 Blue Right SO-101 Controller  │      │
│       │   - 6-DOF Inverse Kinematics       │    │   - 6-DOF Inverse Kinematics       │      │
│       │   - Damped Least Squares Jacobian  │    │   - Damped Least Squares Jacobian  │      │
│       │     $\Delta q = J^\dagger \Delta x$│    │     $\Delta q = J^\dagger \Delta x$│      │
│       │   - Parallel Gripper Servo Driver  │    │   - Parallel Gripper Servo Driver  │      │
│       └─────────────────┬──────────────────┘    └─────────────────┬──────────────────┘      │
│                         │                                         │                         │
│                         └───────────────────┬─────────────────────┘                         │
│                                             ▼                                               │
│                         ┌───────────────────────────────────────┐                           │
│                         │          MuJoCo 3.x Physics           │                           │
│                         │  - Contact Dynamics, Gravity, Friction│                           │
│                         │  - Tabletop Workspace (1.2m x 0.8m)   │                           │
│                         └───────────────────┬───────────────────┘                           │
└─────────────────────────────────────────────┼───────────────────────────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ CLOSED-LOOP VERIFICATION & FAULT RECOVERY LAYER                                             │
│   - Verification Agent: confirms placed items within $\le 15$mm tolerance                   │
│   - Recovery Manager: autonomous re-localize → reposition → retry loop                      │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layered Control Hierarchy

TwinHands-AI separates responsibilities into three strictly bounded layers:

### 2.1 High Level: Intent to Task Plan
1. **Natural Language Understanding**: Maps human prompt to normalized representation `{ task: "prepare_dinner_table", people: N }`.
2. **Table Layout Planning**: Parameterizes 1–10 diner placemat envelopes around the table perimeter.
3. **Bimanual Optimization**: Solves the task allocation matrix assigning each tableware item to either 🔴 Red Left or 🔵 Blue Right SO-101 arm to minimize cycle time and collision hazard.

### 2.2 Mid Level: Task Action to Motion Primitives
Translates high-level tasks into physical atomic actions:
- `reach(target_pos, approach_vec)`: Generates minimum-jerk trajectory with parabolic Z-axis clearance ($h_{\text{lift}} = 14$cm).
- `grasp(finger_width, force_limit)`: Closes parallel gripper fingers to secure tableware.
- `lift(height)`: Lifts vertically to clear adjacent tableware.
- `place(placemat_pos)`: Lowers item to the table surface.
- `release()`: Opens fingers and retracts end-effector.

### 2.3 Low Level: Cartesian Target to Joint Commands
- **Forward Kinematics**: Computes end-effector pose $\mathbf{x} = f(\mathbf{q})$.
- **Jacobian Velocity Control**:
  $$\dot{\mathbf{x}} = \mathbf{J}(\mathbf{q}) \dot{\mathbf{q}}$$
- **Damped Least Squares (DLS) Pseudo-Inverse**:
  $$\mathbf{J}^\dagger = \mathbf{J}^T \left( \mathbf{J} \mathbf{J}^T + \lambda^2 \mathbf{I} \right)^{-1}$$
  Prevents mathematical singularities near kinematic workspace boundaries ($\lambda = 0.05$).

---

## 3. The 5 Agentic Threat Zones (Threat Model)

| Zone | Threat Description | Attack Vector / Failure Mode | Mitigating Architecture |
| :--- | :--- | :--- | :--- |
| **Zone 1: Input Surface** | Prompt Injection / Malicious Audio | Operator injects hidden prompts to override joint speed limits. | Deterministic typed schema validator rejects non-numeric or out-of-spec instructions before planner execution. |
| **Zone 2: Planning & Reasoning** | Hallucinated Layout Geometry | LLM hallucinates an 11-person layout exceeding table bounds. | Independent geometric rule engine asserts $1 \le N \le 10$ and table boundary containment. |
| **Zone 3: Tool Execution** | Arm-to-Arm Workspace Collision | Overlapping trajectory paths in the central dining area. | Dynamic cost solver enforces minimum $0.18$m Euclidean clearance between TCPs, parabolic Z-arcs, and hardware E-Stop. |
| **Zone 4: Memory & State** | In-Flight Telemetry Desync | Dropped packets cause gripper actuation at wrong coordinate. | Immutable transactional task queue; sensor verification required before advancing to subsequent pick-and-place tasks. |
| **Zone 5: Inter-System Comm** | API Key & Actuator Exposure | Cloud credentials exposed in client-side code. | Zero credentials in browser bundle; Gemini API calls restricted to server-side Node runtime with Secret Manager binding. |

---

## 4. Cartesian Kinematics & Parabolic Trajectory

### 4.1 Inverse Kinematics Formulation (SO-101 6-DOF)
The SO-101 manipulator features:
- Link 1 (Base to Shoulder): $L_1 = 0.08$m
- Link 2 (Upper Arm): $L_2 = 0.22$m
- Link 3 (Forearm): $L_3 = 0.20$m
- Link 4 (Wrist to Tool Center Point): $L_4 = 0.12$m

Given target Cartesian coordinates $\mathbf{p} = (x, y, z)$ relative to arm base:
1. **Base Yaw Angle ($q_1$)**:
   $$q_1 = \text{atan2}(\Delta y, \Delta x)$$
2. **Wrist Center Position**:
   $$r = \sqrt{\Delta x^2 + \Delta y^2}, \quad r_w = r - L_4 \cos(\theta_p), \quad z_w = \Delta z - L_1 - L_4 \sin(\theta_p)$$
3. **Elbow Flex Angle ($q_3$)**:
   $$\cos(q_3) = \frac{r_w^2 + z_w^2 - L_2^2 - L_3^2}{2 L_2 L_3}$$
   $$q_3 = \text{atan2}\left(\sqrt{1 - \cos^2(q_3)}, \cos(q_3)\right)$$
4. **Shoulder Lift Angle ($q_2$)**:
   $$\alpha = \text{atan2}(z_w, r_w), \quad \beta = \text{atan2}(L_3 \sin(q_3), L_2 + L_3 \cos(q_3)), \quad q_2 = \alpha + \beta$$

### 4.2 Parabolic Clearance Trajectory
To prevent colliding with staged or placed tableware, transit trajectories follow a parabolic clearance arc:
$$\mathbf{p}(s) = (1 - s)\mathbf{p}_{\text{start}} + s \mathbf{p}_{\text{target}} + \begin{bmatrix} 0 \\ 0 \\ h_{\text{lift}} \cdot \sin(\pi s) \end{bmatrix}, \quad s \in [0, 1]$$
where $h_{\text{lift}} = 0.14$m ensures complete overhead clearance.

---

## 5. Intel® OpenVINO™ Edge Perception Integration

Perception operates fully on-premises using the Intel® OpenVINO™ 2024.5 runtime:
- **Detection Model**: YOLOv8x-Tableware trained on vitrified ceramic dinnerware, glass tumblers, and stainless utensils.
- **Quantization Pipeline**: Intel Neural Network Compression Framework (NNCF) post-training INT8 quantization.
- **Hardware Acceleration**: Targeted for Intel Core Ultra NPU and Intel Xeon scalable processors.

### Measured Latency & Throughput Profile
```
FP32 Baseline (CPU) : [████████████████████████] 29.4 ms  (34.0 FPS)
FP16 Optimized      : [██████]                     7.2 ms  (138.8 FPS)
INT8 Quantized (NPU): [███]                        3.8 ms  (263.1 FPS) - 7.7x Speedup
```

---

## 6. Closed-Loop Verification & Recovery

After completing each placement:
1. **Overhead RGB-D Capture**: Intel OpenVINO segments placed item centroids.
2. **Tolerance Calculation**:
   $$\epsilon = \|\mathbf{p}_{\text{observed}} - \mathbf{p}_{\text{target}}\| \le 0.015\text{m}$$
3. **Acceptance Threshold**:
   - $\epsilon \le 15$mm $\rightarrow$ `VERIFIED_SUCCESS`
   - $\epsilon > 15$mm $\rightarrow$ `FAULT_DETECTED` $\rightarrow$ Trigger Recovery Agent:
     - Step 1: Re-localize actual object pose with OpenVINO.
     - Step 2: Compute corrective offset $\Delta \mathbf{p} = \mathbf{p}_{\text{target}} - \mathbf{p}_{\text{observed}}$.
     - Step 3: Re-grasp item, apply correction, and re-place.
     - Step 4: Re-verify.
