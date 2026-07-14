# Devpost Submission Packet

Prepared from the live OpenAI Build Week requirements on 2026-07-14. This file is ready to paste, but it intentionally does not create a Devpost account/project, accept participation terms, publish code/video, or submit on the user's behalf.

## Core listing

**Project title**  
AI Character Galaxy

**Tagline (134 characters)**  
Explore history and literature as evidence-grounded relationship galaxies, with GPT-5.6 guidance and a complete offline learning path.

**Category**  
Education

**Built with**  
Codex, GPT-5.6, OpenAI Responses API, Structured Outputs, Next.js, React, TypeScript, React Three Fiber, Three.js, Zod, Motion, Vitest, Playwright

**Public repository**  
`USER-OWNED PUBLICATION INPUT: PUBLIC_GITHUB_REPOSITORY_URL`

**Public demo video (YouTube, under 3 minutes, voiceover)**  
`USER-OWNED PUBLICATION INPUT: PUBLIC_YOUTUBE_VIDEO_URL`

**Optional hosted judge URL**  
`USER-OWNED PUBLICATION INPUT: PUBLIC_DEPLOYMENT_URL_OR_LEAVE_BLANK`

## Description

### Inspiration

Students often encounter history and literature as disconnected names, dates, and scenes. We wanted to make the causal structure visible: who influenced whom, which alliance broke, why conflict escalated, and how a relationship changed an event or plot.

### What it does

AI Character Galaxy turns reviewed history and literature lesson packs into explorable relationship maps for learners ages 12–15. The MVP includes complete French Revolution and *Romeo and Juliet* journeys. Learners move through a 3D galaxy or an equivalent keyboard-accessible 2D list, inspect source-grounded relationships, complete five deterministic missions, answer five comprehension prompts, and finish with a private “My Relationship Discoveries” summary.

GPT-5.6 optionally rewrites reviewed evidence into age-appropriate explanations, builds source-constrained questions, and summarizes the learner's explored IDs. The formal learning flow still works without an API key or network. A second GPT-5.6 workflow converts manifest-approved source excerpts into candidate lesson packs that cannot overwrite official content and must pass automated and human review.

### How we built it

The application uses Next.js, React, TypeScript, React Three Fiber, Three.js, Motion, and deterministic seeded layouts. Zod validates each lesson pack and all cross-references. Local mission rules verify selections and explanations without model grading. Same-tab `sessionStorage` restores progress without an account.

Server-only OpenAI routes use the Responses API, `gpt-5.6`, low reasoning effort, Zod Structured Outputs, bounded retry, timeout, and a one-way anonymous `safety_identifier`. Returned entity, relationship, and source IDs are verified against the active pack before React receives them. Unknown IDs or any model/network/configuration failure select reviewed prepared content.

Codex translated the approved product specification into a milestone plan, implemented test-first slices, grounded the API integration in current OpenAI documentation, diagnosed real-browser traces, and assembled the judge handoff.

### Challenges

The hardest boundary was making AI valuable without making the lesson dependent on AI. We separated official reviewed facts, deterministic mission evaluation, optional runtime explanations, and candidate-only content generation. Real-browser testing also exposed two lifecycle issues—session progress after a source-page detour and final-mission feedback—that unit tests alone had not revealed.

### Accomplishments

- Two coherent, source-attributed lessons with five missions and five assessment prompts each.
- Synchronized 2D/3D exploration plus WebGL, reduced-motion, keyboard, contrast, and responsive safeguards.
- Structured GPT-5.6 services that reject invented IDs and preserve a complete offline path.
- Reproducible source manifests and deterministic editorial reports with zero blocking evidence errors.
- Forty-two Vitest checks, three complete Chromium journeys, and a clean optimized production build.

### What we learned

AI safety for education works best as architecture, not copy. Minimal data, reviewed context, explicit schemas, post-parse reference checks, bounded failure behavior, and human editorial gates make the model both more useful and easier to trust. Accessibility also improved the core design: the 2D list became a second lens on the same relationship model rather than a diminished fallback.

### What's next

Next steps are teacher-reviewed lesson authoring, locale-specific reviewed packs, printable discussion summaries, and classroom pilots that measure whether relationship tracing improves causal explanations. We would keep all high-stakes assessment and learner profiling outside the model boundary.

## Live custom-field mapping

| Devpost field ID | Field | Prepared value |
| --- | --- | --- |
| `27945` | Submitter type | `USER-OWNED PUBLICATION INPUT: SELECT THE ACCURATE SUBMITTER TYPE` |
| `27946` | Country/region of residence | `USER-OWNED PUBLICATION INPUT: ENTER THE ACCURATE RESIDENCE` |
| `27947` | Category | `Education` |
| `27948` | Public code repository URL | `USER-OWNED PUBLICATION INPUT: PUBLIC_GITHUB_REPOSITORY_URL` |
| `27949` | Optional judge access URL | `USER-OWNED PUBLICATION INPUT: PUBLIC_DEPLOYMENT_URL_OR_BLANK` |
| `27950` | Codex feedback Session ID | `019f60d5-b064-7520-aed3-b2c0f6c9dc42` |
| `27951` | Plugin/developer-tool instructions | `Used the Devpost Hackathons plugin to review live OpenAI Build Week requirements and field IDs. Used the OpenAI Developer Docs MCP registration plus official OpenAI documentation fallback to verify GPT-5.6 Responses API, Structured Outputs, safety_identifier, and under-18 safeguards.` |

## Requirement checklist

- [x] Working project and complete Education-category learning loop.
- [x] English project description and under-200-character tagline.
- [x] README with setup, architecture, Codex contribution, and GPT-5.6 usage.
- [x] Primary Codex Session ID.
- [x] Sub-three-minute English narration script covering Codex and GPT-5.6.
- [x] MIT application-code license and separate third-party attribution.
- [x] Both official lesson packs validate; automated reports show zero blockers.
- [x] Production build and complete browser journeys pass locally.
- [ ] `USER-OWNED PUBLICATION INPUT: PUBLISH A PUBLIC CODE REPOSITORY`.
- [ ] `USER-OWNED PUBLICATION INPUT: RECORD AND PUBLISH THE PUBLIC YOUTUBE VIDEO`.
- [ ] `USER-OWNED PUBLICATION INPUT: COMPLETE PERSONAL ELIGIBILITY FIELDS AND ACCEPT DEVPOST TERMS`.
- [ ] `USER-OWNED PUBLICATION INPUT: CREATE/UPDATE THE DEVPOST PROJECT, PREVIEW, AND SUBMIT BEFORE THE DEADLINE`.

## Judge framing

- **Technological Implementation:** strict lesson schemas, deterministic engine, synchronized 2D/3D state, structured Responses API, post-parse ID validation, candidate-only generation pipeline, and real-browser verification.
- **Design:** focused Apple-inspired spatial hierarchy, material depth, press feedback, reduced motion, readable typography, and complete accessible fallback.
- **Potential Impact:** reusable evidence-grounded lesson model for history and literature without accounts, learner profiling, or required AI access.
- **Quality of the Idea:** makes relationships—the missing causal layer in many lessons—directly observable, explorable, explainable, and sourced.
