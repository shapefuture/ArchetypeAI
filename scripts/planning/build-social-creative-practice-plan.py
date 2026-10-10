#!/usr/bin/env python3
"""Build an additive Beads planning graph; never mutates the live tracker."""
from __future__ import annotations

import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/plans"
BASE = json.loads((OUT / "elevation-aaa-v7-beads-plan.json").read_text())
BASE_IDS = BASE["beads_ids"]
PLAN_PATH = OUT / "social-creative-practice-beads-plan.json"
PLANNING = "ArchetypeAI-cyqe"
DATE = "2026-10-06"
LABEL = "social-creative-practice-plan"

# key | title | purpose/mechanism | concrete fixtures | platform slots | reconciliation
FEATURE_ROWS = """
F01|Shared-experience theme spaces|Persistent chosen themes with comments, questions, follow controls, differing experiences and discoverable consenting contributors; implement the Pattern Shared Experiences correction explicitly|Join starting-over theme; contribute a personal account; read disagreement; leave and revoke visibility|B03,B04,B12|E19,X02
F02|Finite life-event gatherings and cohorts|Temporary spaces around user-selected transitions with a beginning, activity, follow-up and ending|Moving-city gathering; late join; cohort ends; participant pauses; actual event versus inferred recommendation|B03,B11,B12|E01,X02
F03|Mutually authored relationship portraits|Separate approved accounts of preferences and misunderstandings with concrete jointly chosen experiments|Different support preferences; one person declines; disputed interpretation; source withdrawal; no compatibility verdict|B01,B03,B04,B10|X02,E07,E16
F04|Mutual question and perspective reveals|Separate answers before a consensual reveal, surprising differences and a useful optional question|Answer privately; partner declines reveal; edit before reveal; reveal disagreement; no guessed absent-person response|B04,B09|X02,E10
F05|People discovery through contributions|Discover consenting people through thoughtful comments, questions and practical contributions|Private author stays undiscoverable; invitation from comment; deleted contribution; blocked contributor|B01,B02,B03,B04|X02,E19
F06|Purpose-specific friendship, practice and adult dating discovery|Distinct opted-in modes with explainable criteria, shared interests, user-chosen values and availability|Friendship-only user; nonreciprocal invitation; adult account eligibility; purpose change; delete public profile|B01,B02,B03|X02,E19
F07|Activity-first introductions and mutual continuation|Short question exchange, cooperative puzzle or creative activity before mutually choosing ongoing contact|Finish five-question exchange; one person declines; no reply; accessibility alternative; retain only agreed output|B02,B04,B11|E10,X02
F08|Purpose-specific trusted circles|Separate audiences for partner, buddy, friendship circle and practical support with visible sharing scope|Share tool with buddy only; change audience; revoked member; declined request; complete solo route|B03,B04|X02,E14
F09|Useful invitations and limited guest participation|Invitation carries an approved question, support card or shared activity with a bounded guest response|Guest previews exact artifact; expired link; one-use link; account optional where safe; no private profile leak|B01,B03,B04|X02,E14
F10|Support cards, current support requests and encouragement|Editable how-to-support-me cards, listen/help-think/keep-company requests and recipient-controlled Good Vibes gestures|Change current request; recipient declines; slow reply; request expires; selected card shared without private history|B01,B04,B05|E14,X02
F11|Accountability agreements and flexible shared rhythms|Mutual commitment, acceptable nudge, cadence, obstacles, fallback, pause and graceful re-entry|Two practices weekly; uneven capacity; pause agreement; partner leaves; fallback chosen; no accumulated debt|B04,B06,B05|E01,E03,E08,E09
F12|Short shared presence and body doubling|Trusted-person sessions with a chosen intention, optional quiet presence and clear start/end|Five-minute start; text-only; partner absent; reconnect; cancel; completion remains self-reported|B04,B11|E03,E08
F13|Mutual repair rituals and communication agreements|Separate approved accounts after misunderstanding and one revisable practical agreement|Conflicting accounts remain distinct; request not accepted; delay; pause; boundaries maintained|B04,B09,B10|X02,E06,E07
F14|Finite facilitated circles and mentorship|Purposeful small groups with host, participation agreement, short sequence and ending; accountable qualified facilitation when applicable|Host unavailable; participant leaves; scope changes; quiet participation; complaint; facilitator qualifications unresolved|B03,B11,B09|X04,E15
F15|Reviewed community contributions and useful gifts|Edited tools, questions, practice adaptations, gifts and player-authored scenarios with source/context/review and finite collections|Malicious submission; withdraw source; adapt tool; contributor credit; decline gift; finite browse endpoint|B04,B08,B09|E14,E19,X07
F16|Chosen social milestones and personal/shared recaps|Source-linked corrected stories of attempts, help and revised intentions with exact audience preview|Correct recap; sparse history; private success; friend congratulation; suppress animation; share selected facts only|B04,B06,B10|E09,E11,E14
F17|Occasional grounded insight reminders|One supported observation or saved intention plus a useful optional question/action and why-now explanation|Sparse source; stale observation; user-selected phrase; unrelated prompt rejected; discovery cadence limited|B05,B08,B10|X03,E07
F18|Before-and-after user-chosen moments|Chosen reminder around meeting, conversation, visit or appointment with prepared phrase and optional later review|Rescheduled meeting; cancel event; time zone change; no outcome; discreet reminder; optional follow-up|B05,B09|X03,E14,E15
F19|Independent notification streams, budgets and return|Separate commitments, trusted-person and reflection/discovery settings; digests, quiet hours, pause and welcoming return|Pause discovery only; batch extras; no notification debt; re-entry revise goal; independent sensory choices|B05|E03,E07,X03
F20|Useful notification actions, inbox and relevance feedback|Complete small actions from reminder where supported, equivalent in-app inbox, timing reasons and feedback|Show phrase; later; tried; no longer relevant; wrong time; permission denied; notification action duplicated|B05,B09|E14,E17
F21|Reliable notification delivery and revocation|Device/recipient authority, cancellation, expiry, deduplication, background limits and travel/DST correctness|Two devices; block before queued send; revoke permission; DST shift; deleted source; stale token; sensitive lockscreen|B05,B03|E17,E18,X03
F22|Matching by interaction preferences|Explicit long-message, directness, response rhythm, shared-activity and quiet-company preferences with revisable explanations|Different rhythms; changed preference; delayed reply; user rejects match rationale; no diagnostic shortcut|B01,B02|E03,X02
F23|Interest constellations and enthusiastic deep dives|Specific intersecting interests, chosen depth, personal collections and invitations to explore together|Architecture plus folklore; overview versus deep dive; interest changes; recipient chooses depth; text equivalent|B01,B02,B04|E11,E14
F24|Parallel-play spaces and creative jams|Low-demand shared drawing, research, reading or separate work with optional interaction and bounded artifacts|Audio off; video off; asynchronous contribution; shared start/end; leave mid-jam; contribution ownership|B11,B04|E03,E10,E12
F25|Flexible asynchronous friendship and expectation agreements|Chosen reply expectations, brief acknowledgements, low-capacity status and easy reconnection|Read but cannot answer; no read-receipt pressure; expectations revised; silence; decline; return after gap|B01,B04,B05|E03,X02
F26|Social-event previews and participation clarity|Structure, group size, duration, sensory/interaction expectations, sample first minute and exit paths|Unfamiliar room; preview mismatch; host changes format; written participation; late arrival; early exit|B03,B11|E12,E13
F27|Personal experience vocabulary and low-word communication|User-created metaphors/images and editable low-word request cards with optional conventional wording|Words are buffering; one question at a time; uncertain meaning; translated phrase; no psychological assignment|B07,B09|E03,E04,E12
F28|Predictable structure with adjustable stimulation and novelty|Independent density, motion, sound, richness and surprise preferences with stable navigation and saved contexts|Rich visuals quiet audio; static scene; rapid setting switch; no lost task; user previews surprise|B07,B06|E03,E12,E13
F29|Obstacle-specific help starting|Explicit unclear/boring/large/uncomfortable/transition obstacle and a chosen clarification, smaller step, environment change or company|Reject obstacle guess; smallest artifact; choose rest; ask clarification; no coercion; task remains user-owned|B09,B10,B11|E02,E03,E05
F30|Creative bookmarks and project incubation|Exact last artifact, open question, possible next action and saved references for unfinished or resting projects|Resume old drawing; conflicting edits; archive interest; opt-in connection; AI recap source link; export|B07,B10|E07,E14
F31|Expressive personal exhibits and multiple creative formats|Objects, mini-map, image, question, voice or creation with equally expressive text alternative and exact audience choice|Five-object profile; alternate text; inaccessible upload; private creation; revoke media; attribution and consent|B01,B07,B04|E11,E12,E14
F32|Variable capacity, social recovery and protected rest|Chosen participation effort, recovery arrangements, no-demand periods and readiness to return without inferred mood|Energy changes mid-event; reschedule; recovery private; leave without explanation; quiet rest; warm return|B07,B11,B05|E03,E01
F33|Optional user-authored profiles and terminology|Names, pronouns, labels or no labels selected by user for presentation; plural accommodations distinct from metaphor exercises|No label; edit pronouns; unknown attribution; no inferred member; fictional character separately tagged|B07,B01|E06,E07
F34|Continuity notebook and attributable handovers|What happened, decisions, unfinished work and helpful next context with optional authored attribution and correction|Interrupted session; correction; uncertain recollection; conflicting note; source deletion; no generated identity voice|B07,B10|E06,E07,E14
F35|Commitments, preferences and unresolved decisions board|Shared account plans with differing authored preferences, pending decisions and explicit current agreement|Two preferences; decision pending; appointment context; plan revision; no app deciding for user|B07,B10|E01,E07
F36|Selective presentation disclosure and honest access boundaries|Recipient-specific selected presentation/support cards, previews and clear account/device visibility|Hidden profile never discoverable; shared-device account access; revoke card; no false secure identity separation|B01,B03,B07|X02,E06,E17
F37|Familiar orientation and return page|Predictable chosen next step, actual date/time, familiar artifact, practical info and selected trusted contacts|Offline return; local time correct; no forced check-in; inaccessible image alternative; contacts stale|B07,B09|E02,E12,E13
F38|Portability, backup, deletion and service durability|Usable exports of notes, preferences, support cards and creative artifacts with restoration and shutdown continuity|Selective export; device replacement; corrupt backup; deleted source; export excludes others private contributions|B07,B10|E14,E17
F39|Branching practical skill trees and evidence levels|User-chosen destinations, multiple routes and discover/rehearse/try/revisit labels separate from measured personality|Unknown skill; user skips node; self-report label; request clarification; boundary skill; no diagnosis rank|B06,B09,B10|E08,E09
F40|Flexible builds and situation toolkits|Temporary practice focus and equipped grounding cue, opening phrase, fallback and support contact|Change build; access help immediately; different situation; source removed; saved phrase edited|B06,B09,B10|E08,E14
F41|Context-varied transfer and progressively lighter support|Revisit strategy across friendship/work/family and review when it fits with optional cues and spaced returns|Strategy works once; fails elsewhere; choose support; no lock; rest; no fabricated mastery|B06,B09|E08,E07
F42|Cooperative purposeful quests and chosen adventures|Shared bounded intention with independently suitable acts, flexible pace, endpoint and useful artifact|Uneven contribution; member pauses; quest revised; team completes different routes; seasonal endpoint|B06,B04,B11|E01,E08,E09
F43|Complementary roles and cooperative practical mini-games|Rotate questioner, perspective finder, planner and observer in reviewed scenes with explicit results|Role changes; asynchronous turn; one player leaves; more than one defensible solution; quiet controls|B06,B09,B11|E10,E11
F44|Retries, persistent learning and larger encounters|Failed attempt preserves observations, opens smaller/different route and combines tools for chosen important moment|Unsuccessful conversation; keep learning; retry later; cancel encounter; different strategy; honest outcome|B06,B09,B10|E08,E09,E10
F45|Persistent Felt world and useful personal collections|User-chosen objects/scenes grow from concrete actions and retained tools with visual and text equivalents|Bridge from request; saved support note; scene deleted; offline collection; quiet world; no health status inference|B06,B07,B10|E11,E12,E14
F46|Bounded puzzle and creative expedition rituals|Finite scenario or noticing activity with plausible responses, authored explanation, short/long version and satisfying endpoint|Three-minute visit; alternate solution; skip; return later; sparse knowledge; no endless daily obligation|B06,B08,B09|E10,E03
F47|Original character humor and sensory-aware celebrations|Authored coherent Felt reactions tied to real acts with meaningful milestones and complete quiet equivalents|Celebrate changed plan; no assessment feedback bias; animation interrupted; reduced motion; localized humor|B06,B07|E09,E11,E12
F48|Useful gifts, seasonal stories and corrected recaps|Selected practical tools or creative gifts, finite seasonal projects and source-linked personal/shared story|Decline gift; choose audience; stale recap; seasonal ending; paused friendship; retained artifact|B04,B06,B10|E01,E09,E14
F49|Purpose-organized source-informed practice library|Settle/understand/choose/rehearse/connect entries with reviewed source cards, intensity, alternatives and useful artifacts|User chooses purpose; rejected suggestion; source withdrawn; no diagnosis requirement; different modality route|B08,B09|E02,X04,X05
F50|User-authored meaning map alongside formal assessment|Personal dimensions, symbols, recurring contexts, uncertainty and corrected examples with protected score provenance|Personal dimension differs from canonical axis; symbol meaning changes; source deleted; therapist full vector intact|B10,B08|E04,E06,E16
F51|Accommodation, support and environmental-fit library|Practical setting/activity/support changes stored with when they helped and optional portable request|Quieter room; clear instructions; unsuitable accommodation; context change; shared support card|B10,B09|E05,E07,E14
F52|Selectable bounded coach and communication rehearsal|User selects understanding/planning/environment change/rehearsal/company/pause with clarification and reflection endpoint|Ambivalence; correction; no hidden-person inference; stop analysis; stale source; user declines generated interpretation|B09,B10,B08|E04,E05,E06
F53|Community investigations and practical exception library|Participant-chosen questions, contextual comparisons, small experiments and reviewable contrary outcomes|Enjoyable gathering exhaustion; no causal claim from anecdote; choose what to share; failed experiment retained|B12,B03,B08|E05,E19
F54|Qualified facilitated booking and scoped offerings|Separate clinical/spiritual/educational service scope, accountable operator, chosen preparation and real booking states|Qualification unavailable; requested versus confirmed; operator cancels; private notes; withdraw sharing; scope mismatch|B11,B08,B09|E15,X04,X05
F55|Inclusive group formats, power awareness and co-creation|Hosted questions, quieter/dissenting views, rotating roles, feedback, moderation appeals and shared useful artifacts|Popular host challenged; asynchronous contributor; abuse report; host leaves; consent-based contribution reuse|B03,B11,B12|E12,E13,E19
"""

