"""Tests for restore-beads.sh.

A stand-in bd replaces the real one, so these tests need no network and no Dolt database. The stand-in does
what the script relies on: bootstrap copies refs/dolt/data from the sync remote in the config it is given, and
stats reports whether that copy is present.
"""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / 'restore-beads.sh'
IDENTITY = {
    'GIT_AUTHOR_NAME': 'test', 'GIT_AUTHOR_EMAIL': 'test@localhost',
    'GIT_COMMITTER_NAME': 'test', 'GIT_COMMITTER_EMAIL': 'test@localhost',
}
# The decoy comment must be ignored: only the remote under `sync:` is the sync remote.
CONFIG = '''# Beads Configuration File
# remote: "git+https://github.com/example/decoy.git"

sync:
    remote: "{remote}"
'''
FAKE_BD = '''#!{python}
import os
import subprocess
import sys

beads = os.environ["BEADS_DIR"]
command = sys.argv[1] if len(sys.argv) > 1 else ""
if command == "bootstrap":
    remote = ""
    for line in open(os.path.join(beads, "config.yaml")):
        if line.strip().startswith("remote:"):
            remote = line.split(":", 1)[1].strip().strip('"')
    if not remote.startswith("git+file://"):
        sys.exit("fake bd: sync remote is not a local git+file URL: " + remote)
    listing = subprocess.run(
        ["git", "ls-remote", remote[len("git+file://"):], "refs/dolt/data"],
        capture_output=True, text=True, check=True,
    ).stdout.split()
    if not listing:
        sys.exit("fake bd: sync remote has no refs/dolt/data")
    os.makedirs(os.path.join(beads, "embeddeddolt"))
    with open(os.path.join(beads, "embeddeddolt", "ref"), "w") as ref:
        ref.write(listing[0] + "\\n")
elif command == "stats":
    restored = os.path.exists(os.path.join(beads, "embeddeddolt", "ref"))
    print("Total Issues:", 2 if restored else 0)
else:
    sys.exit("fake bd: unexpected command " + repr(command))
'''


def git(*args, cwd, identity=False):
    env = {**os.environ, **IDENTITY} if identity else None
    result = subprocess.run(['git', *args], cwd=cwd, env=env, capture_output=True, text=True, check=True)
    return result.stdout.strip()


def bare_repo(root, name):
    path = root / name
    git('init', '-q', '--bare', str(path), cwd=root)
    return path


def publish(bare, message):
    """Point refs/dolt/data in a bare repository at a new commit, and return that commit."""
    tree = git('hash-object', '-t', 'tree', '-w', '/dev/null', cwd=bare)
    commit = git('commit-tree', tree, '-m', message, cwd=bare, identity=True)
    git('update-ref', 'refs/dolt/data', commit, cwd=bare)
    return commit


class RestoreBeadsTest(unittest.TestCase):
    def setUp(self):
        self.root = Path(tempfile.mkdtemp(prefix='restore-beads-'))
        self.addCleanup(shutil.rmtree, self.root, ignore_errors=True)
        self.tracker = bare_repo(self.root, 'tracker.git')
        self.commit = publish(self.tracker, 'tracker data')

        # origin is a real remote without refs/dolt/data, as on GitHub. A restore that reads origin fails.
        self.repo = self.root / 'repo'
        git('init', '-q', str(self.repo), cwd=self.root)
        git('remote', 'add', 'origin', str(bare_repo(self.root, 'origin.git')), cwd=self.repo)
        self.script = self.repo / 'scripts' / 'roadmap' / 'restore-beads.sh'
        self.script.parent.mkdir(parents=True)
        shutil.copy(SCRIPT, self.script)
        beads = self.repo / '.beads'
        beads.mkdir()
        (beads / 'metadata.json').write_text('{"database": "dolt"}\n')
        self.set_sync_remote(f'git+file://{self.tracker}')

        self.bin = self.root / 'bin'
        self.bin.mkdir()
        fake = self.bin / 'bd'
        fake.write_text(FAKE_BD.replace('{python}', sys.executable))
        fake.chmod(0o755)

    def set_sync_remote(self, url):
        (self.repo / '.beads' / 'config.yaml').write_text(CONFIG.format(remote=url))

    def run_restore(self):
        env = {key: value for key, value in os.environ.items() if key != 'BEADS_DIR'}
        env['BEADS_BIN'] = str(self.bin / 'bd')
        return subprocess.run(['bash', str(self.script)], cwd=self.repo, env=env, capture_output=True, text=True)

    def restored_ref(self):
        return (self.repo / '.beads' / 'embeddeddolt' / 'ref').read_text().strip()

    def test_restores_from_the_sync_remote_named_in_config(self):
        result = self.run_restore()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(f'restored 2 issues from refs/dolt/data {self.commit[:7]}', result.stdout)
        self.assertEqual(self.restored_ref(), self.commit)
        # The restore reads a private copy, so this repository gets no refs of its own.
        self.assertEqual(git('for-each-ref', cwd=self.repo), '')

    def test_leaves_an_existing_database_alone(self):
        self.assertEqual(self.run_restore().returncode, 0)
        newer = publish(self.tracker, 'newer tracker data')
        self.assertNotEqual(newer, self.commit)
        result = self.run_restore()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.restored_ref(), self.commit)

    def test_names_the_missing_sync_remote_and_writes_nothing(self):
        (self.repo / '.beads' / 'config.yaml').write_text(
            '# Beads Configuration File\n# remote: "git+https://github.com/example/decoy.git"\n')
        result = self.run_restore()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('sync.remote', result.stderr)
        self.assertFalse((self.repo / '.beads' / 'embeddeddolt').exists())

    def test_fails_without_writing_when_the_remote_has_no_data_ref(self):
        self.set_sync_remote(f'git+file://{bare_repo(self.root, "empty.git")}')
        result = self.run_restore()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('refs/dolt/data', result.stderr)
        self.assertFalse((self.repo / '.beads' / 'embeddeddolt').exists())


if __name__ == '__main__':
    unittest.main()
