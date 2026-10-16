# E18.01 audit: Device comfort and economy

- Bead: `ArchetypeAI-l8d0` (E18.01). Tracker status at audit: open.
- Checked at: HEAD `b60e65d`, regenerated after an independent review of the first version.
- Disposition: **candidate audit, awaiting a second independent review.** Read-only. No implementation changed. No acceptance is claimed.
- Method: file inventory, test-name listing, mount search, and the bead's own scenario list. The gap notes in §5 are judgement, not measurement.

## 1. Existing code

| Item | Path | Tests |
| --- | --- | --- |
| Pure step module | `src/parts-cartographer/elevation/e18-device-envelope.ts` | 14 in 1 spec file(s) |
| Panel | `src/parts-cartographer/screens/elevation/e18-device.jsx` | 2 (spec files: e18-device.spec.ts) |
| Mounted in | `src/parts-cartographer/screens/cabinet.jsx` | - |
| Storage key | `INNERVERSE_DEVICE_ENVELOPE_V1` | - |

## 2. Observable scenarios from the bead

| Scenario (from the bead) | Evidence today |
| --- | --- |
| Declare actual handset/OS/network, run repeated entry/background/resume, measure long tasks/frame/memory/heat within available method, and keep complete static alternative. | Not mapped one-to-one in this audit (see §3) |

## 3. Module test names (first eight)

- accepts only an allow-listed metric with a finite in-range value
- rejects any extra field, so a free-text line never enters local instrumentation
- sends only a bucket label to the existing telemetry store, never a raw value
- keeps bounded per-metric buffers and drops the oldest values first
- recovers sustained heat without inventing a reading: no samples is pending no-run, and heat stays pending with
- declares the envelope only with handset, OS, browser and network, and reports invalid labels as pending
- observations without a complete envelope are not device evidence, and no frozen budget never reads as within
- repeated entry and exit counts each entry, ignores a second enter while mounted, and disposes on exit

## 4. Input beads and their status

| Bead | Title | Status |
| --- | --- | --- |
| `ArchetypeAI-28h.2.9` | Complete accessible map alternatives and graphics lifecycle recovery | open |
| `ArchetypeAI-28h.2.18` | Finish bilingual, sensory, accessibility, real-device and intuitive core acceptance | open |
| `ArchetypeAI-28h.2.24` | Validate real therapist 3+1 analysis and plush-cosmos visual grammar | open |
| `ArchetypeAI-28h.7.4` | Complete localized content versions, durability and performance acceptance | in_progress |

## 5. Gaps (judgement, not measurement)

- The device is declared, but no measurement run has been made. Every measure is pending.
- Real device runs need a physical phone, which is not available here.

## 6. Smallest useful slice (educated guess)

Keep. Record the measurement method and leave the runs pending on real hardware.

## 7. Pending evidence (not claimed)

- Participant, device, assistive-technology and native-language evidence: **pending**.
- Independent review of this audit: **pending** (the first review found errors, now corrected; a second review is needed).