# key | title | transferable mechanism | source | scope | featured consumers | distinguishing checks
METHOD_ROWS = """
M01|PCM-inspired stress preferences and playbooks|User-confirmed stress signs, needs and preferred response; edit personal support playbook|https://processcommunicationmodel.com/discover-pcm/|reflective|F10,F13,F51,F52|Need differs by context; recognition versus room to think; no inferred personality or validated PCM profile claim
M02|PCM-inspired communication translation|Express same request through selected pacing, warmth, structure or play while preserving meaning|https://processcommunicationmodel.com/discover-pcm/|reflective|F13,F25,F52|Recipient rejects style guess; clear boundary preserved; direct and warm forms; no covert manipulation
M03|Gestalt-inspired present awareness experiments|Optional external or bodily noticing followed by small expressive experiment and reflection|https://www.eagt.org/|clinical-inspired|F27,F49,F52|External alternative; no forced bodily focus; ordinary request spoken two ways; stop if uncomfortable
M04|Psychodrama-inspired ordinary rehearsal|User-directed fictional rehearsal and chosen alternative perspective with hypothetical status|https://asgpp.org/what-is-psychodrama/|facilitator-sensitive|F04,F43,F44,F49|Imagined response not real mind; mild fictional situation; skip role; no trauma reenactment as self-guidance
M05|Sociodrama and group role rehearsal|Theme-based fictional shared scene with roles, observer rotation and personal takeaways|https://asgpp.org/what-is-psychodrama/|facilitator-sensitive|F14,F43,F54,F55|Voluntary roles; observer option; participant withdraws; group story ownership; accountable facilitator
M06|Psychosynthesis-inspired inner council|Authored competing motivations and chosen broader intention with optional metaphor labels|https://psychosynthesistrust.org.uk/|clinical-inspired|F27,F40,F49,F52|Security and adventure; user discards metaphor; no inferred identities; priorities change
M07|Chöd contextual source and compassionate relation|Respect Buddhist context and prototype original mild curiosity/care reflection with no ritual or intense imagery claim|https://www.taramandala.org/|tradition-sensitive|F27,F49,F54|User declines spirituality; ordinary drawing alternative; Chöd distinct from modern adaptation; intensive scope reserved
M08|Feeding Your Demons source-informed exploration|Distinct contemporary source and original bounded compassionate metaphor; licensed/qualified offering separate|https://www.taramandala.org/programs/feeding-your-demons/|facilitator-sensitive|F49,F54|Trademark/source distinctions; no copied protocol; no generated autonomous identity; no trauma healing claim
M09|ACT-inspired values-guided choice|User chooses value and manageable action with difficult thought present, including revised goal|https://contextualscience.org/act|clinical-inspired|F29,F39,F44,F52|Thought is reported experience; no forced exposure; values conflict; rest/accommodation can be chosen
M10|Motivational interviewing-inspired ambivalence|Own reasons, mixed motivations, confidence and optional plan with autonomy to decline change|https://motivationalinterviewing.org/understanding-motivational-interviewing|clinical-inspired|F29,F49,F52|User declines goal; no unsolicited pressure; both sides of ambivalence preserved; chosen plan
M11|Jungian personal symbols and voluntary dream material|User-authored associations and changing meanings with waking facts distinct from dream/fiction|https://iaap.org/jung-analytical-psychology/short-articles-on-analytical-psychology/symbol-2/|clinical-inspired|F30,F31,F45,F50|Bridge meanings differ; dream account marked; no prophecy or recovered-memory inference
M12|Jungian underexpressed qualities and shadow lens|Explore a quality user admires or limits, with real disagreement and mistreatment also possible|https://iaap.org/jung-analytical-psychology/short-articles-on-analytical-psychology/the-shadow/|clinical-inspired|F39,F49,F50|Assertiveness experiment; interpretation rejected; boundary maintained; no every-irritation-is-projection claim
M13|Jungian opposites and third possibilities|Represent competing concerns fairly and author a response accommodating useful aspects|https://iaap.org/jung-analytical-psychology/short-articles-on-analytical-psychology/symbol-2/|reflective|F43,F46,F50|Belonging and independence; firmness and kindness; several defensible responses; no mandatory compromise
M14|Active-imagination-inspired authored dialogues|Deliberately write both fictional sides and choose a practical takeaway; intensive practice separately scoped|https://iaap.org/jung-analytical-psychology/short-articles-on-analytical-psychology/|facilitator-sensitive|F31,F43,F49|User authors both sides; fictional tags; no autonomous voices, new identities or hidden knowledge
M15|Mindell process-work edges|Optional unfamiliarity exploration and smallest wanted experiment, support or maintained boundary|https://www.processwork.org/what-is-processwork/|clinical-inspired|F29,F39,F44|User declines edge; boundary preserved; show unfinished work; no escalation reward
M16|Mindell expressive channels|Try words, sketch, sound, movement, arrangement or example and check whether it clarifies|https://www.processwork.org/what-is-processwork/|reflective|F27,F31,F49|Switch medium; text equivalent; no coded symptom interpretation; movement optional
M17|Deep democracy and overlooked perspectives|Invite uncertainty, dissent and quieter accounts before a group decision|https://www.aamindell.net/process-work|community|F14,F53,F55|Asynchronous dissent; host uncertain; abuse boundaries remain; no false factual equivalence
M18|Process-work rank and power awareness|Inspect how popularity, expertise, fluency and host powers affect contribution and feedback|https://www.aamindell.net/process-work|community|F14,F55|Disagree with host; badge bias; rotating opportunities; moderator denial and appeal
M19|DNMS-inspired supportive resources|Concrete current sources of care/protection/support; visualization alternatives and scoped clinical source|https://www.dnmsinstitute.com/what-is-the-dnms/|facilitator-sensitive|F10,F37,F51,F54|Real person/place/object; no visualization ability assumed; no app-delivered trauma treatment claim
M20|DNMS-inspired present needs to practical support|Identify present acknowledgment, choice, consistency, protection or help and available response|https://www.dnmsinstitute.com/what-is-the-dnms/|facilitator-sensitive|F10,F29,F51,F52|Need unknown; ask clarification; change arrangement; childhood account optional and user-supplied
M21|Stoic event, interpretation and influence reflection|Separate observed event, conclusion and available choice while preserving emotion and external constraints|https://plato.stanford.edu/entries/stoicism/|philosophical|F20,F46,F49,F52|Delayed reply; interpretation uncertain; influence limited; no emotional suppression requirement
M22|Daoist less-forcing and workable conditions lens|Explore timing, environment, sequence, scope and where movement is possible as clearly named analogy|https://plato.stanford.edu/entries/daoism/|tradition-sensitive|F29,F32,F51|One friction removed; rest appropriate; tradition broader than productivity; no metaphysical causal claim
M23|Buddhist conditionality-inspired context map|User-selected contributing conditions and one chosen contextual change|https://www.dhammatalks.org/|tradition-sensitive|F50,F51,F53|Sensory load, uncertainty and expectations; user rejects map; no fixed fate or inferred karma
M24|Mettā and chosen goodwill|Optional caring intention or practical supportive act with chosen recipients and maintained boundaries|https://www.dhammatalks.org/suttas/KN/StNp/StNp1_8.html|tradition-sensitive|F10,F15,F48|Decline recipient; no demanded forgiveness; secular/tradition options; freely chosen gesture
M25|Zen-inspired beginner attention|Brief noticing of overlooked details with photograph, sketch or sentence and clear endpoint|https://www.sotozen.com/|tradition-sensitive|F31,F46,F49|Familiar object; external attention; short activity; no altered-state or enlightenment claim
M26|Mussar-inspired context-sensitive quality practice|Chosen ethical quality, actual actions and reflection on when another quality matters|https://www.mussarinstitute.org/learn/what-is-mussar/|tradition-sensitive|F39,F42,F49|Patience versus firm boundary; Jewish context retained; no universal virtue ranking
M27|Jain many-sidedness and perspective limits|Several accounts with what each reveals, assumes and leaves unanswered; evidence still evaluated|https://plato.stanford.edu/entries/jaina-philosophy/|tradition-sensitive|F04,F43,F46,F55|Incomplete account; factual mistake; evidence distinction; no all-claims-equally-true instruction
M28|Confucian reciprocal relationship expectations|Mutually chosen care/respect/responsibilities with revisable inherited expectations|https://plato.stanford.edu/entries/confucius/|tradition-sensitive|F03,F11,F13|Question expectation; unequal power; explicit agreement; no compulsory hierarchy
M29|Karma-yoga-inspired effort and uncertain outcome|Choose quality of effort and review actual result without guaranteed success or blame|https://www.gitasupersite.iitk.ac.in/|tradition-sensitive|F39,F42,F44|Good preparation unsuccessful; consequence learned; spiritual participation optional; no victim blame
M30|Protected rest and personal transition rituals|User-authored beginning/end/rest sequence with source-specific review for tradition versions|https://www.mussarinstitute.org/|tradition-sensitive|F18,F32,F45|No-demand period; one sentence ending; chosen object/music; no streak penalty or mandatory spirituality
M31|Focusing-inspired fitting words and metaphors|Try word/image/example, check fit and revise with alternatives to bodily attention|https://focusing.org/felt-sense/what-focusing|clinical-inspired|F27,F49,F52|Partly fits; no body focus; user changes word; no bodily signal as reliable external truth
M32|Hakomi-inspired gentle assumption experiments|User-chosen mild assumption and ordinary low-stakes observation; intensive work separately scoped|https://hakomiinstitute.com/|facilitator-sensitive|F29,F49,F54|Receive company without usefulness; strong response stop; alternative explanation; no unconscious diagnosis
M33|Narrative approaches and richer self-accounts|Person authors story using actual examples, context and exceptions with source lineage|https://dulwichcentre.com.au/what-is-narrative-therapy/|clinical-inspired|F16,F30,F50|Always abandon challenged with examples; sparse account; no fabricated positive history
M34|Solution-focused exceptions and useful conditions|Find when something was a little easier and choose one contextual difference to test|https://www.sfbta.org/|clinical-inspired|F29,F51,F53|No exception recalled; change not available; inconclusive attempt; user-defined useful outcome
M35|Mentalization and uncertainty about other minds|Separate observation and interpretation, consider plausible alternatives and ask clarification|https://www.annafreud.org/|clinical-inspired|F03,F13,F22,F52|Delayed response; direct question; no mind-reading certainty; actual harmful action recognized
M36|Compassion-focused warmth and useful action|Acknowledge difficulty, fair perspective and chosen support, boundary, practical help or rest|https://www.compassionatemind.co.uk/about|clinical-inspired|F10,F32,F49,F52|Self-criticism; reject scripted warmth; boundary action; no demands to feel compassionate
M37|Existential choice, uncertainty and meaning|User-defined importance, unresolved options and chosen action without perfect answers|https://www.existentialpsychotherapy.net/|reflective|F29,F39,F49|Loss not reframed as benefit; remain undecided; meaning differs; no imposed purpose
M38|Tojisha-kenkyu participant-led collective inquiry|People choose what to share, investigate context together and preserve differences and contrary outcomes|https://doi.org/10.1093/jmp/jhac025|community|F01,F53,F55|Gathering exhaustion; user-led question; failed change retained; no clinical/causal conclusion from anecdotes
M39|Personal construct psychology and authored dimensions|Compare three chosen situations and describe personally meaningful distinctions alongside formal map|https://www.pcp-net.org/encyclopaedia/construct.html|reflective|F23,F50|Room to think versus instant response; dimensions editable; no canonical score mutation
M40|Person-environment-occupation fit|Review current resources, setting and demands and choose accommodation or activity change|https://doi.org/10.1177/000841749606300103|occupational|F26,F29,F51|Quieter room; smaller group; unclear task; no presumed personal deficit; unavailable accommodation
M41|Cognitive analytic recurring sequences|Authored observed sequence, provisional links and selected exit/intervention point|https://www.acat.org.uk/|clinical-inspired|F13,F44,F50|Uncertainty to overexplaining to withdrawal; link disputed; no other-person motive asserted
M42|CO-OP guided strategy discovery and transfer|Meaningful activity, collaborative goal, try/check/revise and application elsewhere|https://www.icancoop.org/pages/the-co-op-approach-1|occupational|F29,F39,F41|Strategy works once; new context fails; help remains available; no treatment efficacy transfer
M43|Clean Language and preserved personal meaning|Questions use user words and avoid imposed interpretations while keeping uncertain metaphors editable|https://cleanlanguage.com/introducing-clean-language/|reflective|F27,F50,F52|Tangled means different things; question rejected; no diagnosis or hidden meaning assigned
M44|Perceptual control theory and Method of Levels competing goals|Explore user-confirmed goals that interfere and a workable arrangement as one possible account|https://www.methodoflevels.com.au/|clinical-inspired|F29,F40,F52|Finish drawing and keep options open; user rejects goal hypothesis; no recovered motive claim
M45|Intentional Peer Support mutual learning|Chosen partnership, different perspectives, capacity and ability to decline support|https://intentionalpeersupport.org/ips-approach|community|F08,F10,F11,F14|Unequal capacity; limits explicit; both learn; no mandatory crisis-support role
M46|Participatory sense-making and interaction conditions|Pairs test medium, pacing, structure and shared activity and record when communication fits|https://doi.org/10.1007/s11097-007-9076-9|conceptual|F03,F07,F22,F24|Drawing works, video difficult; several contexts; no static compatibility truth
M47|Double-empathy perspective and reciprocal adaptation|Both participants express intent/understanding and request changes based on actual preferences|https://doi.org/10.1080/09687599.2012.710008|conceptual|F13,F22,F25|Misunderstanding bidirectional possibility; individual variation; no diagnostic matching shortcut
M48|Reflecting teams and selected tentative perspectives|Consented human circle offers observations/questions and recipient chooses what fits|https://doi.org/10.1111/j.1545-5300.1987.00415.x|facilitator-sensitive|F14,F54,F55|Unwanted interpretation discarded; tentative language; no fake human/clinical team; recipient authority
M49|Supported decision-making and bounded support roles|Person requests help with options/consequences/company and retains decision authority|https://supporteddecisionmaking.org/|accessibility|F08,F10,F35|Explain options only; helper exceeds role; retract request; no legal guardianship implication
M50|Micro-phenomenology bounded recent-event detail|Brief recent ordinary account, fallible recall, unknown allowed and optional practical detail|https://www.microphenomenology.com/|reflective|F29,F34,F53|Seconds before task abandoned; cannot recall; one bounded pass; no trauma memory recovery
M51|Metacognitive and rumination-focused reflection endpoint|Check whether reflection adds information and choose continue, record question, action or stop|https://mct-institute.co.uk/|clinical-inspired|F32,F46,F52|Analysis stalls; user chooses continue; no thought suppression or therapeutic protocol claim
M52|Morita-inspired capacity-fitting action with feelings present|Chosen manageable action, rest or accommodation without prerequisite emotional state|https://www.todoinstitute.org/morita.html|tradition-sensitive|F29,F32,F44|Nervous draft sentence; overload rest; no forced endurance or treatment claim
M53|Naikan-inspired support, contribution and effects reflection|Specific received/given support and freely chosen appreciation/repair with unmet needs and boundaries added explicitly|https://www.todoinstitute.org/naikan.html|tradition-sensitive|F13,F16,F48|No guilt debt; harmful relationship boundary; original practice and adaptation distinguished
M54|Forum theatre and fictional social change rehearsal|Voluntary group tries changes to social arrangements and discusses prerequisites|https://www.cardboardcitizens.org.uk/|community|F43,F54,F55|Interrupted meeting; role voluntary; structural change; no compelled personal reenactment
M55|Liberating Structures distributed participation|Individual reflection then pairs/small groups/wider contribution with asynchronous/access variants|https://www.liberatingstructures.com/1-2-4-all|community|F14,F24,F55|Quiet contributor; processing time; incomplete subgroup; no popularity dominance
M56|Positive deviance contextual useful exceptions|Find community examples that work under similar constraints, describe conditions and preserve failures|https://positivedeviance.org/|community|F15,F51,F53|Unexpected accommodation; fails elsewhere; contributor edits; no generalized treatment claim
M57|Capability approach and meaningful options|Evaluate chosen ability to participate, communicate, create, access support or leave unsuitable commitment|https://plato.stanford.edu/entries/capability-approach/|philosophical|F39,F51,F53|User-valued option expanded; access barrier remains; disengagement can be valid; no universal achievement rank
"""

