# AI Character Galaxy

AI Character Galaxy turns historical events and literary plots into explorable, evidence-grounded relationship maps for learners ages 12–15.

Built for **OpenAI Build Week 2026 · Education** with Codex, GPT-5.6, Next.js, TypeScript, React Three Fiber, Three.js, Zod, and Playwright.

## Problem

History and literature are often taught as isolated names, dates, and plot points. Learners can recall the pieces while missing the causal structure: who influenced whom, which alliance broke, why a conflict escalated, and how one relationship changed an event or story.

## What AI Character Galaxy does

- Presents two complete English lesson packs: the French Revolution and *Romeo and Juliet*.
- Frames the product as an orbital editorial exhibition with a shared navigation system, course register, and reviewed character atlas.
- Synchronizes a spatial 3D galaxy with a fully equivalent, keyboard-accessible 2D relationship list.
- Re-centers the 3D relationship space on the selected person: distance expresses relationship strength, height expresses affinity versus conflict, depth expresses personal versus public context, and lateral direction distinguishes incoming from outgoing influence.
- Renders procedural shader planets, atmospheres, orbit rings, and deterministic particle fields while keeping a stable HTML character index for selection.
- Guides learners through five deterministic missions per lesson: find, group, trace, compare, and explain cause-and-effect.
- Keeps every official character, relationship, mission, question, and source inside a strict reviewed lesson schema.
- Lets learners expand the selected person's galaxy with up to three GPT-5.6-researched, web-grounded relationships per request, each with visible citations.
- Provides a clearly separated, web-grounded GPT-5.6 research form for a learner-supplied historical or literary character name.
- Finishes with five evidence-grounded comprehension prompts and a private relationship-discoveries summary.
- Remains fully usable with no API key, no network, no account, and no WebGL.

## Demo paths

### French Revolution

1. Open **French Revolution: People and Factions** and start the missions.
2. Find Robespierre and map the radical group.
3. Trace Rousseau → Robespierre → Louis XVI.
4. Open the relationship evidence, then expand a selected person's network with sourced GPT-5.6 connections.
5. Compare Lafayette and Robespierre, explain the Danton break, complete the check, and reach **My Relationship Discoveries**.

### Romeo and Juliet

1. Open **Romeo and Juliet: Character Relationships**.
2. Find Friar Laurence and map the Capulet household.
3. Trace Romeo → Friar Laurence → Juliet.
4. Compare Romeo and Juliet, then explain how Tybalt and Mercutio's conflict produces the turning point.
5. Complete the evidence-grounded check and open the discoveries summary.

The browser tests in [`e2e/`](e2e/) execute both paths end to end. The timed judge narration is in [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md).

## Quick start

Requirements: Node.js 20+ and npm.

```powershell
cd G:\YSF_Digital\project\Devposts
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Leave `OPENAI_API_KEY` empty to run the complete reviewed learning flow without live AI. Add a server-side key only when live relationship-network expansion or custom character research is desired.

Production check:

```powershell
npm run build
npm start
```

## Experience routes

| Route | Purpose |
| --- | --- |
| `/` | Animated orbital exhibition landing page. |
| `/courses` | Full-screen course register with direct lesson entry. |
| `/characters` | Searchable reviewed character atlas plus optional custom GPT-5.6 research. |
| `/learn/french-revolution` | French Revolution introduction and active learning observatory. |
| `/learn/romeo-and-juliet` | *Romeo and Juliet* introduction and active learning observatory. |
| `/sources/[lessonId]` | Reviewed source, attribution, and evidence register. |

## Environment

Copy [`.env.example`](.env.example) to `.env.local` only when live GPT-5.6 enhancements are desired.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | No | none | Enables web-grounded relationship expansion, custom character research, and controlled content-generation tools. |
| `OPENAI_MODEL` | No | `gpt-5.6` | Overrides the OpenAI model used on the server. |
| `NEXT_PUBLIC_SITE_URL` | No | `http://localhost:3000` | Resolves canonical social-preview image URLs in deployed metadata. |

The API key is read only by server modules and is never included in browser code.

## Offline behavior

The application treats AI as an enhancement, not a dependency. Without `OPENAI_API_KEY`, all reviewed profiles, relationships, pages, 2D/3D exploration, missions, hints, source evidence, prepared comprehension questions, and summaries remain available. If WebGL initialization fails, the app announces the fallback and opens the complete 2D relationship list without losing progress. Lesson progress and any successfully expanded network are restored after a same-tab refresh or source-page detour.

## GPT-5.6 usage

GPT-5.6 is used in three controlled places:

