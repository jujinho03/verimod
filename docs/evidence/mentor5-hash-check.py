"""Read-only checks for the published W4 files; never opens the private database.

The independent JSON serializer is restricted to this ASCII-key, safe-integer
fixture, and is not a replacement for the production canonicalizer.
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
W4 = ROOT / 'docs/handoffs/w4-anchored-epoch-public/20261020-r01'
PUBLIC = ROOT / 'public/evidence'
MODEL = '0x96b337807aa81ebac6acc3997586cbd351cbfa5c9c44028d479cab327ad0b7c1'
POLICY = '0xa4559132db0d048483c43b258d189027b5de59067ae0b0f4365da2b222299a1e'
FILES = ['a389ec1547f76124b136e5648e9d906e5a22eb3099deff8b4a733f2c03282f72',
         '826a0af4030a9c525c015fd719ea117ecb2c4eb5467976ac88b0b921dee0cbb0']


def require(condition, message):
    # Do not use assert for evidence checks: Python -O disables assertions.
    if not condition:
        raise ValueError(message)


def canonical(value):
    if isinstance(value, dict):
        require(all(isinstance(k, str) and k.isascii() for k in value), 'non-ASCII or non-string fixture key')
        for item in value.values(): canonical(item)
    elif isinstance(value, list):
        for item in value: canonical(item)
    elif isinstance(value, int) and not isinstance(value, bool):
        require(abs(value) <= 9007199254740991, 'fixture integer exceeds safe range')
    elif not (value is None or isinstance(value, (str, bool))):
        raise ValueError('unsupported fixture value')
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode('utf-8')


def digest(domain, value):
    return '0x' + hashlib.sha256(domain.encode() + b'\0' + canonical(value)).hexdigest()


def compare(w4_pair, current_pair):
    if current_pair is None or any(x is None for x in current_pair):
        return 'NOT_VERIFIED'
    return 'MATCH' if w4_pair == current_pair else 'MISMATCH'


def read(path): return json.loads(path.read_text(encoding='utf-8'))


def main():
    model = read(ROOT / 'backend/config/w4-r01.model_manifest.json')
    policy = read(ROOT / 'backend/config/w4-provisional.policy_manifest.json')
    require(digest('verimod:model:v1', model) == MODEL, 'model manifest hash mismatch')
    require(digest('verimod:policy:v1', policy) == POLICY, 'policy manifest hash mismatch')
    pair = (MODEL, POLICY)
    for i in range(2):
        path = W4 / f'receipt-{i}.bundle.json'
        original = path.read_bytes()
        require(hashlib.sha256(original).hexdigest() == FILES[i], f'W4 receipt-{i} file digest mismatch')
        bundle = read(path)
        body = bundle['receipt_body']
        require(digest('verimod:receipt:v1', body) == bundle['receipt_hash'], f'W4 receipt-{i} body hash mismatch')
        require((body['payload']['inference']['model_manifest_hash'],
                 body['payload']['policy']['policy_manifest_hash']) == pair, f'W4 receipt-{i} manifest hash mismatch')
        copy = PUBLIC / path.name
        try:
            copied = copy.read_bytes()
        except FileNotFoundError as exc:
            raise ValueError(f'Redesign public receipt-{i} copy missing') from exc
        require(copied == original, f'Redesign public receipt-{i} copy bytes differ from W4 original')
    require(compare(pair, pair) == 'MATCH', 'match comparison failed')
    require(compare(pair, (MODEL, '0x' + '00' * 32)) == 'MISMATCH', 'mismatch comparison failed')
    require(compare(pair, None) == 'NOT_VERIFIED', 'missing comparison failed')
    require(compare(pair, (MODEL, None)) == 'NOT_VERIFIED', 'partial comparison failed')
    print('PASS: manifest hashes, W4 file digests, W4 receipt hashes, public copies byte-identical, match/mismatch/missing')
    print('W7 LIVE actual receipt: NOT_VERIFIED (not supplied to this check)')


if __name__ == '__main__': main()
