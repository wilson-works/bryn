# Bryn the Trail Guide: the design

Bryn is a WilsonWorks specialist agent built from four free skills that already exist. You bring her a decision. She
helps you lay out the options, puts the question to five scouts who each walk a different road, has them check each
other's work without names attached, and makes the call with you. Then she climbs the hill to look six months down the
trail for where the plan could wash out. When you decide, she lays a stone on the stone path, so the same question never
has to be argued from scratch again.

This file records what was chosen and why, before anything was built. The studio that designed her: positioning and
name (the brand head), how she uses Claude (the VP of AI), voice and every line (the copy head), look, art and motion
(the frontend head and his visual junior), accessibility (the accessibility junior). The lane lead owns the result.

## 1. The skill set, and why this one

The brief: "another simple generic and already built set of skills that could be another agent." Taken or private
subjects were out (research, social posts and marketing, sales, accounting, bookkeeping, tax). Four sets were weighed
on the three things the brief asks for:

| Set | Who it helps first | Setup it needs | How it shows on an office floor and a dashboard |
|---|---|---|---|
| **Decision council**: `brainstorm`, `llm-council`, `premortem`, `decision-policy` | Anyone with a choice to make. Everyone has one this week. | None beyond Claude Code. No browser, no MCP, no accounts. | One pipeline with distinct stages, a cast of five advisors, and a growing log of past decisions to browse. |
| QA inspector: `audit-page`, `review-ui`, `test-flow`, `perf-trace`, `qa-sweep`, `smoke-check`, `preflight` | People who build web apps. | The Chrome DevTools MCP and a running dev server: a real setup step for a new user. | Strong (screenshots), but only for developers. |
| Life organizer: `weekly-review`, `journal`, `life-loop`, `meal-prep`, `travel-plan`, `notetaker` | Very friendly to newcomers. | None. | Six separate rituals, not one job. No single scene sequence; personal data everywhere. |
| Project keeper: `backlog`, `work-orders`, `quick-design`, `scope-check`, `retro` | Developers running code work. | A repo and a backlog layout. | A list of tickets. Little to animate. |

**Chosen: the decision council.** It is the only set that is one job from start to finish (frame, generate options,
weigh them, look ahead, record), needs nothing installed, and helps the same person Louise helps: someone new to AI.
It also answers the most common newcomer habit, asking one chatbot and getting one agreeable answer, with the thing
these skills were written to do: five independent views, anonymous peer review, and a premortem that assumes the plan
already failed.

`agent.json` lists the four under `requires.skills`, so a Workspace that knows the field installs any that are missing
from its pinned pack.

## 2. Who Bryn is (the brand head's call)

**Positioning.** For people new to AI who have a real decision to make: Bryn puts it to five advisors who answer
blind, looks six months ahead for where the plan breaks, and files the call so it is never argued twice. A chatbot
gives you one voice, and it tends to agree with you.

**The character.** Bryn, a mountain guide in her forties: weathered, calm, practical. A red rain shell, a wide-brimmed
hat, a coiled rope over one shoulder, a walking pole. "Bryn" is Welsh for hill, which is where she goes to look ahead.
She is Louise's opposite on every count: outdoors, daylight, on the move, stone instead of paper.

**The world, stage by stage.**

| Stage | What the skill does | What you see |
|---|---|---|
| `idle` | Nothing on the table | One of three living vignettes (`art/README.md` §11), changing every few minutes: Bryn on her rock with a tin cup while a small bird lands on the signpost; walking her red trail with deer and a moose grazing far off; paddling her kayak down the stream past a heron |
| `framing` | The question is framed: what it is, can it be undone, how much is at stake | A blank signpost at a fork in the trail; Bryn writing the question on a card pinned to it |
| `brainstorm` | Options generated, then clustered and shortlisted | Bryn kneeling over a map on a flat rock, routes being chalked across it |
| `council` | Five advisors answer independently | Five scouts, each walking out along a different road from the fork |
| `review` | Anonymous peer review | The five back at the fork with their props laid down and hoods up: five identical figures, the anonymity visible |
| `verdict` | The chair's synthesis: agree, clash, blind spots, the call, the first step | At dusk, Bryn and the five scouts round a campfire at the fork, the scouts leaning in as she gives the call; the signpost's red board points up the road she recommends |
| `waiting` | The advice is in; the decision is yours | Bryn leaning on her pole by the finished signpost, a marker flag moving in the wind, the path toward you open |
| `premortem` | "Six months from now this failed. Why?" | Bryn on the hilltop, hand shading her eyes, looking far down the chosen trail at a washed-out bridge |
| `filing` | The decision goes in the log; a standing policy, when it qualifies | Bryn laying a new stone along the path, and a painted trail marker on a rock beside it |
| `consulting` | A lookup in the log before deciding again | Bryn at the stone path, reading the painted markers on its stones |