def rows(raw, names):
    result = {}
    for line in raw.strip().splitlines():
        values = line.split("|")
        assert len(values) == len(names), line
        item = dict(zip(names, values))
        result[item["key"]] = item
    return result

FEATURES = rows(FEATURE_ROWS, ["key", "title", "purpose", "fixtures", "platforms", "reuse"])
METHODS = rows(METHOD_ROWS, ["key", "title", "mechanism", "source", "scope", "consumers", "fixtures"])

PLATFORMS = {
    "B01": ("Public presentation and private preferences", "social.profile", "public audience, per-purpose fields and private preference separation", ["C01", "C02", "C08"], []),
    "B02": ("Opt-in explainable matching", "matching.discovery", "purpose/criteria provenance, eligibility, decline and block suppression", ["C01", "C08"], ["B01", "B03"]),
    "B03": ("Membership, moderation and recipient authority", "community.membership", "server-enforced grants, blocks/revocation, moderator capabilities, reporting/appeal and retention", ["C01", "C08"], []),
    "B04": ("Messages, invitations and reviewed contributions", "social.messaging", "authorship, guest expiry, recipient scope, send identity and content lifecycle", ["C01", "C08"], ["B03"]),
    "B05": ("Notification policy, scheduling and delivery", "notification.delivery", "separate local decisions/external delivery, device authority, quiet hours, timezone, dedupe and cancellation", ["C01", "C08"], ["B03"]),
    "B06": ("Optional practical progression and quests", "progression.repertoire", "skill DAG, evidence labels, optional reward events, shared quest state and user-chosen routes", ["C02", "C08"], []),
    "B07": ("Authored presentation and creative continuity", "creative.workspace", "manual labels/attribution, continuity notes, creative artifacts and honest same-account access", ["C02", "C08", "C09"], []),
    "B08": ("Reviewed source and practice catalog", "practice.catalog", "source/version/license/tradition/evidence/scope, independent review, withdrawal and authorized publishing", ["C08"], []),
    "B09": ("Accessible bounded practice runner", "practice.runner", "purpose, consented steps, skip/stop, alternatives, useful output and no diagnostic inference", ["C02", "C08"], ["B08"]),
    "B10": ("Personal meaning, context and accommodations", "meaning.map", "user-authored dimensions/symbols/support, provenance correction and isolation from canonical scores", ["C02", "C03", "C04", "C08", "C09"], []),
    "B11": ("Shared presence and finite group activities", "social.presence", "sessions, host/participant roles, quiet/asynchronous participation, expiry and cancellation", ["C01", "C08"], ["B03", "B04"]),
    "B12": ("Participant-led inquiries and contextual knowledge", "community.inquiry", "voluntary observations, comparisons, contrary results, contributor control and noncausal labels", ["C08"], ["B03", "B08"]),
}

