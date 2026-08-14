# Archetype Descriptions — 3D Map (ArchetypeAI Universe)

This document catalogs all **24 archetypes** hardcoded in the 3D relational map
(`ALL_ARCHETYPES` constant in `src/services/webxr.service.ts`). Each archetype
is a node in a 4-dimensional conceptual space, rendered as a Three.js sphere
in the interactive universe. The same fields are exposed to the UI via
`src/i18n/translations.ts` (with parallel Russian translations for `name`,
`description`, `quality`, `wound`, `shadow`, `invitation`, `coreBelief`,
`attracts`, and `integratedForm`).

Source of truth: `src/services/webxr.service.ts` (lines 56–636).

---

## The 4 Dimensions

Every archetype sits at a point in this 4D space, scaled by `POSITION_SCALE = 10`.

| # | Axis          | Range | Hypo pole (−1) | Hyper pole (+1) |
|---|---------------|-------|----------------|-----------------|
| 0 | **AGENCY**    | −1…+1 | Active         | Receptive       |
| 1 | **TEMPERATURE** | −1…+1 | Cool           | Hot             |
| 2 | **FOCUS**     | −1…+1 | Self           | Other           |
| 3 | **ATTACHMENT** | −1…+1 | Avoidant       | Anxious         |

The universe can be orbited freely, and any single axis can be **isolated** so
the camera reframes the map onto that dimension's plane.

---

## Cluster Map

The 24 archetypes are grouped into **1 gift cluster** (integrated / mature
patterns) and **5 shadow clusters** (defensive patterns).

| Cluster ID                          | Cluster Name              | Count |
|-------------------------------------|---------------------------|-------|
| `gift_archetypes`                   | Gift Archetypes           | 4     |
| `control_shadows`                   | The Control Shadows       | 4     |
| `emotional_storm_shadows`           | The Emotional Storm Shadows | 4   |
| `avoidant_intellectual_shadows`     | The Avoidant Intellectual Shadows | 4 |
| `anxious_connection_shadows`        | The Anxious Connection Shadows | 4 |
| `seductive_avoidance_shadows`       | The Seductive Avoidance Shadows | 4 |

---

# 1. Gift Archetypes (4)

These are integrated, psychologically mature patterns — the destination
points on each shadow archetype's developmental path.

## 💎 The Sovereign

> *"I am the source of my experience. My internal state creates my external reality."*

| Field         | Value |
|---------------|-------|
| **Cluster**   | `gift_archetypes` |
| **Quality**   | Clarity & Precision |
| **Description** | Master of context-appropriate expression |
| **Core Belief** | I am the source of my experience. My internal state creates my external reality. |
| **Invitation** | To balance clarity with compassion and control with surrender |
| **Shadow**    | Can become rigid or controlling when threatened |
| **Attracts**  | Other sovereign beings for co-creation and conscious relationship |

**Coordinates:** `[AGENCY −0.2, TEMP +0.1, FOCUS −0.1, ATTACH −0.1]`
*(slightly Active, very Cool, very Self-focused, very Avoidant — the centered pole of the map, animated specially during the genesis fly-in)*

**Color / Symbol:** `#4A90E2` · 💎 · Size 0.80

---

## 🌊 The Relational Fluent

> *"Connection and autonomy are a dance, not a conflict. I can move between them with grace."*

| Field         | Value |
|---------------|-------|
| **Cluster**   | `gift_archetypes` |
| **Quality**   | Adaptability & Flow |
| **Description** | Flows seamlessly between connection and autonomy |
| **Core Belief** | Connection and autonomy are a dance, not a conflict. I can move between them with grace. |
| **Invitation** | To maintain core self while flowing with relational currents |
| **Shadow**    | Can lose center in turbulent relationships |
| **Attracts**  | Partners who value both deep intimacy and healthy independence |

**Coordinates:** `[AGENCY +0.3, TEMP +0.2, FOCUS +0.2, ATTACH +0.1]`
*(mildly Receptive, mildly Hot, mildly Other-focused, mildly Anxious — the only gift archetype leaning toward Other)*

**Color / Symbol:** `#00B4D8` · 🌊 · Size 0.85

---

## 🎨 The Embodied Wisdom

