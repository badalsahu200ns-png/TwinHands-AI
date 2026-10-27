\# TwinHands-AI — Business Requirements Document (Hackathon)



\*\*Document status:\*\* Hackathon business requirements  

\*\*Product:\*\* TwinHands-AI  

\*\*Version:\*\* 1.0  

\*\*Purpose:\*\* Explain the business problem, proposed value, evaluation requirements, and evidence standards.



\## 1. Executive summary



TwinHands-AI is a simulation-first concept for evaluating table-preparation automation workflows. It combines natural-language task interpretation, language-model-generated planning, deterministic validation, simulation, and independent verification.



The project aims to make early-stage automation experiments easier to demonstrate and evaluate without treating model-generated output as proof of successful execution.



The proposed business value is a hypothesis. Commercial impact, customer demand, financial return, and operational performance have not been established merely by implementing the prototype.



\## 2. Business problem



Robotics teams and operations managers often require specialist programming to translate a high-level task request into a coordinated workflow. Before attempting physical deployment, they need ways to investigate:



\- Whether a request can be translated into a structured plan.

\- Whether the proposed plan meets application-specific constraints.

\- Whether the workflow can be executed in simulation.

\- Whether the resulting state satisfies defined completion criteria.

\- How invalid requests, planning errors, and execution failures are handled.

\- Whether test results can be reproduced and independently inspected.



A simulation-first workflow could help teams explore these questions earlier in the development process. The scale of the problem and the extent of potential benefits require validation with representative users and measured tests.



\## 3. Proposed solution



TwinHands-AI aims to provide an end-to-end evaluation workflow:



1\. The user describes a table-preparation task in natural language.

2\. NVIDIA Nemotron is accessed through Nebius Token Factory to propose a structured plan.

3\. Server-side validation checks the plan's schema, types, counts, and supported values.

4\. The existing deterministic planner and safety gates determine whether execution may proceed.

5\. The deterministic simulator runs the accepted task.

6\. Independent verification checks the simulator's actual final state.

7\. An evidence view reports the outcome, model information, timing, and verification status.



The language model proposes a plan; deterministic application logic governs acceptance and execution; simulator evidence supports the final result.



\## 4. Target stakeholders



| Stakeholder | Need |

|---|---|

| Kitchen and canteen operations teams | Explore candidate workflows before physical deployment. |

| Robotics engineers | Inspect structured plans, constraints, execution, and verification behavior. |

| Automation integrators | Evaluate integration points and failure handling. |

| Hackathon judges | Reproduce the workflow and inspect technical evidence. |

| Project developers | Maintain clear interfaces between model inference, validation, simulation, and evidence collection. |



These stakeholder needs are proposed and should be confirmed through feedback or user testing.



\## 5. Proposed business value



TwinHands-AI aims to make early-stage automation evaluation more accessible by combining:



\- Natural-language task entry.

\- Structured plan generation.

\- Deterministic validation and safety gates.

\- Repeatable simulation.

\- Independent final-state verification.

\- Evidence suitable for technical review.



Potential benefits to investigate include reduced setup effort for demonstration scenarios, faster identification of invalid plans, improved reproducibility, and clearer communication of test outcomes.



\*\*These are hypotheses, not proven commercial performance.\*\* No financial savings, productivity improvement, payback period, ROI, or deployment-readiness claim should be made without appropriate measurements and supporting evidence.



\## 6. Business requirements



| ID | Requirement | Acceptance evidence |

|---|---|---|

| BR-01 | Demonstrate the complete request-to-verification workflow. | A reproducible run shows request submission, inference, validation, simulation, and final verification. |

| BR-02 | Show an explicit invalid-request or safety-rejection path. | A documented test is rejected, and evidence confirms that the simulation did not start when rejection occurs before execution. |

| BR-03 | Display evidence rather than unverified success messages. | The result view distinguishes model output, validation, execution, and simulator verification. |

| BR-04 | Allow judges to reproduce the demo from the public repository. | Setup instructions, configuration guidance, and test commands are available and have been tested. |

| BR-05 | Clearly identify how Nebius Token Factory and NVIDIA Nemotron are used. | Documentation identifies the provider, selected model, inference integration, and required configuration. A successful real inference request is demonstrated. |

| BR-06 | Disclose the pre-existing project and describe material hackathon changes. | A README or submission note identifies the starting implementation, new or changed components, and any reused or external dependencies. |

| BR-07 | Report measured metrics with sample sizes and test conditions. | Every reported metric includes its measurement method, sample size, test conditions, and relevant limitations. |



\## 7. Technical and operational constraints



\- Provider credentials must remain server-side.

