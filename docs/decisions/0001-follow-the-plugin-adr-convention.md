---
status: accepted
date: 2026-07-29
decision-makers: ajkatz
---

# This repo follows the MADR convention set by the plugin repo

## Context and Problem Statement

`goalplanner-share-mcp` is the generated follower to `runelite-goal-planner`:
the plugin is the source of truth for the share wire format, and decisions
about that format bind both repos. The plugin adopted MADR for architecture
decisions; this repo kept an append-only `DECISIONS.md`. Two formats across two
repos that share decisions is worse than either format alone.

## Considered Options

* Keep the append-only `DECISIONS.md` here
* Adopt MADR here too, with an independent number sequence
* Record all decisions in the plugin repo only

## Decision Outcome

Chosen option: "Adopt MADR here too, with an independent number sequence",
because decisions that are genuinely MCP-local (item resolver sourcing, name
resolution) do not belong in the plugin's log, while decisions that bind both
can be recorded once in the plugin and cited from here by name.

Numbering restarts at 0001 per repo. Cross-repo citations are written in full —
`runelite-goal-planner ADR-0002` — never as a bare number, because a bare
`ADR-0002` means something different in each repo.

### Consequences

* Good, because MCP-local decisions stay where the code they describe lives.
* Good, because each repo's log is readable standalone.
* Bad, because every repo needs its own charter ADR (this file) to explain the
  numbering, which is duplication that earns its place only by removing
  ambiguity.

### Confirmation

`npm run check:adr` (`scripts/check_adr.py`, shared verbatim with the plugin
repo) validates filenames, status values, supersession targets, required
sections, and that `DECISIONS.md` has not drifted from the directory.

## More Information

Rationale for MADR itself: `runelite-goal-planner` ADR-0001. Do not restate it
here — that file is the single source.
