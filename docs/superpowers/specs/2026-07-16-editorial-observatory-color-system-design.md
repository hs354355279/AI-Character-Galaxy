# Editorial Observatory Color System Design

**Date:** 2026-07-16

**Status:** Direction A approved, awaiting written specification review

**Product:** AI Character Galaxy

**Language:** English by default

## 1. Summary

The active lesson will use a restrained **Gallery Ink and Mineral Constellations** color system. A cool neutral exhibition shell will surround a deep indigo-black projection field. Character groups will keep distinct categorical colors, but those colors will shift from bright digital candy tones to subdued mineral pigments.

The redesign changes color, material, light, and interaction states. It does not change the approved Editorial Observatory layout, lesson state, relationship coordinates, camera behavior, or responsive information architecture.

## 2. Physical scene

A learner studies on a large desktop display in a classroom or at home under ordinary daylight. The interface should feel like a cool-lit contemporary museum table surrounding a dark projection surface: calm enough for reading, precise enough for evidence work, and vivid only where the relationship structure requires it.

This scene requires a light editorial shell and a dark galaxy stage. It does not support an all-dark cockpit, a warm parchment page, or saturated arcade colors.

## 3. Problems to solve

- The current warm beige shell and blue-black galaxy feel like two unrelated products.
- Pure black controls create harsh jumps inside an otherwise soft editorial surface.
- Character planets use highly saturated red, yellow, blue, violet, and green, which reads as playful rather than curatorial.
- The evidence sheet repeats the shell color without a meaningful connection to the selected group or course.
- Dark labels and the bottom filmstrip use near-identical surfaces, so depth and interaction hierarchy are weak.
- Color is concentrated in planets instead of being used consistently for current task, selection, provenance, and focus.

## 4. Goals

- Make the desktop lesson feel continuous with the landing page, course register, character atlas, and source archive.
- Preserve fast recognition of every character group without relying on bright saturation.
- Use the current course accent for primary actions, active mission state, focus, and selected evidence.
- Create three legible dark surface elevations without decorative transparency or broad shadows.
- Keep body text at WCAG 2.2 AA contrast and interactive component boundaries at a minimum 3:1 contrast.
- Preserve existing 2D, keyboard, reduced-motion, reduced-transparency, and mobile behavior.

## 5. Non-goals

- Changing the Editorial Observatory layout or panel dimensions.
- Reworking the relationship-space algorithm, camera framing, planet size, or hit targets.
- Adding bloom, post-processing, animated gradients, glassmorphism, or decorative page-load motion.
- Replacing procedural planets with raster images.
- Changing lesson copy, missions, evidence, scoring, or GPT-5.6 behavior.
- Applying the new product palette to the public landing page in this iteration.

## 6. Considered directions

### A. Gallery Ink and Mineral Constellations, selected

A cool neutral exhibition shell surrounds a deep indigo-black stage. Muted mineral colors identify groups and selected state. This retains the approved editorial split while making the two halves feel intentionally related.

### B. Full Night Observatory, rejected

Every surface becomes dark. This is visually cohesive but breaks continuity with the public editorial pages and makes sustained evidence reading more tiring.

### C. Monochrome Archive, rejected

The interface becomes almost black and white, with color appearing only on selection. This is quiet but removes too much of the group-recognition system that supports the learning task.

## 7. Color strategy

The product uses a restrained semantic strategy. Neutral surfaces carry most of the composition. The course accent appears only in primary actions, current state, focus, and selected evidence. Mineral group colors remain categorical data colors and are not used as general decoration.

### 7.1 Exhibition shell tokens

| Semantic role | OKLCH value | Intended use |
| --- | --- | --- |
| `--obs-shell` | `oklch(96.2% 0.008 255)` | Main navigation and mission surface |
| `--obs-shell-raised` | `oklch(92.5% 0.012 255)` | Secondary controls and inactive wells |
| `--obs-sheet` | `oklch(98% 0.006 255)` | Evidence sheet |
| `--obs-ink` | `oklch(19% 0.018 255)` | Primary text and dark controls |
| `--obs-muted` | `oklch(43% 0.018 255)` | Supporting text |
| `--obs-rule` | `oklch(76% 0.014 255)` | Hairline structure |

