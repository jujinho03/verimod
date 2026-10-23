"""Synthetic-only schema, independent policy recomputation and privacy checks."""
from copy import deepcopy
import hashlib
import importlib.util
import json
from pathlib import Path
from unittest.mock import patch

import pytest

from verimod_ai.evaluation.metrics import model_report
from verimod_ai.evaluation.w4_policy import summarize
from verimod_ai.evaluation.w5_validation_rows import (
    ACTIONS, BASELINE, LABELS, PAIRS, action, analyze_cases, recalculate,
    summarize_rows, surface_features, validate_alignment, validate_predictions,
)


def row(i, truth="none", scores=(.3, .2, .5), status="FULL"):
    native = dict(zip(LABELS, scores))
    return {"local_row": i, "native_truth": truth, "native_prediction": max(LABELS, key=native.get),
            "native_scores": native, "raw_logits": [0., 0., 0.],
            "scores_ppm": {k: int(native[k] * 1_000_000 + .5) for k in ("hate", "offensive")},
            "input_status": status}


def split_row(label="none", i=0):
    return {"label": label, "text": "PRIVATE_TEXT_SENTINEL", "news_title": "PRIVATE_TITLE_SENTINEL",
            "record_id": f"PRIVATE_RECORD_{i}", "bias": "none", "contain_gender_bias": False}