**The five scouts.** One shared, faceless hooded figure, told apart by one prop and one jacket colour, labelled only
by the role title the skill already gives it, so newcomers meet five roles, not five more names:

- The Contrarian walks back down the trail.
- The First Principles Thinker kneels at the bedrock with a rock hammer.
- The Expansionist holds a map wider than they are.
- The Outsider arrives from off the trail, a straw sun hat hanging on their back, with no map.
- The Executor has the pack on and one foot already on the path.

**The stone path and the markers.** Past decisions are stones laid along the stone path. Standing policies are painted
trail markers. "Check before you decide again" is Bryn checking the stone path at the fork. That turns `decision-policy`, the hardest skill
to explain, into the brand itself.

**The look.** Her world is her own trail map risen into relief (redrawn at the owner's word, 2026-10-05: more
imaginative, still calm). Parchment with a faint grid; hills drawn as stacks of contour lines with pale elevation
tints; trees as map symbols; clouds with dotted outlines; trails as dashed map routes. Bryn and the scouts are drawn
in the map's own brown ink, never black, with folds that wrap them like contour lines; `art/README.md` is the
standard every picture is held to. Trail-marker red for Bryn's shell, her dashed trail, the recommended
road and the call; each scout's route is dashed in that scout's jacket colour. Bryn always shows a warm face and a
chestnut braid under a dark felt hat; the scouts' hoods stay dark, so she is never mistaken for one. Her decisions
are waypoint stones laid along her red trail, in a line, never a pile. The page around the scenes keeps the light
slate-and-fog room and the two accents (red, glacier blue for links and focus). The mark (36 px on her office sign):
three waypoint stones along a red dashed path on a scrap of contour map. The office-door figure (112 by 124): Bryn
standing with her pole on a patch of contour map (open contour lines, never a base), hat on, one hand raised in a
wave, looking at you.

**Names refused, and why.** Court words (judge, jury, gavel, bench, "counsel", which is one letter from council and
means a lawyer): Bryn gives no legal advice. Prophecy words (oracle, seer, crystal ball): a premortem assumes failure,
it does not predict it. Owls and sages: library wisdom is Louise's ground. Tree, star and river names: the Workspace
uses them as session callsigns. Generic keys (`council`, `decide`, `pilot`): they would match unrelated sessions on the
office floor. The key is the character's name: `bryn`.

## 3. How Bryn uses Claude (the VP of AI's call)

- **The main session runs the work.** A Claude Code subagent cannot start subagents of its own, and the council and
  the premortem each start five or more. So the full pipeline runs in the session you are talking to, following
  `CLAUDE.md` (her runbook), which calls the skills and sets her stage at the start of every step.
- **`subagent.md` is the front desk, and only reads.** Three jobs: check the stone path and the trail markers (`POLICIES.md` and the records) and
  cite what is there or say nothing is; frame a question in one line with whether it can be undone and how much is at
  stake; and route it: "a small call you can undo: just decide" or "open a session as Bryn and run the council on: ...".
  It never runs or imitates a council, a premortem or a brainstorm (one voice playing five loses the independence the
  method depends on), and its description says so. `model: sonnet`, `tools: Read, Grep, Glob`: no shell, so the stage
  file has one writer.
- **Model routing, by alias, never pinned ids.** The biggest saving is the triage: a small decision you can undo gets
  no council. Brainstorm rounds on Sonnet (clustering also on Sonnet when a council follows). The council as the skill
  wrote it: five advisors and five reviewers on Sonnet, the chair on Opus. Premortem investigators on Sonnet, at most
  five investigated failure reasons, the synthesis on Opus. Where Opus is not available, the session's own model, said
  in the report and recorded in `meta.json`.
