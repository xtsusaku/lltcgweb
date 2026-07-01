# PBSP02 — Premium Booster Superstar!! DUO

Official expansion code: **PBSP02**  
JP product name: `プレミアムブースター ラブライブ！スーパースター!! DUO`  
Card list API: `cardsearch_ex?expansion=PBSP02&view=text&page=N` (9 pages, **122 cards**)

## Card prefixes

| Prefix | Role |
|--------|------|
| `PL!SP-pb2-*` | **New DUO cards** (members, lives, energy, parallels) — official numbering |
| `PL!SP-bp2-*` | **SRL live reprints** only (`023`–`027` in this box) |
| `PL!SP-bp1-*` / `PL!SP-sd1-*` | Reprints / alternate rarities from prior products |

> **Note:** Early drafts used `PL!SP-bp2-001` style numbers; the live official IDs are `PL!SP-pb2-*` (matching vol.1 `pb1`). Legacy `PL!SP-bp2-*` rows in `cards.json` (wrong numbering) should be ignored — use scrape output.

Image folder on official CDN: **`PBSP02/`** (paths may also appear under `PBSP/` for parallels).

Booster box id in `booster.php`: **`pb_superstar_duo`**

## Tooling

### Scrape expansion → Chiichan JSON

From **lltcgweb** repo:

```bash
python tools/scrape_expansion.py PBSP02
# optional: --output-dir /path/to/Chiichan
```

Writes `Chiichan/all_cards_pbsp02_<timestamp>.json`.

### Import JSON → Chiichan `database.db`

From **Chiichan** repo:

```bash
python tools/import_cards_json_to_db.py all_cards_pbsp02_*.json
# update existing rows after re-scrape:
python tools/import_cards_json_to_db.py all_cards_pbsp02_*.json --force-update
```

### Import DB → `lltcgweb/cards.json`

From **lltcgweb** repo:

```bash
python import_from_db.py --prefix "C:/Users/super/OneDrive/Documents/GitHub/Chiichan/database.db" "PL!SP-pb2-"
python import_from_db.py --refresh "C:/Users/super/OneDrive/Documents/GitHub/Chiichan/database.db" "PL!SP-pb2-"
python import_from_db.py --refresh "C:/Users/super/OneDrive/Documents/GitHub/Chiichan/database.db" "PL!SP-bp2-"
```

Ability routing: `sp_bp2_abilities.py` → `abilities_for_sp_bp2()` (English in `_SP_BP2_TRANSLATIONS`).

## Import status (2026-07-01)

| Scope | Count | Notes |
|-------|------:|-------|
| **PBSP02 expansion total** | 122 | Official cardsearch |
| **DUO-tagged in `cards.json`** | **122/122** | Full pool — `booster_pack` = `プレミアムブースター ラブライブ！スーパースター!! DUO` |
| **`PL!SP-pb2-*` new DUO cards** | 93 | All rarities / parallels |
| **Unique pb2 base numbers** | 51 | `000`–`050` + extras |
| **Bases with engine abilities** | 46 | All non-vanilla bases wired |
| **Bases text-only / no ability** | 5 | `034`, `038`, `039`, `042`–`044` (vanilla) |
| **Bases blocked** | 0 | Batch 3 complete |

### Reprint import (final 13, audit 947a091c)

Scrape JSON was already in `database.db`; imported into `cards.json` via `import_from_db.py --prefix`:

| Source set | Card numbers | Ability reuse |
|------------|--------------|---------------|
| **SAPPHIRE MOON** (`bp4`) | `PL!SP-bp4-023-SRL` … `030-SRL` (+ `024-SECL`) | `abilities_for_sp_bp4()` — same base numbers as `PL!SP-bp4-*-L` |
| **Premium vol.1** (`pb1`) | `PL!SP-pb1-023-SRL` … `026-SRL` | `abilities_for_sp_pb1()` — same base numbers as `PL!SP-pb1-*-L` |

Images use **`PBSP02/`** CDN paths; `booster_pack` set to DUO so `tcgBuildBoxPools()` includes them in `pb_superstar_duo`.

### Batch table

| Batch | Base numbers | Status |
|-------|----------------|--------|
| **1** | `pb2-000`–`pb2-030` | **Done** — batch 3 handlers for 003–006, 008–009, 011, 022, 026 |
| **2** | `pb2-031`–`pb2-050` | **Done** — includes `046` Butterfly Wing |
| **SRL lives** | `bp2-023`–`027`, `bp4-023`–`030`, `pb1-023`–`026`, `bp1/sd1` in box | **Done** — inherit bp2/bp4/pb1/sd1 handlers |
| **Reprints** | `bp1-*`, `sd1-*` members/lives | **Done** — inherit existing pb1/sd1 handlers |

### Batch 3 handlers (`sp_bp2_effects.php`)

| Base | Effect types |
|------|----------------|
| `pb2-003` | `score_if_moved_by_group_effect` (member Live Success; Liella effect move) |
| `pb2-004` | `draw_if_live_zone_score_up_or_yell_score_icon` |
| `pb2-005` | `stack_baton_wr_member_under`, `inherit_stacked_group_abilities` |
| `pb2-006` | `cost_per_stacked_group_member`, `auto_stack_wr_group_member_under` |
| `pb2-008` | `score_per_yell_group_no_blade` (deferred after Yell reveal) |
| `pb2-009` | `optional_wait_self_opp_heart_gap` |
| `pb2-011` | `auto_on_center_move_choose` (+ optional position change) |
| `pb2-022` | `auto_on_move_to_center_subunit_heart` |
| `pb2-026` | `hearts_if_active_energy` |
| `pb2-046` | `continuous_negate_stage_member_abilities`, `live_score_if_stage_has_ability_members` |

## Booster UI

- **Box picker** (`booster.php` `image`): Official 3D box render from cardlist (`LLC_-PB06_box_image.png` on llofficial-cardgame.com).
- **Pack open** (`pack_images`): Amazon pack wrapper `pb_superstar_duo-a.jpg` (unchanged).

## Operator deploy checklist

1. Scrape + DB import if card data changed.
2. `import_from_db.py --refresh` for touched prefixes.
3. Deploy Hostinger: `tcg/cards.json`, `tcg/booster.php`, `tcg/effects.php`, `tcg/sp_bp2_effects.php`, `tcg/api.php`, `tcg/index.html`.
4. Hard-refresh https://loveliveradio.ca/tcg after deploy.

**Do not deploy** `tcg/games/*.json` or `tcg/data/*.db`.

## References

- Product page: https://llofficial-cardgame.com/products/pbsp_duo/
- Vol.1 premium (`pb_superstar`): `PL!SP-pb1-*`, `abilities_for_sp_pb1()`
