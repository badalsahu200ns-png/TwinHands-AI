# TwinHands-AI

> **Adaptive Multimodal Physical AI for Coordinated Bimanual Dinner-Table Preparation**

TwinHands-AI coordinates dual SO-101 articulated robotic arms (🔴 Red Left Arm + 🔵 Blue Right Arm) in MuJoCo simulation, leveraging Multimodal Vision-Language-Action (VLA) models and Intel® OpenVINO™ Edge AI perception to prepare dinner tables for 1 to 10 diners autonomously from high-level natural language instructions.

---

## 📚 Complete Project Documentation Suite

- **[Product Requirements Document (PRD.md)](./PRD.md)**: 28-section comprehensive product specification covering executive summary, vision, group-size planning (1–10 diners), safety boundaries, manipulation primitives, metrics, and risk register.
- **[Business Requirements Document (BRD.md)](./BRD.md)**: Commercial business case, 3-year TCO/ROI analysis (91% operational savings, 3.2-month payback), stakeholder mapping, and commercial hospitality viability.
- **[System Architecture (ARCHITECTURE.md)](./ARCHITECTURE.md)**: Layered control hierarchy (High/Mid/Low), 5 Threat Zones, Damped Least Squares Jacobian mapping ($\dot{x} = J(q)\dot{q}$), and Intel OpenVINO edge perception integration.
- **[Development Roadmap (ROADMAP.md)](./ROADMAP.md)**: 11-phase development lifecycle (Phases 0–10) with MoSCoW prioritization matrix and milestone dependencies.
- **[Live Demonstration & Judge Script (DEMO.md)](./DEMO.md)**: Complete hackathon pitch, live walkthrough flow, test scenarios, and evaluation guide.

---

## 1. System Architecture & Repository Layout

```
TwinHands-AI/
├── README.md                      # Primary project overview, quickstart & threat model
├── PRD.md                         # Complete 28-section Product Requirements Document
├── BRD.md                         # Business Requirements Document (ROI, market, operations)
├── ARCHITECTURE.md                # System Architecture, 5 Threat Zones, Kinematic Pipeline
├── ROADMAP.md                     # Roadmap Phases 0–10 with MoSCoW prioritization
├── DEMO.md                        # Step-by-step judge presentation & walkthrough script
├── simulation/
│   └── mujoco/
│       ├── scene.xml              # MuJoCo MJCF world definition (table, dual SO-101s, tableware)
│       └── dual_arm_env.py        # Python Gym/MuJoCo environment wrapper & step controller
├── robotics/
│   ├── controllers/
│   │   ├── cartesian_controller.py # Damped Least Squares Jacobian pseudo-inverse controller
│   │   ├── reach_controller.py    # Parabolic trajectory generator with Z-clearance
│   │   └── gripper_controller.py  # Parallel gripper grasp/release controller
│   ├── planning/
│   │   ├── motion_planner.py      # Collision-avoidance waypoint motion planner
│   │   └── bimanual_planner.py    # Dual-arm synchronization & workload balancer
│   └── primitives/
│       ├── __init__.py
│       ├── reach.py               # Approach target pre-grasp pose
│       ├── grasp.py               # Finger closure with force limit
│       ├── lift.py                # Vertical Z-axis ascent
│       ├── place.py               # Placement descent onto placemat
│       └── release.py             # Gripper opening and clearance retraction
├── ai/
│   ├── agents/
│   │   ├── task_agent.py          # Voice/Text natural language intent parser
│   │   ├── vision_agent.py        # Multimodal scene understanding & spatial mapping
│   │   ├── verification_agent.py  # Closed-loop placement verification
│   │   └── recovery_agent.py      # Autonomous fault detection & retry recovery
│   └── planning/
│       ├── task_planner.py        # High-level task decomposition
│       └── table_layout_planner.py# Geometric layout generator (1–10 people)
├── perception/
│   ├── object_detection.py        # Tableware detection wrapper (plates, bowls, cups, spoons)
│   ├── localization.py            # 3D spatial coordinate projection from camera frame
│   └── verification.py            # Tolerance checking (<15mm Euclidean error)
├── intel/
│   └── openvino/
│       ├── inference.py           # OpenVINO Core runtime pipeline (INT8/FP16/FP32)
│       └── benchmark.py           # Benchmark script measuring latency, FPS, memory, CPU/NPU
├── dashboard/
│   ├── frontend/ (src/)           # React + Vite + Tailwind + Lucide web application
│   └── backend/ (server.ts)       # Express + Gemini VLA fallback ladder service
├── tests/
│   ├── robotics/test_kinematics.py
│   ├── planning/test_table_layout.py
│   ├── perception/test_detection.py
│   └── integration/test_end_to_end.py
└── public/
    └── assets/renders/            # Photorealistic 3D generated industrial renders
```

---

## 2. Agentic Threat Model (The 5 Threat Zones)

