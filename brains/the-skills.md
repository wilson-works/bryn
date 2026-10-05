# The four skills Bryn runs

What it covers: which free skill does which part of the work, what it leaves on disk, and what it costs.

- `brainstorm`: options when there are none yet. Their seeds first, then quota rounds with named techniques, then
  clustering and a scored shortlist. Bryn saves the pile as `brainstorm-pile.md`. A few quick rounds. (from the
  brainstorm skill)
- `llm-council`: five scouts, five blind reviews, one chair. Leaves `council-transcript-<ts>.md` and
  `council-report-<ts>.html`. Eleven model runs. (from the llm-council skill)
- `premortem`: "six months on, the plan failed; why?" One investigator per failure reason (Bryn caps it at five), then
  the most likely failure, the most dangerous one, the hidden assumption, a revised plan and a checklist. Leaves
  `premortem-transcript-<ts>.md` and `premortem-report-<ts>.html`. Up to six model runs. (from the premortem skill and
  DESIGN.md section 3)
- `decision-policy`: files the decision (an ADR-style record or a standing policy), and is consulted before deciding
  again. Its log is `log/` in Bryn's data folder: `POLICIES.md`, `policies/`, `adr/`. (from the decision-policy skill)
- A Claude Code subagent cannot start subagents of its own, so the council and the premortem always run in the main
  session; Bryn's subagent only reads and routes. (from DESIGN.md section 3)
- The four skills come from the free WilsonWorks skills pack; `agent.json` lists them under `requires.skills`. (from
  agent.json)

Last checked: 2026-10-05.