> *"My body is an intelligent guide. True knowing comes from integrating mind, heart, and gut."*

| Field         | Value |
|---------------|-------|
| **Cluster**   | `gift_archetypes` |
| **Quality**   | Grounded Presence & Emotional Intelligence |
| **Description** | Grounded presence with emotional intelligence |
| **Core Belief** | My body is an intelligent guide. True knowing comes from integrating mind, heart, and gut. |
| **Invitation** | To trust bodily wisdom while maintaining healthy energetic boundaries |
| **Shadow**    | Can become overwhelmed by others' emotional states |
| **Attracts**  | Those ready for deep, present intimacy beyond surface connection |

**Coordinates:** `[AGENCY +0.1, TEMP +0.4, FOCUS +0.3, ATTACH −0.2]`
*(mildly Receptive, very Hot, Other-focusing, mildly Avoidant — the most "warm" gift, anchored in sensation)*

**Color / Symbol:** `#FF6B6B` · 🎨 · Size 0.90 (largest gift)

---

## 🌳 The Creative Synthesis

> *"All parts of me are valuable. By integrating my shadows and gifts, I create new possibilities."*

| Field         | Value |
|---------------|-------|
| **Cluster**   | `gift_archetypes` |
| **Quality**   | Generative Innovation |
| **Description** | Innovates relational patterns from center |
| **Core Belief** | All parts of me are valuable. By integrating my shadows and gifts, I create new possibilities. |
| **Invitation** | To balance innovation with appreciation for what already works |
| **Shadow**    | Can over-complicate simple relationships |
| **Attracts**  | Collaborators who see challenges as creative opportunities |

**Coordinates:** `[AGENCY −0.1, TEMP +0.3, FOCUS −0.2, ATTACH +0.2]`
*(centred Agency, warm, Self-focused, mildly Anxious — the integrator archetype)*

**Color / Symbol:** `#38B000` · 🌳 · Size 0.75

---

# 2. Shadow Archetypes (20)

## Cluster: `control_shadows` — The Control Shadows

> Roots: active, cool, self-focused control dynamics.

### ⚔️ The Tyrant

> *"The world is unsafe. I must control everything and everyone to protect myself."*

| Field        | Value |
|--------------|-------|
| **Wound**    | Hyper-control, cannot receive |
| **Shadow**   | Domination & Rigidity |
| **Invitation** | To release control and learn to receive |
| **Core Belief** | The world is unsafe. I must control everything and everyone to protect myself. |
| **Attracts** | Rebels who challenge their power or The Doormat who submit to it |
| **Integrated Path** | Tyrant → Guardian → Sovereign |

**Coordinates:** `[AGENCY −0.9, TEMP −0.8, FOCUS −0.9, ATTACH −0.7]`
*(deep Active, deep Cool, deep Self-focus, deep Avoidant — the extreme negative corner)*

**Color / Symbol:** `#6A040F` · ⚔️ · Size 0.60

---

### ⚙️ The Perfectionist

> *"I am only valuable if I am flawless. My mistakes are proof of my unworthiness."*

| Field        | Value |
|--------------|-------|
| **Wound**    | Rigid control masking deep insecurity |
| **Shadow**   | Paralyzing Self-Criticism |
| **Invitation** | To embrace 'good enough' and the beauty of imperfection |
| **Core Belief** | I am only valuable if I am flawless. My mistakes are proof of my unworthiness. |
| **Attracts** | Critics who mirror their inner judge, or partners they feel they can 'fix' |
| **Integrated Path** | Perfectionist → Analyst → Creative Synthesis |

**Coordinates:** `[AGENCY −0.8, TEMP −0.7, FOCUS −0.8, ATTACH +0.6]`
*(deep Active, deep Cool, deep Self-focus, strong Anxious — internalised self-criticism)*

**Color / Symbol:** `#6D6875` · ⚙️ · Size 0.55

---

### 🏹 The Guardian

> *"Love means protecting others from pain, even if it means walling off my own heart."*