- **The guardrails her runbook states.** Before a council or premortem, say what it costs ("eleven model runs: five
  advisors, five reviewers, one chair") and wait for a yes. "Five viewpoints from one model, not five experts." The
  report is advice; Bryn records your decision, she never makes it. Legal, medical, tax and investment questions get
  the options and the questions to take to a licensed professional, and the report says it is not professional
  advice; a safety emergency stops the run and points to help. She never sends, buys, books, posts or edits a project.
  She lays a stone or paints a marker only when you say "file it". A decision that cannot be undone never becomes a standing policy.

## 4. The stage

`stage.json` in her data folder; `node engine/stage.js set <stage> [--question ..] [--decision <id>] [--step n/of]
[--note ..]` at the start of each step, `set idle` at the end.

```json
{ "stage": "council", "question": "Repair the old laptop or replace it?", "decision": "2026-10-03-repair-or-replace-laptop",
  "step": { "n": 3, "of": 7 }, "since": "2026-10-05T19:40:00.000Z", "note": "Five scouts out" }
```

Stages: `idle`, `framing`, `brainstorm`, `council`, `review`, `verdict`, `waiting`, `premortem`, `filing`, `consulting`.

- A working stage unchanged for 30 minutes is **stalled**: it reads as `idle` with `stalled: { stage, since }`, and the
  dashboard says where the table went quiet. The next session's first step offers to pick it up or close it. (30
  minutes is a first guess, longer than a slow council round; measure three real runs and adjust.)
- `waiting` never stalls; after 24 hours it reads as `idle` with `parked`.
- `consulting` lasts about eight seconds, then falls back to the stage it interrupted.

## 5. Where things land

Nothing you tell Bryn lives in her own folder. Her folder is the package: it is copied, zipped, replaced and archived,
and your questions must not travel with it. Her data folder is `data_dir` in `bryn.config.json`, else
`<Hub>/50-AI/agent-data/bryn/` inside a Hub, else `data/` beside her (git-ignored).

```
<data>/stage.json                         the stage
<data>/asks.md                            questions left at the trailhead from the dashboard
<data>/log/                               trail markers and records: POLICIES.md, policies/, adr/   (decision-policy's <decision-log-path>)
<data>/decisions/<YYYY-MM-DD>-<slug>/     one per question                      (brainstorm's <sessions-path> too)
    meta.json                             the one file her runbook writes
    brief.md                              the framed question
    brainstorm-pile.md                    the options
    council-report-<ts>.html  council-transcript-<ts>.md       (llm-council, unchanged)
    premortem-report-<ts>.html  premortem-transcript-<ts>.md   (premortem, unchanged)
    decision.md                           your decision, in your words
```

`meta.json` holds only what no file name carries:

```json
{ "schema": 1, "id": "2026-10-03-repair-or-replace-laptop", "question": "...", "door": "two-way", "stakes": "low",
  "status": "in-progress | waiting | decided | parked | abandoned",
  "planned": ["framing", "council", "review", "verdict", "premortem", "filing"], "created": "...", "updated": "...",
  "options": ["..."], "verdict": "the chair's one line", "first_step": "...",
  "seats": [{ "seat": "contrarian | first-principles | expansionist | outsider | executor", "lean": "for | against | split", "line": "..." }],
  "premortem": { "likely": "...", "dangerous": "...", "assumption": "..." },
  "models": { "advisors": "sonnet", "reviewers": "sonnet", "chairman": "opus" },
  "outcome": null, "filed_as": null, "revisit": null }
```

`outcome` is filled only from your own words: "advice, you decide" is built into the data.

`examples/` holds an invented data folder of the same shape (a person called Alex: repair or replace an old laptop,
which evening class to take, adopting a second dog, cycling to work, a garden plot, hosting a family holiday). The
dashboard shows it, marked as examples, until the first real decision lands.

## 6. The dashboard

`dashboard/server.js`, Node built-ins only, `127.0.0.1` only, port 7550 by default. One page, three parts and a
journal:

