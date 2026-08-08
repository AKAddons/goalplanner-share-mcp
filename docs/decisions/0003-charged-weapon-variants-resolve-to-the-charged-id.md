---
status: accepted
date: 2026-06-09
decision-makers: ajkatz
---

# Plain wiki names of chargeable weapons resolve to the CHARGED item id

> Migrated in substance from the pre-MADR `DECISIONS.md` entry of the same
> date. See [ADR-0001](0001-follow-the-plugin-adr-convention.md).

## Context and Problem Statement

Plain names of chargeable weapons ("Trident of the seas", "Craw's bow") were
invisible to the resolver. Both generated layers miss this class: the charged
form is untradeable, so it has no wiki-prices mapping row, and its codename is
an internal slug, so it has no normalize or loose match either.

## Decision Drivers

* Some charged items already resolved to their charged id by accident, wherever
  the charged codename happened to match the display name
  (`scythe_of_vitur` 22325, `sanguinesti_staff` 22323, `tumekens_shadow` 27275)
  — so charged-id-for-plain-name was already the de-facto convention.
* `ItemTracker` matches by exact id, so this choice determines what a user's
  goal actually counts.
* Hand-typed ids are a known failure mode ([ADR-0002](0002-item-name-to-id-resolver-sourced-from-objtypes.md)).

## Considered Options

* Curated NICKNAMES entries targeting objtypes **codenames**, resolving to the charged id
* Resolve plain names to the uncharged id
* Regenerate `item-names.data.ts` from the full wiki item table instead of the prices mapping

## Decision Outcome

Chosen option: "Curated NICKNAMES entries targeting objtypes codenames",
resolving plain names to the charged id. Entry targets are codenames
(`tots_charged`, `wild_cave_bow_charged`) — never hand-typed ids. Uncharged
forms stay reachable under their own wiki names ("Uncharged trident", "Craw's
bow (u)") through the generated display layer.

This makes the slug-codename tail (tridents, wilderness weapons, blood fury,
crystal armour) consistent with the items that already behaved this way, rather
than special-casing them to uncharged.

### Consequences

* Good, because it matches the convention the corpus already exhibited, so
  behaviour is uniform across chargeable weapons.
* Good, because codename targets keep the "no hand-typed ids" rule intact.
* Bad, because a "Trident of the seas" goal does not count an uncharged trident
  in the bank. Documented in `list_supported_goals`; users who want the
  tradeable grind name the uncharged form.

### Confirmation

Clan-corpus test asserts curated entries resolve.

## Pros and Cons of the Options

### Curated NICKNAMES targeting codenames

* Good, because consistent with already-working charged items.
* Bad, because the uncharged form no longer matches the plain name.

### Resolve plain names to uncharged

* Bad, because it contradicts the de-facto behaviour of the items that already
  resolved, producing two rules for one class of item.

### Regenerate from the full wiki item table

* Bad, because it is a heavier scrape, and the divergent untradeable tail is
  small, enumerable, and already covered by the name-reference curation pattern.
