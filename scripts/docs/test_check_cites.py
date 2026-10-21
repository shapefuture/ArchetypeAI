import os
import pathlib
import subprocess
import tempfile
import unittest

from check_cites import check_file

GIT = ['git', '-c', 'user.name=test', '-c', 'user.email=test@example.invalid']


def make_repo(root, files):
    """Create a repository with the given files committed; return the commit sha."""
    subprocess.run(['git', 'init', '-q'], cwd=root, check=True)
    for name, text in files.items():
        target = pathlib.Path(root, name)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding='utf-8')
    subprocess.run(GIT + ['add', '.'], cwd=root, check=True)
    subprocess.run(GIT + ['commit', '-q', '-m', 'fixture'], cwd=root, check=True)
    return subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=root, check=True, capture_output=True, text=True).stdout.strip()


SOURCE = 'export const alpha = 1;\nexport function beta() {\n  return alpha;\n}\n'


class CheckCitesTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = self.tmp.name
        self.sha = make_repo(self.root, {'src/a.ts': SOURCE})

    def tearDown(self):
        self.tmp.cleanup()

    def doc(self, body, ref=None):
        header = f'<!-- cite-ref: {ref or self.sha} -->\n' if ref != 'none' else ''
        path = pathlib.Path(self.root, 'doc.md')
        path.write_text(header + body, encoding='utf-8')
        return str(path)

    def test_cite_with_identifier_on_the_line_passes(self):
        doc = self.doc('| `beta` | `src/a.ts:2` (`beta`) |\n')
        self.assertEqual(check_file(doc, self.root), [])

    def test_missing_path_at_the_commit_fails(self):
        doc = self.doc('| `beta` | `src/missing.ts:2` (`beta`) |\n')
        problems = check_file(doc, self.root)
        self.assertEqual(len(problems), 1)
        self.assertIn('does not exist', problems[0][1])

    def test_range_outside_the_file_fails(self):
        doc = self.doc('| `beta` | `src/a.ts:40-44` |\n')
        self.assertIn('outside the file', check_file(doc, self.root)[0][1])

    def test_identifier_not_on_the_cited_lines_fails(self):
        doc = self.doc('| `gamma` | `src/a.ts:1` |\n')
        self.assertIn('none of gamma appears', check_file(doc, self.root)[0][1])

    def test_relative_cite_uses_last_path_in_the_row(self):
        doc = self.doc('| `beta` | `src/a.ts:2` and `:3` (`alpha`) |\n')
        self.assertEqual(check_file(doc, self.root), [])
        doc = self.doc('| `beta` | `src/a.ts:2` and `:9` (`beta`) |\n')
        self.assertIn('outside the file', check_file(doc, self.root)[0][1])

    def test_relative_cite_without_an_earlier_path_fails(self):
        doc = self.doc('| `beta` | `:3` |\n')
        self.assertIn('no earlier path', check_file(doc, self.root)[0][1])

    def test_explicit_commit_overrides_the_header(self):
        first = self.sha
        subprocess.run(GIT + ['commit', '-q', '--allow-empty', '-m', 'second'], cwd=self.root, check=True)
        doc = self.doc('| `beta` | `src/a.ts:2@' + first + '` (`beta`) |\n', ref='0000000')
        self.assertEqual(check_file(doc, self.root), [])

    def test_missing_header_fails(self):
        doc = self.doc('| `beta` | `src/a.ts:2` |\n', ref='none')
        self.assertEqual(check_file(doc, self.root), [(0, 'missing <!-- cite-ref: <sha> --> header')])


if __name__ == '__main__':
    unittest.main()