1. **The trailhead.** The scene for the current stage (polled every 2 seconds, crossfading; at idle, one of three
   vignettes, a random one on load and a slow crossfade to another every two and a half minutes, chosen by
   `dashboard/public/vignettes.js`), Bryn's caption in her voice, what is on the table and a trail map of the planned stops with the current one lit, and "Bring Bryn a
   question" (a question and a line of context, left at the trailhead in `asks.md` for the next session).
2. **The stone path.** Every decision as a stone, coloured by status, with an indicator per status and its count, a filter,
   a search box, and "Ask Bryn to check", which plays `consulting` and points at the matching marker or past decision.
3. **The trail markers.** The standing policies: when it applies, what to do, and when to stop and think again.
4. **The trail journal.** Open a stone and flip its pages: the question, the options, the council (with where the five
   scouts stood), the premortem, your decision. Markdown is rendered safely (everything escaped, then a small set of
   formatting). The skills' own HTML reports open in a new tab, served with `Content-Security-Policy: sandbox`.

| Request | Answer |
|---|---|
| `GET /health` | `{"ok":true}`, no token, ever |
| `GET /api/stage` | the stage |
| `GET /api/decisions?status=&q=` | `{ examples, total, counts, decisions: [...] }` |
| `GET /api/decision/<id>` | one decision, its pages and its reports |
| `GET /api/decision/<id>/page/<n>` | `{ n, name, stage, file, markdown }`, at most 512 KB |
| `GET /api/decision/<id>/report/<file>` | a skill's HTML report, sandboxed |
| `GET /api/policies` | `{ examples, policies, records }` |
| `POST /api/consult` `{ q }` | `{ policy, decision, matches }`; the stage goes to `consulting` |
| `POST /api/ask` `{ question, context }` | `{ queued: n }` |
| `GET /api/asks` | `{ asks: [...] }` |

The server answers only Host `127.0.0.1`, `localhost` or the name in its own `door.phone`; serves files only by plain
name from `dashboard/public/`, `art/` and `brand/`; reads only inside her data folder or `examples/`; writes only
`stage.json` and `asks.md`. The page carries a strict Content-Security-Policy (scripts and styles from itself only), so
the scenes are plain SVG with no styles of their own and every motion lives in `app.css`, and stops for people who ask
for reduced motion. Every scene moves (a walk, a paddle stroke, a fire, grass, birds, water), calm and slow; the Pause
button stops all of it and the vignette change, and reduced motion shows the rock, still, and never changes it.

## 7. The repo

| Path | What | Who |
|---|---|---|
| `DESIGN.md` | this file | lead |
| `agent.json` | the Workspace contract, key `bryn`, port 7550, `requires.skills` | lead |
| `art.svg`, `mark.svg` | her office-door figure and her mark | art |
| `art/` | the ten stage scenes and two more idle vignettes (`idle-trail`, `idle-kayak`) | art |
| `brand/VOICE.md`, `brand/character.md`, `brand/copy.json` | her voice, her character sheet, every line on the page and at her door | copy |
| `brand/tokens.css` | palette and type | look |
| `dashboard/server.js`, `dashboard/public/` | the server and the page (no build step); `vignettes.js` picks the idle vignette | lead |
| `engine/` | `config.js`, `stage.js`, `decisions.js`, `record.js` (opens and updates a decision's `meta.json` for the runbook, added during the build), `asks.js` | lead |
| `CLAUDE.md`, `subagent.md` | her runbook, her front desk | lead (voice from copy) |
| `brains/`, `rules/`, `memory/` | what she knows, her standing rules, what she has learned | lead |
| `examples/` | the invented data folder | lead |
| `tests/` | `node:test`, written for the gate, not run by the builders | lead |

## 8. The fences

Public-ready: no real person, path, hostname, business, client or private agent anywhere; the examples are invented.
Node built-ins only at run time; CommonJS. No GitHub Actions workflows. Tests are written, never run by the builders.

## 9. Not settled yet

- The cost line in plain usage terms ("about N% of a usage window") waits for three measured council runs; until then
  her runbook says "eleven model runs".
- The 30-minute stall is a guess until those runs are timed.
- Installing the required skills is the Workspace's job (`requires.skills`); a Workspace that does not know the field
  ignores it, and her README says how to copy the four skills by hand.
