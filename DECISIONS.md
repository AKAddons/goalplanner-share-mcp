# Decisions — goalplanner-share-mcp

Architecture decisions are recorded as [MADR](https://adr.github.io/madr/)
files in **[`docs/decisions/`](docs/decisions/)** — one file per decision.

Start from [`0000-adr-template.md`](docs/decisions/0000-adr-template.md).
Everything except Context, Considered Options, and Decision Outcome is
optional. Numbers are identifiers, not chronology — `date:` in the frontmatter
carries the real ordering.

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](docs/decisions/0001-follow-the-plugin-adr-convention.md) | This repo follows the MADR convention set by the plugin repo | accepted |
| [0002](docs/decisions/0002-item-name-to-id-resolver-sourced-from-objtypes.md) | Source the ITEM_GRIND name-to-id resolver from objtypes plus a curated alias map | accepted |
| [0003](docs/decisions/0003-charged-weapon-variants-resolve-to-the-charged-id.md) | Plain wiki names of chargeable weapons resolve to the CHARGED item id | accepted |
| [0004](docs/decisions/0004-cross-section-relation-ids-explicit-only-local-wins.md) | Cross-section relation ids: explicit ids only, local wins, ambiguity drops | accepted |
| [0005](docs/decisions/0005-new-item-ids-topped-up-from-gameval.md) | Item ids newer than the objtypes snapshot come from RuneLite's gameval.ItemID | accepted |

Numbering restarts per repo. Decisions in the plugin repo are cited in full —
`runelite-goal-planner ADR-0002` — never as a bare number, since a bare number
means something different in each repo.