def cli_module():
    path = Path(__file__).resolve().parents[1] / "scripts/revalidate_w5_rows.py"
    spec = importlib.util.spec_from_file_location("w5_rows_cli", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_valid_schema_and_alignment():
    rows = [row(0)]
    assert validate_predictions(rows, 1, {"none": 1})["status"] == "PASS"
    assert validate_alignment(rows, [split_row()])["aligned_rows"] == 1


@pytest.mark.parametrize("fault", ["count", "index", "extra", "label", "status", "score_keys", "bool_ppm", "rounding", "nan", "sum", "prediction", "logits"])
def test_bad_prediction_schema_rejected(fault):
    rows = [row(0)];r=rows[0]
    if fault == "count": rows=[]
    if fault == "index": r["local_row"]=True
    if fault == "extra": r["text"]="PRIVATE_SENTINEL"
    if fault == "label": r["native_truth"]="unsupported"
    if fault == "status": r["input_status"]="UNKNOWN"
    if fault == "score_keys": r["scores_ppm"]["none"]=500000
    if fault == "bool_ppm": r["scores_ppm"]["hate"]=True
    if fault == "rounding": r["scores_ppm"]["hate"]+=1
    if fault == "nan": r["native_scores"]["none"]=float("nan")
    if fault == "sum": r["native_scores"]["none"]=.4
    if fault == "prediction": r["native_prediction"]="hate"
    if fault == "logits": r["raw_logits"]=[float("inf"),0.,0.]
    with pytest.raises(ValueError): validate_predictions(rows, 1)


@pytest.mark.parametrize("fault", ["label", "count", "duplicate", "text_type", "extra"])
def test_alignment_rejects_wrong_split(fault):
    rows=[row(0),row(1)];split=[split_row(i=0),split_row(i=1)]
    if fault=="label":split[0]["label"]="hate"
    if fault=="count":split.pop()
    if fault=="duplicate":split[1]["record_id"]=split[0]["record_id"]
    if fault=="text_type":split[0]["text"]=None
    if fault=="extra":split[0]["secret"]="PRIVATE"
    with pytest.raises(ValueError):validate_alignment(rows,split)


def test_independent_action_matches_reference_at_boundaries():
    thresholds={k:{"review":100000,"restrict":300000} for k in ("hate","offensive")}
    rows=[row(0,scores=(.3,.2,.5)),row(1,"hate",(.099999,.1,.800001)),
          row(2,"offensive",(.5,.4,.1),"TRUNCATED"),row(3,"none",(.05,.05,.9))]
    independent=summarize_rows(rows,thresholds)
    assert independent==summarize(rows,thresholds)
    assert [action(r["scores_ppm"],r["input_status"],thresholds) for r in rows]==["RESTRICT","HUMAN_REVIEW","HUMAN_REVIEW","ALLOW"]
    assert summarize_rows([row(0,scores=(.01,.01,.98))],thresholds)["metrics"]["RP"]["value"] is None


def test_unknown_status_cannot_become_an_automatic_action():
    thresholds={k:{"review":100000,"restrict":300000} for k in ("hate","offensive")}
    with pytest.raises(ValueError, match="Unknown input status"):
        action({"hate":0,"offensive":0},"UNKNOWN",thresholds)


def test_recalculation_rebuilds_quantiles_and_reports_every_difference():
    rows=[row(0),row(1,"hate",(.6,.1,.3)),row(2,"offensive",(.1,.7,.2)),row(3,scores=(.01,.01,.98))]
    model=model_report([r["native_truth"] for r in rows],[r["native_prediction"] for r in rows]);model["accuracy"]=model["micro_f1"]
    stub={"candidates":[],"quantiles_ppm":{}}
    first=recalculate(rows,{"metrics":model},stub)
    comparison={"candidates":first["candidates"],"quantiles_ppm":first["quantiles_ppm"]}
    report=recalculate(rows,{"metrics":model},comparison)
    assert report["status"]=="PASS" and report["candidate_count"]==25
    assert report["python_reference_action_comparisons"]==100 and report["python_reference_action_mismatches"]==0
    comparison=deepcopy(comparison)
    comparison["candidates"][0]["metrics"]["FRR"]["numerator"]+=1
    comparison["candidates"][1]["actions"]["ALLOW"]+=1
    bad=recalculate(rows,{"metrics":model},comparison)
    assert bad["status"]=="FAIL" and bad["difference_count"]==2


def test_real_case_shape_is_deidentified_and_selection_is_deterministic():
    rows=[row(i, scores=s) for i,s in enumerate([(.3,.2,.5),(.7,.1,.2),(.1,.7,.2)]*5)]
    split=[split_row(i=i) for i in range(len(rows))]
    thresholds={k:{"review":100000,"restrict":250000} for k in ("hate","offensive")}
    report,mapping=analyze_cases(rows,split,thresholds)
    assert report["verified_real_cases"]==10 and len(mapping)==10
    assert report==analyze_cases(rows,split,thresholds)[0]
    assert {c["model_prediction"] for c in report["public_cases"]}==set(LABELS)
    encoded=json.dumps(report)
    for forbidden in ("PRIVATE_TEXT_SENTINEL","PRIVATE_TITLE_SENTINEL","PRIVATE_RECORD_",'"local_row"','"record_id"'):
        assert forbidden not in encoded
    assert all(c["ground_truth"]=="none" and c["policy_action"]=="RESTRICT" and not c["original_text_published"] for c in report["public_cases"])
    assert len({m["local_row"] for m in mapping})==10


def test_surface_features_do_not_return_content():
    features=surface_features('"아니 미친" ㅋㅋ ? PRIVATE_PERSON_SENTINEL')
    assert all(type(v) is bool for v in features.values()) and all(features.values())
    assert "PRIVATE_PERSON_SENTINEL" not in json.dumps(features)


def test_hash_mismatch_rejected_before_json_parsing(tmp_path):
    cli=cli_module();path=tmp_path/"synthetic.jsonl";path.write_bytes(b"not-json-PRIVATE")
    with patch.object(cli.json,"loads",side_effect=AssertionError("must not parse")):
        with pytest.raises(ValueError,match="hash mismatch"):cli.read_verified(path,"0"*64,"synthetic")


def test_verified_loader_and_sanitized_parse_error(tmp_path):
    cli=cli_module();path=tmp_path/"synthetic.jsonl";raw=b'{"synthetic":true}\n';path.write_bytes(raw)
    rows,proof=cli.read_verified(path,hashlib.sha256(raw).hexdigest(),"synthetic")
    assert rows==[{"synthetic":True}] and proof["hash_match"]
    raw=b'PRIVATE_INVALID_JSON';path.write_bytes(raw)
    with pytest.raises(ValueError) as error:cli.read_verified(path,hashlib.sha256(raw).hexdigest(),"synthetic")
    assert "PRIVATE_INVALID_JSON" not in str(error.value)


def test_cli_accepts_no_arbitrary_data_path_and_writer_does_not_overwrite(tmp_path):
    cli=cli_module()
    with patch.object(cli,"read_verified",side_effect=AssertionError("must not read")):
        with pytest.raises(SystemExit):cli.main(["--data-path","UNUSED_SYNTHETIC"])
        with pytest.raises(SystemExit):cli.main(["--run-id","../escape"])
    path=tmp_path/"report.json";cli.write_new(path,{"synthetic":True})
    with pytest.raises(FileExistsError):cli.write_new(path,{})
