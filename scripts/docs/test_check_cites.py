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
        self.assertIn('not in the tree', problems[0][1])

    def test_range_outside_the_file_fails(self):
        doc = self.doc('| `beta` | `src/a.ts:40-44` |\n')
        self.assertIn('outside the file', check_file(doc, self.root)[0][1])

    def test_identifier_not_on_the_cited_lines_fails(self):
        doc = self.doc('| `gamma` | `src/a.ts:1` |\n')
        self.assertIn('none of gamma appears', check_file(doc, self.root)[0][1])

    def test_identifier_in_the_enclosing_block_passes(self):
        doc = self.doc('| `beta` | `src/a.ts:3` (`beta`) |\n')
        self.assertEqual(check_file(doc, self.root), [])

    def test_identifier_far_above_the_cited_lines_fails(self):
        filler = ''.join(f'const pad{i} = {i};\n' for i in range(60))
        sha = make_repo(self.root, {'src/far.ts': 'export function gamma() {}\n' + filler})
        doc = self.doc('| `gamma` | `src/far.ts:61` |\n', ref=sha)
        self.assertIn('none of gamma appears', check_file(doc, self.root)[0][1])

    def test_relative_cite_uses_last_path_in_the_row(self):
        doc = self.doc('| `beta` | `src/a.ts:2` and `:3` (`alpha`) |\n')
        self.assertEqual(check_file(doc, self.root), [])
        doc = self.doc('| `beta` | `src/a.ts:2` and `:9` (`beta`) |\n')
        self.assertIn('outside the file', check_file(doc, self.root)[0][1])

    def test_relative_cite_uses_the_nearest_earlier_path(self):
        pathlib.Path(self.root, 'src', 'short.ts').write_text('export const x = 1;\n', encoding='utf-8')
        subprocess.run(GIT + ['add', '.'], cwd=self.root, check=True)
        subprocess.run(GIT + ['commit', '-q', '-m', 'short file'], cwd=self.root, check=True)
        head = subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=self.root, check=True, capture_output=True, text=True).stdout.strip()
        doc = self.doc('| `beta` | `src/a.ts:2` and `:4`; `src/short.ts:1` |\n', ref=head)
        self.assertEqual(check_file(doc, self.root), [])

    def test_span_with_several_ranges_checks_each_range(self):
        doc = self.doc('| `beta` | `src/a.ts:1, 2-3` (`beta`) |\n')
        self.assertEqual(check_file(doc, self.root), [])
        doc = self.doc('| `beta` | `src/a.ts:2, 40-44` |\n')
        problems = check_file(doc, self.root)
        self.assertEqual(len(problems), 1)
        self.assertIn('src/a.ts:40-44 is outside the file', problems[0][1])

    def test_relative_cite_after_a_span_with_several_ranges(self):
        doc = self.doc('| `beta` | `src/a.ts:1, 3` and `:2` |\n')
        self.assertEqual(check_file(doc, self.root), [])

    def test_relative_cite_without_an_earlier_path_fails(self):
        doc = self.doc('| `beta` | `:3` |\n')
        self.assertIn('no earlier file', check_file(doc, self.root)[0][1])

    def test_explicit_commit_overrides_the_header(self):
        first = self.sha
        subprocess.run(GIT + ['commit', '-q', '--allow-empty', '-m', 'second'], cwd=self.root, check=True)
        doc = self.doc('| `beta` | `src/a.ts:2@' + first + '` (`beta`) |\n', ref='0000000')
        self.assertEqual(check_file(doc, self.root), [])

    def test_bare_file_name_resolves_when_unique(self):
        doc = self.doc('| `beta` | `a.ts:2` (`beta`) |\n')
        self.assertEqual(check_file(doc, self.root), [])

    def test_ambiguous_bare_file_name_fails(self):
        pathlib.Path(self.root, 'lib').mkdir()
        pathlib.Path(self.root, 'lib', 'a.ts').write_text(SOURCE, encoding='utf-8')
        subprocess.run(GIT + ['add', '.'], cwd=self.root, check=True)
        subprocess.run(GIT + ['commit', '-q', '-m', 'second file with the same name'], cwd=self.root, check=True)
        head = subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=self.root, check=True, capture_output=True, text=True).stdout.strip()
        doc = self.doc('| `beta` | `a.ts:2` (`beta`) |\n', ref=head)
        self.assertIn('matches 2 files', check_file(doc, self.root)[0][1])

    def test_missing_header_fails(self):
        doc = self.doc('| `beta` | `src/a.ts:2` |\n', ref='none')
        self.assertEqual(check_file(doc, self.root), [(0, 'missing <!-- cite-ref: <sha> --> header')])


if __name__ == '__main__':
    unittest.main()
