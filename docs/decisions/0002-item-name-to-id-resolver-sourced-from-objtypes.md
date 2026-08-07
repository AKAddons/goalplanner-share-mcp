---
status: accepted
date: 2026-06-04
decision-makers: ajkatz
---

# Source the ITEM_GRIND name-to-id resolver from objtypes plus a curated alias map, not from ItemSourceData

> Migrated in substance from the pre-MADR `DECISIONS.md` entry of the same
> date. See [ADR-0001](0001-follow-the-plugin-adr-convention.md).

## Context and Problem Statement

Phase 2 — bringing ITEM_GRIND into the typed (auto-tracking) core using the
newly-added OSRS MCP cache data. A user says "10 Bandos chestplates" and the
crafter must emit a verified `itemId` that auto-tracks on the recipient's
account. The question was where authoritative item names come from.

## Decision Drivers

* The plugin tracks ITEM_GRIND by **exact** `itemId`, so a wrong id is a
  silently broken goal, not a degraded one.
* Internal codenames diverge from display names for a meaningful minority of
  items.
* Any name table shipped here is a maintenance surface; hand-typed ids are
  exactly the bug class the project's test discipline warns about.

## Considered Options

* `objtypes.txt` + normalization + loose matching + a small curated alias map
* An `id -> displayName` overlay built from the plugin's `ItemSourceData.java`
* Pure objtypes, no aliases
* A comprehensive hand-curated name table

## Decision Outcome

Chosen option: "`objtypes.txt` + normalization + loose matching + a small
curated alias map", with every alias id individually verified against objtypes.

Roughly 70%+ of common grindables' codenames *are* their display name with
underscores, so normalization carries the bulk; the loose (alphanumeric) key
absorbs most of the rest ("Vorkath pet" -> `vorkathpet`). Only the genuinely
divergent tail — pure-slug consumables and collection-log pet nicknames — needs
aliases, and that set is small and individually verifiable. The long tail is
the caller's job: resolve an id via the OSRS Wiki and pass `itemId` explicitly,
validated against the corpus.

### Consequences

* Good, because the generated corpus stays a mechanical transform of game data,
  with curation confined to a small auditable map.
* Good, because loose-key ambiguity measured at just 0.5% (88 of 18,519 keys,
  all `_p`/`_p+`/`_p++` poison-variant collisions), handled by a safe null plus
  an actionable warning.
* Bad, because divergent-name recall depends on the alias map, which grows by
  hand as gaps are found.

### Confirmation

Resolver tests cover happy path, variant filtering, ambiguity, and
miss-to-unverified fallback. Alias ids are cross-checked against objtypes.

## Pros and Cons of the Options

### objtypes + normalization + loose matching + curated aliases

* Good, because normalization and loose matching cover the large majority
  mechanically.
* Good, because the curated tail is small enough to verify entry by entry.
* Bad, because it needs ongoing curation for newly divergent names.

### ItemSourceData overlay

Measured before rejecting: 2,370 unique ids carry `//` display comments, but
the file is a **collection-log-slot to all-variant-ids** table — its own header
says "ALL item ID variants... inventory, noted, collection log, follower
forms". The comment is the *slot* name stamped onto every variant id, so id
5883 (a beer keg in objtypes) is labelled "Abyssal orphan".

* Bad, because using it as a per-id name map would make wrong items resolve —
  worse than the status quo.
* Bad, because ~1,995 of the 2,370 apparent gains were this mislabelled-variant
  noise.

### Pure objtypes, no aliases

* Bad, because codenames diverge for consumables (`4doseprayerrestore`) and old
  items (`mcannonball`); ~30% of common consumables will not normalize-match.

### Comprehensive hand-curated name table

* Bad, because low ROI and error-prone — display-name typos are precisely the
  failure mode the project's test discipline exists to prevent.

## More Information

The measurement that exposed the ItemSourceData slot-vs-item mismatch is the
reason this decision is worth recording: it prevented shipping a corrupting
overlay that would have looked like a large recall win.