These are cool brand-tinted neutrals, not beige, cream, or blue-gray decoration.

### 7.2 Galaxy-stage tokens

| Semantic role | OKLCH value | Intended use |
| --- | --- | --- |
| `--obs-stage` | `oklch(13.5% 0.022 258)` | Canvas and dominant stage |
| `--obs-stage-raised` | `oklch(18.5% 0.028 258)` | Labels, filmstrip, and compact legends |
| `--obs-stage-active` | `oklch(23% 0.032 258)` | Hovered and selected dark controls |
| `--obs-stage-ink` | `oklch(92% 0.012 255)` | Primary text on dark surfaces |
| `--obs-stage-muted` | `oklch(70% 0.02 255)` | Supporting dark-surface text |
| `--obs-stage-rule` | `oklch(34% 0.025 258)` | Dark-surface dividers |

Dark-mode depth comes from explicit surface lightness, not blur or broad shadows.

### 7.3 Course accents

| Course | Base | Strong | Soft |
| --- | --- | --- | --- |
| French Revolution | `oklch(61% 0.145 24)` | `oklch(46% 0.13 24)` | `oklch(91% 0.032 24)` |
| Romeo and Juliet | `oklch(61% 0.12 315)` | `oklch(46% 0.105 315)` | `oklch(91% 0.028 315)` |

The strong value is used for filled primary controls with light text. The base value is used for current progress, focus rings, and restrained highlights. The soft value is used for selected light-surface backgrounds.

### 7.4 Mineral group palette

The categorical palette is defined in OKLCH and converted to GPU-ready sRGB hex at the Three.js boundary.

| Meaning | Mineral name | OKLCH target | GPU fallback |
| --- | --- | --- | --- |
| Monarchy | Aged brass | `oklch(70% 0.09 82)` | `#b79a5b` |
| Constitutional reform / Montague | Lapis | `oklch(64% 0.105 245)` | `#5d83b1` |
| Radical revolution / Capulet | Garnet coral | `oklch(61% 0.135 24)` | `#bd5b63` |
| Ideas and rights / bridges | Amethyst | `oklch(64% 0.095 305)` | `#8d75ad` |
| Post-revolution power | Verdigris | `oklch(63% 0.08 170)` | `#579583` |

Group color always appears with a symbol, name, or selected-state treatment. Color alone never communicates group membership.

## 8. Component application

### 8.1 Shared header

- Use `--obs-shell` with `--obs-ink` instead of the current warm paper and pure-black pair.
- Use `--obs-shell-raised` for the 3D/2D segmented control well.
- Fill the active view with `--obs-ink`; use the course accent only for its focus ring and active indicator.
- Keep secondary actions text-only and reserve filled color for the primary mission action.

### 8.2 Mission rail

- Use `--obs-shell` as the base and `--obs-rule` for progress dividers.
- Use the course accent for the current mission mark and focus state.
- Use the course strong color for `Check mission` and the soft course color for feedback or selected hints.
- Replace black button shadows with a direct filled state and a short 180ms color transition.

### 8.3 Galaxy stage

- Use `--obs-stage` for the canvas, with a restrained center lift toward `--obs-stage-raised` that does not read as a generic gradient.
- Use explicit `--obs-stage-raised` surfaces for labels, the filmstrip, and the axis legend.
- Relationship lines use stage-muted tones by default; selected and mission-relevant lines use the course accent.
- Particle color remains subordinate to planets and relationship lines.

### 8.4 Evidence sheet

- Use `--obs-sheet` with `--obs-ink` and a single `--obs-rule` border.
- Remove the broad overlap shadow. A narrow stage-colored edge shadow of no more than 8px blur may separate the sheet from the canvas.
- Use the selected group color only for the leading symbol, evidence badge, and active relationship marker.
- Use the course soft value for generated-network status and selected evidence background.

### 8.5 Character filmstrip and HTML labels

- Use `--obs-stage-raised` instead of an almost-black translucent panel.
- Default labels use `--obs-stage-ink` and `--obs-stage-muted` at verified contrast.
- Selected filmstrip entries use the mineral group color with `--obs-ink`, plus the existing group symbol.
- Hover uses `--obs-stage-active`; inactive entries never receive full-saturation color.

