---
status: accepted
date: 2026-06-11
decision-makers: ajkatz
---

# Cross-section relation ids: explicit ids only, local wins, ambiguity drops

> Migrated in substance from the pre-MADR `DECISIONS.md` entry of the same
> date. See [ADR-0001](0001-follow-the-plugin-adr-convention.md).

## Context and Problem Statement

The plugin's GPSHARE2 wire format gained a bundle-level `crossEdges` list so
dependency edges can span sections (`runelite-goal-planner` ADR-0002). The MCP
craft form has to decide how a `requires`/`orRequires` id in one section
resolves against goals in another — a question the plugin side does not face,
because it works from real store ids while the MCP works from caller-supplied
names or list indexes.

## Decision Drivers

* Goals without a caller id default to their list index ("0", "1", ...), and
  index ids collide across sections constantly.
* Every spec that resolved before `crossEdges` existed must resolve identically
  afterwards — silent behaviour change in a code generator is unacceptable.
* Cycle detection must not become weaker just because an edge crosses a section.

## Considered Options

* Explicit-id-only cross-section matching, resolving locally first
* Match any id across sections, including index-derived ids
* Keep refs strictly section-local and never emit cross edges

## Decision Outcome

Chosen option: "Explicit-id-only cross-section matching, resolving locally
first".

A `requires`/`orRequires` id resolves **within its own section first**; failing
that, it matches a goal in another section **only if** the target goal has an
explicit caller-supplied `id` and matches **exactly one** other section. The
match is lifted off the goal's section-scoped refs onto the bundle-level
`crossEdges` list (`{fromSection, fromRef, toSection, toRef, or}` — mirrors the
plugin's `CrossEdgeDto`). An id present in several other sections warns
"ambiguous" and drops. Cycle detection runs over the whole bundle graph,
section-local plus cross edges, so a cycle threaded through two sections is
caught like a local one.

### Consequences

* Good, because local-wins preserves pre-`crossEdges` behaviour byte for byte —
  a spec that resolved before resolves identically now.
* Good, because explicit ids are deliberate names, so cross-section wiring is
  always something the caller asked for.
* Good, because indexes stay section-local, which is the only way to stop
  accidental edges between unrelated goals that happen to be third in their list.
* Bad, because a caller who wants a cross-section edge must supply explicit ids,
  which is a hidden requirement until they hit the warning.

### Confirmation

Parity verified against the plugin's real codec in both directions: an
MCP-encoded code with AND and OR cross edges decoded by `ShareCodec`/Gson via a
throwaway JUnit test, and a plugin-encoded code decoded here. Unknown-everywhere
ids keep the existing "unknown goal id — edge dropped" warning path.

## Pros and Cons of the Options

### Explicit-id-only, local wins

* Good, because it is backwards-identical for existing specs.
* Bad, because cross-section edges need opt-in naming.

### Match any id across sections, including index ids

* Bad, because index ids collide across sections constantly, so this silently
  wires accidental edges — the worst failure mode for a generator, since the
  output looks valid.

### Never emit cross edges

* Bad, because it discards plan structure the plugin format can now carry, and
  the recipient cannot recover it.

## More Information

Binds `runelite-goal-planner` ADR-0002, which defines the wire field this
resolution feeds.
