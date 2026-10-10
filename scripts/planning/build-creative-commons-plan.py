#!/usr/bin/env python3
"""Build the additive creative-commons specification; never mutate Beads here."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/plans/creative-commons-beads-plan.json'
BASE = json.loads((ROOT / 'docs/plans/social-creative-practice-beads-plan.json').read_text())
IDS = BASE['beads_ids']
CONTROL = 'ArchetypeAI-we2s.1'

# Each row names a reusable foundation and four distinct, reviewable deliverables.
# These are extensions to existing capabilities, not a duplicate social platform.
STREAMS = [
 ('C01', 'Connected public threads', 'F01,F04,F15,B03,B04,B12', 'B03,B04', [
  ('Define thread formats and transitions', 'Specify question, poll, opinion, meme, resource, event, intro, WIP and collaboration schemas, browse/publish switching, cross-list references and stable IDs. Fixture: meme becomes poll then event without duplicate conversation.'),
  ('Persist audience-safe thread evolution', 'Implement versioned transitions, old-link resolution, audience previews, explicit consent to broaden visibility, revocation and notification deduplication. Reject an unauthorized format or audience change.'),
  ('Compose purposeful browsing and publishing', 'Ship content-type tabs plus intents laugh, think, meet, make and happening; preserve draft and audience when switching; provide low-density text navigation and no infinite-scroll obligation.'),
  ('Verify thread outcomes and history', 'Exercise accepted insights, annotated resources, decided polls and event artifacts; preserve provenance and corrected history, delete revoked content, and test block/report across every format.')]),
 ('C02', 'Living places and temporary camps', 'F02,F24,F26,F45,B03,B11', 'B03,B11', [
  ('Specify place ownership and lifecycle', 'Distinguish revisitable workshops, meme theater, question garden, library, intro porch and quiet studios from temporary camps; define host scope, opening hours, capacity, accessibility and closing policy.'),
  ('Persist places without false presence', 'Implement membership, artifact-derived place history, host succession, finite camp expiry and public/private presence controls; never imply a person is present from stale activity.'),
  ('Build equivalent world views', 'Provide illustrated/spatial and calm text views with equal actions and discoverability; control motion, sound, density and visibility independently; navigation must work with keyboard and screen reader.'),
  ('Verify revisits and camp closure', 'Test empty, crowded, closed and host-absent places, museum-of-mistakes and fictional-weather camps; selective archiving preserves permissions and quiet users can leave without penalty.')]),
 ('C03', 'Arrival and satisfying visit arcs', 'F19,F20,F28,F32,F37', 'B01,B05', [
  ('Define intention and capacity entry', 'Make time, energy and intent optional self-report; no diagnosis or mood inference. Map a two-minute tired visit and a longer making visit to useful routes without an assessment.'),
  ('Implement bounded visit routing', 'Offer arrival, encounter, small creation and closure with fallback solo value; do not promise a match or fill empty places with fake activity.'),
  ('Build gentle closure and return', 'End with chosen artifact, next step or meaningful memory, dismissible recap and notification budget; retain bookmarks after an interrupted or quiet exit.'),
  ('Verify attention-respecting behavior', 'Exercise zero-time, declined questions, offline/retry and notification-off states; prove there is no required streak, artificial urgency or endless feed to finish a visit.')]),
 ('C04', 'Explainable serendipity', 'F05,F06,F07,F22,F23,F28,B02', 'B01,B02,B03', [
  ('Define consented discovery inputs', 'Use chosen public interests, pace, availability and purpose; explain one affinity, one difference and one possible action. Exclude private assessment, therapist, journal and plural-profile inference.'),
  ('Implement surprise and correction controls', 'Build familiar, adjacent and unexpected modes, explicit feedback, reset and per-purpose eligibility; delayed replies are not dislike. Apply blocks, age boundaries and revocation before ranking.'),
  ('Offer complementary micro-introductions', 'Explain why a maker/editor or poet/sound artist might try a five-minute shared action; support decline, no-DM public continuation and sparse-network alternatives.'),
  ('Audit diversity and usefulness', 'Compare simple consented-interest baseline to discovery candidate; inspect repeated exposure, popularity bias, unequal visibility, inappropriate suggestions and correction effectiveness without claiming personality compatibility.')]),
 ('C05', 'Expressive intros and chosen facets', 'F22,F27,F31,F33,F36,B01,B07', 'B01,B03,B07', [
  ('Specify authored intros and facet boundaries', 'Support rabbit holes, teach-in-ten-minutes, abandoned projects, odd loves and Ask Me About; distinguish chosen pseudonymous facets from diagnosis, fictional role and plural identity.'),
  ('Persist deliberate audience linkage', 'Make facet selection and linking explicit; define account-level moderation/block authority without publicly linking pseudonyms; deny access to private authored material.'),
  ('Build expressive and low-word intros', 'Offer text/collage/voice alternatives, editable availability and reply expectations; previews show exactly which facet and fields recipients will see.'),
  ('Verify context changes and unlinking', 'Test public contribution to private circle transitions, outdated intro correction, unlinking, blocked viewers and export/deletion; no generated identity voice or inferred identity appears.')]),
 ('C06', 'Reception modes and social comfort', 'F13,F22,F25,F26,F27,F32,F55', 'B01,B03,B04', [
  ('Define item-level reception contracts', 'Choose celebrate, witness, questions, develop, challenge or remix; encode permitted actions separately from audience visibility and make changing expectations explicit.'),
  ('Enforce response and exit preferences', 'Validate reply/remix scope; support slow replies, clear declines, private reminders, quiet observation, overwhelm break and reversible return without social debt.'),
  ('Build predictable participation previews', 'Show camera/speaking expectations, duration, preparation, sensory conditions, text/async alternative, quiet buddy and easy exit before joining.'),
  ('Verify nonjudgmental boundaries', 'Test unsolicited critique, revoked remix permission, ignored reply, quiet participation and re-entry; blocking/reporting remains available and no safety preference exposes a diagnosis.')]),
 ('C07', 'Half-creations and remix lineage', 'F15,F24,F30,F31,F38,B04,B07', 'B03,B04,B07', [
  ('Define collaborative artifact rights', 'Model initiator, contributor, remixer, versions, branches, credit, license, paid/unpaid expectations and withdrawal; fixture: miniature city needs a sentence then soundscape.'),
  ('Persist permissioned artifact lineage', 'Implement invitation, fork and contribution acceptance with concurrent edits and provenance; a poem-to-sound-to-animation chain resolves original credits and license incompatibility.'),
  ('Build inviting unfinished-work flows', 'Publish purposeful gaps, small offered contributions, preview/accept/reject and branch comparison; text-equivalent placeholders work while billing-dependent media storage is unavailable.'),
  ('Verify rights and failure recovery', 'Test rejected changes, competing branches, creator exit, revocation, disputed credit, deletion and derivative retention; make limits visible instead of promising impossible removal from external copies.')]),
 ('C08', 'Cross-circle expeditions', 'F07,F23,F24,F42,F43,F46', 'B02,B03,B06', [
  ('Define bounded bridging expeditions', 'Design small consented visits between interest circles: inquire, contrast, collect, return with an artifact; scope guide authority, accessibility, time and permission to quote.'),
  ('Implement expedition states and roles', 'Persist invite, opt-in, role choice, check-in, return and closure; complementary roles instigator, maker, connector, editor, researcher and host are flexible, not personality labels.'),
  ('Build asynchronous cross-pollination', 'Offer short alternating creative turns, quiet roles, accessible summaries and no forced DM; fallback to existing community resources if another circle is unavailable.'),
  ('Verify benefit and respectful exchange', 'Test declined participation, missing guide, cultural disagreement, appropriation concerns and uncredited borrowing; assess useful new perspective without maximizing outsider traffic.')]),
 ('C09', 'Collaboration marketplace and gift table', 'F09,F10,F15,F24,F54', 'B03,B04', [
  ('Define commitments and offering boundaries', 'Model collaboration cards with role, effort, availability, pay, ownership and outcome; separate five-minute feedback, quiet twenty-minute companionship, volunteer gifts and professional services.'),
  ('Implement mutual commitment states', 'Accept, scope, renegotiate, cancel and complete offers with recipient authority, expiry and limits; gifting creates no implicit debt, sales pitch or forced reciprocity.'),
  ('Build action-first discovery', 'Let people offer a skill, idea, question or quiet presence and find bounded complementary requests; expose unpaid/paid terms before contact and preserve refusal.'),
  ('Verify fairness and practical usefulness', 'Test oversubscribed requests, exploitative unpaid work, stale availability, cancellation and organizer overload; contextual thanks do not turn help into a global reputation score.')]),
 ('C10', 'Cooperative mysteries and creative games', 'F39,F42,F43,F44,F46,F47,B06', 'B03,B06', [
  ('Design accessible cooperative encounters', 'Specify a mystery with researcher, sketcher, storyteller and quiet observer routes; allow multiple answers, asynchronous play, clear end and no mandatory competitive scoreboard.'),
  ('Implement optional shared game state', 'Persist discoveries, retries and shared revelations without punishment for absence; deterministic fixtures handle one participant, dropout, late join and stalled clues.'),
  ('Build playful constraints and remix prompts', 'Ship changing member-remixed constraints, jokes and sensory-aware celebrations with content boundaries; laughter is opt-in and never targets vulnerability.'),
  ('Verify fun without compulsion', 'Exercise quiet completion, skipped celebration, alternative solution, timeout and restart; basic access remains open without playing and no public failure shame occurs.')]),
 ('C11', 'Constellation progression and shared unlocks', 'F16,F39,F40,F41,F45,F48,B06', 'B06', [
  ('Define evidence-based personal constellations', 'Nodes recognize making, welcoming, hosting, repair and useful cross-circle contribution; evidence can be private, self-chosen and corrected. No universal person score or diagnosis.'),
  ('Implement flexible cooperative progress', 'Support skill branches, build changes, rest, contribution withdrawal and shared artwork/tool unlocks; unequal capacity never causes guilt or locks basic participation.'),
  ('Present contextual achievements and stories', 'Offer creative-chemistry milestones for an actual artifact, renewed idea or inclusive gathering; show contribution context and optional celebration, not contact counts.'),
  ('Audit gaming and recognition equity', 'Test spam, self-dealing, invisible care, quiet contributors, mistaken credit and revoked evidence; ensure cosmetic unlocks do not become exclusionary status or mandatory streaks.')]),
 ('C12', 'Living resources and consequential questions', 'F01,F04,F15,F23,F53,B12', 'B03,B04,B12', [
  ('Define useful knowledge outcomes', 'Differentiate opinion, choose, change-my-mind, missing-perspective and version polls; resource annotations state when useful, limitations and actual application, with source/credit.'),
  ('Persist discussion-to-decision trails', 'Implement poll closure, reasons, decisions, accepted insight and corrected annotations without silently converting disagreement into consensus.'),
  ('Build curated deep-dive collections', 'Support obscure-interest collections, meme-to-inquiry links, request-a-resource and accessible summaries; no popularity-only sorting or fabricated source authority.'),
  ('Verify disagreement and source correction', 'Test disputed evidence, withdrawn annotation, misleading resource, harmful joke and reopened decision; credit persists appropriately while removed material loses visibility.')]),
 ('C13', 'Event seeds and co-organizing', 'F02,F09,F14,F24,F26,F54,F55', 'B03,B04,B11', [
  ('Define seed-to-gathering lifecycle', 'Move interest to feasible scheduling, role commitment and confirmed event; specify small, quiet, online and asynchronous formats, cancellation and timezone behavior.'),
  ('Implement organizer recipes and succession', 'Persist roles, preparation, accessibility, attendance limits, consented reminders and handover; never display unconfirmed interest as a booked event.'),
  ('Build welcoming event entry and closure', 'Expose first-timer preview, buddy option, host expectations and leave action; follow-up creates a permissioned artifact and optional continuation rather than group-chat obligation.'),
  ('Verify attendance and host workload', 'Test no-shows, host departure, abusive attendee, over-capacity, timezone shift and inaccessible venue; review actual attendance/helpfulness and care load separately.')]),
 ('C14', 'Temporary festivals and participatory rituals', 'F02,F15,F16,F24,F26,F48,F55', 'B03,B04,B11', [
  ('Design member-built festival boundaries', 'Offer unfinished-work fair, forgotten-projects museum, school of odd skills and seasonal closure; members choose gifts, exhibitions, quiet presence and whether to preserve or let go.'),
  ('Implement finite festival composition', 'Assemble approved places, event seeds and artifacts into a bounded program with host/care shifts, capacity, licenses and published closing time.'),
  ('Build generous participation rituals', 'Welcome newcomers and honor stopped projects without pressured disclosure, spiritual claims, pay-to-belong or reciprocity debt; equivalent async/text access is available.'),
  ('Verify festival closure and legacy', 'Test cancellation, quiet-only participation, unwanted archival, overworked hosts and a paused project return; retain only approved artifacts and attributable collective history.')]),
 ('C15', 'Relationship continuity without pressure', 'F03,F07,F08,F16,F25,F34,F35', 'B01,B03,B04,B10', [
  ('Specify chosen relationship distances', 'Distinguish familiar face, quiet buddy, collaborator, feedback friend and public follow; shared artifacts and next-encounter intentions require explicit reciprocal scope where appropriate.'),
  ('Persist controllable relationship memory', 'Store selected shared milestones and links with correction, export, unlink and deletion; no inferred emotional bond or hidden affinity score.'),
  ('Build gentle continuation invitations', 'Offer one bounded follow-up or keep-public option; show reply expectations and let either person decline or simply leave without debt.'),
  ('Verify asymmetric consent and changed context', 'Test one-sided unlink, blocks, obsolete commitment, facet changes and stale relationship recap; never pressure private messaging or reveal another person’s private notes.')]),
 ('C16', 'Care, moderation and optional repair', 'F13,F14,F26,F55,B03', 'B03', [
  ('Define accountable care roles', 'Specify trained host/moderator scope, response expectations, escalation, appeals, pseudonym accountability, adult-dating boundaries and unhosted-state limits; peer care is not clinical treatment.'),
  ('Implement safe community intervention', 'Integrate report, block, containment, evidence minimization, conflict-of-interest reassignment and appeal with access controls; no public victim disclosure or mandatory mediation.'),
  ('Build candid optional repair paths', 'Provide boundary-setting, clarified intent and chosen repair only when safe; preserve exit, non-response and separate care support; avoid coercive reconciliation rituals.'),
  ('Exercise abuse and care-capacity scenarios', 'Run tabletop targeted harassment, stalking across facets, hostile remix, brigading, facilitator misuse and host burnout; record response/recovery evidence and unresolved staffing gates.')]),
 ('C17', 'Participatory culture and co-evolution', 'F53,F55,B03,B12', 'B03,B12', [
  ('Define bounded governance experiments', 'Members propose culture questions and time-limited changes with impact, rollback, eligibility and decision authority; prohibit popularity vote overriding individual consent or safety.'),
  ('Persist proposals, decisions and revisions', 'Implement accessible deliberation, conflict declarations, decision logs and revision triggers; distinguish representative input from unanimous agreement.'),
  ('Build inclusive feedback and shared memory', 'Offer anonymous-to-publication feedback through accountable moderation, quiet input and artifact-based community history with corrections and permissioned visibility.'),
  ('Verify legitimacy and power distribution', 'Test capture by high-volume posters, excluded newcomers, moderator conflict and failed experiment; assess who benefits, who bears care work and how rollback restores rights.')]),
 ('C18', 'Transparent AI creative assistance', 'F15,F24,F31,F52,B04,B07', 'B03,B04,B07', [
  ('Define bounded opt-in AI roles', 'Default AI participation off; permit explicit per-action idea translation, cross-discipline prompts, event routing and consented discussion summaries. No simulated friends, identity voices or private-data discovery.'),
  ('Implement scoped AI request boundaries', 'Enforce allowed inputs, recipient consent, attribution, capability/budget limits and remove/disable paths; do not transmit private notes, assessment or therapist context.'),
  ('Build human-owned assistance previews', 'Show inputs, generated label, editable result and human publish decision; fallback manual templates if no model service is available within existing budget.'),
  ('Verify authorship and revocation', 'Test malicious public prompt, invented credit, summary disagreement, off-state, consent withdrawal and unavailable model; AI output never masquerades as a participant or community decision.')]),
 ('C19', 'Authored beauty and world performance', 'F28,F31,F45,F47,F48', 'B07', [
  ('Define shared visual grammar', 'Extend authored Felt/loading identity into plush places and artifact galleries; require licensing, consistent orientation and accessible text descriptions, without fake online crowds.'),
  ('Build bounded ambient composition', 'Use approved collective artifacts in modular world scenes with payload limits, reduced-motion/static versions and independent sound, motion, texture and density controls.'),
  ('Integrate sensory-equivalent presentation', 'Ensure text view has equal discovery, collaboration and return actions; preserve preferences across devices and do not hide safety controls behind spatial navigation.'),
  ('Measure real rendering and accessibility', 'Collect trace/payload budgets, keyboard/screen-reader checks and actual-device measurements for new views; retain existing phone report only as tested and fine, not new measured evidence.')]),
 ('C20', 'Concentrated cold start and healthy liquidity', 'F05,F07,F09,F23,F24,F26', 'B02,B03,B11', [
  ('Design a small useful launch cell', 'Pick one or two creative niches and bounded hosted windows with seed artifacts, real host capacity and clear empty states; no fabricated members, posts or activity.'),
  ('Implement sparse-community routing', 'Provide solo making, useful resources, scheduled encounters and consented invitations when matching is empty; bound requests and avoid repeatedly burdening the same helpers.'),
  ('Prepare authentic host and newcomer playbooks', 'Plan launch rituals, five-minute contributions, quiet pathways, co-organizing handoffs and opt-in invitations; external contact requires actual authorization and participants.'),
  ('Verify expansion decision policy before a real trial', 'Exercise useful encounter, failed-match and host-load fixtures against preregistered expand/iterate/pause rules; verify genuine observations remain pending for P07/G02 and are never replaced by fixture outcomes.')]),
 ('C21', 'Sustainable commons economics', 'F15,F54,F55', '', [
  ('Model costs and compensation fairly', 'Estimate moderation/hosting/tool costs and organizer effort; compare optional membership, paid workshops and creator tools while protecting free basic participation.'),
  ('Specify transparent commercial boundaries', 'Define paid versus gift offers, fees/refunds, organizer compensation and conflict disclosures; no sale of sensitive data, pay-to-belong pressure or covert sponsorship.'),
  ('Prototype budget-respecting sustainability', 'Implement only no-charge labels and transparent cost mockups initially; Spark quota planning excludes billing-dependent media storage and any new paid provider activation.'),
  ('Verify viability review and payment boundaries', 'Exercise cost, fairness, accessibility and free-participation scenarios; prepare a genuine consented viability protocol for P07/G02. No fixture establishes willingness to pay; live payment, billing or commercial commitments require separate concrete authorization.')]),
 ('C22', 'Benefit measurement and accountable learning', 'F16,F20,F53,F55', 'B03,B12', [
  ('Define observable benefit and harm measures', 'Operationalize useful artifacts, valued connections, felt welcome, capability growth, offline benefit and unequal care burden; distinguish self-report, behavior and inference, no therapy-efficacy claim.'),
  ('Implement minimized consented instrumentation', 'Track bounded funnel and optional follow-up with purposes, retention, withdrawal and research consent; avoid private message content, diagnostic inference and individual social scoring.'),
  ('Build pilot evidence and decision views', 'Compare meaningful outcomes, inappropriate suggestions, abandoned collabs, host load and quiet access with baselines; missing participants or follow-up remains visibly pending.'),
  ('Verify evidence-to-roadmap decision flow', 'Use explicitly synthetic findings to exercise adverse-outcome, uncertainty and accessibility review; link proposed changes to Beads and retain negative evidence. Genuine pilot findings and accept/iterate/pause decisions belong to P01–P09/G02, not this pre-pilot verification.')]),
]

FOUNDATIONS = [
 ('D01', 'Reconcile existing capabilities and freeze scope', 'Inspect F01–F55/B01–B12 live tasks and current implementation; publish reuse-versus-delta inventory, requirement coverage, deferred media limitations and no duplicate implementation decisions.'),
 ('D02', 'Publish creative-world extension contracts', 'Specify stable Thread/Place/Artifact/Reception/Visit references and versioned transitions against B01–B12; resolve field authority, deletion, consent, migration and read/write effects with registry review.'),
 ('D03', 'Prepare accessible author-owned fixture corpus', 'Create licensed text-first examples for all nine thread types, one miniature-city half-creation, a poem remix chain, sparse places, quiet attendance, disputes and withdrawn contributions; no copied private user data.'),
 ('D04', 'Prepare research consent and storage prerequisites', 'Reuse live research consent/access work; verify versioned study consent, withdrawal, bounded Firestore access/retention/deletion on Spark and recruitment materials before any collection. Do not invent sessions or enable Cloud Storage.'),
 ('D05', 'Resolve AAA workcells and safe sweep manifests', 'Pin immutable source and contract versions; declare exact disjoint writes, effects, resources, fixtures and leases for proposed social slots. One integrator owns app wiring, rules, locales, migrations and deployment.'),
 ('D06', 'Pre-register pilots and release thresholds', 'Specify realistic recruited audience, accessibility variants, outcome definitions, adverse-event limits, host capacity, stopping/rollback and pass/iterate/pause thresholds before seeing results. Store only minimized consented evidence.')]

PILOTS = [
 ('P01', 'Quiet newcomer to collaborative exhibition', ['C01','C03','C05','C06','C07','C19','C20'], 'A tired newcomer chooses two minutes, contributes one sentence to a miniature city, optionally meets a sound artist and later attends or asynchronously views an exhibition; record friction, consent and useful outcome.'),
 ('P02', 'Meme becomes consequential public collaboration', ['C01','C09','C12','C13'], 'A meme becomes a poll, accepted idea and confirmed small event; audience expansion is reviewed, credits survive and follow-up artifact is permissioned.'),
 ('P03', 'Cross-disciplinary remix expedition', ['C04','C07','C08','C15'], 'Consenting poet, sound artist and illustrator make branches and return an artifact; test declined match, role flexibility, credit, changed availability and relationship unlink.'),
 ('P04', 'Quiet asynchronous cooperative mystery', ['C06','C10','C11'], 'Solve through multiple roles and answers with no camera, quiet observer, dropout and late return; compare playfulness, agency and comprehension without forced streaks.'),
 ('P05', 'Member-built finite festival', ['C02','C09','C13','C14','C16','C19'], 'Run a small hosted odd-skills/unfinished-work program with quiet routes, host succession and deliberate closure; measure enjoyment, accessible participation and actual care burden.'),
 ('P06', 'Governance, credit conflict and repair tabletop', ['C01','C07','C16','C17','C18'], 'Independently simulate unauthorized remix, brigading, AI-authorship ambiguity, unsafe reconciliation and captured vote; record containment, appeal and rollback without exposing participants.'),
 ('P07', 'Sparse launch and sustainable care trial', ['C03','C09','C20','C21','C22'], 'Evaluate a genuinely small community with missing matches, unpaid/paid boundary previews and constrained hosts; observe usefulness before growth and inspect free-access fairness.'),
 ('P08', 'Measured phone and assistive-technology journey', ['C01','C02','C06','C19'], 'Measure the new integrated journey on an actual phone and with applicable assistive technology; distinguish measured traces, emulation, expert inspection and participant feedback.'),
 ('P09', 'Consented follow-up on meaningful benefit', ['C15','C17','C22'], 'Follow up at preregistered intervals about chosen connections, completed work and real-world usefulness, plus harms and exclusions; preserve non-response, withdrawal and uncertainty.')]

GUARD = ('Inspect current implementation and reuse linked Beads before writing. Private assessment, journal, therapist and authored parts data never enter public discovery implicitly. '
 'Preserve solo support, Felt identity, independent sensory controls and core 64/147 plus therapist 3+1 scope. Keep quiet/decline/exit/block/report/export/delete paths. '
 'Firebase Spark is authorized; billing-dependent Cloud Storage is excluded. Text-first references precede deferred uploads. No billing, payment activation, external messaging or fabricated research. '
 'Bind immutable generation, published contract versions, exact narrowed writes/capabilities and live lease before parallel code writes; proposed ownership is not a lease. '
 'Shared app composition, manifests, security rules, migrations, locales and integration environment belong to one integrator. Record candidate, actual checks, limits and next consumer in Beads.')
nodes, edges, requirements = [], [], []

# Both brainstorms are enumerated so recovery can detect a dropped proposal.
PROPOSALS = '''
T01|Outcome-oriented public creative commons|C01,C09,C22
T02|Switchable question/poll/opinion/meme/resource/event/intro/WIP/collaboration threads|C01
T03|Browse by laugh/think/meet/make/happening intent|C01,C03
T04|Threads produce decisions, annotated resources and persistent artifacts|C01,C12
T05|Meme-to-poll-to-challenge-to-event evolution with credit|C01,C07,C13
T06|User-chosen shared experiences across interests|C01,C08
T07|Expressive rabbit-hole and abandoned-project introductions|C05
T08|Complementary discovery without diagnostic verdicts|C04
T09|Consented micro-action discovery and correctable recommendations|C04,C08
T10|Collaboration cards with roles, effort, pay, ownership and outcome|C09
T11|Five-minute feedback and quiet twenty-minute commitments|C09
T12|Finite cooperative quests producing member-authored artifacts|C08,C10
T13|Flexible instigator/maker/connector/editor/researcher/host roles|C08,C10
T14|Practical skill trees with evidence and open basic access|C11
T15|Creative chemistry recognized through useful output|C11
T16|Collective unlocks without guilt or equal-contribution demands|C11
T17|Changing member-remixed creative constraints|C10
T18|Attributable creative meme formats and thoughtful discovery|C01,C07,C12
T19|Resources annotated by actual use and obscure collections|C12
T20|Consequential polls, reasons and respectful disagreement|C12
T21|Interest-to-confirmed event seeds with quiet and async routes|C13
T22|Co-organizing recipes, roles and follow-up artifacts|C13
T23|Variable capacity, slow replies, clear declines and return|C03,C06
T24|Chosen pseudonymous facets with private practice boundaries|C05
T25|Quiet contributions and contextual thanks without global rank|C09,C11
T26|Meaningful notifications with budget, digest and off switch|C03,C01
T27|Satisfying visit completion through useful finding or action|C03
T28|Correctable community history from artifacts and gatherings|C02,C17
T29|Temporary participatory festival with exhibition and legacy|C14
T30|Complete intro-to-thread-to-collaboration-to-gathering journey|C03,C07,C13
T31|Measure friendships, projects, attendance, failed matches and host load|C22,C20
W01|A living world changes through real artifacts and recurring places|C02,C17,C19
W02|Optional arrival ritual based on chosen intention, time and energy|C03
W03|Equivalent spatial, illustrated and calm text views|C02,C19
W04|Workshop, meme theater, question garden, library and quiet studios|C02
W05|Cross-listed content and preserved relationships when formats switch|C01
W06|Serendipity explained through affinity, difference and possible action|C04
W07|Familiar/adjacent/unexpected surprise with explicit feedback|C04
W08|Shared micro-actions and short asynchronous turns|C08,C09
W09|Inviting half-creations with permissions and branching|C07
W10|Cross-discipline poem-to-sound-to-animation lineage|C07,C08
W11|Bounded cross-circle expeditions returning an artifact|C08
W12|Finite forgotten-project/mistake-museum/fictional-weather/odd-skill worlds|C02,C14
W13|Generosity, participation and quiet offerings inspired by participatory festivals|C09,C14
W14|Gift tables with sustainable voluntary help and no debt|C09
W15|Cooperative mysteries with multiple roles and answers|C10
W16|Personal participation constellation without gated basic access|C11
W17|Recognize welcome, idea revival and inclusive cooperation|C11
W18|Controllable shared relationship memory and next encounters|C15
W19|Chosen relationship distances without forced DMs|C15
W20|Deliberate contextual facets without inferred plural identities|C05
W21|Celebrate/witness/question/develop/challenge/remix reception modes|C06
W22|Camera/speaking/duration/preparation/exit social previews|C06,C13
W23|Overwhelm break and quiet return without social penalty|C06,C03
W24|Accountable care hosts, moderation, appeals and pseudonyms|C16
W25|Optional repair preserving candid boundaries and safe exit|C16
W26|Rituals for unfinished work, stopped projects and seasonal closure|C14
W27|Participatory culture experiments and equitable co-evolution|C17
W28|Transparent opt-in AI that preserves human authorship|C18
W29|Concentrated authentic cold start before growth|C20
W30|Beautiful licensed collective artifacts with sensory/text parity|C19
W31|Arrival-to-encounter-to-creation-to-closure visit arc|C03
W32|Economics sustain care and compensate hosts without exclusion|C21
W33|Quiet miniature-city story-to-soundscape-to-exhibition journey|C07,C03
W34|Measure welcome, capability, offline benefit and unequal care burden|C22
W35|Creative peer world with honest claims, distinct from therapy|C16,C22
'''
proposal_coverage=[]
for line in PROPOSALS.strip().splitlines():
    key,requirement,streams=line.split('|')
    stream_keys=streams.split(',')
    proposal_coverage.append(dict(key=key,requirement=requirement,streams=stream_keys,
        task_keys=[f'{s}.{i}' for s in stream_keys for i in range(1,5)]))

def add(key, title, detail, parent='WORLD', kind='task', stage='design', role='domain-owner', reuse=(), criteria=None):
    scope = key.split('.')[0].lower()
    nodes.append(dict(key=key, title=f'[{key}] {title}', type=kind, priority=2,
        description=f'{detail}\n\nReuse: {", ".join(reuse) or "Shared world foundation"}.\nOwner: {role}. Stage: {stage}.\n{GUARD}',
        acceptance_criteria=criteria or f'{detail}\nDeliverable and scenario evidence are reviewable against an exact candidate; denied, quiet, interrupted and revoked alternatives are covered where relevant. Required participant/device/service observations remain pending until actually obtained.',
        labels=['roadmap','creative-commons-plan',stage],
        metadata=dict(planning_key=key, planning_task=CONTROL, stage=stage, role=role,
            reuse_beads=[IDS[r] for r in reuse], base_generation=None, contract_versions=[],
            workcell_status='proposal_requires_resolved_base_contracts_capabilities_and_lease',
            read_set=['docs/plans/creative-commons-beads-plan.json','docs/plans/social-creative-practice-beads-plan.json'],
            write_set=[f'docs/plans/creative-commons/{scope}/**'] if stage in ('design','research','acceptance') else [f'src/creative-commons/{scope}/**'],
            central_writes='integrator-only; no shared rules/composition/migrations/locales authority', evidence_status='uncollected'),
        **({'parent':parent} if parent else {})))

def dep(a, b, typ='blocks', external=False):
    edges.append(dict(from_key=a, **({'to_id':b} if external else {'to_key':b}), type=typ))

add('WORLD','Living creative commons and serendipity engine','Integrate all public-thread and living-world proposals as additive deltas, real end-to-end journeys and explicit acceptance gates.',parent=None,kind='epic')
dep('WORLD','ArchetypeAI-we2s','parent-child',True)
dep('WORLD',CONTROL,'discovered-from',True)
add('FOUNDATION','World contracts, fixtures and dispatch prerequisites','Resolve reuse, rights, accessible data, consent and safe parallel workcells.',kind='epic')
for key,title,detail in FOUNDATIONS:
    add(key,title,detail,'FOUNDATION',role='research-owner' if key in ('D04','D06') else 'architecture-owner')
for key in ('D02','D03','D04','D05','D06'): dep(key,'D01')
dep('D05','D02');dep('D06','D04')
for b in ('B01','B03','B04','B06','B07','B11','B12'): dep('D02',IDS[b+'.S03'],'blocks',True)

for key,title,reuses,platforms,steps in STREAMS:
    reuse=reuses.split(',')
    add(key,title,f'Extend {", ".join(reuse)} with the named creative-commons delta. Children define actual deliverables, not a second implementation of the base feature.',kind='epic',reuse=reuse)
    for i,(step,detail) in enumerate(steps,1):
        task=f'{key}.{i}'
        add(task,step,detail,key,stage=('design','implementation','experience','verification')[i-1],
            role=('domain-owner','slot-implementer','experience-owner','independent-verifier')[i-1],reuse=reuse)
        dep(task,'D01' if i==1 else f'{key}.{i-1}')
        if i==2:
            dep(task,'D02');dep(task,'D03');dep(task,'D05')
            for b in filter(None,platforms.split(',')):dep(task,IDS[b+'.S09'],'blocks',True)
    requirements.append(dict(key=key,requirement=title,subrequirements=[s[1] for s in steps],
        new_tasks=[f'{key}.{i}' for i in range(1,5)],reuse_keys=reuse,reuse_beads=[IDS[r] for r in reuse]))

# Specific cross-stream prerequisites, without serializing the whole program.
for a,b in [('C02.2','C01.2'),('C07.2','C01.2'),('C06.3','C05.2'),('C08.2','C04.2'),('C10.2','C06.2'),('C11.2','C10.2'),('C13.2','C09.2'),('C14.2','C02.2'),('C14.2','C13.2'),('C15.2','C07.2'),('C17.2','C16.2'),('C18.2','C07.2'),('C19.2','C02.2'),('C20.2','C04.2'),('C22.2','D04')]:dep(a,b)
add('PILOTS','Integrated journeys and genuine evidence','Observe coherent social outcomes, actual accessibility and care capacity; no invented user sessions.',kind='epic')
for key,title,streams,detail in PILOTS:
    add(key,title,detail,'PILOTS',stage='research',role='independent-research-owner')
    dep(key,'D06')
    for stream in streams: dep(key,f'{stream}.4')
    if key in ('P01','P02','P03','P04','P05','P07','P09'):dep(key,'C22.2')
add('G01','Integrate complete creative-world candidate','One integrator composes routes, APIs, rules, consent, locales and thread-to-artifact-to-event journeys against frozen slot versions. Run meaningful existing regression, rules, accessibility and performance checks; record rollback and Spark quota limits.',stage='verification',role='integration-owner')
for key,*_ in STREAMS:dep('G01',f'{key}.4')
for key,*_ in PILOTS:dep(key,'G01')
add('G02','Make independent release and benefit decision','Review preregistered pilot outcomes, serious harms, accessibility, privacy, real-device performance, care capacity and cost limits. Decide accept/iterate/pause with reasons; attractive presentation cannot average away a hard gate.',stage='acceptance',role='independent-release-owner')
for key,*_ in PILOTS:dep('G02',key)
add('G03','Prepare bounded rollout and continuing improvement','Only after accepted evidence, document limited rollout, actual host coverage, rollback triggers and monitoring ownership; convert findings to live Beads and preserve full four-root recovery. Production rollout itself requires applicable existing release authorization.',stage='acceptance',role='release-owner')
dep('G03','G02')

SWEEPS=[
 dict(key='S0',tasks=['D01'],purpose='Reconcile current implementation and approved scope'),
 dict(key='S1',tasks=['D02','D03','D04']+[f'{k}.1' for k,*_ in STREAMS],purpose='Independent contract, fixture, consent and domain design; WIP limited to available agents'),
 dict(key='S2',tasks=['D05','D06'],purpose='Publish source/contracts, consent protocol and resolved workcells'),
 dict(key='S3',tasks=[f'{k}.2' for k,*_ in STREAMS],purpose='Select only live-ready disjoint slot deltas; respect cross-stream and Bxx.S09 blockers'),
 dict(key='S4',tasks=[f'{k}.3' for k,*_ in STREAMS],purpose='Integrate experience candidates through one shared compositor'),
 dict(key='S5',tasks=[f'{k}.4' for k,*_ in STREAMS]+['G01'],purpose='Independent domain verification followed by complete integration'),
 dict(key='S6',tasks=[p[0] for p in PILOTS],purpose='Real pilot/device evidence or exact remaining external prerequisites'),
 dict(key='S7',tasks=['G02','G03'],purpose='Evidence decision and bounded rollout preparation')]

def validate():
    keys={n['key'] for n in nodes}
    assert len(keys)==len(nodes)
    graph={k:[] for k in keys}
    for n in nodes:
        assert n.get('parent') is None or n['parent'] in keys
    for e in edges:
        assert e['from_key'] in keys
        if 'to_key' in e:
            assert e['to_key'] in keys
            if e['type']=='blocks':graph[e['from_key']].append(e['to_key'])
    visited,active=set(),set()
    def visit(k):
        assert k not in active, f'cycle: {k}'
        if k in visited:return
        active.add(k)
        for p in graph[k]:visit(p)
        active.remove(k);visited.add(k)
    for k in keys:visit(k)
    assert len({(e['from_key'],e.get('to_key',e.get('to_id')),e['type']) for e in edges})==len(edges)
    assert {t for r in requirements for t in r['new_tasks']}=={f'{k}.{i}' for k,*_ in STREAMS for i in range(1,5)}
    assert len(proposal_coverage)==66
    assert all(set(r['task_keys'])<=keys for r in proposal_coverage)
    return dict(unique_keys=True,blocking_graph_acyclic=True,complete_stream_coverage=True,
        external_targets=sorted({e['to_id'] for e in edges if 'to_id' in e}))

previous=json.loads(OUT.read_text()) if OUT.exists() else {}
plan=dict(schema_version=1,prepared_date='2026-10-10',client_timezone='Asia/Jerusalem',planning_bead=CONTROL,
    authority='Live Beads; this is an additive specification, never completion state',
    scope='Both approved public-thread and ambitious living creative-world brainstorms, integrated with F01–F55/B01–B12',
    graph=dict(nodes=nodes,edges=edges),requirements=requirements,proposal_coverage=proposal_coverage,sweeps=SWEEPS,
    pilots=[dict(key=k,title=t,streams=s,scenario=d) for k,t,s,d in PILOTS],
    reuse_policy='Existing task evidence may satisfy overlap; reconcile before writing. Do not close existing packages from this plan.',
    dispatch='Resolve immutable base, exact narrowed writes, contracts, capabilities, resources and actual leases before parallel writes. Sweep lists are candidates, not a ready queue.',
    counts=dict(nodes=len(nodes),tasks=sum(n['type']=='task' for n in nodes),epics=sum(n['type']=='epic' for n in nodes),
        explicit_edges=len(edges),streams=len(STREAMS),pilots=len(PILOTS),sweeps=len(SWEEPS),reused_packages=len({r for x in requirements for r in x['reuse_keys']})),
    beads_ids=previous.get('beads_ids',{}),validation={**previous.get('validation',{}),'structural':validate()})
OUT.write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
Path('/tmp/creative-commons-create-graph.json').write_text(json.dumps(plan['graph'],ensure_ascii=False,indent=2)+'\n')
print(json.dumps(plan['counts']))
