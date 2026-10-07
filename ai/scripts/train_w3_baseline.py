"""Frozen baseline runner. --smoke is limited to 32 examples/split and 2 updates."""
import argparse
import json
import os
import re
from pathlib import Path
import sys

AI_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(AI_ROOT/'src'))
from verimod_ai.training.runner import MemoryMonitor, run, write_json


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config',type=Path,default=AI_ROOT/'configs/w3_baseline.json')
    parser.add_argument('--splits-dir',type=Path,default=os.environ.get('VERIMOD_BEEP_SPLITS'))
    parser.add_argument('--smoke',action='store_true')
    parser.add_argument('--offline',action='store_true')
    parser.add_argument('--run-id')
    args = parser.parse_args()
    if args.splits_dir is None:
        parser.error('Set VERIMOD_BEEP_SPLITS or --splits-dir')
    identity_path = None
    if args.run_id:
        if args.smoke or not re.fullmatch(r'[A-Za-z0-9-]+',args.run_id):
            parser.error('An official run ID cannot label smoke or contain path characters')
        meta_dir = AI_ROOT/'artifacts/reports/w3_baseline_run'/args.run_id
        meta_dir.mkdir(parents=True,exist_ok=True)
        identity_path = meta_dir/'run_identity.json'
        if identity_path.exists():
            parser.error('Official run identity already exists; no automatic retry')
        from datetime import datetime,timezone
        write_json(identity_path,{'run_id':args.run_id,'status':'STARTING','actual_training_started':False,
                   'started_at_utc':datetime.now(timezone.utc).isoformat(),'argv':sys.argv,
                   'configuration_modified':False})
    try:
        with MemoryMonitor() as memory:
            summary,result_dir = run(args.config,args.splits_dir,smoke=args.smoke,offline=args.offline,run_id=args.run_id)
    except BaseException as error:
        if identity_path:
            identity = json.loads(identity_path.read_text(encoding='utf-8'))
            identity.update(status='FAILED',error_type=type(error).__name__,error=str(error),
                            ended_at_utc=datetime.now(timezone.utc).isoformat())
            write_json(identity_path,identity)
        raise
    summary['throughput']['peak_process_rss_bytes'] = memory.peak
    summary['throughput']['memory_method'] = '100ms process RSS polling plus Windows peak_wset when available'
    write_json(result_dir/'run_summary.json',summary)
    if identity_path:
        identity = json.loads(identity_path.read_text(encoding='utf-8'))
        identity.update(status='TRAINING_AND_FINAL_VALIDATION_COMPLETED',
                        ended_at_utc=datetime.now(timezone.utc).isoformat())
        write_json(identity_path,identity)
        write_json(meta_dir/'run_summary.json',summary)
    if args.smoke:
        root = AI_ROOT/'artifacts/reports/w3_runner_smoke'
        root.mkdir(parents=True,exist_ok=True)
        # Aggregate engineering evidence only; no model metrics/logits/raw records.
        write_json(root/'smoke_summary.json',summary)
    sys.stdout.reconfigure(encoding='utf-8')
    print(json.dumps(summary,ensure_ascii=False,indent=2))


if __name__ == '__main__':
    main()
