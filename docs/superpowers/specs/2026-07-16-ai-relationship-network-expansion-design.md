# AI Relationship Network Expansion Design

**Date:** 2026-07-16

**Status:** Implemented and verified

**Product:** AI Character Galaxy

**Language:** English by default

## 1. Summary

GPT-5.6 will act as a relationship-network curator, not a character-detail writer. When a learner selects a person, the evidence sheet immediately shows the available profile, relationship evidence, and citations. A separate `Expand relationship galaxy with GPT-5.6` action researches up to three additional people with direct, verifiable relationships to the selected person and automatically adds them to both the 3D galaxy and complete 2D relationship view.

The selected person remains the semantic origin while expansion is in progress and after the new nodes arrive. AI-generated graph data is stored as a separate runtime overlay, persists through refreshes in the current browser tab, and never changes the reviewed lesson pack, mission answers, or assessment content.

## 2. Confirmed product decisions

- New relationships are added automatically after server validation; there is no candidate-confirmation step.
- Expansion data survives refreshes in the current browser tab and is cleared when the tab closes.
- Each request adds at most three new people.
- A lesson session may contain at most twelve AI-added people.
- Existing characters and relationships are deduplicated instead of being added twice.
- A newly added person may be selected and used as the focus of a later expansion.
- AI-generated relationships never count toward completion of reviewed missions.
- Failed, refused, unconfigured, or insufficiently sourced responses add nothing to the graph.

## 3. Goals

1. Make GPT-5.6 visibly expand the interactive relationship galaxy around the selected person.
2. Keep character and relationship details available immediately on selection without another AI request.
3. Preserve the distinction between reviewed curriculum content and web-grounded AI additions.
4. Keep the 3D origin, camera, labels, click targets, 2D parity, and mission state stable while the graph grows.
5. Provide clear, clickable citations for every AI expansion.
6. Restore the same expanded graph after a same-tab refresh.

## 4. Non-goals

- AI does not rewrite official lesson JSON files.
- AI additions do not create or modify missions, hints, assessments, objectives, or prepared summaries.
- Expansions are not shared between browsers or devices.
- The first version does not require accounts, a database, teacher moderation queues, or permanent publication.
- The UI does not provide an open-ended chat surface.
- The application does not fabricate prepared fallback relationships when GPT-5.6 is unavailable.

## 5. User experience

### 5.1 Default evidence

Selecting a reviewed character immediately displays:

- name, group, and role;
- reviewed summary and learning tags;
- links to reviewed lesson sources;
- the network-expansion action.

Selecting a reviewed relationship immediately displays its summary, evidence summary, location, dispute note when relevant, and reviewed source link. The current `Optional learning lens` and `Explain with GPT-5.6` detail-generation UI is removed from the evidence sheet.

Selecting an AI-added character immediately displays:

- name, role, and concise researched summary;
- an `AI expanded` provenance badge;
- its direct connection to the expansion focus;
- clearly visible, clickable web citations;
- the same network-expansion action for recursive exploration.

Selecting an AI-added relationship immediately displays its type, direction, strength, explanation, evidence summary, confidence note, dispute note when relevant, and clickable citations.

### 5.2 Expansion action

The character evidence sheet contains a single primary action labeled `Expand relationship galaxy with GPT-5.6`. On activation:

1. The selected character remains the 3D origin.
2. The action enters a loading state labeled `Researching verified relationships…`.
3. A restrained orbital pulse appears around the origin; existing controls remain usable except for duplicate expansion requests for the same focus.
4. The server researches and validates up to three relationships.
5. Valid nodes and edges enter the graph automatically with an orbit-entry transition.
6. The origin remains selected and the evidence sheet reports the names and count added.
7. New planets and filmstrip items carry an `AI` provenance marker.

Repeated expansion of the same focus is allowed while the lesson has capacity. Existing names and edges are sent as exclusions, so later requests must find different verified connections.

### 5.3 Capacity state

At twelve AI-added people, the action becomes unavailable and displays `Expansion limit reached for this session`. Existing AI characters and citations remain fully accessible.

## 6. Architecture

### 6.1 Immutable lesson plus runtime overlay

The official `LessonPack` remains immutable. A separate `RelationshipNetworkExpansionState` owns AI additions:

