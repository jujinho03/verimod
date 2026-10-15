# W4 A — Validation policy candidates

Status: PROVISIONAL. X/B unapproved; no adopted policy, no LOCK.

Population: 1,255 internal VALIDATION rows; native none (547) is an operational NORMAL proxy, not a platform determination. Native hate/offensive (708) are the HARMFUL proxy. All rows are eligible and FULL; there are zero actual TRUNCATED validation rows. TRUNCATED behavior is covered by fixed parity vectors and actual synthetic E2E, not inferred from this dataset.

The table uses actual selected R01 scores, with per-label nearest-rank FULL score quantiles 25/50/75/90. A candidate H50-75_O50-75 uses the hate median/upper-quartile and offensive median/upper-quartile as review/restrict thresholds. No legacy five-label values are reused.

Formal selection remains FRR <= X AND HRR_TOTAL <= B, then minimum HAR, maximum RP, minimum HRR_TOTAL. No formal feasible-set selection ran without X/B. The predeclared median/upper-quartile candidate is only a technical branch-coverage choice, not an operating recommendation.

| Candidate | hate review/restrict | offensive review/restrict | ALLOW / REVIEW / RESTRICT | FRR | RP | HAR | HRR_TOTAL |
|---|---:|---:|---:|---:|---:|---:|---:|
| H25-50_O25-50 | 4613 / 24495 | 28833 / 180483 | 247 / 214 / 794 | 176/547 (32.18%) | 618/794 (77.83%) | 22/708 (3.11%) | 214/1255 (17.05%) |
| H25-50_O25-75 | 4613 / 24495 | 28833 / 646501 | 247 / 339 / 669 | 119/547 (21.76%) | 550/669 (82.21%) | 22/708 (3.11%) | 339/1255 (27.01%) |
| H25-50_O50-75 | 4613 / 24495 | 180483 / 646501 | 313 / 273 / 669 | 119/547 (21.76%) | 550/669 (82.21%) | 43/708 (6.07%) | 273/1255 (21.75%) |
| H25-50_O50-90 | 4613 / 24495 | 180483 / 828254 | 313 / 300 / 642 | 108/547 (19.74%) | 534/642 (83.18%) | 43/708 (6.07%) | 300/1255 (23.90%) |
| H25-50_O75-90 | 4613 / 24495 | 646501 / 828254 | 313 / 300 / 642 | 108/547 (19.74%) | 534/642 (83.18%) | 43/708 (6.07%) | 300/1255 (23.90%) |
| H25-75_O25-50 | 4613 / 216950 | 28833 / 180483 | 247 / 219 / 789 | 174/547 (31.81%) | 615/789 (77.95%) | 22/708 (3.11%) | 219/1255 (17.45%) |
| H25-75_O25-75 | 4613 / 216950 | 28833 / 646501 | 247 / 412 / 596 | 91/547 (16.64%) | 505/596 (84.73%) | 22/708 (3.11%) | 412/1255 (32.83%) |
| H25-75_O50-75 | 4613 / 216950 | 180483 / 646501 | 313 / 346 / 596 | 91/547 (16.64%) | 505/596 (84.73%) | 43/708 (6.07%) | 346/1255 (27.57%) |
| H25-75_O50-90 | 4613 / 216950 | 180483 / 828254 | 313 / 502 / 440 | 53/547 (9.69%) | 387/440 (87.95%) | 43/708 (6.07%) | 502/1255 (40.00%) |
| H25-75_O75-90 | 4613 / 216950 | 646501 / 828254 | 313 / 502 / 440 | 53/547 (9.69%) | 387/440 (87.95%) | 43/708 (6.07%) | 502/1255 (40.00%) |
| H50-75_O25-50 | 24495 / 216950 | 28833 / 180483 | 271 / 195 / 789 | 174/547 (31.81%) | 615/789 (77.95%) | 24/708 (3.39%) | 195/1255 (15.54%) |
| H50-75_O25-75 | 24495 / 216950 | 28833 / 646501 | 271 / 388 / 596 | 91/547 (16.64%) | 505/596 (84.73%) | 24/708 (3.39%) | 388/1255 (30.92%) |
| H50-75_O50-75 | 24495 / 216950 | 180483 / 646501 | 461 / 198 / 596 | 91/547 (16.64%) | 505/596 (84.73%) | 90/708 (12.71%) | 198/1255 (15.78%) |
| H50-75_O50-90 | 24495 / 216950 | 180483 / 828254 | 461 / 354 / 440 | 53/547 (9.69%) | 387/440 (87.95%) | 90/708 (12.71%) | 354/1255 (28.21%) |
| H50-75_O75-90 | 24495 / 216950 | 646501 / 828254 | 586 / 229 / 440 | 53/547 (9.69%) | 387/440 (87.95%) | 158/708 (22.32%) | 229/1255 (18.25%) |
| H50-90_O25-50 | 24495 / 887209 | 28833 / 180483 | 271 / 230 / 754 | 171/547 (31.26%) | 583/754 (77.32%) | 24/708 (3.39%) | 230/1255 (18.33%) |
| H50-90_O25-75 | 24495 / 887209 | 28833 / 646501 | 271 / 544 / 440 | 74/547 (13.53%) | 366/440 (83.18%) | 24/708 (3.39%) | 544/1255 (43.35%) |
| H50-90_O50-75 | 24495 / 887209 | 180483 / 646501 | 461 / 354 / 440 | 74/547 (13.53%) | 366/440 (83.18%) | 90/708 (12.71%) | 354/1255 (28.21%) |
| H50-90_O50-90 | 24495 / 887209 | 180483 / 828254 | 461 / 542 / 252 | 32/547 (5.85%) | 220/252 (87.30%) | 90/708 (12.71%) | 542/1255 (43.19%) |
| H50-90_O75-90 | 24495 / 887209 | 646501 / 828254 | 586 / 417 / 252 | 32/547 (5.85%) | 220/252 (87.30%) | 158/708 (22.32%) | 417/1255 (33.23%) |
| H75-90_O25-50 | 216950 / 887209 | 28833 / 180483 | 271 / 230 / 754 | 171/547 (31.26%) | 583/754 (77.32%) | 24/708 (3.39%) | 230/1255 (18.33%) |
| H75-90_O25-75 | 216950 / 887209 | 28833 / 646501 | 271 / 544 / 440 | 74/547 (13.53%) | 366/440 (83.18%) | 24/708 (3.39%) | 544/1255 (43.35%) |
| H75-90_O50-75 | 216950 / 887209 | 180483 / 646501 | 466 / 349 / 440 | 74/547 (13.53%) | 366/440 (83.18%) | 93/708 (13.14%) | 349/1255 (27.81%) |
| H75-90_O50-90 | 216950 / 887209 | 180483 / 828254 | 466 / 537 / 252 | 32/547 (5.85%) | 220/252 (87.30%) | 93/708 (13.14%) | 537/1255 (42.79%) |
| H75-90_O75-90 | 216950 / 887209 | 646501 / 828254 | 659 / 344 / 252 | 32/547 (5.85%) | 220/252 (87.30%) | 203/708 (28.67%) | 344/1255 (27.41%) |

## Interpretation

Lower review thresholds reduce harmful ALLOW by increasing review work. Lower restrict thresholds move cases into RESTRICT, usually increasing false restriction of the none proxy. Increasing thresholds is not guaranteed to optimize all metrics together. RP is undefined if no case is restricted; it is never silently converted to zero.

Technical candidate H50-75_O50-75 has FRR 91/547 = 16.64%, RP 505/596 = 84.73%, HAR 90/708 = 12.71%, HRR_TOTAL 198/1255 = 15.78%. These measured false restrictions are a substantive trade-off. Team review must supply X/B and approve or reject the candidate before operational use.

All 25 candidates are descriptive validation comparisons. No TEST claim, confidence interval claim, calibration claim, production fitness claim or model reselection is made.

Complete machine-readable numerators, denominators and FULL/TRUNCATED counts: [policy_candidates.json](../../ai/artifacts/reports/w4_a_validation/20261016/policy_candidates.json).

Private prediction SHA-256: `74fcac005741574422edcd597dc1f78d8234b20e24e50f35d722d01fd927a400`. The full row file is Git-ignored and is not attached.
