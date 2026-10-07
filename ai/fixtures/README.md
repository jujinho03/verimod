# W3 real-model output fixture

`w3_synthetic_inputs.json` contains three newly AI-authored Korean examples for interface testing:
general text, a personal insult and group-targeted hate. The harmful examples are test inputs,
not statements endorsed by the project. They were not copied from BEEP or any dataset.

`w3_real_model_i1_fixture.json` records actual offline selected-model outputs. No expected label
is imposed. It is REAL_MODEL_OUTPUT_FIXTURE / OFFLINE_SELECTED_MODEL / live_inference=false.
The three native scores are UNCALIBRATED; `none` is a reference class, not ALLOW.
Only hate/offensive ppm are exposed through the I1 envelope. Python applies independent half-up
rounding once; the sum is not repaired. Empty evidence means no attribution was generated.

Public deterministic salts and content commitments are synthetic fixture material only. The commitments
come from T-owned `contentCommitment`; an actual issuer supplies its own commitment and salt.
No authoritative receipt was issued and no anchor was created in this handoff.

Two independent CPU processes produced exactly equal logits, scores, ppm, classes and statuses.
This does not establish cross-machine bitwise reproducibility or model performance.

Current shared Receipt schema rejects the actual taxonomy. F's validator at
`e5f2bdcc49a5182d25ba9cfb96f6d591d44ca0a4` accepts all three envelopes, but that branch is not in main.
Status: A_OUTPUT_READY_CONSUMER_ALIGNMENT_REQUIRED.