\- The application must have bounded request sizes and provider timeouts.

\- Invalid plans and rejected layouts must not proceed to execution.

\- Simulation completion and verified completion must remain distinct states.

\- Error handling must make configuration, provider, validation, simulation, and verification failures identifiable.

\- External provider access, account permissions, quotas, and model availability may affect demonstration reproducibility.

\- The demo must disclose components that are mocked, prerecorded, or otherwise not executed live.



\## 8. Hackathon demonstration and evaluation



The submission should demonstrate:



\### Scenario A — Valid task

Submit a supported request and show the real inference result, validated plan, deterministic execution, and final-state verification evidence.



\### Scenario B — Invalid request or safety rejection

Submit an invalid or unsupported request and show the rejection. Confirm that the relevant execution stage was not entered.



\### Scenario C — Failure handling

Where practical, demonstrate a missing-credential, provider-error, timeout, or simulation-error condition. Show a clear error state and ensure that no false success is reported.



\### Scenario D — Reproducibility

Provide the repository, setup steps, required configuration names, and test commands. Clearly state any prerequisites that judges need, including provider credentials where applicable.



\## 9. Metrics and reporting policy



The following metrics may be collected if the implementation supports them:



| Metric | Measurement method | Reporting requirements |

|---|---|---|

| Inference latency | Elapsed time for a defined provider request. | State sample size, model, provider, and timing boundaries. |

| End-to-end latency | Elapsed time from request acceptance to final result. | State whether inference, simulation, and verification are included. |

| Valid-plan acceptance | Valid test plans accepted divided by valid plans tested. | Define the test set and expected outcomes. |

| Invalid-plan rejection | Invalid test plans rejected divided by invalid plans tested. | Identify invalid categories and total test counts. |

| Simulation completion | Runs reaching the simulator's defined terminal state divided by runs started. | Define completion and list excluded or failed runs. |

| Verification outcome | Runs satisfying the documented final-state predicates divided by runs evaluated. | Describe the predicates, sample size, and simulator assumptions. |



Do not report a metric until the underlying tests have been run and the method can be explained. A small hackathon test set should not be presented as proof of production reliability.



\## 10. Pre-existing work and contribution disclosure



The project submission should transparently document:



\- Which repository, simulation pipeline, UI, and infrastructure existed before the hackathon work.

\- Which features were created, materially modified, or integrated for the hackathon.

\- How Nebius Token Factory and NVIDIA Nemotron are used in the live application.

\- Which components are third-party dependencies, pre-existing modules, or external services.

\- Which scenarios are live, simulated, mocked, or prerecorded.

\- Any known limitations that affect interpretation of the demonstration.



The description must reflect the actual commit history and implementation rather than assuming that every component is new.



\## 11. Risks and mitigations



| Risk | Mitigation |

|---|---|

| Model returns malformed or unsupported output. | Validate schema, types, ranges, and allowed values server-side. |

| Model proposal is mistaken for an executed result. | Display proposal, execution, and verification as separate states. |

| Invalid layout reaches the simulator. | Enforce safety validation before execution and test the rejection path. |

| Provider access fails during a demo. | Document configuration and failure behavior; do not substitute a mock while claiming live inference. |

| Secrets are exposed. | Use environment configuration, secret redaction, and repository checks. |

| Results are not reproducible. | Publish setup instructions, test cases, assumptions, and measurement methods. |

| Prototype claims exceed available evidence. | Disclose limitations and report only measured results. |



\## 12. Success criteria for the hackathon



The project is ready for evaluation when:



1\. The end-to-end request-to-verification workflow can be demonstrated.

2\. A real Nebius-hosted Nemotron inference request is evidenced.

3\. Invalid input and safety rejection are demonstrated.

4\. Successful completion depends on actual simulator-state verification.

5\. Failure states and relevant evidence are visible.

6\. The public repository contains reproducible setup and test instructions.

7\. Pre-existing work and hackathon contributions are disclosed.

8\. Reported metrics have documented methods, sample sizes, and conditions.



These criteria measure demonstration readiness. They do not establish commercial viability, production safety certification, guaranteed collision avoidance, or financial return.



\## 13. Next steps



\- Verify that the PRD acceptance tests match the actual application routes and validation rules.

\- Implement or confirm structured plan validation and independent final-state verification.

\- Execute and record the acceptance tests.

\- Add the documented setup and troubleshooting instructions to the repository.

\- Prepare a short demonstration script covering valid execution, rejection, and failure handling.

\- Collect stakeholder feedback before making broader business claims.



\*\*Business principle:\*\* Demonstrate the workflow, preserve the evidence, disclose the limitations, and validate business value separately from technical functionality.