| Field        | Value |
|--------------|-------|
| **Wound**    | Protective but emotionally unavailable |
| **Shadow**   | Emotional Unavailability |
| **Invitation** | To find safety in vulnerability and authentic connection |
| **Core Belief** | Love means protecting others from pain, even if it means walling off my own heart. |
| **Attracts** | People who feel unsafe or need rescuing, reinforcing their protector role |
| **Integrated Path** | Guardian → Anchor → Sovereign |

**Coordinates:** `[AGENCY −0.7, TEMP −0.6, FOCUS +0.7, ATTACH −0.8]`
*(strong Active, cool, strong Other-focus — yet deep Avoidant — the contradictory "selfless" protector)*

**Color / Symbol:** `#1B9AAA` · 🏹 · Size 0.65

---

### 🛡️ The Sentinel

> *"Confuses protection with love — if I keep everyone safe, I don't have to feel my own vulnerability."*

| Field        | Value |
|--------------|-------|
| **Wound**    | Over-protects others while remaining emotionally distant |
| **Shadow**   | Strategic Distance |
| **Invitation** | To learn that vulnerability is the gateway to true intimacy |
| **Core Belief** | Confuses protection with love - if I keep everyone safe, I don't have to feel my own vulnerability. |
| **Attracts** | Partners who need constant protection, validating their defensive posture |
| **Integrated Path** | Sentinel → Embodied Wisdom |

**Coordinates:** `[AGENCY −0.6, TEMP −0.4, FOCUS +0.9, ATTACH −0.9]`
*(Active, cool, the most Other-focused archetype in the universe, deepest Avoidant — the wall)*

**Color / Symbol:** `#7F8C8D` · 🛡️ · Size 0.60

---

## Cluster: `emotional_storm_shadows` — The Emotional Storm Shadows

> Roots: active, hot, self-focused emotional intensity.

### 🌋 The Tempest

> *"My emotions are overwhelming and dangerous. I must push people away before I destroy them."*

| Field        | Value |
|--------------|-------|
| **Wound**    | Volcanic emotions with intimacy avoidance |
| **Shadow**   | Reactive Emotionality |
| **Invitation** | To find the ground within the storm and respond with intention |
| **Core Belief** | My emotions are overwhelming and dangerous. I must push people away before I destroy them. |
| **Attracts** | Calm, avoidant partners they try to provoke, or anxious partners who fuel drama |
| **Integrated Path** | Tempest → Wild → Embodied Wisdom |

**Coordinates:** `[AGENCY −0.9, TEMP +0.9, FOCUS −0.8, ATTACH −0.6]`
*(deep Active, deep Hot, Self-focused, Avoidant — burning alone)*

**Color / Symbol:** `#9D0208` · 🌋 · Size 0.95

---

### 🔥 The Destroyer

> *"If I feel threatened or abandoned, I must burn everything to the ground to regain power."*

| Field        | Value |
|--------------|-------|
| **Wound**    | Uncontained emotional fire |
| **Shadow**   | Uncontrolled Destruction |
| **Invitation** | To channel intense energy into creative, not destructive, acts |
| **Core Belief** | If I feel threatened or abandoned, I must burn everything to the ground to regain power. |
| **Attracts** | Partners who trigger abandonment wounds, creating self-fulling destruction |
| **Integrated Path** | Destroyer → Creative Synthesis |

**Coordinates:** `[AGENCY −0.95, TEMP +0.95, FOCUS −0.9, ATTACH +0.8]`
*(extreme Active, extreme Hot, extreme Self-focus, strong Anxious — the volatile corner, also the largest blob in the universe)*

**Color / Symbol:** `#DC2F02` · 🔥 · Size 1.00 *(largest archetype)*

---

### ⚔️ The Crusader *(second ⚔️)*

> *"Focusing on a grand cause allows me to avoid the terrifying vulnerability of personal intimacy."*

| Field        | Value |
|--------------|-------|
| **Wound**    | Fights for causes to avoid intimacy |
| **Shadow**   | Externalized Purpose |
| **Invitation** | To find a cause worthy of passion within one's own heart |
| **Core Belief** | Focusing on a grand cause allows me to avoid the terrifying vulnerability of personal intimacy. |
| **Attracts** | Followers for their cause, or partners willing to take backseat to mission |
| **Integrated Path** | Crusader → Relational Fluent |

