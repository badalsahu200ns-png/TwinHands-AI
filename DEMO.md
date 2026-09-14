# TwinHands-AI: Live Demonstration & Judge Walkthrough Script

> **Comprehensive Presentation Script, Test Procedures & Evaluation Guide**

---

## 1. Hackathon Pitch (60-Second Overview)

> *"Judges, traditional robotics systems describe HOW to move—commanding joint angles or rigid fixed waypoints. If you change a table from 2 people to 4 people, a traditional cobot breaks or requires a robotics engineer to spend hours hand-tuning waypoints.*
>
> *TwinHands-AI introduces **Adaptive Multimodal Physical AI for Coordinated Bimanual Manipulation**. Instead of coordinates, an operator commands:*
>
> **'Prepare the dinner table for four people.'**
>
> *Our system extracts the group size as a continuous planning variable, generates an optimized table layout, balances tasks across dual SO-101 robotic arms (🔴 Red Left + 🔵 Blue Right), executes Cartesian motion with parabolic clearance arcs in MuJoCo, and verifies the placement with Intel® OpenVINO™ edge AI perception.*
>
> *From 1 diner to a 10-person banquet, TwinHands-AI coordinates two hands seamlessly without hardcoded routines."*

---

## 2. Step-by-Step Live Demo Flow

```
Step 1: System Ready Check (Arms, MuJoCo, OpenVINO Online)
         │
Step 2: Natural Language Command ("Prepare dinner table for 4 people")
         │
Step 3: Intent Parsing & Group Extraction ({ task: "prepare_dinner_table", people: 4 })
         │
Step 4: Layout & Placemat Geometry Synthesis (16 items, 4 place settings)
         │
Step 5: Bimanual Task Allocation (Red Arm: 8 items | Blue Arm: 8 items, 1.82x Speedup)
         │
Step 6: Real-time Coordinated Simulation in MuJoCo (Parabolic Arcs, Cartesian IK)
         │
Step 7: Safety Interlock Demonstration (E-Stop Trigger & Resume)
         │
Step 8: Intel OpenVINO Benchmarking (INT8 Quantization: 3.8ms, 7.7x Speedup)
         │
Step 9: Closed-Loop Verification & Completion Confetti Report
         │
Step 10: Boundary Test: Safe Rejection of Unsupported Group ("Table for 12")
```

---

## 3. Test Cases & Expected Outcomes

| Test ID | Scenario | Command / Action | Expected Result & Verification |
| :--- | :--- | :--- | :--- |
| **TC-01** | Standard 4-Person Setup | Click preset *"Small Group (4)"* or speak *"Prepare the dinner table for 4 people."* | Intent parsed to `{ task: "prepare_dinner_table", people: 4 }`. Layout generates 4 place settings (16 objects: 4 plates, 4 bowls, 4 cups, 4 spoons). Solver allocates 8 tasks to Red arm, 8 to Blue arm ($1.8\times$ speedup). |
| **TC-02** | Solo Dining Setup ($N=1$) | Click preset *"Solo Dining (1)"* or speak *"Prepare a table for one."* | Layout switches to intimate South-Center setting (4 objects). Single place setting completed in $<12$ seconds. |
| **TC-03** | Banquet Scalability ($N=10$) | Click preset *"Banquet (10)"* or speak *"Set the table for ten guests."* | Layout scales dynamically to full table perimeter (40 objects). Reachability and boundary constraints validated. |
| **TC-04** | Unsupported Group Rejection ($N=12$) | Click preset *"Reject Test (12)"* or speak *"Prepare the table for twelve people."* | System rejects execution safely with message: <br>`GROUP SIZE NOT SUPPORTED. TwinHands-AI currently supports 1–10 people. Please specify a group size between 1 and 10.` |
| **TC-05** | Emergency Stop Interlock | During active simulation, click the red **E-STOP** button. | Manipulator motion halts instantaneously ($\le 10$ms). Arm status switches to `E_STOPPED`. Collision avoidance envelope maintained. |
| **TC-06** | Intel OpenVINO Edge Benchmark | Click **INT8**, **FP16**, and **FP32** buttons on the OpenVINO card. | Live benchmark shows INT8 inference at **3.8ms** ($263.1$ FPS, $7.7\times$ speedup vs 29.4ms FP32 baseline) with $99.4\%$ accuracy retention. |
| **TC-07** | Closed-Loop Verification Modal | Allow simulation to reach 100% item placement. | Verification modal pops up: `Requested: 4 people \| Completed: 4/4 \| Status: SUCCESS` with celebratory confetti. |
| **TC-08** | 3D CAD Digital Twin Viewer | Switch tab to **CAD Digital Twin Assets** and cycle through assets. | High-fidelity 3D reference renders display alongside interactive Canvas orthographic/perspective wireframes and MuJoCo XML code. |

---

## 4. Key Talking Points for Judges

1. **Why Dual Arms?** Bimanual manipulation provides a $>1.7\times$ speedup over single-arm robots while enabling symmetrical human-like table preparation.
2. **Why Adaptive Planning over Hardcoded Routines?** Traditional systems hardcode `table_1()`, `table_2()`, etc. In TwinHands-AI, group size $N$ is a first-class mathematical variable. The system solves geometry, reach, and arm assignments on the fly.
3. **Safety Boundary**: We strictly enforce that high-level AI models never directly write motor commands. All outputs pass through typed schema and collision validation before Cartesian trajectory execution.
4. **Intel OpenVINO Advantage**: Edge AI inference takes only 3.8ms on an Intel Core Ultra NPU, eliminating cloud latency and privacy concerns in real dining environments.