| Threat Zone | Identified Risk | Impact | Implemented Countermeasure |
| :--- | :--- | :--- | :--- |
| **1. Input Surfaces** | Malicious audio/prompt injection (e.g. override commands to trigger physical collisions) | Actuator damage, joint overload, unhandled exceptions | Strict validation whitelist; bounding checks enforce $1 \le N \le 10$. Non-conforming payloads safely rejected. |
| **2. Planning & Reasoning** | System prompt hijacking to force out-of-table bounds ($N > 10$ or $N < 1$) | Out-of-table kinematics and arm singularities | Deterministic capacity validation rule engine (AC-11) rejects unsupported group sizes independently of LLM reasoning. |
| **3. Tool Execution** | Dual-arm trajectory overlap in shared central tabletop workspace | Physical arm-to-arm collision between Red and Blue SO-101 arms | Dynamic cost solver enforces minimum 0.18m Euclidean clearance between TCPs, parabolic Z-axis clearance arcs, and an instant hardware E-Stop interlock. |
| **4. Memory & State** | In-flight state desynchronization between simulation and telemetry | Gripper actuation failures or dropped tableware items | Immutable action queue with transactional task acknowledgement. Sensor verification required before next task dispatch. |
| **5. Inter-System Comm** | API token exfiltration or unauthenticated robot activation | Unauthorized external activation of physical actuators | Zero hardcoded keys. `GEMINI_API_KEY` confined to server-side Node runtime. Client communicates only via typed local endpoints. |

---

## 3. Intel® OpenVINO™ Edge AI Benchmarks

Calibrated on Intel Core Ultra NPU & Intel Xeon w9-3495X:

```
======================================================================
 Precision  | Latency (ms)   | FPS        | Memory (MB)  | Speedup   
----------------------------------------------------------------------
 INT8       | 3.80           | 263.1      | 42.6         | 7.74x     
 FP16       | 7.20           | 138.8      | 85.2         | 4.08x     
 FP32       | 29.40          | 34.0       | 170.4        | 1.00x     
======================================================================
```

To execute the benchmark locally:
```powershell
python -m intel.openvino.benchmark
```

---

## 4. Running Tests

Run the full automated robotics, planning, perception, and integration test suite:

```powershell
# Run Python unit and integration tests (16 tests)
python -m unittest discover -s tests -t . -p "test_*.py" -v

# Run TypeScript compilation and lint check
npm run lint

# Build production bundle
npm run build
```

---

## 5. Google Cloud Prerequisites & Configuration

### Enable Google Cloud APIs
```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

### Secret Manager Configuration
```bash
# 1. Create the secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add your Gemini API key value
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant the default Cloud Run service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 6. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /table_sessions/{sessionId} {
      allow read, write: if request.auth != null && request.auth.uid == request.resource.data.operatorId;
    }
  }
}
```

---

## 7. Build and Cloud Run Deployment

```bash
# 1. Set environment variables
export SERVICE_NAME="twinhands-ai"
export REGION="us-central1"

# 2. Deploy to Cloud Run from source with Secret Manager binding
gcloud run deploy ${SERVICE_NAME} \
  --source . \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --min-instances=1 \
  --memory=1Gi \
  --cpu=1

# 3. Apply the Mandatory Verification Challenge Label
gcloud run services update ${SERVICE_NAME} \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=${REGION}
```

---

## 8. Functional Walkthrough Test Procedures

| Test ID | Scenario | Procedure | Expected Outcome |
| :--- | :--- | :--- | :--- |
| **TC-001** | Voice/Text Intent Parsing ($N=4$) | 1. Click preset "Small Group (4)".<br>2. Click "Plan & Setup". | Badge outputs `{ task: "prepare_dinner_table", people: 4 }`. Planner allocates 16 objects across 4 place settings. |
| **TC-002** | Unsupported Group Rejection ($N=12$) | 1. Click preset "Reject Test (12)".<br>2. Click "Plan & Setup". | Rejection banner displays: `"GROUP SIZE NOT SUPPORTED. TwinHands-AI currently supports 1–10 people. Please specify a group size between 1 and 10."` |
| **TC-003** | Coordinated MuJoCo Execution | 1. Click "Simulate".<br>2. Observe Red SO-101 and Blue SO-101 moving items from staging bays to placemats. | Tableware items follow smooth parabolic trajectories with real-time Cartesian and 6-DOF joint updates. |
| **TC-004** | Emergency Stop Interlock | 1. During motion, click "E-STOP". | Arms halt motion instantly; telemetry status switches to `E_STOPPED`. |
| **TC-005** | Intel OpenVINO Benchmarks | 1. Select "INT8" on the OpenVINO card.<br>2. Select "FP16" and "FP32". | Latency displays 3.8ms on INT8 (7.7x speedup vs 29.4ms FP32 baseline). |
| **TC-006** | Place-Setting Verification | 1. Let simulation reach 100%. | Acceptance modal displays: `Requested: 4 people \| Completed: 4/4 \| Status: SUCCESS` with celebratory confetti. |
| **TC-007** | 3D Photorealistic Render Inspector | 1. Click the "3D Photo Render" tab in CAD Asset Inspector. | High-resolution 4K render appears with dimensional and material callout cards. |