PREPARATIONS = {
    "V01": ("Paid lived-experience co-design", "Neurodivergent and plural contributors with diverse capacities, chosen terminology and compensation; no diagnosis admission gate."),
    "V02": ("Social and matching participant evidence", "Mutual understanding, worthwhile connections, declined invitations, comfort and disclosure comprehension across separately scoped modes."),
    "V03": ("Sources, traditions and practitioner review", "Actual accessible sources; licensing/attribution; relevant community and qualified review; distinguish conceptual, reflective, clinical and spiritual scopes."),
    "V04": ("Authorized accounts and community operations", "Server-enforced roles, membership, block/revoke, moderator appeal, guest links and real operational owners; do not send unsolicited messages."),
    "V05": ("Physical device and manual accessibility", "Phones, assistive technology, large text, keyboard, reduced stimulation, sustained use and selected creative media with exact artifacts."),
    "V06": ("Real notification delivery evidence", "Actual supported platform permissions/background delivery, device authority, timezone/DST, lockscreen choice, cancellation and latency."),
    "V07": ("Task-matched comparison and independent rubrics", "The Pattern Shared Experiences concept, Boo/PDB/Hiki/Finch/Tiimo/PluralKit/Focusmate/games where obtainable, plus simple complete alternatives; no imagined competitor walkthrough."),
    "V08": ("Transfer, meaningful options and longitudinal follow-up", "Chosen real-life outcomes, strategy fit across contexts, useful re-entry, optional pauses and source/evidence limits; no causal claim from anecdotes."),
}

PILOTS = {
    "J01": ("Saying yes when you mean no", ["F01", "F03", "F06", "F10", "F39", "F49", "F52"], ["M01", "M35", "M42"], "Join theme, choose connection, clarify need, rehearse, equip phrase and optionally try it."),
    "J02": ("Joining a creative group in a workable format", ["F22", "F24", "F26", "F51", "F53", "F55"], ["M38", "M40", "M45", "M55"], "Identify fit, compare contexts, choose accommodation, find company and review actual participation."),
    "J03": ("Resuming an unfinished creative project", ["F27", "F29", "F30", "F37", "F40"], ["M39", "M43", "M44"], "Restore original artifact/context, choose a small move, optionally request company and save continuity."),
    "J04": ("Different support preferences in a relationship", ["F03", "F04", "F10", "F13", "F25"], ["M02", "M46", "M47", "M49"], "Separate authored accounts, mutual reveal, explicit request and chosen revised agreement."),
    "J05": ("Quiet short visit and trustworthy reminder", ["F18", "F19", "F20", "F21", "F28", "F32", "F46"], ["M25", "M30", "M51"], "Complete bounded quiet activity, choose reminder, receive exact useful cue and pause without debt."),
    "J06": ("Private continuity and selected presentation", ["F33", "F34", "F35", "F36", "F38"], ["M43", "M49"], "Optional authored labels, handover correction, unresolved decision, selected disclosure and restore/export."),
}

FAMILIES = {
    "SOCIAL": ("Shared experiences, connections and relational support", list(FEATURES)[:16]),
    "NOTIFY": ("Helpful reminders and dependable delivery", [f"F{i:02}" for i in range(17, 22)]),
    "CREATIVE": ("Neurodivergent creative participation and continuity", [f"F{i:02}" for i in range(22, 33)]),
    "AUTHORSHIP": ("Plural-community-inspired user-authored accommodations", [f"F{i:02}" for i in range(33, 39)]),
    "PLAY": ("Practical skill progression, cooperation and original Felt play", [f"F{i:02}" for i in range(39, 49)]),
    "PRACTICES": ("Purposeful practices, personal meaning and contextual support", [f"F{i:02}" for i in range(49, 56)]),
}

COMMON = """Execution and truthfulness requirements:
- Reconcile the existing implementation and linked Beads before changing behavior; an already-satisfied slice requires fresh applicable evidence, not a duplicate implementation.
- Beads holds live status. This graph is a dispatch specification, not evidence that a feature exists.
- Bind immutable base, exact contracts, narrowed read/write paths, capability/effect limits, fixtures, ports and live leases before code work. Proposed paths and null generations are not active leases.
- Use isolated mutable workcells. A shared checkout, fixture database, build/cache or integration environment does not provide AAA isolation.
- Broker owns shared composition, worker dispatch, Firestore/security rules, shared locales and integration fixtures. Registry/content publishers and independent verifiers have separate ownership.
- Preserve authored loading/Felt identity, independent sensory controls, assessment-free support, canonical 64/147 provenance and full therapist 3+1 workspace. Personal meaning/progression never silently rewrites formal measurement.
- Public discovery uses chosen fields and per-purpose consent. Private notes, diagnoses, therapist context and authored plural profiles are never inferred or silently exposed. Respect blocks, revocation and recipient authority server-side.
- Keep user facts, self-report, metaphor/fiction, community observation and model inference distinct. No inferred identities, generated identity voices, recovered-memory claim or inherited therapeutic efficacy.
- Label actual tests, participant/device/live-account/community/practitioner observations and missing evidence accurately. Candidate reports need applicable independent review.
- Development beyond old stage boundaries is authorized. Actual release/clinical or spiritual service acceptance still requires its own operator, scope and evidence. No extra permission request is created by this plan.
- Protected constitution, authority ceilings, evaluator definitions and promotion policies remain independently governed M4/R4 changes; ordinary feature proposals do not activate them.
- Record exact artifact, checks, limitations, rollback/undo, source versions and next handoff in this Bead. Do not copy credentials or private participant content into evidence.
- Any change after verification creates a new candidate generation, invalidates affected evidence, and requires fresh broker composition plus applicable independent/participant checks before acceptance.
"""