**Coordinates:** `[AGENCY −0.8, TEMP +0.8, FOCUS +0.7, ATTACH −0.5]`
*(Active, Hot, strongly Other-focusing, Avoidant — passion outsourced to a mission)*

**Color / Symbol:** `#D00000` · ⚔️ · Size 0.85

---

### ⚡ The Rebel

> *"All rules are prisons. If I conform in any way, I lose myself completely."*

| Field        | Value |
|--------------|-------|
| **Wound**    | Rejects all structure and authority, including healthy boundaries |
| **Shadow**   | Chronic Opposition |
| **Invitation** | To distinguish between oppressive control and healthy structure |
| **Core Belief** | All rules are prisons. If I conform in any way, I lose myself completely. |
| **Attracts** | Controllers they can rebel against, or followers who admire their defiance |
| **Integrated Path** | Rebel → Creative Synthesis |

**Coordinates:** `[AGENCY −0.9, TEMP +0.5, FOCUS −0.9, ATTACH +0.3]`
*(deep Active, mildly Hot, deep Self-focus, mildly Anxious — the reactive opposer)*

**Color / Symbol:** `#7209B7` · ⚡ · Size 0.75

---

## Cluster: `avoidant_intellectual_shadows` — The Avoidant Intellectual Shadows

> Roots: receptive, cool, self-focused strategies of withdrawal and analysis.

### 👻 The Ghost

> *"To be seen is to be annihilated. The only safety is in complete invisibility."*

| Field        | Value |
|--------------|-------|
| **Wound**    | Complete emotional withdrawal |
| **Shadow**   | Radical Unavailability |
| **Invitation** | To risk being seen in one's true form, even if it feels unsafe |
| **Core Belief** | To be seen is to be annihilated. The only safety is in complete invisibility. |
| **Attracts** | Anxious partners who chase them, reinforcing need to disappear |
| **Integrated Path** | Ghost → Ice Queen → Oracle |

**Coordinates:** `[AGENCY +0.9, TEMP −0.9, FOCUS −0.9, ATTACH −0.8]`
*(deep Receptive, deep Cool, deep Self-focus, deep Avoidant — the vanishing pole)*

**Color / Symbol:** `#B8B8B8` · 👻 · Size 0.50 *(smallest archetype after Ice Queen)*

---

### ❄️ The Ice Queen

> *"Feelings are weakness. I built these walls of ice to protect a heart that feels too much."*

| Field        | Value |
|--------------|-------|
| **Wound**    | Complete emotional shutdown and isolation |
| **Shadow**   | Frozen Heart |
| **Invitation** | To allow the first crack in the ice and feel the warmth of connection |
| **Core Belief** | Feelings are weakness. I built these walls of ice to protect a heart that feels too much. |
| **Attracts** | Passionate partners who try to 'melt' them, confirming emotions are invasive |
| **Integrated Path** | Ice Queen → Embodied Wisdom |

**Coordinates:** `[AGENCY +0.8, TEMP −0.95, FOCUS −0.8, ATTACH −0.9]`
*(Receptive, extreme Cool, deep Self-focus, extreme Avoidant — the coldest coordinate in the map; also the smallest blob, size 0.45)*

**Color / Symbol:** `#A8DADC` · ❄️ · Size 0.45 *(smallest archetype)*

---

### 🔍 The Analyst

> *"Life is a problem to be solved from a safe distance, not a mystery to be lived."*

| Field        | Value |
|--------------|-------|
| **Wound**    | Over-analysis prevents authentic experience |
| **Shadow**   | Detached Observation |
| **Invitation** | To step into the river of life instead of just studying it from the bank |
| **Core Belief** | Life is a problem to be solved from a safe distance, not a mystery to be lived. |
| **Attracts** | Emotional partners they can study like fascinating alien species |
| **Integrated Path** | Analyst → Sage → Creative Synthesis |

**Coordinates:** `[AGENCY +0.7, TEMP −0.8, FOCUS +0.5, ATTACH −0.6]`
*(Receptive, deep Cool, mildly Other-focused, Avoidant — the observer from a distance)*

**Color / Symbol:** `#4CC9F0` · 🔍 · Size 0.55

---

### 🧠 The Anxious Intellectual

