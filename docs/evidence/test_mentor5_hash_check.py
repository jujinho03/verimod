"""Exercise the public W4 evidence check on isolated fixture copies only."""
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPT = Path('docs/evidence/mentor5-hash-check.py')
W4 = Path('docs/handoffs/w4-anchored-epoch-public/20261020-r01')
PUBLIC = Path('public/evidence')
FILES = [
    SCRIPT,
    Path('backend/config/w4-r01.model_manifest.json'),
    Path('backend/config/w4-provisional.policy_manifest.json'),
    *(directory / f'receipt-{i}.bundle.json' for directory in (W4, PUBLIC) for i in range(2)),
]


class EvidenceCheckTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='verimod-w4-check-')
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        for path in FILES:
            target = self.root / path
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / path, target)

    def run_check(self, *flags):
        return subprocess.run(
            [sys.executable, '-B', *flags, str(self.root / SCRIPT)],
            capture_output=True, text=True, check=False,
        )

    def test_originals_and_byte_identical_copies_pass(self):
        result = self.run_check()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('W7 LIVE actual receipt: NOT_VERIFIED', result.stdout)

    def test_changed_public_copy_fails_even_if_json_still_parses(self):
        path = self.root / PUBLIC / 'receipt-0.bundle.json'
        path.write_bytes(path.read_bytes() + b'\n')
        self.assertNotEqual(self.run_check().returncode, 0)

    def test_missing_public_copy_fails(self):
        (self.root / PUBLIC / 'receipt-1.bundle.json').unlink()
        self.assertNotEqual(self.run_check().returncode, 0)

    def test_changing_both_copies_does_not_bypass_original_digest(self):
        for directory in (W4, PUBLIC):
            path = self.root / directory / 'receipt-0.bundle.json'
            path.write_bytes(path.read_bytes() + b'\n')
        self.assertNotEqual(self.run_check().returncode, 0)

    def test_optimized_python_still_checks_public_copy(self):
        result = self.run_check('-O')
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        path = self.root / PUBLIC / 'receipt-0.bundle.json'
        path.write_bytes(path.read_bytes() + b'\n')
        self.assertNotEqual(self.run_check('-O').returncode, 0)


if __name__ == '__main__':
    unittest.main()