FEATURE_STEPS = [
    ("Reconcile existing implementation and source Beads", "gap map, reusable artifacts and smallest missing slice", "Audit the actual related behaviors and predecessor work; identify satisfied, partial and absent requirements."),
    ("Specify chosen outcome, useful endpoint and comparator", "observable outcome and task-matched simpler comparison", "Describe who benefits, what they can do afterward, and how a simple alternative would accomplish the same purpose."),
    ("Design normal, quiet, empty and interrupted journeys", "interaction/state storyboard and precise stopping point", "Cover rejected/declined participation, waiting, missing data, low capacity, accessible equivalents and return."),
    ("Propose data, permission and provenance contract", "versioned domain proposal with state/effect/retention and consumer fanout", "Separate authoritative state, authored facts, inference, disclosure and derived views; list consumers and deletion/revocation effects."),
    ("Implement deterministic domain transitions", "narrow pure model and changed-boundary fixtures", "Implement only the named behavior with explicit legal states, unknowns and stable identifiers; no external effects in pure core."),
    ("Implement persistence and effect adapters", "bounded adapter candidate with local/live/unavailable states", "Apply published auth/storage/consent contracts, operation identity, cancellation, deadlines and effect-appropriate retry."),
    ("Build the primary accessible interaction", "complete primary journey and useful output", "Use native controls and published domain semantics; prototype against deterministic adapters while preserving chosen scope."),
    ("Submit broker-owned integration and consumer handoff", "composed candidate proposal and compatibility/fanout report", "Compose relevant consumers in the broker workcell; do not directly broaden screen/root/rules/locale ownership."),
    ("Implement interruption, failure and recovery", "stream-specific recovery matrix and tested transitions", "Handle applicable offline, partial save, quota, late/duplicate operation, conflict, no reply, stale source and cancelled participation."),
    ("Verify permission, abuse and information boundaries", "positive/negative authority and disclosure evidence", "Test denied audience, withdrawal/block/source deletion and scope-specific misuse; clearly separate optional authored presentation and clinical inference."),
    ("Apply authored craft and quiet equivalents", "Felt/copy/visual craft with equivalent static/text/keyboard actions", "Make choices, feedback and endings legible; preserve independent sensory preferences and truthful acknowledgments."),
    ("Review EN/RU, time/context and retained-runtime scope", "localization, platform/parity applicability and limited instrumentation report", "Check expansion/tone, user-facing locale/timezone, device affordances and justified runtime parity; collect no hidden sensitive content."),
    ("Recompose final candidate and run focused boundary verification", "broker-composed final digest and actual automated results on that generation", "Broker consumes the final immutable outputs from all changed producer steps, recomposes after initial S08 integration and executes meaningful boundary/browser checks. Independent review consumes this final digest; no stale initial candidate is accepted."),
    ("Obtain independent comparison and iterate", "separate critic report with exact artifact and largest actionable gap", "Inspect task-matched references and simple alternative, name evidence limits and resolve material findings with new linked iteration tasks."),
    ("Observe actual users, devices or services", "consented scoped external evidence with unavailable items open", "Use prepared protocols/resources and actual artifacts; observe relevant usefulness, comfort, comprehension, access and follow-through."),
    ("Record scoped acceptance and release disposition", "attributable accept/iterate/hold decision and exact activation handoff", "Separate implemented behavior, evidence and release; list residual prerequisites, rollback and next largest gap without invented scores."),
]

METHOD_STEPS = [
    ("Inventory primary sources and exact borrowed principle", "versioned source/attribution inventory", "Find accessible authoritative sources, record original context and distinguish exact method from proposed analogy; mark unavailable sources honestly."),
    ("Review evidence, licensing, expertise and scope", "evidence/qualification/tradition/license matrix", "Distinguish source claims from independent evidence; specify appropriate reviewer/operator and any permission needed for source-specific material."),
    ("Specify mechanism, comparator and bounded alternative", "testable design hypothesis with inclusion/exit/alternative", "Use ordinary user purpose; define limits and a complete lower-intensity/text/nonspiritual alternative where relevant."),
    ("Author reviewed sample activities and failure fixtures", "original sample corpus and source-linked cards", "Cover every mechanism named in this package with normal, rejected/does-not-fit and inaccessible/intense variants; never copy a protected protocol."),
    ("Build the smallest applicable consumer prototype", "immutable scoped runner, interface, community, matching or evaluation candidate", "Implement the mechanism in its named consumer: an exercise can use the runner; structural/conceptual approaches can instead produce community, accommodation, matching or evaluation behavior. Do not invent artificial modality exercises. Intensive protocols remain in qualified offering scope."),
    ("Obtain independent source, scope and access review", "named reviewer record and resolved findings", "Use actual appropriate reviewers for source-sensitive work; verify wording, meaning, alternatives, stop/skip, provenance and cultural context."),
    ("Collect task-matched participant usefulness evidence", "actual scoped observation and comparator report", "Evaluate the exact reviewed prototype against its ordinary alternative, preserve divergent experiences and avoid treatment/causal generalization."),
    ("Publish immutable reviewed entry through content owner", "versioned source-qualified content artifact or explicit held entry", "Authorized content publisher emits a source-linked immutable entry and evidence manifest. This is approved content, not live activation; separate ordinary artifact from clinical/spiritual availability."),
    ("Compose catalog ingestion and verify withdrawal transaction", "broker-owned catalog manifest and active/held scope with withdrawal evidence", "Authorized integration consumes the immutable entry, binds exact source and evidence versions, exercises withdrawal/consumer invalidation and rollback, and records precisely which scope is active or held."),
]

PLATFORM_STEPS = [
    ("Inventory current ownership and actual reuse", "state/effect/component inventory", "Trace current code and existing slot outputs before adding infrastructure."),
    ("Specify authoritative state, grants and effects", "ownership and permission/effect matrix", "Name local/server/derived state, recipient scope, mutation class and recoverability."),
    ("Propose versioned interface and consumer contracts", "contract candidate and fanout inventory", "Define the narrow shared semantics and migration from any overlapping current mechanism."),
    ("Define compatibility and adversarial fixtures", "six-dimension compatibility/rejection suite", "Cover interface, state, effects, operations, performance and failure; include positive and denied cases."),
    ("Implement pure policy and transition core", "isolated deterministic core", "Keep authority decisions and business rules independent from framework/network side effects."),
    ("Implement bounded adapters and state migration", "adapter/migration candidate", "Use published authorities; declare retry, effect identity, conflict and restoration behavior."),
    ("Submit composition and security integration candidate", "broker-owned composition proposal", "Shared root/rules/dispatch/localization writers remain serialized and separately accountable."),
    ("Independently verify complete swap and recovery compatibility", "separate verifier-owned six-dimension swap/migration/recovery and authority evidence", "Before publication, verifier reruns alternate adapter swap, state migration/rollback, effects/retry, operational, performance, failure/recovery and abuse suites on exact candidate. Candidate edits return to producer and trigger a new composition; no unsupported live service is declared accepted."),
    ("Publish frozen contract through registry authority", "versioned accepted slot and suites", "Authorized registry publisher consumes independent evidence; no candidate-owned publication or authority expansion."),
    ("Audit published scope and remaining operational evidence", "post-publication scope audit and remaining live prerequisites", "All compatibility/swap/migration/recovery evidence is already required at S08 before publication. Audit actual external operation evidence separately; any new implementation change returns through producer, broker, verifier and publisher rather than changing an accepted slot in place."),
]

nodes, edges = [], []
def edge(a, b, kind="blocks"):
    item = {"from_key": a, "type": kind}
    item["to_id" if b.startswith("ArchetypeAI-") else "to_key"] = b
    if item not in edges:
        edges.append(item)

def prior(key):
    return BASE_IDS[key]

def add(key, title, purpose, fixtures="", parent=None, kind="task", stage="research", role="domain-owner", writes=None, slots=None, risk="R1", mutation="M0", sources=None, reuse=None, detail="", output="", labels=None, estimate=60):
    reads = ["docs/80-20-plan.md", "docs/plans/first-principles-elevation-beads.md",
             "docs/plans/aaa-v7-architecture-and-agent-sweeps.md",
             "docs/plans/social-creative-practice-beads-plan.json", "src/parts-cartographer/core/ports.ts"]
    refs = list(sources or [])
    reconciliation = list(reuse or [])
    description = (
        f"Purpose: {purpose}\nStep: {title}.\nActions: {detail or purpose}\n"
        f"Deliverable: {output or purpose}\nConcrete scenarios: {fixtures or 'Verify the named scope and its explicit unavailable/denied alternative.'}\n"
        f"Reconcile existing packages: {', '.join(reconciliation) or 'Related parent/foundation outputs; inspect current implementation before writing.'}\n"
        f"Source references: {'; '.join(refs) or 'User-approved 2026-10-06 discussion; source-specific research belongs to linked method/source tasks.'}\n"
        f"Role: {role}. Proposed writes: {', '.join(writes or [f'docs/plans/extension/{key.lower()}/**'])}.\n"
        f"Published predecessor contract versions and immutable base must be resolved before dispatch. Next consumer reads this exact output and applicable evidence.\n{COMMON}"
    )
    acceptance = (
        f"Named deliverable exists and addresses this specific scope: {output or purpose}.\n"
        f"Scenario matrix explicitly covers: {fixtures or purpose}.\n"
        "Relevant normal/unknown/declined/denied/interrupted/quiet states are specified or exercised at this step's depth.\n"
        "Artifact and checks are attributable, source/data provenance is explicit, actual role/write/contract manifest is recorded, and limitations/next handoff are in Beads.\n"
        "Applicable independent, participant, real-service, device, tradition or practitioner evidence is recorded as actual or pending; no plan/prototype becomes an acceptance claim.\n"
    )
    if role == "independent-verifier":
        acceptance += "Independent reviewer owns evidence only; any candidate fix returns to its producer in a linked iteration.\n"
    if role.endswith("publisher"):
        acceptance += "Publication is performed by the authorized owner after required independent review; active protected policy changes use their own governed path.\n"
    item = {
        "key": key, "title": title, "type": kind, "priority": 1 if key.startswith(("B", "V", "COVER")) else 2,
        "description": description, "acceptance_criteria": acceptance,
        "labels": ["roadmap", LABEL, stage, *(labels or [])],
        "metadata": {
            "planning_key": key, "planning_task": PLANNING, "stage": stage, "role": role,
            "base_generation": None, "workcell_status": "proposal_requires_resolved_base_contracts_capabilities_and_lease",
            "read_set": reads, "write_set": writes or [f"docs/plans/extension/{key.lower()}/**"],
            "owned_slots": slots or [], "contract_versions": [], "mutation_class": mutation, "risk_class": risk,
            "source_references": refs, "reuse_packages": reconciliation, "output": output or purpose,
            "estimate_minutes": estimate, "evidence_status": "uncollected",
            "central_writes": "broker-owned app composition, worker routes, rules, shared locales and integration fixtures",
        },
    }
    if parent:
        item["parent"] = parent
    nodes.append(item)