> *"If I can just think my way through my feelings, I can avoid the messiness of actually feeling them."*

| Field        | Value |
|--------------|-------|
| **Wound**    | Over-analysis with fear of being seen |
| **Shadow**   | Analysis Paralysis |
| **Invitation** | To drop from the mind into the feeling body |
| **Core Belief** | If I can just think my way through my feelings, I can avoid the messiness of actually feeling them. |
| **Attracts** | Emotional partners they can analyze, or intellectuals avoiding embodiment |
| **Integrated Path** | Anxious Intellectual → Embodied Wisdom |

**Coordinates:** `[AGENCY +0.8, TEMP −0.7, FOCUS −0.8, ATTACH +0.7]`
*(Receptive, cool, Self-focused, strong Anxious — the paradoxical anxious-thinker)*

**Color / Symbol:** `#C77DFF` · 🧠 · Size 0.60

---

## Cluster: `anxious_connection_shadows` — The Anxious Connection Shadows

> Roots: receptive, hot, other-focused needs for connection and validation.

### ✝️ The Martyr

> *"My needs don't matter. My worth comes from sacrificing myself for others."*

| Field        | Value |
|--------------|-------|
| **Wound**    | Complete self-abandonment |
| **Shadow**   | Resentful Self-Sacrifice |
| **Invitation** | To honor one's own needs as sacred |
| **Core Belief** | My needs don't matter. My worth comes from sacrificing myself for others. |
| **Attracts** | Narcissists, Tyrants, or 'Takers' who exploit their generosity |
| **Integrated Path** | Martyr → Weaver → Relational Fluent |

**Coordinates:** `[AGENCY +0.6, TEMP +0.5, FOCUS +0.9, ATTACH +0.8]`
*(Receptive, warm, extreme Other-focus, strong Anxious — the doormat corner)*

**Color / Symbol:** `#457B9D` · ✝️ · Size 0.65

---

### 😊 The People Pleaser

> *"I must agree with everyone and meet their needs to be loved. My true self is unlovable."*

| Field        | Value |
|--------------|-------|
| **Wound**    | Seeks validation through constant accommodation |
| **Shadow**   | Identity Loss |
| **Invitation** | To disappoint someone today and survive the experience |
| **Core Belief** | I must agree with everyone and meet their needs to be loved. My true self is unlovable. |
| **Attracts** | Demanding partners who take advantage of their lack of boundaries |
| **Integrated Path** | People Pleaser → Anchor → Sovereign |

**Coordinates:** `[AGENCY +0.9, TEMP +0.3, FOCUS +0.9, ATTACH +0.9]`
*(deep Receptive, mild warmth, extreme Other-focus, strong Anxious — the "always-yes" corner)*

**Color / Symbol:** `#9B5DE5` · 😊 · Size 0.70

---

### 🌸 The Sensitive Soul

> *"I feel everything so deeply that I have no skin. Other people's emotions overwhelm and define me."*

| Field        | Value |
|--------------|-------|
| **Wound**    | Absorbs emotions but fears engulfment |
| **Shadow**   | Emotional Sponging |
| **Invitation** | To build energetic boundaries that honor both self and other |
| **Core Belief** | I feel everything so deeply that I have no skin. Other people's emotions overwhelm and define me. |
| **Attracts** | Emotionally chaotic partners they absorb, or stoic partners they try to 'open up' |
| **Integrated Path** | Sensitive Soul → Embodied Wisdom |

**Coordinates:** `[AGENCY +0.9, TEMP +0.8, FOCUS +0.8, ATTACH +0.9]`
*(deep Receptive, deep Hot, strong Other-focus, strong Anxious — the porous empath corner)*

**Color / Symbol:** `#FF5D8F` · 🌸 · Size 0.85

---

### 🦎 The Chameleon

> *"My authentic self is unlovable. I must become what others want me to be."*

| Field        | Value |
|--------------|-------|
| **Wound**    | Over-adapts to others, losing core identity |
| **Shadow**   | Shape-Shifting |
| **Invitation** | To discover which relationships survive self-revelation |
| **Core Belief** | My authentic self is unlovable. I must become what others want me to be. |
| **Attracts** | Partners with strong personalities who don't know the real them |
| **Integrated Path** | Chameleon → Relational Fluent |

