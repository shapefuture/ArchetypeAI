#!/usr/bin/env python3
"""Run Beads push with an API transport for refs/dolt/data only.

For environments where GitHub API writes work but Git receive-pack returns 401.
Preserves each transport commit exactly, including Dolt's final manifest update.
Credentials come only from GH_TOKEN; no JSONL import or force update is used.
"""
import base64
import datetime
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request


def proxy(args):
    real_git = os.environ['BEADS_API_REAL_GIT']
    if 'push' not in args:
        os.execv(real_git, [real_git, *args])
    position = args.index('push')
    prefix, push_args = args[:position], args[position + 1:]
    specs = [a for a in push_args if a.endswith(':refs/dolt/data')]
    if len(specs) != 1:
        raise RuntimeError('Recovery allows only one refs/dolt/data push')
    spec = specs[0]
    other = [a for a in push_args if a != spec and not a.startswith('-')]
    if len(other) != 1:
        raise RuntimeError('Unexpected Git push arguments')

    def git(*command):
        return subprocess.check_output([real_git, *prefix, *command])

    remote = git('remote', 'get-url', other[0]).decode().strip()
    match = re.fullmatch(r'https://github\.com/([\w.-]+/[\w.-]+?)(?:\.git)?', remote)
    if not match:
        raise RuntimeError('Recovery requires an HTTPS GitHub remote without embedded credentials')
    repository = match[1]
    token = os.environ.get('GH_TOKEN')
    if not token:
        raise RuntimeError('Attach GH_TOKEN with repository contents write access')

    def api(method, endpoint, data=None):
        request = urllib.request.Request(
            f'https://api.github.com/repos/{repository}/git/{endpoint}',
            method=method,
            headers={'Authorization': f'Bearer {token}', 'Accept': 'application/vnd.github+json',
                     'Content-Type': 'application/json'},
            data=json.dumps(data).encode() if data is not None else None,
        )
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            raise RuntimeError(f'GitHub API {method} failed with HTTP {error.code}') from None

    source = spec.split(':')[0]
    if source.startswith('+'):
        raise RuntimeError('Forced refspecs are not allowed')
    commit = git('rev-parse', source).decode().strip()
    raw = git('cat-file', 'commit', commit)
    header, message = raw.split(b'\n\n', 1)
    fields = {}
    for line in header.decode().splitlines():
        key, value = line.split(' ', 1)
        fields.setdefault(key, []).append(value)
    if set(fields) != {'tree', 'parent', 'author', 'committer'} or len(fields['parent']) != 1:
        raise RuntimeError('Unexpected transport commit headers or parents')
    parent, tree = fields['parent'][0], fields['tree'][0]
    current = api('GET', 'ref/dolt/data')['object']['sha']
    if current == commit:
        return
    if current != parent:
        raise RuntimeError('Remote advanced: run bd dolt pull before retrying')
    elements = []
    changes = git('diff-tree', '--no-commit-id', '--name-status', '-r', parent, commit).decode().splitlines()
    for change in changes:
        status, path = change.split('\t')
        if status not in ('A', 'M') or not re.fullmatch(r'(manifest|[0-9a-v]{32}(?:\.darc)?)', path):
            raise RuntimeError('Unexpected transport path or deletion')
        content = git('show', f'{commit}:{path}')
        sha = git('rev-parse', f'{commit}:{path}').decode().strip()
        uploaded = api('POST', 'blobs', {'content': base64.b64encode(content).decode(), 'encoding': 'base64'})
        if uploaded['sha'] != sha:
            raise RuntimeError('Transport blob mismatch')
        elements.append({'path': path, 'mode': '100644', 'type': 'blob', 'sha': sha})
    base = api('GET', f'commits/{parent}')['tree']['sha']
    if api('POST', 'trees', {'base_tree': base, 'tree': elements})['sha'] != tree:
        raise RuntimeError('Transport tree mismatch')

    def identity(value):
        match = re.fullmatch(r'(.*) <([^<>]+)> (\d+) ([+-]\d{4})', value)
        if not match:
            raise RuntimeError('Unexpected transport author format')
        name, email, timestamp, offset = match.groups()
        minutes = int(offset[1:3]) * 60 + int(offset[3:])
        timezone = datetime.timezone(datetime.timedelta(minutes=minutes * (1 if offset[0] == '+' else -1)))
        date = datetime.datetime.fromtimestamp(int(timestamp), timezone).isoformat()
        return {'name': name, 'email': email, 'date': date}

    created = api('POST', 'commits', {'message': message.decode(), 'tree': tree, 'parents': [parent],
                  'author': identity(fields['author'][0]), 'committer': identity(fields['committer'][0])})
    if created['sha'] != commit:
        raise RuntimeError('Transport commit mismatch; remote was not changed')
    if api('GET', 'ref/dolt/data')['object']['sha'] != parent:
        raise RuntimeError('Remote advanced during upload; pull before retrying')
    updated = api('PATCH', 'refs/dolt/data', {'sha': commit, 'force': False})
    if updated['object']['sha'] != commit:
        raise RuntimeError('Transport ref mismatch')
    print(f'Published verified Beads transport commit {commit}', file=sys.stderr)


def main():
    if sys.argv[1:2] == ['--git-proxy']:
        proxy(sys.argv[2:])
        return
    if len(sys.argv) != 1:
        raise RuntimeError('Usage: python3 scripts/beads-github-api-push.py')
    if not os.environ.get('GH_TOKEN'):
        raise RuntimeError('GH_TOKEN is required; never put the token on the command line')
    real_git = shutil.which('git')
    if not real_git:
        raise RuntimeError('Git is required')
    with tempfile.TemporaryDirectory(prefix='beads-api-transport-') as directory:
        shim = Path(directory) / 'git'
        import shlex
        shim.write_text(f'#!/bin/sh\nexec {shlex.quote(sys.executable)} {shlex.quote(str(Path(__file__).resolve()))} --git-proxy "$@"\n')
        shim.chmod(0o700)
        env = os.environ.copy()
        env['BEADS_API_REAL_GIT'] = real_git
        env['PATH'] = directory + os.pathsep + env['PATH']
        env['GIT_TERMINAL_PROMPT'] = '0'
        raise SystemExit(subprocess.call(['bd', 'dolt', 'push'], env=env))


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, subprocess.CalledProcessError, urllib.error.URLError) as error:
        print(f'Beads API recovery stopped: {error}', file=sys.stderr)
        raise SystemExit(1)