add("EXPANSION", "Social, creative, progression and practice expansion", "Implement and evaluate all additions after the prior elevation plan.", kind="epic", labels=["extension-root"])
edge("EXPANSION", prior("ELEVATION"), "relates_to")
edge("EXPANSION", prior("AAA"), "relates_to")
for key, title in [("PLATFORM", "New logical slots and accountable publication"), ("METHODS", "Source-informed approaches and wisdom traditions"), ("EVIDENCE", "Early external evidence preparation"), ("PILOTS", "Integrated useful-life prototypes"), ("SWEEPS", "Parallel bounded execution sweeps")]:
    add(key, title, title, parent="EXPANSION", kind="epic")
for key, (title, members) in FAMILIES.items():
    add(key, title, title, parent="EXPANSION", kind="epic")

for i, (title, description) in PREPARATIONS.items():
    add(i, f"[{i}] {title}", description, parent="EVIDENCE", kind="epic", labels=["evidence-preparation"])
    for n, (action, output) in enumerate([
        ("Specify consented scope and concrete observation protocol", "protocol with exact tasks, inclusion, withdrawal and minimized data"),
        ("Identify resources, accountable reviewers and available participants", "actual resource/role availability and unanswered prerequisites"),
        ("Prepare reproducible sessions and protected evidence handling", "ready session materials, artifact binding and pending-resource list"),
    ], 1):
        k = f"{i}.S{n:02}"
        add(k, f"[{k}] {action}: {title}", description, parent=i, stage="evidence-preparation",
            role="evidence-preparer", writes=[f"docs/evaluation/extension/preparation/{i.lower()}/s{n:02}/**"],
            detail=action + ". Prepare independently now; actual observations are in scoped leaf tasks. Existing permission is not authorization to send unsolicited messages or spend unapproved money.",
            output=output, reuse=["P01", "P02", "P03", "P04", "P05", "P06"])
        if n > 1:
            edge(k, f"{i}.S{n-1:02}")
        for p in ["P01", "P02", "P03", "P04", "P05", "P06"]:
            edge(k, prior(p), "relates_to")

for k, (title, slot, semantics, oldslots, newslots) in PLATFORMS.items():
    add(k, f"[{k}] {title}", semantics, parent="PLATFORM", kind="epic", slots=[slot])
    for n, (action, output, detail) in enumerate(PLATFORM_STEPS, 1):
        task = f"{k}.S{n:02}"
        role = "independent-verifier" if n == 8 else "authorized-registry-publisher" if n == 9 else "integration-broker" if n == 7 else "slot-owner"
        folder = "evidence" if n == 8 else "contracts" if n == 9 else "integration" if n == 7 else "development"
        writes = [f"architecture/extension/{folder}/{k.lower()}/s{n:02}/**"] if n < 5 or n >= 7 else [f"src/domains/extension/{k.lower()}/**", f"src/adapters/extension/{k.lower()}/**", f"tests/extension/{k.lower()}/**"]
        owned = [f"verification.{slot}"] if n == 8 else [f"registry.{slot}"] if n == 9 else ["integration.broker"] if n == 7 else [slot] if n in [5, 6] else []
        add(task, f"[{task}] {action}: {title}", semantics,
            fixtures=f"Normal and denied grant; stale contract; account change; deleted source; duplicate/cancelled operation; offline/quiet alternative; six compatibility dimensions for {slot}.",
            parent=k, stage="planning" if n < 5 else "independent-review" if n == 8 else "publication" if n == 9 else "implementation",
            role=role, writes=writes, slots=owned, risk="R3" if n >= 5 else "R2",
            mutation="M2" if n in [5, 6, 7, 9] else "M0", output=output, detail=detail, reuse=oldslots, estimate=120)
        if n > 1:
            edge(task, f"{k}.S{n-1:02}")
        if n == 5:
            for p in ["A01.S08", "A04.S08", "A05.S08", "A07.S08"]:
                edge(task, prior(p))
        if n == 6:
            for p in oldslots:
                edge(task, prior(f"{p}.S08"))
        if n == 7:
            edge(task, prior("A09.S08"))
            for p in newslots:
                edge(task, f"{p}.S09")
        if n == 8:
            edge(task, prior("A10.S08"))
        if n == 9:
            edge(task, prior("A05.S08"))
    for p in oldslots:
        edge(k, prior(p), "relates_to")
edge("B05.S07", "B04.S09")

GUARDS = {
    "D01": ("Purpose-specific adult eligibility and private verification", [
        ("Specify per-mode eligibility, unknown denial and adult-minor boundaries", "Eligibility policy separates friendship/practice/creative and optional adult dating; fail closed for unknown/ineligible dating, prevent adult-minor dating discovery, and define legal/account eligibility independent from authored profile/role ages."),
        ("Define minimally retained verification and server-owned eligibility contract", "Versioned eligibility result/provenance/expiry/revocation contract, proportionate verification mechanism, no raw age document in public profile/evidence, and reviewer-approved data minimization."),
        ("Implement server-enforced checks and bounded adapter candidate", "Deterministic eligibility plus server enforcement on discovery, invitation and continuation; client cannot self-grant eligibility or bypass blocked modes."),
        ("Independently verify adversarial eligibility and disclosure cases", "Unknown/ineligible denied, tampered flags, expired proof, purpose switch, authored role age, adult-minor boundary and verification-data privacy checked on exact candidate."),
        ("Publish verified eligibility capability and ingestion receipt", "Authorized broker/registry activation with exact contract, scope, evidence and rollback; unknown or unsupported eligibility remains denied."),
    ]),
    "D02": ("Independently reviewed facilitated-service readiness", [
        ("Specify operator types, service scopes and trial requirements", "Separate peer-hosted/educational, clinical and spiritual services; identify appropriate qualifications, jurisdiction/scope, participant boundaries and source-specific protocol permissions."),
        ("Record actual operator qualifications and bounded protocol", "Accountable operator identity, verified qualification validity/expiry, exact allowed scope, reviewed session protocol, stop/complaint owner and real resource availability; unavailable prerequisites are held."),
        ("Independently review scoped operator readiness", "Appropriate independent reviewer verifies evidence, scope/protocol/source permission, stop/report ownership and participant consent; no mock credential or host badge proves readiness."),
        ("Publish versioned readiness and hold dispositions", "Versioned signed readiness record defines permitted actual trials/offers and explicit unavailable scope; acceptance of a held registry record does not authorize a live trial."),
    ]),
}
for k, (title, steps) in GUARDS.items():
    add(k, f"[{k}] {title}", title, parent="PLATFORM", kind="epic")
    for n, (action, output) in enumerate(steps, 1):
        task = f"{k}.S{n:02}"
        independent = (k == "D01" and n == 4) or (k == "D02" and n == 3)
        publisher = n == len(steps)
        role = "independent-verifier" if independent else "authorized-readiness-publisher" if publisher else "eligibility-owner" if k == "D01" else "operator-readiness-owner"
        add(task, f"[{task}] {action}", title,
            fixtures="Denied/unknown/expired/tampered authority; private verification source; purpose/scope change; actual qualified review; active and held status remain distinct.",
            parent=k, role=role, stage="operational-prerequisite",
            writes=[f"architecture/extension/readiness/{k.lower()}/s{n:02}/**"], slots=[f"verification.{k.lower()}"] if independent else [f"readiness.{k.lower()}"] if publisher else [],
            risk="R3", mutation="M2" if k == "D01" and n in [3, 5] else "M0",
            detail=action, output=output, estimate=90)
        if n > 1:
            edge(task, f"{k}.S{n-1:02}")
        if independent:
            edge(task, prior("A10.S08"))
        if publisher:
            edge(task, prior("A09.S08"))
    if k == "D01":
        for p in ["B01.S09", "B03.S09"]:
            edge(f"{k}.S03", p)
        for p in ["C01.S08", "C08.S08", "A04.S08"]:
            edge(f"{k}.S03", prior(p))
    else:
        edge(f"{k}.S02", "V03.S03")
        edge(f"{k}.S04", "B08.S09")
edge("B02.S06", "D01.S05")

