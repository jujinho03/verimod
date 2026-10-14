"""Start AI-09 locally; datasets are not an inference dependency."""
import argparse
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'ai/src'))


def deny_dataset_access(event, values):
    if event in ('open', 'os.listdir', 'os.scandir') and values:
        path = str(values[0]).lower().replace('\\', '/')
        if 'verimod-local-data' in path or '/ai/data/' in path:
            raise PermissionError('AI-09 server cannot access datasets')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=8099)
    args = parser.parse_args()
    sys.addaudithook(deny_dataset_access)
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['TRANSFORMERS_OFFLINE'] = '1'
    import uvicorn
    uvicorn.run('verimod_ai.inference.service:create_app', factory=True,
                host=args.host, port=args.port, workers=1, access_log=False)