## 9. Three.js material and lighting changes

`PlanetNode` will keep the procedural ridge field but change its color construction:

- Remove the warm `#f0ece2` highlight mix.
- Mix the group pigment toward a cool stone highlight derived from the stage palette.
- Lift shadow lightness slightly while reducing chroma, avoiding crushed black bands.
- Reduce the unselected additive halo and ring opacity.
- Replace the pure-white selected wireframe with the course accent or a lightened group pigment.
- Keep AI-expanded provenance as a distinct secondary ring, using a subdued verdigris rather than neon mint.

`GalaxyScene` lighting will use a neutral-cool key light, a low-chroma violet fill, and lower-intensity colored rim light. Lighting must reveal the procedural material without recoloring every planet blue or coral.

## 10. Interaction states

Every affected interactive component must define:

- Default: neutral surface and readable text.
- Hover: one elevation step or soft course tint, without a large shadow.
- Focus visible: 2px course-accent outline with at least 3:1 contrast.
- Active or selected: filled course or group state plus text/symbol confirmation.
- Disabled: reduced chroma and contrast while remaining legible.
- Loading: existing text status plus a restrained course-colored progress treatment.

Transitions stay between 150 and 220ms using ease-out-quart or ease-out-quint timing. Reduced motion removes positional movement but retains instant state color changes.

## 11. Responsive behavior

- Desktop at 1440×900 and 1920×1080 receives the complete palette and material treatment.
- Tablet retains the same semantic colors when mission and evidence surfaces move into document flow.
- Mobile keeps the 2D-first information architecture and uses the same course and group meanings.
- No breakpoint may introduce a separate warm-paper or neon-dark theme.

## 12. Implementation boundaries

```text
app/globals.css
  semantic observatory tokens and component-state mapping

components/learning/LearningExperience.tsx
  course-kind class for theme selection

components/galaxy/PlanetNode.tsx
  mineral material highlight, shadow, rings, and selected shell

components/galaxy/GalaxyScene.tsx
  stage fog and lighting palette

content/lesson-packs/*.json
  GPU-ready group color fallbacks derived from the mineral palette
```

No new global theme provider is required. The lesson workspace owns its semantic tokens, and existing components consume them through CSS custom properties or explicit Three.js color inputs.

## 13. Testing strategy

### Unit and component

- Course-kind classes select the correct course accent.
- Character groups retain unique stable colors and symbols.
- Selected, disabled, and AI-expanded states preserve their non-color indicators.

### Browser

- Capture and compare 1440×900 and 1920×1080 lesson screenshots for both courses.
- Verify header, mission rail, stage, evidence sheet, labels, and filmstrip use their declared semantic surfaces.
- Verify body text reaches 4.5:1 and UI boundaries/focus indicators reach 3:1.
- Emulate common color-vision deficiencies and confirm group symbols remain sufficient.
- Re-run 3D selection, 2D fallback, mobile overflow, keyboard, reduced-motion, and both complete lesson journeys.

## 14. Acceptance criteria

- The light shell and dark stage read as one intentional exhibition environment.
- No active lesson surface uses the previous warm beige `#eeece5` or pure black `#11110f` as its final semantic color.
- Character planets retain categorical distinction without neon or candy-like saturation.
- Primary actions and current mission state use the course accent consistently.
- Evidence, selected labels, and selected filmstrip entries reflect the current group without relying on color alone.
- Dark surfaces use explicit three-step elevation colors instead of decorative blur and transparency.
- Text and controls meet WCAG 2.2 AA contrast requirements.
- Existing layout, interaction, evidence, 3D positioning, and lesson completion behavior remain unchanged.

## 15. Resolved decisions

- Direction: **A, Gallery Ink and Mineral Constellations**.
- Register: product UI inside an editorial exhibition shell.
- Color strategy: restrained semantic color with categorical mineral data colors.
- Shell: cool neutral, not beige or parchment.
- Stage: deep indigo-black with three explicit elevation levels.
- Course accent: state and action only.
- Group colors: muted mineral pigments with symbol/text redundancy.
- 3D treatment: procedural material retained, saturation and additive glow reduced.
- Language: English by default.
