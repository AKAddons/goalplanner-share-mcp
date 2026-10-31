---
status: accepted
date: 2026-10-28
decision-makers: ajkatz
---

# Item ids newer than the objtypes snapshot come from RuneLite's gameval.ItemID

## Context and Problem Statement

[ADR-0002](0002-item-name-to-id-resolver-sourced-from-objtypes.md) sources the
item table from the mcp-osrs `objtypes.txt`. That snapshot (mcp-osrs 1.0.1,
June 2026) stops at item id 33377, while the plugin's 1.0.1 content reaches
34727 (Mad Angel, The Fractured Archive). Every newer item came out as an
UNVERIFIED goal, even when the plugin's own item-source table knew it.

## Decision Drivers

* The plugin tracks by exact id, and RuneLite's `gameval` classes are its own
  authoritative id source, ahead of third-party caches by days.
* Existing codenames must not move. Players' phrases and curated aliases
  resolve against them.
* `gameval.ItemID` names are the cache codenames uppercased, but with
  Java-identifier mangling: `+` becomes `_`, and a leading `_` is added before
  a digit. That changes 615 of the existing names.

## Considered Options

* Keep objtypes as the base and add only ids above its highest id from `gameval.ItemID`
* Switch the whole table to `gameval.ItemID`
* Wait for a newer mcp-osrs release

## Decision Outcome

Chosen option: "Keep objtypes as the base and add only ids above its highest id".
`gen:items` runs the `runelite-api` jar (same discovery as `gen:quests`) and
adds new ids with the same placeholder/cert filtering. It strips the leading
`_` before a digit. Rows at or below the objtypes maximum are byte-identical
to an objtypes-only run.

### Consequences

* Good, because new content tracks the day RuneLite ships its ids, with no
  churn in existing names.
* Bad, because `gen:items` now needs a JDK and a cached `runelite-api` jar as
  well as the mcp-osrs data dir.
* Neutral: once a newer objtypes snapshot exists, rerunning moves its rows back
  under the objtypes source automatically, because the cut-off is its maximum id.
