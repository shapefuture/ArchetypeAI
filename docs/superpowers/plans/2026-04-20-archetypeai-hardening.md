# ArchetypeAI Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove product drift, fix broken template bindings, harden async/error flows, and make the UI feel stable on mobile and desktop.

**Architecture:** Keep the root app as the screen-level orchestrator, let feature panels own their local interaction state, and move every user-visible fallback through the translation layer. Fix class binding misuse with `ngClass`, add visible error/retry paths where failures are currently silent, and keep the generated/report outputs semantically aligned with what the UI promises.

**Tech Stack:** Angular 20, TypeScript, Tailwind CSS, Jasmine/Karma, DOMPurify, marked

---

## Chunk 1: State and Flow Cleanup

**Files:**
- Modify: `src/app.component.ts`
- Modify: `src/app.component.html`
- Modify: `src/app.component.spec.ts`
- Modify: `src/app/features/assessment-panel/assessment-panel.component.ts`
- Modify: `src/app/features/assessment-panel/assessment-panel.component.html`
- Modify: `src/app/features/assessment-panel/assessment-panel.component.spec.ts` (create if needed)

- [x] **Step 1: Write the failing tests**
- [x] **Step 2: Remove stale root assessment navigation state**
- [x] **Step 3: Keep assessment ownership in the feature panel**
- [ ] **Step 4: Run targeted tests**
- [ ] **Step 5: Mark chunk complete**

## Chunk 2: Template Binding and Motion Fixes

**Files:**
- Modify: `src/app.component.html`
- Modify: `src/app/features/results-panel/results-panel.component.html`
- Modify: `src/app/features/synastry-panel/synastry-panel.component.html`
- Modify: `src/app/features/landing/landing.component.html`
- Modify: `src/app/shared/components/blob-character/blob-character.component.ts`
- Modify: `src/app/shared/components/wisdom-owl/wisdom-owl.component.ts`
- Modify: `src/index.css`
- Modify: `src/styles/animations.css`

- [x] **Step 1: Replace broken `[class]` string bindings with `ngClass`**
- [x] **Step 2: Normalize shared component wrapper classes**
- [x] **Step 3: Tighten responsive spacing and mobile nav behavior**
- [ ] **Step 4: Smooth the most visible transitions/animations**
- [ ] **Step 5: Mark chunk complete**

## Chunk 3: Async Safety and Error Paths

**Files:**
- Modify: `src/app.component.ts`
- Modify: `src/app/features/results-panel/results-panel.component.ts`
- Modify: `src/app/features/synastry-panel/synastry-panel.component.ts`
- Modify: `src/services/gemini.service.ts`
- Modify: `src/services/translation.service.ts`
- Modify: `src/services/gemini.service.spec.ts`
- Modify: `src/services/translation.service.spec.ts`

- [x] **Step 1: Add visible error states and retry-safe loading guards**
- [x] **Step 2: Make universe init and backup restore fail closed**
- [x] **Step 3: Make AI/timeouts/messages use localized fallbacks**
- [x] **Step 4: Stabilize scoring mode toggles and persistence**
- [x] **Step 5: Mark chunk complete**

## Chunk 4: Copy, Exports, and Dead Data

**Files:**
- Modify: `src/i18n/translations.ts`
- Modify: `src/app/features/landing/landing.component.ts`
- Modify: `src/app/features/coach-panel/coach-panel.component.ts`
- Modify: `src/app/features/coach-panel/README.md`
- Modify: `README.md`

- [x] **Step 1: Remove dead landing placeholders**
- [x] **Step 2: Rename misleading export/mode labels**
- [x] **Step 3: Localize hardcoded runtime strings**
- [x] **Step 4: Align setup docs with real runtime requirements**
- [x] **Step 5: Mark chunk complete**

## Chunk 5: Verify

**Files:**
- Modify: `src/app.component.spec.ts`
- Modify: `src/app/shared/components/blob-character/blob-character.component.spec.ts`
- Modify: `src/services/webxr.service.spec.ts`

- [x] **Step 1: Update/extend tests for the new behavior**
- [ ] **Step 2: Run typecheck**
- [ ] **Step 3: Run unit tests**
- [ ] **Step 4: Fix any regressions**
- [ ] **Step 5: Mark plan done**