**Coordinates:** `[AGENCY +0.95, TEMP +0.4, FOCUS +0.85, ATTACH +0.7]`
*(extreme Receptive, warm, strong Other-focus, strong Anxious — the shape-shifter corner)*

**Color / Symbol:** `#27AE60` · 🦎 · Size 0.65

---

## Cluster: `seductive_avoidance_shadows` — The Seductive Avoidance Shadows

> Roots: blend of receptive, hot, self-focused magnetism with an avoidance of true intimacy.

### 🔮 The Enchantress

> *"I can attract anyone, but if they get too close, they will see I am not enough. I must leave first."*

| Field        | Value |
|--------------|-------|
| **Wound**    | Magnetic attraction with commitment avoidance |
| **Shadow**   | Seduction & Abandonment |
| **Invitation** | To stay and witness the beauty that unfolds after the initial chase |
| **Core Belief** | I can attract anyone, but if they get too close, they will see I am not enough. I must leave first. |
| **Attracts** | Partners who love the chase, reinforcing pattern of intense beginnings and abrupt endings |
| **Integrated Path** | Enchantress → Siren → Relational Fluent |

**Coordinates:** `[AGENCY +0.9, TEMP +0.7, FOCUS −0.7, ATTACH −0.8]`
*(deep Receptive, warm, Self-focused but magnetic, deep Avoidant — the self-centered magnet paradox)*

**Color / Symbol:** `#FF006E` · 🔮 · Size 0.80

---

### 🕷️ The Black Widow

> *"Authentic connection is impossible, so I must use seduction and manipulation to get needs met."*

| Field        | Value |
|--------------|-------|
| **Wound**    | Uses sexuality as weapon |
| **Shadow**   | Manipulative Intimacy |
| **Invitation** | To discover the power of authentic, non-transactional connection |
| **Core Belief** | Authentic connection is impossible, so I must use seduction and manipulation to get needs met. |
| **Attracts** | Partners easily controlled by charm and sexuality, but ultimately disposable |
| **Integrated Path** | Black Widow → Sovereign |

**Coordinates:** `[AGENCY +0.8, TEMP +0.6, FOCUS −0.8, ATTACH −0.7]`
*(Receptive, warm, Self-focused, Avoidant — the relational predator corner)*

**Color / Symbol:** `#6A040F` · 🕷️ · Size 0.60

---

### 🃏 The Trickster

> *"If I keep everything light and entertaining, no one will notice how terrified I am of real intimacy."*

| Field        | Value |
|--------------|-------|
| **Wound**    | Uses humor and chaos to avoid authentic connection |
| **Shadow**   | Deflective Humor |
| **Invitation** | To trust that being authentic won't lead to rejection |
| **Core Belief** | If I keep everything light and entertaining, no one will notice how terrified I am of real intimacy. |
| **Attracts** | Partners who enjoy the entertainment but never know the real person |
| **Integrated Path** | Trickster → Creative Synthesis |

**Coordinates:** `[AGENCY +0.7, TEMP +0.8, FOCUS +0.6, ATTACH −0.6]`
*(Receptive, warm, mildly Other-focused, Avoidant — the socially deflective entertainer)*

**Color / Symbol:** `#F39C12` · 🃏 · Size 0.70

---

### 🧜‍♀️ The Siren

> *"My power is in the mystery and the chase. If I let someone truly know me, the magic will disappear."*

| Field        | Value |
|--------------|-------|
| **Wound**    | Creates intense attraction but cannot sustain depth |
| **Shadow**   | Magnetic Superficiality |
| **Invitation** | To discover that true magic lives in sustained intimacy, not just initial attraction |
| **Core Belief** | My power is in the mystery and the chase. If I let someone truly know me, the magic will disappear. |
| **Attracts** | Partners addicted to the high of pursuit but unprepared for real relationship |
| **Integrated Path** | Siren → Embodied Wisdom |

**Coordinates:** `[AGENCY +0.85, TEMP +0.75, FOCUS +0.5, ATTACH −0.5]`
*(Receptive, warm, mildly Other-focused, Avoidant — the chase-and-evaporate archetype)*