```ts
interface RelationshipNetworkExpansionState {
  schemaVersion: "1.0";
  lessonId: string;
  characters: ExpandedCharacter[];
  relationships: ExpandedRelationship[];
  citations: ExpansionCitation[];
  expansionEvents: ExpansionEvent[];
}
```

The client derives a `RuntimeRelationshipGraph` from the reviewed lesson and expansion state. Only the graph-facing surfaces consume this runtime graph:

- `GalaxyScene`;
- 2D relationship list;
- character filmstrip;
- evidence sheet.

Mission evaluation, reviewed source pages, assessments, and summaries continue to consume the original `LessonPack`.

### 6.2 Runtime graph boundary

Layout functions will accept the smallest graph contract they need instead of the complete lesson pack:

```ts
interface RelationshipGraph {
  id: string;
  layoutSeed: number;
  groups: CharacterGroup[];
  characters: GraphCharacter[];
  relationships: GraphRelationship[];
}
```

This avoids weakening the official lesson schema limits. AI-added people use one dedicated `Expanded network` group with a stable color and `AI` symbol, making provenance visible without asking the model to invent design tokens.

### 6.3 Session persistence

Expansion state uses a dedicated `sessionStorage` key:

```text
ai-character-galaxy:network-expansion:<lessonId>
```

The stored value is parsed through a strict Zod schema before use. Malformed, mismatched, or unsupported data is discarded without affecting the reviewed lesson session.

## 7. API design

### 7.1 Endpoint

`POST /api/learning/expand-network`

Request:

```ts
interface ExpandNetworkRequest {
  lessonId: string;
  focus: {
    id: string;
    name: string;
    role: string;
    summary: string;
  };
  existingCharacterNames: string[];
  existingRelationshipKeys: string[];
  sessionId: string;
}
```

For reviewed characters, the server replaces client-supplied focus fields with the authoritative lesson record. For an AI-added focus, the server accepts only the bounded, schema-validated focus profile supplied by the client.

Successful response:

```ts
interface ExpandNetworkResponse {
  source: "gpt-5.6";
  data: {
    focusCharacterId: string;
    characters: ExpandedCharacter[];
    relationships: ExpandedRelationship[];
    citations: ExpansionCitation[];
    generatedAt: string;
  };
}
```

The route returns:

- `400` for invalid input;
- `422` when no sufficiently supported new relationships are found;
- `503` when the OpenAI API key is not configured;
- `502` for timeout, refusal, invalid structured output, or upstream failure.

No error response contains upstream secrets, raw prompts, or provider response bodies.

### 7.2 Model output

GPT-5.6 receives the selected person, the lesson era and topic, existing names to exclude, and a requirement to find direct, historically or textually supportable relationships. The Responses API uses:

- `web_search` with tool use required;
- low reasoning effort;
- a strict Zod Structured Output schema;
- the existing hashed `safety_identifier`;
- a bounded timeout and at most one retry.

The model returns up to three candidates. Each candidate contains canonical name, aliases, role, concise summary, relationship type, direction, strength, relationship summary, evidence summary, confidence, dispute metadata, learning tags, and evidence source URLs.

The server extracts web-search sources from response annotations and tool-call sources. Candidate source URLs must match extracted web-search sources after URL normalization. Candidates without a valid clickable citation are rejected.

## 8. Validation and deduplication

The server and client both enforce:

- normalized case-insensitive name and alias matching;
- deterministic kebab-case IDs prefixed with `ai-`;
- deterministic relationship keys based on endpoints and relationship type;
- allowed relationship types from the existing lesson schema;
- strength from 1 to 5 and confidence from 0 to 1;
- concise age-appropriate English;
- at least one verified citation per added relationship;
- no self-relationships;
- no duplicate character or relationship records;
- no more than three new people per response;
- no more than twelve AI-added people per lesson session.

When the model names a person already in the graph, the runtime overlay may add a missing relationship to that existing person, but it does not create a duplicate node.

## 9. 3D and 2D graph behavior

