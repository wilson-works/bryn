# Bryn, the Trail Guide

Helps you think a decision through. Five scouts weigh it on their own, she looks for where the plan could fail, and
she keeps your call so you never argue it twice.

Bryn is a specialist agent for the WilsonWorks Workspace. She is built from four free skills that already exist:
`brainstorm`, `llm-council`, `premortem` and `decision-policy`. She needs nothing else: no browser tools, no accounts,
no extra installs. If you have Claude Code and a Workspace, you have everything she uses.

## What she does

Bring her a decision, big or small.

1. **At the fork.** She reads your question back in fewer words, checks the stone path in case you decided it before, and
   asks two things: can you undo it, and how much rides on it? A small call you can undo gets a straight answer and no
   fuss: "You can undo this one. I'd pick X. Your call."
2. **Laying out the routes.** No options yet? She runs a brainstorm. You go first.
3. **Scouts on the trail.** For a bigger call, five scouts each take a different road: the Contrarian, the First
   Principles Thinker, the Expansionist, the Outsider and the Executor. They answer alone, then review each other's
   notes without names attached, and Bryn pulls it together into her advice and one first step. They are five
   viewpoints from one AI model, not five experts, and she says so.
4. **Up on the hill.** Committing to a plan? She imagines it is six months on and the plan failed, and works out why:
   the most likely failure, the most damaging one, and the assumption nobody checked.
5. **Laying a stone.** When you decide and say "file it", your decision goes on the stone path. A choice that keeps coming
   back, can be undone, and has bounded stakes becomes a trail marker: a standing rule, so the same question gets the
   same answer next time.

Before a council or a premortem she tells you what it costs (a council is eleven model runs) and waits for a yes. She
never makes the decision for you, never acts on it, and never gives legal, medical, tax or investment advice.

## Her dashboard

A page on your own computer (`http://127.0.0.1:7550/`) with:

- **The trailhead**: a scene for what she is doing right now, what is on the table, and the trail map of the stops
  ahead. You can leave her a question there for your next Claude session.
- **The stone path**: every decision as a stone. Filter them, search them, or ask Bryn to check whether you have decided
  something like it before. Open a stone to read its pages: the question, the options, the council, the premortem and
  what you decided.
- **The trail markers**: your standing rules, each with when it applies, what to do, and when to stop and think again.

A fresh install shows invented examples (a person called Alex) until your first real question lands.

## Install

In a WilsonWorks Workspace, from the Workspace folder:

```
node agents/bin/install-agent.js <this folder, a .zip of it, or its git address>
```

She moves into the Agents' wing of your office, her subagent is registered so any Claude session on your Hub can call
her, and her dashboard starts on port 7550 (or the next free one). A Workspace that knows `requires.skills` installs
the four skills she uses from its skills pack. An older one ignores that field: copy `brainstorm`, `llm-council`,
`premortem` and `decision-policy` from the pack into `<Hub>/.claude/skills/` yourself.

To run her dashboard straight from this folder: `node dashboard/server.js`.

To open her door from your phone, put this computer's own address in `bryn.config.json` as `"phone"` (for example `https://desk.example-tailnet.ts.net:8445/` from `tailscale serve`). Her dashboard then answers that name too. It never goes in `agent.json`.

## Use

In a Claude Code session on your Hub:

- "Bryn, help me decide whether to ..." runs the whole trail (in the session itself, following `CLAUDE.md`).
- "Bryn, have we decided this before?" checks the stone path and the trail markers.
- "Bryn, take up the next question" takes the oldest question you left on her dashboard.

## Where your decisions live

Everything you tell her stays on your computer, in her data folder, never in her own folder (her folder is the package,
and your questions must not travel with it):

- inside a Hub: `<Hub>/50-AI/agent-data/bryn/`
- anywhere else: `data/` beside her, or `data_dir` in `bryn.config.json` (`bryn.config.example.json` shows the shape)

`node engine/config.js` prints where everything is.

## What is in this folder

| File or folder | What it is |
|---|---|
| `agent.json` | Who she is, her colours, her door, how to start her, the skills she needs. |
| `CLAUDE.md` | Who she is and her runbook, step by step. |
| `subagent.md` | Her front desk: checks the stone path and the trail markers, frames a question, says the next step. It only reads. |
| `brand/` | Her voice (`VOICE.md`), her character sheet, every line on her page (`copy.json`), her palette (`tokens.css`). |
| `art/`, `art.svg`, `mark.svg` | Her ten scenes, the figure in her office doorway, and her sign. |
| `dashboard/` | Her page and its server (Node's built-ins only, this computer only). |
| `engine/` | The small tools her runbook calls: the stage, a decision's record, the stone path reader, questions left for her. |
| `brains/`, `rules/`, `memory/` | What she knows, her standing rules, what she has learned. |
| `examples/` | The invented examples a fresh install shows. |
| `tests/` | Checks for the engine, the server and her manifest (`node --test`). |
| `DESIGN.md` | Why these four skills, and how she was designed. |