for k, f in FEATURES.items():
    family = next(fam for fam, (_, members) in FAMILIES.items() if k in members)
    reuse = f["reuse"].split(",")
    platforms = f["platforms"].split(",")
    add(k, f"[{k}] {f['title']}", f["purpose"], f["fixtures"], family, "epic", reuse=reuse)
    for old in reuse:
        edge(k, prior(old), "relates_to")
    originals = [".6.1", ".6.2", ".6.3", ".6.4"] if family == "SOCIAL" else [".5.1", ".5.3", ".5.6", ".5.7"] if family in ["CREATIVE", "AUTHORSHIP"] else [".7.1", ".7.2", ".7.3", ".7.4"] if family == "PRACTICES" else [".3.2", ".4.4", ".5.4"]
    for old in originals:
        edge(k, "ArchetypeAI-28h" + old, "relates_to")
    for n, (action, output, detail) in enumerate(FEATURE_STEPS, 1):
        task = f"{k}.S{n:02}"
        stage = "planning" if n <= 4 else "independent-review" if n == 14 else "empirical-evidence" if n == 15 else "acceptance" if n == 16 else "implementation"
        role = "integration-broker" if n in [8, 13] else "independent-verifier" if n == 14 else "participant-evaluator" if n == 15 else "release-decision-owner" if n == 16 else "feature-owner"
        writes = [f"docs/plans/extension/features/{k.lower()}/s{n:02}/**"] if n <= 4 else [f"docs/evaluation/extension/features/{k.lower()}/s{n:02}/**"] if n >= 14 else [f"architecture/extension/integration/{k.lower()}/s{n:02}/**"] if n in [8, 13] else [f"src/features/extension/{k.lower()}/**", f"tests/extension/{k.lower()}/**"]
        owned = ["integration.broker"] if n in [8, 13] else [f"verification.feature.{k.lower()}"] if n == 14 else [f"feature.{k.lower()}"] if 5 <= n <= 12 else []
        add(task, f"[{task}] {action}: {f['title']}", f["purpose"], f["fixtures"], parent=k,
            stage=stage, role=role, writes=writes, slots=owned, risk="R3" if family in ["SOCIAL", "NOTIFY", "AUTHORSHIP"] and n >= 5 else "R2",
            mutation="M2" if 5 <= n <= 12 else "M0", reuse=reuse, detail=detail, output=output, estimate=90)
        predecessors = {1: [], 2: [1], 3: [2], 4: [3], 5: [4], 6: [5], 7: [4], 8: [6, 7], 9: [8], 10: [9], 11: [7], 12: [11], 13: [10, 12], 14: [13], 15: [14], 16: [15]}[n]
        for pred in predecessors:
            edge(task, f"{k}.S{pred:02}")
        if n in [5, 7]:
            edge(task, prior("A04.S08"))
            for p in platforms:
                edge(task, f"{p}.S09")
        if n in [8, 13]:
            edge(task, prior("A09.S08"))
        if n == 14:
            edge(task, prior("A10.S08"))
            edge(task, "V07.S03")
        if n == 15:
            prep = "V02" if family == "SOCIAL" else "V06" if family == "NOTIFY" else "V01" if family in ["CREATIVE", "AUTHORSHIP"] else "V08"
            edge(task, f"{prep}.S03")
            edge(task, "V05.S03")
            if family == "SOCIAL":
                edge(task, "V04.S03")
            if family == "PRACTICES":
                edge(task, "V03.S03")
        if n == 16:
            edge(task, prior("A08.S08"))
            edge(task, prior("A12.S08"))
    for p in platforms:
        edge(k, p, "relates_to")
# Additional actual shared dependencies, attached at consumption rather than audit.
edge("F52.S06", prior("C06.S08"))
edge("F52.S06", prior("A11.S08"))
edge("F54.S06", prior("C07.S08"))
edge("F54.S15", "V03.S03")
edge("F06.S06", "D01.S05")
edge("F06.S10", "D01.S04")
edge("F14.S15", "D02.S04")
edge("F54.S15", "D02.S04")
edge("F38.S06", prior("C09.S08"))

for k, m in METHODS.items():
    sensitive = m["scope"] in ["facilitator-sensitive", "tradition-sensitive", "clinical-inspired"]
    add(k, f"[{k}] {m['title']}", m["mechanism"], m["fixtures"], "METHODS", "epic", sources=[m["source"]], labels=[m["scope"]])
    edge(k, prior("X04" if m["scope"] == "facilitator-sensitive" else "X05"), "relates_to")
    for n, (action, output, detail) in enumerate(METHOD_STEPS, 1):
        task = f"{k}.S{n:02}"
        role = "independent-source-reviewer" if n == 6 else "participant-evaluator" if n == 7 else "authorized-content-publisher" if n == 8 else "integration-broker" if n == 9 else "source-practice-owner"
        folder = "sources" if n <= 4 else "prototypes" if n == 5 else "evidence" if n <= 7 else "publication"
        writes = [f"content/practices/extension/{k.lower()}/releases/**", f"docs/content/extension/publication/{k.lower()}/**"] if n == 8 else [f"architecture/extension/catalog-ingestion/{k.lower()}/**"] if n == 9 else [f"docs/content/extension/{folder}/{k.lower()}/s{n:02}/**"] if n != 5 else [f"content/practices/extension/{k.lower()}/candidate/**", f"tests/content/extension/{k.lower()}/**"]
        owned = [f"catalog.entry.{k.lower()}"] if n == 8 else ["integration.content-catalog"] if n == 9 else [f"candidate.practice.{k.lower()}"] if n == 5 else []
        add(task, f"[{task}] {action}: {m['title']}", m["mechanism"], m["fixtures"], parent=k,
            stage="source-research" if n <= 4 else "prototype" if n == 5 else "source-review" if n == 6 else "empirical-evidence" if n == 7 else "content-publication" if n == 8 else "catalog-integration",
            role=role, writes=writes, slots=owned, risk="R3" if sensitive and n >= 5 else "R2",
            mutation="M2" if n in [5, 8, 9] else "M0", sources=[m["source"]],
            detail=detail + f" Source scope is {m['scope']}; named consumers: {m['consumers']}.", output=output,
            labels=[m["scope"]], estimate=90)
        if n > 1:
            edge(task, f"{k}.S{n-1:02}")
        if n == 5:
            edge(task, "B08.S09")
            edge(task, "B09.S09")
            edge(task, prior("A04.S08"))
        if n == 6:
            edge(task, "V03.S03")
            edge(task, prior("A10.S08"))
        if n == 7:
            edge(task, "V01.S03")
            edge(task, "V07.S03")
        if n == 8:
            edge(task, "B08.S09")
        if n == 9:
            edge(task, "B08.S09")
            edge(task, prior("A09.S08"))
    for consumer in m["consumers"].split(","):
        edge(consumer, k, "relates_to")

PILOT_STEPS = [
    ("Reconcile constituents and choose exact useful-life outcome", "reuse/gap map and outcome"),
    ("Specify integrated journey, simpler comparator and available evidence", "protocol and task-matched comparison"),
    ("Freeze constituent contract/source versions and integration manifest", "generation-bound manifest"),
    ("Compose initial deterministic and accessible candidate", "broker-produced candidate"),
    ("Verify cross-feature authority, provenance and state consistency", "boundary verification"),
    ("Exercise interruption, revocation, absence and recovery", "composed recovery evidence"),
    ("Refine Felt craft, pacing, humor and quiet equivalence", "authored composed experience"),
    ("Recompose final pilot and verify EN/RU/access applicability", "final broker digest, locale and access findings"),
    ("Obtain independent exact-generation comparison", "independent critic report"),
    ("Observe actual users/accounts/devices and useful outcomes", "consented real evidence"),
    ("Resolve largest remaining gap through linked iteration", "new broker-composed candidate or accurately recorded unmet prerequisite"),
    ("Repeat independent verification after any iteration", "fresh independent evidence bound to final candidate and affected real observations"),
    ("Record scoped acceptance and next-base handoff", "release disposition and reusable artifacts"),
]
for k, (title, features, methods, purpose) in PILOTS.items():
    add(k, f"[{k}] {title}", purpose, parent="PILOTS", kind="epic")
    for n, (action, output) in enumerate(PILOT_STEPS, 1):
        task = f"{k}.S{n:02}"
        role = "integration-broker" if n in [4, 5, 6, 7, 8, 11] else "independent-verifier" if n in [9, 12] else "participant-evaluator" if n == 10 else "pilot-owner"
        add(task, f"[{task}] {action}: {title}", purpose,
            fixtures=f"Exact feature set {', '.join(features)}; reviewed methods {', '.join(methods)}; normal/declined/revoked/interrupted/quiet result.",
            parent=k, stage="integrated-pilot", role=role,
            writes=[f"architecture/extension/pilots/{k.lower()}/s{n:02}/**"] if n < 9 else [f"docs/evaluation/extension/pilots/{k.lower()}/s{n:02}/**"],
            slots=["integration.broker"] if n in [4, 5, 6, 7, 8, 11] else [f"verification.pilot.{k.lower()}"] if n in [9, 12] else [],
            mutation="M2" if n in [4, 7, 11] else "M0", risk="R3", detail=action,
            output=output, estimate=90)
        if n > 1:
            edge(task, f"{k}.S{n-1:02}")
        if n == 3:
            for f in features:
                edge(task, f"{f}.S13")
            for m in methods:
                edge(task, f"{m}.S09")
        if n == 4:
            edge(task, prior("A09.S08"))
        if n in [9, 12]:
            edge(task, prior("A10.S08"))
        if n == 10:
            for v in ["V01", "V04", "V05", "V07", "V08"]:
                edge(task, f"{v}.S03")
        if n == 13:
            edge(task, prior("A12.S08"))

