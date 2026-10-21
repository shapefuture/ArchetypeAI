#!/usr/bin/env python3
"""Check file:line citations in Markdown documents against git commits.

A document declares its default commit with a header line:

    <!-- cite-ref: <sha> -->

A citation is an inline code span such as `src/a.ts:12` or `src/a.ts:12-18`.
It may name its own commit with `@<sha>`, which overrides the header.
Inside a table row, a bare `:NN` cite refers to the last path cited in that row.

Checks, per citation:
- the path exists at the commit;
- the cited line range is inside the file;
- in a table row that names identifiers (backticked words), at least one of
  them appears as a whole word on the cited lines.

Usage: check_cites.py [--strict] [--cwd REPO] FILE...
Without --strict the script reports and exits 0, so it can run as an advisory step.
"""
import argparse
import re
import subprocess
import sys

HEADER = re.compile(r'<!--\s*cite-ref:\s*([0-9a-fA-F]{7,40})\s*-->')
PATH_CITE = re.compile(
    r'`(?P<path>(?:src|tests|scripts|firestore|worker|architecture|docs|\.github)[^`\s:@]*\.[A-Za-z]+)'
    r'(?::(?P<a>\d+)(?:-(?P<b>\d+))?)?(?:@(?P<ref>[0-9a-fA-F]{7,40}))?`')
REL_CITE = re.compile(r'`:(?P<a>\d+)(?:-(?P<b>\d+))?(?:@(?P<ref>[0-9a-fA-F]{7,40}))?`')
IDENTIFIER = re.compile(r'`([A-Za-z_][A-Za-z0-9_]{3,})`')


def git_lines(ref, path, cwd):
    """Return the lines of path at ref, or None when git cannot read it there."""
    result = subprocess.run(['git', 'show', f'{ref}:{path}'], cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        return None
    return result.stdout.split('\n')


def check_file(doc_path, cwd=None):
    """Return a list of (line number, message) problems for one document."""
    with open(doc_path, encoding='utf-8') as handle:
        lines = handle.read().split('\n')
    header = next((m.group(1) for line in lines if (m := HEADER.search(line))), None)
    problems = []
    if header is None:
        return [(0, 'missing <!-- cite-ref: <sha> --> header')]
    for number, line in enumerate(lines, 1):
        is_row = line.startswith('|')
        identifiers = {m.group(1) for m in IDENTIFIER.finditer(line)} if is_row else set()
        last_path = None
        for match in PATH_CITE.finditer(line):
            last_path = match.group('path')
            problems += _check_cite(number, match, match.group('path'), header, identifiers, cwd)
        if is_row:
            for match in REL_CITE.finditer(line):
                if last_path is None:
                    problems.append((number, f'relative cite {match.group(0)} has no earlier path in this row'))
                    continue
                problems += _check_cite(number, match, last_path, header, identifiers, cwd)
    return problems


def _check_cite(number, match, path, header, identifiers, cwd):
    ref = match.group('ref') or header
    lines = git_lines(ref, path, cwd)
    if lines is None:
        return [(number, f'{path} does not exist at {ref}')]
    if match.group('a') is None:
        return []
    low = int(match.group('a'))
    high = int(match.group('b') or match.group('a'))
    if low < 1 or high < low or high > len(lines):
        return [(number, f'{path}:{low}-{high} is outside the file at {ref} ({len(lines)} lines)')]
    if identifiers:
        window = '\n'.join(lines[low - 1:high])
        if not any(re.search(rf'(?<![A-Za-z0-9_]){re.escape(name)}(?![A-Za-z0-9_])', window) for name in identifiers):
            names = ', '.join(sorted(identifiers))
            return [(number, f'none of {names} appears on {path}:{low}-{high} at {ref}')]
    return []


def main(argv):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--strict', action='store_true', help='exit 1 when any citation fails')
    parser.add_argument('--cwd', default=None, help='repository to read commits from (default: current directory)')
    parser.add_argument('files', nargs='+')
    args = parser.parse_args(argv)
    failures = 0
    for doc in args.files:
        for number, message in check_file(doc, args.cwd):
            failures += 1
            print(f'FAIL {doc}:{number}: {message}')
    print(f'{failures} citation problem(s) in {len(args.files)} file(s)')
    return 1 if args.strict and failures else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
