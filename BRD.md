# TwinHands-AI: Business Requirements Document (BRD)

> **Autonomous Multimodal Physical AI for Commercial Dining, Laboratory Preparation & Bimanual Robotics**

---

## 1. Project Background & Commercial Context

The commercial dining, high-volume hospitality, institutional catering, and specialized laboratory sectors face severe labor constraints:
- **Repetitive Strain & Turnover**: Table preparation, setting alignment, and utensil sanitization involve millions of repetitive bending and reaching motions, leading to high injury and turnover rates (>75% annually in hospitality).
- **Inflexible Automation**: Traditional industrial cobots require skilled roboticists to reprogram waypoints whenever table sizes or group counts change, rendering them unviable for dynamic dining rooms or agile catering venues.
- **Underutilized Hardware**: Fixed single-purpose automation systems cannot adapt between small intimate meals ($N=1$ or $N=2$) and large banquets ($N=8$ or $N=10$) without costly mechanical retooling.

**TwinHands-AI solves this through an Intent-Driven Multimodal Physical AI Platform.** By treating group size ($N \in [1, 10]$) as a continuous planning variable and delegating dual-arm coordination to a cost-optimized solver, operators command complex physical arrangements through natural speech.

---

## 2. Business Objectives & Strategic Fit

| Objective ID | Business Objective | Target Metric | Strategic Value |
| :--- | :--- | :--- | :--- |
| **BO-01** | Zero-Code Reconfiguration | $0$ lines of code needed to reconfigure for 1–10 diners | Allows floor staff to operate robots without robotics engineering support. |
| **BO-02** | Turnaround Cycle Acceleration | $\ge 1.7\times$ speedup via bimanual coordination vs single arm | Prepares a 4-person table in $<45$ seconds; 10-person banquet in $<2$ minutes. |
| **BO-03** | Human Error & Misalignment Reduction | $\le 15$mm placement deviation; $99.4\%$ CV verification | Eliminates missing silverware, crooked placemats, and dining inconsistency. |
| **BO-04** | Edge AI Cost & Latency Reduction | $\le 4$ms perception latency on Intel Core Ultra NPU | Runs locally on edge compute without cloud GPU rental costs. |
| **BO-05** | Certified Operational Safety | $0$ collisions via 0.18m hardware clearance & instant E-Stop | Safe for shared collaborative workspaces. |

---

## 3. Total Cost of Ownership (TCO) & ROI Analysis

### 3.1 3-Year Operational Cost Comparison (Single Hospitality Station)

| Cost Component | Manual Floor Staff (2 FTEs) | Traditional Fixed Cobot | TwinHands-AI Physical Workcell |
| :--- | :---: | :---: | :---: |
| **Initial Hardware & Tooling** | $0 | $68,000 (Custom End-Effectors) | $18,500 (Dual SO-101 + Table) |
| **Software Setup & Programming** | $0 | $35,000 (Systems Integrator) | $0 (Zero-Code NL VLA System) |
| **Annual Labor / Cloud Inference** | $84,000/yr | $12,000/yr (Cloud GPU API) | $0 (Intel OpenVINO On-Premises) |
| **Changeover & Retooling Downtime** | High (Human Fatigue) | 4–6 Hours per Table Change | Instantaneous ($<200$ms Layout Solver) |
| **3-Year Cumulative Total** | **$252,000** | **$139,000** | **$22,500** |

**Projected Net Savings**: **$229,500 over 3 years** (91.0% operational cost reduction) with a payback period of **3.2 months**.

---

## 4. Stakeholder Analysis

```
┌─────────────────────────────────────────────────────────────┐
│                      Executive Sponsor                      │
│            (VP of Hospitality Operations / Chief Robotics)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┴───────────────────────┐
       ▼                                               ▼
┌──────────────────────────────┐       ┌──────────────────────────────┐
│       Floor Operators        │       │      Robotics Engineers      │
│ - Natural Language / Voice   │       │ - Kinematics & Controllers   │
│ - Instant E-Stop Safety      │       │ - Simulation in MuJoCo       │
│ - Live Verification Badges   │       │ - OpenVINO Edge Benchmarking │
└──────────────────────────────┘       └──────────────────────────────┘
```

---

## 5. Scope & Business Constraints

### In Scope
1. Adaptive table setup for group sizes $1 \le N \le 10$ on standardized dining tables.
2. Manipulation of plates, bowls, cups, spoons, glasses, and benchmark cubes.
3. Dual-arm coordination between 🔴 Red Left and 🔵 Blue Right SO-101 manipulators.
4. Voice and text natural language understanding.
5. On-premise Intel OpenVINO perception without cloud runtime dependencies.
6. Closed-loop optical verification and autonomous recovery.

### Out of Scope (Future Phases)
1. High-speed hot liquid pouring or soup dispensing (P3).
2. Large-scale physical mobility on AMRs/AGVs (P3).
3. Non-rigid deformable napkin folding (P2).

---

## 6. Success Metrics & Key Performance Indicators (KPIs)

- **Autonomous Table Preparation Success Rate**: $\ge 98.0\%$
- **Cycle Time per Place Setting**: $\le 11.2$ seconds
- **Bimanual Workload Balance Ratio**: $50\% \pm 10\%$ split between Red and Blue arms
- **Operator Training Time**: $< 5$ minutes (Natural language command interface)
- **Local Edge Inference Latency**: $< 4.0$ ms with Intel OpenVINO INT8 quantization
