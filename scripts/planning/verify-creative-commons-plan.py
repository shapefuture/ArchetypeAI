#!/usr/bin/env python3
"""Read live Beads and verify the creative-commons specification without writes."""
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts/roadmap'))
from continuity import assess, load_scope, run_beads, validate_artifacts  # noqa: E402

plan = json.loads((ROOT / 'docs/plans/creative-commons-beads-plan.json').read_text())
ids = plan['beads_ids']
nodes = plan['graph']['nodes']
assert set(ids) == {n['key'] for n in nodes}, 'Incomplete or stale ID mapping'
assert len(set(ids.values())) == len(ids), 'Duplicate live IDs'
issues = run_beads(['list', '--all', '--limit', '0'])
ready = run_beads(['ready', '--limit', '0'])
scope = load_scope()
report = assess(scope, issues, ready)
validate_artifacts(scope, report)
rows = report['by_id']

for node in nodes:
    row = rows[ids[node['key']]]
    for planned, stored in [('title','title'),('type','issue_type'),('description','description'),('acceptance_criteria','acceptance_criteria')]:
        assert node[planned] == row[stored], f'{node["key"]}: drift in {stored}'
    assert node['metadata'] == row['metadata'], f'{node["key"]}: metadata drift'
    assert report['ownership'][row['id']] == 'ArchetypeAI-we2s', 'Detached extension record'
    for reused in node['metadata']['reuse_beads']:
        assert reused in rows, f'Missing reuse target {reused}'

expected = {(ids[e['from_key']], ids[e['to_key']] if 'to_key' in e else e['to_id'], e['type']) for e in plan['graph']['edges']}
expected |= {(ids[n['key']],ids[n['parent']],'parent-child') for n in nodes if n.get('parent')}
actual = {(i, e['depends_on_id'],e['type']) for i in ids.values() for e in rows[i].get('dependencies',[])}
assert actual == expected, f'Edge drift: missing {len(expected-actual)}, extra {len(actual-expected)}'
assert (ids['C01.2'],ids['C01.1'],'blocks') in actual
assert (ids['G03'],ids['G02'],'blocks') in actual
assert ids['D01'] in report['ready'], 'Reuse reconciliation should be ready'
assert ids['C01.2'] not in report['ready'], 'Implementation must wait for design and contracts'
assert ids['G02'] not in report['ready'], 'Acceptance must wait for genuine pilots'
assert len(plan['proposal_coverage']) == 66
for proposal in plan['proposal_coverage']:
    assert proposal['task_keys'] and set(proposal['task_keys']) <= set(ids)

print(json.dumps(dict(status='passed',mapped_records=len(ids),
    explicit_edges=len(plan['graph']['edges']),total_stored_edges=len(actual),
    covered_proposals=len(plan['proposal_coverage']),all_four_roots_accounted=True,
    dependency_orientation_verified=True,fields_and_metadata_match=True,
    ready_reconciliation=ids['D01'],world_root=ids['WORLD'],
    limitation='Local live tracker verification, not remote restore, feature implementation or empirical evidence'),indent=2))