1. **Relationship-network expansion.** `POST /api/learning/expand-network` treats the selected person as the origin, requires OpenAI Web Search, validates a strict Structured Output, and automatically adds at most three new people per request. A tab may hold at most twelve AI-added people. Every accepted relationship must match a Web Search citation, and those citation titles remain visible and clickable in the evidence sheet. The overlay lives only in `sessionStorage`; it disappears when the tab closes and never modifies reviewed missions, answers, assessments, sources, or lesson JSON.
2. **Custom character research.** `POST /api/characters/query` accepts only a bounded character name, requires web search, validates a compact structured profile, and displays source links next to the generated result. Generated profiles remain visually and semantically separate from the reviewed atlas and never modify lesson packs.
3. **Candidate content pipeline.** A CLI reads only manifest-approved normalized excerpts and can ask GPT-5.6 for a candidate lesson pack. The generator requires a `.candidate.json` output outside the official lesson directory, refuses overwrite, and requires schema validation plus human review before publication.

Calls use low reasoning effort, bounded timeouts, at most one retry, and a SHA-256-derived anonymous `safety_identifier`. Duplicate, unsourced, invalid, refused, unconfigured, or failed expansion responses add nothing to the graph. GPT output never overwrites an official pack.

## Content pipeline

Validate all official packs:

```powershell
npm run content:validate
```

Regenerate deterministic editorial reports:

```powershell
npm run content:review
```

Generate a new candidate when an API key is configured:

```powershell
npm run content:generate -- --manifest content/manifests/french-revolution.source-manifest.json --output content/candidates/french-revolution-v2.candidate.json
```

Each source manifest fixes its URL, publisher, license, retrieval date, SHA-256 content hash, permitted use, attribution, and reviewed normalized excerpt. Current reports are under [`content/reports/`](content/reports/); both official packs have zero blocking evidence errors.

## Architecture

The system is local-first and pack-driven:

```text
Reviewed JSON lesson pack
  + session-only, citation-validated AI overlay
  → strict Zod validation and immutable runtime merge
  → shared 2D/3D relationship graph
  → deterministic local mission evaluator
  → optional server-only GPT-5.6 web research
  → validated additions or no graph change
  → session-only progress and summary
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for module boundaries, trust boundaries, data flow, and extension points.

## Accessibility

- Complete semantic 2D alternative to the 3D canvas.
- Keyboard-operable lesson cards, controls, people, relationships, missions, and sources.
- Visible focus states and native buttons/links instead of gesture-only interaction.
- Group, relationship type, direction, disputed status, and progress conveyed in text.
- `prefers-reduced-motion`, reduced transparency, and increased-contrast adaptations.
- Responsive phone layout verified at 390×844 with no horizontal overflow.
- Automatic WebGL failure announcement and state-preserving fallback.

## Safety and privacy

- No registration, learner name, school information, email, chat history, analytics profile, or persistent identity.
- Progress and AI-expanded relationship overlays stay in same-tab `sessionStorage`; Reset replaces both with a new empty lesson session.
- Learner identity and free-form personal details are never sent to OpenAI.
- The anonymous safety identifier is a one-way hash of lesson ID plus session start time.
- Official learning facts and answers come from reviewed, versioned packs; AI additions remain a visibly labeled runtime overlay and cannot change reviewed curriculum data.
- Prompts forbid unsupported quotations, sensitive profiles, intelligence judgments, and teacher-facing ability labels.
- Disputed interpretations are labeled neutrally and cannot power an official mission below the confidence gate.
- Under-18 safeguards favor minimal data, age-appropriate language, source constraints, failure monitoring, and human editorial review.

This is an educational prototype, not a substitute for a teacher's judgment or independent source evaluation.

## Testing

Run the repository-wide non-browser gate:

```powershell
npm run verify
```

That command runs ESLint, Vitest, content validation, TypeScript, and the optimized Next.js build. Run real Chromium journeys separately:

```powershell
npm run test:e2e
```

Coverage includes schema integrity, citation matching, expansion deduplication and limits, immutable runtime merging, deterministic semantic 3D layout and particle budgets, damped node entry, mission isolation, same-tab recovery, custom character research, API input validation, immediate details, 2D/3D parity, keyboard navigation, reduced motion, responsive layout, forced WebGL failure, fixed-height desktop observatory behavior, stable 3D planet interaction, and both complete judge journeys.

## Codex-assisted development

Codex converted the approved product specification into an executable plan, created the application in milestone commits, wrote tests before each implementation slice, grounded GPT-5.6 integration in official OpenAI documentation, diagnosed browser failures from traces, and prepared this submission handoff. Human-review boundaries remain explicit for lesson evidence, publication URLs, personal Devpost fields, and the final submission action.

## License

Application source code is available under the [MIT License](LICENSE).

## Third-party content

The MIT license does not relicense lesson sources. Source-specific attribution and license notes are in [`THIRD_PARTY_CONTENT.md`](THIRD_PARTY_CONTENT.md), the source manifests, and each in-app source page.

## Devpost

- Hackathon: OpenAI Build Week
- Category: Education
- Submission-ready copy and live custom-field IDs: [`docs/DEVPOST_SUBMISSION.md`](docs/DEVPOST_SUBMISSION.md)
- Required public repository and public YouTube URLs remain marked as **USER-OWNED PUBLICATION INPUT**.
- No Devpost project, registration agreement, or final submission is created automatically by this repository.

## Session ID

Primary Codex feedback Session ID: `019f60d5-b064-7520-aed3-b2c0f6c9dc42`
