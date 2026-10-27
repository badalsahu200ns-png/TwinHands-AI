# TwinHands AI — User Stories and Acceptance Criteria

## Purpose

This document defines the user stories and acceptance criteria for TwinHands AI. It establishes the expected behavior for natural-language task planning, request validation, deterministic safety, execution verification, bounded recovery, and reproducible demonstrations.

## US-01 — Plan a Task

**As an** operator,  
**I want** to request a table setup in plain language,  
**so that** I do not need to program the task manually.

### Acceptance criteria

- [ ] A valid request for four people returns a structured, machine-readable plan.
- [ ] The plan contains the required task details, supported item types, quantities, and placement information.
- [ ] Only item types explicitly supported by the application are accepted.
- [ ] The generated plan is validated before it can be passed to the simulator.
- [ ] The system distinguishes a generated plan from an executed task and never claims execution based on planning alone.

### Example

**Input:** `Prepare the dinner table for 4 people`

**Expected behavior:** Return a structured plan that can be validated by deterministic application logic. Do not report the table as prepared until execution and final-state verification have succeeded.

## US-02 — Reject Unsupported Requests

**As an** operator,  
**I want** unsupported requests to be rejected before simulation,  
**so that** invalid tasks cannot enter the execution workflow.

### Acceptance criteria

- [ ] Requests specifying 0, 11, or 12 people are rejected.
- [ ] The supported participant-count range is enforced by deterministic validation, not solely by the language model.
- [ ] A rejected request does not start a simulation or trigger robot actions.
- [ ] The interface displays a clear rejection reason and, where appropriate, explains the supported range.
- [ ] Malformed plans, unsupported item types, missing required fields, and invalid layouts are rejected before simulation.
- [ ] Rejected requests do not produce a success status.

## US-03 — Preserve the Safety Boundary

**As a** robotics engineer,  
**I want** deterministic planning and collision checks to remain authoritative,  
**so that** model-generated output cannot bypass safety constraints.

### Acceptance criteria

- [ ] Language-model output is treated as untrusted input.
- [ ] Deterministic validators check task constraints, object types, placements, and layout validity before execution.
- [ ] The language model cannot override safety rules or directly authorize execution.
- [ ] Invalid layouts and plans that fail safety checks cannot execute.
- [ ] Collision checks are enforced by the deterministic safety layer.
- [ ] An active emergency stop prevents execution and recovery actions.
- [ ] An unknown, unavailable, or unsafe simulator state prevents recovery actions until the state is safely resolved.
- [ ] Safety-check failures are reported clearly and recorded where supported by the application.

## US-04 — Verify Completion

**As an** operator,  
**I want** to distinguish a planned task from a completed task,  
**so that** I can trust the reported result.

### Acceptance criteria

- [ ] After execution, the application obtains the simulator's observed final state.
- [ ] The observed state is compared with the expected task state using deterministic verification logic.
- [ ] Missing, misplaced, unexpected, or incorrectly arranged items are reported.
- [ ] A planned task is not automatically marked as completed.
- [ ] The application reports success only when the final-state verification passes.
- [ ] Failed, incomplete, unavailable, or inconclusive verification never produces a success status.
- [ ] The interface clearly distinguishes planning, execution, verification, failure, and completion states.

## US-05 — Recover from Failure

**As a** robotics engineer,  
**I want** a bounded recovery workflow for a simulated failure,  
**so that** the system can attempt a safe correction without entering an uncontrolled retry loop.

### Acceptance criteria

- [ ] A reproducible fault-injection scenario causes final-state verification to fail.
- [ ] The recovery workflow permits at most one retry for a task attempt.
- [ ] The retry is permitted only after deterministic safety checks pass.
- [ ] Emergency-stop activation, an unknown simulator state, or failed safety checks prevent recovery.
- [ ] The system verifies the final state again after the permitted retry.
- [ ] If the retry fails or cannot safely proceed, the system stops and requests operator review.
- [ ] The application reports the original failure, recovery decision, retry outcome, and final status.
- [ ] Recovery is not reported as successful unless the final verification passes.

## US-06 — Reproduce the Demo

**As a** hackathon judge,  
**I want** to run the application using the repository's README,  
**so that** I can independently evaluate the implementation and its limitations.

### Acceptance criteria

- [ ] The repository contains a license file.
- [ ] The README documents prerequisites, installation, configuration, startup, and testing.
- [ ] Required environment variables are documented with their purpose and safe example values.
- [ ] Secrets and API keys are not committed to the repository.
- [ ] Automated test instructions cover valid requests, invalid participant counts, safety rejection, final-state verification, and bounded recovery.
- [ ] Test results are disclosed accurately, including tests that have not been run or that fail.
- [ ] Known limitations, simulator assumptions, and the distinction between simulation and physical robot execution are documented.
- [ ] Public demo links are included when available and have been checked for accessibility.
- [ ] The documented setup and test steps are reproducible from a clean environment, subject to the stated prerequisites.

## Cross-Cutting Definition of Done

A feature is complete only when its acceptance criteria are implemented and supported by appropriate tests or documented evidence.

- **Planning is not execution.** A generated plan is only a proposal until the application validates and executes it.
- **Safety is authoritative.** Model output cannot bypass deterministic validation, collision checks, emergency-stop handling, or simulator-state checks.
- **Verification determines success.** A task succeeds only when the observed final state satisfies the expected state.
- **Recovery is bounded.** No more than one retry is permitted, and every retry must pass the safety checks.
- **Failures remain visible.** Rejected requests, safety failures, verification failures, and unresolved recovery attempts must not be presented as successes.
- **Claims must be evidence-based.** Documentation and demos must distinguish implemented behavior, tested behavior, and planned or unsupported capabilities.

## Test Evidence Checklist

Use this checklist to record verification evidence before a demo or submission.

- [ ] Four-person table setup returns a valid structured plan.
- [ ] Participant counts 0, 11, and 12 are rejected before simulation.
- [ ] Unsupported item types and invalid layouts are rejected.
- [ ] A safety-check failure prevents execution.
- [ ] Emergency stop or an unknown simulator state prevents recovery.
- [ ] Missing or misplaced items cause verification to fail.
- [ ] A reproducible injected fault produces a failed verification result.
- [ ] At most one retry is attempted, and it must pass safety checks.
- [ ] A failed retry stops and requests operator review.
- [ ] Success is displayed only after final-state verification passes.
- [ ] README setup instructions, license, environment variables, and demo links are checked.

**Evidence status:** Do not mark a checklist item as verified until the corresponding behavior has actually been tested.