SWEEPS = [
    ("W01", "Reconcile coverage and prepare source/user evidence", ["B01.S04", "B08.S04", "V01.S03", "V03.S03"]),
    ("W02", "Publish isolated extension slots and compatibility suites", [f"{b}.S09" for b in PLATFORMS]),
    ("W03", "Compose theme spaces, discovery and relational support", ["F01.S13", "F06.S13", "F10.S13", "F13.S13"]),
    ("W04", "Compose reminders, creative continuity and authored presentation", ["F21.S13", "F30.S13", "F34.S13", "F36.S13"]),
    ("W05", "Compose progression, reviewed practices and group participation", ["F39.S13", "F49.S13", "F51.S13", "F55.S13"]),
    ("W06", "Verify six integrated pilot journeys", [f"{j}.S13" for j in PILOTS]),
    ("W07", "Record scoped activation evidence and next largest gaps", [f"{j}.S13" for j in PILOTS]),
]
for k, title, joins in SWEEPS:
    add(k, f"[{k}] {title}", title, parent="SWEEPS", kind="epic")
    for n, (action, role) in enumerate([
        ("Resolve eligible antichain, exact bases and live leases", "development-scheduler"),
        ("Collect selected immutable outputs and integration decisions", "integration-broker"),
        ("Independently verify handoff and next scoped base", "independent-verifier"),
    ], 1):
        task = f"{k}.S{n:02}"
        add(task, f"[{task}] {action}: {title}", title, parent=k, stage="agent-sweep", role=role,
            writes=[f"architecture/extension/sweeps/{k.lower()}/s{n:02}/**"],
            slots=["development.scheduler" if n == 1 else "integration.broker" if n == 2 else "verification.sweep"],
            output="attributable eligible tasks, lease/conflict decisions, accepted/rejected output digests, evidence limitations and next handoff",
            detail="Sweep tags are advisory. Actual readiness, available capacity and conflicts govern dispatch. No leaf waits for a whole sweep; use successive finite rounds.", risk="R3")
        if n > 1:
            edge(task, f"{k}.S{n-1:02}")
        if n == 2:
            for p in joins:
                edge(task, p)
        if n == 1:
            edge(task, prior("A03.S08"))
        if n == 3:
            edge(task, prior("A10.S08"))

for n, title in enumerate([
    "Verify every conversation proposal has explicit live scope and reuse lineage",
    "Validate global blocker DAG, publication roles and symmetric ownership conflicts",
    "Publish independent plan review, ready-task handoff and synchronized artifacts",
], 1):
    k = f"COVER.S{n:02}"
    add(k, f"[{k}] {title}", title, parent="EXPANSION", stage="planning-validation",
        role="independent-verifier" if n < 3 else "planning-publisher",
        writes=[f"docs/evaluation/extension/planning/s{n:02}/**"], output="independent plan audit and concrete corrective findings", estimate=60)
    if n > 1:
        edge(k, f"COVER.S{n-1:02}")

# Pin predecessor artifacts explicitly; a verifier's baseline read set alone is insufficient.
by_key = {n["key"]: n for n in nodes}
for e in edges:
    if e["type"] == "blocks":
        m = by_key[e["from_key"]]["metadata"]
        producer = e.get("to_key", e.get("to_id"))
        m.setdefault("immutable_inputs", []).append({
            "producer": producer, "required": True,
            "binding": "resolve accepted artifact/contract digest and generation before dispatch",
        })
for n in nodes:
    k, m = n["key"], n["metadata"]
    if n["type"] != "task":
        continue
    if k.startswith("F") and k.endswith(".S14"):
        m["candidate_artifact_from"] = k.split(".")[0] + ".S13"
    elif k.startswith("B") and k.endswith(".S08"):
        m["candidate_artifact_from"] = k.split(".")[0] + ".S07"
    elif k.startswith("M") and k.endswith((".S06", ".S07", ".S08")):
        m["candidate_artifact_from"] = k.split(".")[0] + ".S05"
    elif k.startswith("M") and k.endswith(".S09"):
        m["candidate_artifact_from"] = k.split(".")[0] + ".S08"
    elif k.startswith("J") and k.endswith(".S09"):
        m["candidate_artifact_from"] = k.split(".")[0] + ".S08"
    elif k.startswith("J") and k.endswith(".S12"):
        m["candidate_artifact_from"] = k.split(".")[0] + ".S11"

def overlap(a, b):
    a, b = a.split("*", 1)[0].rstrip("/"), b.split("*", 1)[0].rstrip("/")
    return a == b or a.startswith(b + "/") or b.startswith(a + "/")

tasks = [n for n in nodes if n["type"] == "task"]
conflicts = []
for i, a in enumerate(tasks):
    ma = a["metadata"]
    for b in tasks[i + 1:]:
        mb = b["metadata"]
        common = sorted(set(ma["owned_slots"]) & set(mb["owned_slots"]))
        paths = any(overlap(x, y) for x in ma["write_set"] for y in mb["write_set"])
        if common or paths:
            conflicts.append({"a": a["key"], "b": b["key"], "reason": "owned-slot overlap" if common else "proposed write-set overlap", "shared_slots": common})
cross_conflicts = []
for a in tasks:
    ma = a["metadata"]
    for b in BASE["graph"]["nodes"]:
        if b["type"] != "task":
            continue
        mb = b.get("metadata", {})
        common = sorted(set(ma["owned_slots"]) & set(mb.get("owned_slots", [])))
        paths = any(overlap(x, y) for x in ma["write_set"] for y in mb.get("write_set", []))
        if common or paths:
            cross_conflicts.append({"a": a["key"], "b": BASE_IDS[b["key"]], "baseline_key": b["key"],
                                    "reason": "owned-slot overlap" if common else "proposed write-set overlap",
                                    "shared_slots": common})

coverage = []
for k, f in FEATURES.items():
    coverage.append({"key": k, "discussion_requirement": f["purpose"], "title": f["title"], "tasks": [f"{k}.S{n:02}" for n in range(1, 17)], "reuses": f["reuse"].split(",")})
for k, m in METHODS.items():
    coverage.append({"key": k, "discussion_requirement": m["mechanism"], "title": m["title"], "scope": m["scope"], "consumers": m["consumers"].split(","), "tasks": [f"{k}.S{n:02}" for n in range(1, 10)]})

def validate_snapshot():
    keys = [node["key"] for node in nodes]
    key_set = set(keys)
    assert len(keys) == len(key_set), "duplicate node keys"
    edge_keys = []
    blockers = {key: set() for key in key_set}
    indegree = {key: 0 for key in key_set}
    for item in nodes:
        if item.get("parent_key") is not None:
            assert item["parent_key"] in key_set, f"missing parent for {item['key']}"
    for item in edges:
        assert item["from_key"] in key_set, f"missing edge source {item['from_key']}"
        assert ("to_key" in item) != ("to_id" in item), f"edge needs one target: {item}"
        if "to_key" in item:
            assert item["to_key"] in key_set, f"missing edge target {item['to_key']}"
        edge_id = (item["from_key"], item.get("to_key", item.get("to_id")), item["type"])
        edge_keys.append(edge_id)
        if item["type"] == "blocks" and "to_key" in item:
            source, target = item["from_key"], item["to_key"]
            if target not in blockers[source]:
                blockers[source].add(target)
                indegree[target] += 1
    assert len(edge_keys) == len(set(edge_keys)), "duplicate dependency tuples"
    ready = [key for key, degree in indegree.items() if degree == 0]
    visited = 0
    while ready:
        key = ready.pop()
        visited += 1
        for target in blockers[key]:
            indegree[target] -= 1
            if indegree[target] == 0:
                ready.append(target)
    assert visited == len(key_set), "blocking dependency cycle"
    covered = {task for entry in coverage for task in entry["tasks"]}
    assert covered <= key_set, f"coverage references missing nodes: {sorted(covered - key_set)[:10]}"
    assert len(FEATURES) == 55 and len(METHODS) == 57 and len(PLATFORMS) == 12
    assert len({(item["a"], item["b"]) for item in conflicts}) == len(conflicts)
    assert len({(item["a"], item["b"]) for item in cross_conflicts}) == len(cross_conflicts)
    return {
        "status": "passed",
        "unique_node_keys": len(key_set),
        "unique_dependency_tuples": len(edge_keys),
        "blocking_dag_acyclic": True,
        "local_parent_and_edge_targets_resolve": True,
        "coverage_task_targets_resolve": True,
        "feature_packages": len(FEATURES),
        "method_packages": len(METHODS),
        "platform_packages": len(PLATFORMS),
        "external_bead_ids_requiring_live_check": sorted({item["to_id"] for item in edges if "to_id" in item}),
    }

structural_validation = validate_snapshot()
previous = json.loads(PLAN_PATH.read_text()) if PLAN_PATH.exists() else {}
plan = {
    "schema_version": 1, "prepared_date": DATE, "client_timezone": "Asia/Jerusalem",
    "planning_bead": PLANNING, "authority": "Beads; planning snapshot, not live status",
    "baseline": {"existing_records": 688, "existing_product_root": prior("ELEVATION"), "existing_architecture_root": prior("AAA"), "architecture_source": BASE["source"], "immutable_generation": None},
    "scope": "All subsequent discussion additions: social/shared-experience/matching/reminders/neurodivergent creative/plural accommodations/games/modalities/wisdom/lesser-known approaches.",
    "graph": {"nodes": nodes, "edges": edges}, "conflicts": conflicts, "cross_plan_conflicts": cross_conflicts, "coverage": coverage,
    "features": FEATURES, "platforms": PLATFORMS, "methods": METHODS, "preparations": PREPARATIONS,
    "pilots": PILOTS, "sweeps": SWEEPS, "families": FAMILIES, "operational_guards": GUARDS,
    "counts": {"nodes": len(nodes), "tasks": len(tasks), "epics": len(nodes) - len(tasks), "dependencies": len(edges), "proposed_conflicts": len(conflicts),
               "feature_packages": len(FEATURES), "method_packages": len(METHODS), "platform_packages": len(PLATFORMS),
               "cross_plan_conflicts": len(cross_conflicts)},
    "beads_ids": previous.get("beads_ids", {}),
    "validation": {**previous.get("validation", {}), "structural": structural_validation},
    "dispatch": "Published predecessor versions, immutable workcell isolation, exact writes/capabilities and live leases required; ready does not establish safe concurrent writes.",
}
OUT.mkdir(parents=True, exist_ok=True)
PLAN_PATH.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + "\n")
Path("/tmp/social-extension-create-graph.json").write_text(json.dumps(plan["graph"], ensure_ascii=False, indent=2) + "\n")
(OUT / "social-creative-practice-coverage.json").write_text(json.dumps(coverage, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(plan["counts"]))