**Color / Symbol:** `#9A48D0` · 🧜‍♀️ · Size 0.75

---

# Relational Map Summary (Attractor Edges)

The 3D map draws **dashed tether lines** between archetypes when one is selected,
using this attractor map (`RELATIONAL_MAP` in `webxr.service.ts`, lines ~600).
Each source archetype has up to **4 target IDs**; duplicates are deduplicated
and prioritized by cluster-membership and proximity to gift archetypes.

| Source                       | Attracts (in priority order) |
|------------------------------|------------------------------|
| **Sovereign**                | Relational Fluent, Embodied Wisdom, Creative Synthesis |
| **Relational Fluent**        | Sovereign, Embodied Wisdom, Creative Synthesis |
| **Embodied Wisdom**          | Sovereign, Relational Fluent, Creative Synthesis |
| **Creative Synthesis**       | Sovereign, Relational Fluent, Embodied Wisdom |
| **Tyrant**                   | Rebel, People Pleaser, Martyr |
| **Perfectionist**            | Perfectionist (self-mirror), Tyrant, People Pleaser, Anxious Intellectual |
| **Guardian**                 | Sensitive Soul, People Pleaser, Martyr |
| **Sentinel**                 | Sensitive Soul, Martyr |
| **Tempest**                  | Ice Queen, Ghost, Analyst, Sensitive Soul |
| **Destroyer**                | Enchantress, Ghost, Siren |
| **Crusader**                 | People Pleaser, Chameleon, Martyr |
| **Rebel**                    | Tyrant, Guardian, Perfectionist, People Pleaser |
| **Ghost**                    | People Pleaser, Sensitive Soul, Martyr |
| **Ice Queen**                | Tempest, Destroyer, Siren, Enchantress |
| **Analyst**                  | Tempest, Sensitive Soul |
| **Anxious Intellectual**     | Tempest, Analyst, Ice Queen |
| **Martyr**                   | Tyrant, Black Widow, Destroyer |
| **People Pleaser**           | Tyrant, Crusader, Perfectionist |
| **Sensitive Soul**           | Tempest, Destroyer, Ice Queen, Guardian, Analyst |
| **Chameleon**                | Tyrant, Sovereign, Crusader |
| **Enchantress**              | Rebel, Trickster, Crusader |
| **Black Widow**              | People Pleaser, Martyr |
| **Trickster**                | People Pleaser, Chameleon, Sensitive Soul |
| **Siren**                    | Rebel, Crusader, Tempest |

---

## Field Reference per Archetype

Every archetype object has this typed shape (`Archetype` interface in
`webxr.service.ts`, line 36):

```typescript
export interface Archetype {
  id:               string;            // kebab-case key, e.g. "the_sovereign"
  name:             string;            // English display name
  coordinates:      [number, number, number, number]; // [AGENCY, TEMPERATURE, FOCUS, ATTACHMENT]
  color:            string;            // hex color for blob + aura
  size:             number;            // 0.45–1.00, scales the Three.js sphere
  symbol:           string;            // single emoji rendered next to the name
  description?:     string;            // one-line tagline (gift archetypes only)
  wound?:           string;            // shadow-only: the pain underneath
  cluster:          string;            // cluster ID (see table above)
  quality?:         string;            // gift-only: the core positive quality
  shadow:           string;            // the default-mode expression
  invitation:       string;            // the re-orientation prompt
  coreBelief:       string;            // the unconscious organising belief
  attracts:         string;            // who / what the pattern magnetises
  integratedForm?:  string;            // shadow-only: path → gift (e.g. "Tyrant → Guardian → Sovereign")
}
```

---

## File map

- **Source of truth (English):** `src/services/webxr.service.ts` — `ALL_ARCHETYPES` (24 entries)
- **Localised translations (EN + RU):** `src/i18n/translations.ts` — `universe.archetypes.*`
- **UI renderer:** `src/app/shared/components/archetype-detail-card/archetype-detail-card.component.ts`
- **Visualisation owner / 3D scene:** `src/services/webxr.service.ts` — `VisualizationService` class
- **Universe shell / controls:** `src/app/features/universe-controls/universe-controls.component.ts`
