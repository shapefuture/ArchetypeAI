"""Pin check for the AAA v7.1 draft source snapshot (ArchetypeAI-9ulr, A01.01).

Standard library only. Run from the repository root with:

    python3 -I -m unittest discover -s tests/architecture/a01 -p 'test_*.py'
"""
import hashlib
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SOURCE = REPO_ROOT / "docs" / "plans" / "references" / "AAA-V7-SPEC.source.md"
ARTIFACT = REPO_ROOT / "architecture" / "a01" / "a01-01-aaa-source-pin.md"
PINNED_SHA256 = "e85d85f962c8da8ed110122b4fa236f934b16cdbbc9108f80ca2f32b50be75dc"


class PinMismatch(AssertionError):
    """Raised when a file's SHA-256 differs from the expected pin."""


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def check_pin(path, expected):
    actual = sha256_file(path)
    if actual != expected:
        raise PinMismatch(f"{path}: sha256 {actual} != pinned {expected}")
    return actual


class SourcePinTests(unittest.TestCase):
    def test_source_snapshot_matches_pinned_digest(self):
        self.assertTrue(SOURCE.is_file(), f"missing source snapshot: {SOURCE}")
        self.assertEqual(check_pin(SOURCE, PINNED_SHA256), PINNED_SHA256)

    def test_pin_artifact_exists_and_records_the_same_digest(self):
        self.assertTrue(ARTIFACT.is_file(), f"missing artifact: {ARTIFACT}")
        self.assertIn(PINNED_SHA256, ARTIFACT.read_text(encoding="utf-8"))

    def test_wrong_digest_is_reported_as_mismatch(self):
        # Deliberately wrong: the pinned digest with its final hex digit changed.
        wrong = PINNED_SHA256[:-1] + ("1" if PINNED_SHA256[-1] != "1" else "2")
        self.assertNotEqual(wrong, PINNED_SHA256)
        with self.assertRaises(PinMismatch):
            check_pin(SOURCE, wrong)


if __name__ == "__main__":
    unittest.main()