- The selected focus remains exactly `[0, 0, 0]` before, during, and after expansion.
- New direct connections occupy the existing direct relationship shell.
- Affinity/conflict, personal/public depth, relationship strength, and direction continue to determine semantic coordinates.
- New nodes begin close to the origin and animate to deterministic target positions.
- Existing nodes keep their current interpolated positions and do not jump when additions arrive.
- Camera fitting includes the expanded graph but remains bounded.
- HTML labels remain translation-only with fixed readable font sizes.
- Expanded nodes use the same enlarged hit targets and line-safe pointer behavior as reviewed nodes.
- The 2D list and filmstrip update in the same render as the 3D scene.
- On mobile, the complete 2D view receives the same expansion state even though WebGL is not mounted by default.

## 10. Error handling

An expansion failure leaves the graph unchanged. The evidence sheet shows one of these English messages:

- `GPT-5.6 network expansion is not configured.`
- `No new verified relationships were found for this person.`
- `The relationship search timed out. Try again.`
- `The relationship network could not be expanded right now.`

The learner may retry. Existing reviewed and AI-expanded data remains usable. A response containing only duplicates is treated as `422`, not as a successful zero-change expansion.

## 11. Accessibility and motion

- Expansion status uses `aria-live="polite"`.
- Loading and capacity states remain understandable without animation.
- Added characters and relationships are immediately keyboard-accessible in the filmstrip and 2D list.
- Reduced-motion mode uses a short opacity transition instead of orbital movement.
- Color is never the only provenance indicator; `AI expanded` text and `AI` symbols remain visible.

## 12. Testing strategy

### Unit tests

- strict request, response, and persisted-state schemas;
- deterministic IDs and relationship keys;
- deduplication against reviewed and AI-added names and aliases;
- capacity enforcement;
- merge behavior that leaves the official lesson unchanged;
- persistence round trip and malformed-state rejection;
- prompt includes focus, topic, exclusions, citation requirements, and no detail-generation instruction.

### Integration tests

- validated expansion response returns `200`;
- invalid input returns `400`;
- no new sourced relationships returns `422`;
- missing configuration returns `503`;
- refusal, timeout, and upstream failure return sanitized `502` responses;
- extracted citations are normalized and unmatched source URLs are rejected.

### Component tests

- character details render immediately without `Explain with GPT-5.6`;
- expansion action sends the selected focus and automatically merges a successful response;
- loading, error, success, and capacity states are announced;
- reviewed mission evaluation still receives only reviewed IDs;
- AI-added details and citations render on selection;
- refresh restoration rebuilds the same runtime graph.

### Browser tests

- expand a reviewed character and observe three new planets and lines;
- keep the selected person at the 3D origin;
- select an AI-added person and recursively expand it;
- preserve additions after refresh in the same tab;
- show the same additions in 2D and 3D;
- keep labels sharp, nodes selectable, the document width bounded, and the console free of runtime errors.

## 13. Acceptance criteria

The feature is complete when:

1. Character and relationship details are present immediately after selection.
2. No detail-generation AI action remains in the evidence sheet.
3. Expanding a selected person automatically adds up to three sourced relationships to the graph.
4. The selected person remains the origin and existing planets do not jump.
5. AI additions are clearly distinguishable and provide clickable citations.
6. AI additions are available in 3D, 2D, the filmstrip, and the evidence sheet.
7. Additions survive same-tab refresh and disappear when the tab closes.
8. Official lesson data, mission answers, assessments, and reviewed sources remain unchanged.
9. Invalid or failed AI responses do not mutate the graph.
10. Unit, integration, component, accessibility, and real-browser tests pass.

## 14. Verification record

Verified on 2026-07-16:

- `npm run verify`: 40 Vitest files and 112 tests passed, both lesson packs validated, and the optimized Next.js build completed with TypeScript checks.
- `npm run test:e2e`: 21 Chromium journeys passed, including planet hit testing, repeated focus changes, 3D origin/depth, zoom-label clarity, fixed desktop height, mobile 2D parity, network expansion, same-tab restoration, citations, keyboard access, and overflow checks.
- Final desktop and mobile captures are produced under `output/playwright/` and were visually inspected.

## 15. Official API references

- OpenAI Web Search requires citations shown to end users to be clearly visible and clickable: <https://developers.openai.com/api/docs/guides/tools-web-search#output-and-citations>
- OpenAI Structured Outputs support strict JSON Schema and JavaScript Zod helpers, including GPT-5.6: <https://developers.openai.com/api/docs/guides/structured-outputs>
