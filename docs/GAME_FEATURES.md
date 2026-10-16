# StudyRPG: Game Features

What the game does today, with the exact numbers. Anything under **Not built yet** is an idea only.

> Keep this file in sync with the code. When a feature, number, item or screen changes, update the matching section here in the same change.

---

## 1. Core loop

1. Pick a **subject** (what you're studying) and a **session length**.
2. Start the **quest**. A monster appears; its HP drains as the timer runs.
3. When the timer ends you win: **XP**, **gold**, and your army's **siege loot**.
4. Take a **rest**, then go again.
5. Spend gold on **gear** (Shop) and souls on **troops/upgrades** (Army) to earn more next time.

Nothing needs clicking while studying. The game is designed to run in the background.

---

## 2. Screens (tabs)

| Tab | What's there |
|---|---|
| **Quest** | Battle stage, siege scene, timer + controls, subject picker. On desktop the battle and siege are visible together. |
| **Hero** | Hero sprite with equipped gear, stats, equipment slots, inventory (equip/remove). |
| **Army** | Siege overview and stats, recruit troops, War Council upgrades. |
| **Shop** | Buy gear with gold. |
| **Log** | Time per subject (Bestiary) and recent completed sessions (Adventure Log). Delete subjects here. |
| **Config** | Hero name, timer lengths, options, save export/import, New Game. |

A red dot on the Quest tab means a quest is running while you're on another tab. The browser tab title shows the countdown (e.g. `24:58 Quest - StudyRPG`).

---

## 3. Subjects

- Add any number of subjects with a name (max 24 chars) and one of 8 colours.
- The selected subject is locked in when a quest starts; you can't switch mid-quest.
- Each subject tracks total minutes and sessions completed.
- The subject's colour tints the monster you fight.
- Deleting a subject keeps its past log entries. You can't delete the subject of a running quest.

---

## 4. Timer (Pomodoro)

| Setting | Default | Range | Where |
|---|---|---|---|
| Study length | 25 min | 1–180 | Quest screen presets (15/25/45/60/90) or custom box; also Config |
| Short rest | 5 min | 1–60 | Config |
| Long rest | 15 min | 1–90 | Config |
| Quests per long rest | 4 | 1–12 | Config |
| Auto-start rests | off | | Config |

- **Phases:** Quest (focus), Rest (short break), Save Room (long break).
- **Controls during a quest:** Pause / Resume, **Flee** (press twice within 3 s to confirm). Fleeing gives **no rewards** and no siege progress.
- **Rests** can be started or skipped. Rests give no rewards.
- The timer keeps correct time in background tabs, and **survives closing the tab or browser**. If a quest ended while the app was closed, it completes (with rewards) the next time you open it.
- Changing lengths while a phase is running applies from the next phase.

---

## 5. Monsters (scale with session length)

Longer sessions summon tougher, bigger foes, capped at the Archdemon.

| Session length | Foe | Threat | Look |
|---|---|---|---|
| 1–14 min | Slime | ★ | small blob |
| 15–24 min | Bat | ★★ | flying |
| 25–44 min | Skeleton | ★★★ | sword & shield |
| 45–74 min | Gargoyle | ★★★★ | flying, purple aura |
| 75–119 min | Demon Lord | ★★★★★ | large, aura |
| 120+ min | **Archdemon** (BOSS) | ★★★★★★ | largest, dark palette, red aura, screen quake, dark stage |

- Name shown as `<Subject> <Foe>`, e.g. "Calculus Skeleton".
- Monster HP = **10 × minutes** (display only; it drains with the timer).
- Monster type is cosmetic: rewards depend only on minutes studied (and bonuses).

---

## 6. Rewards & progression

### Per completed quest
- **XP = minutes × 4 × (1 + XP bonuses)**
- **Gold = minutes × 1 × (1 + gold bonuses)**
- Plus siege loot (see §8).
- The Quest screen previews the loot before you start.

### Bonuses
- **Gear** (§7) and **War Council hero upgrades** (§8) add XP%/gold%.
- **Daily streak:** study on consecutive days. Day 1 = +0%, each further day +5% XP, max **+25%** (day 6+). Missing a day resets it. Shown as 🔥 in the HUD.

### Levels
- XP needed for the next level = **floor(100 × level^1.5)** (Lv1→2: 100, 2→3: 282, 3→4: 519, 4→5: 800 …).
- Each level-up grants **20 × new level** bonus gold.
- Titles: Lv1 Novice · Lv3 Squire · Lv5 Apprentice · Lv8 Knight · Lv12 Night Hunter · Lv16 Archmage · Lv20 Legend.

### Victory dialog
Shows XP, gold, streak bonus, siege report (souls, keeps razed with their loot) and any level-up, with jingles.

---

## 7. Gear (Shop, paid in gold)

Three slots. Weapons boost XP, armour boosts gold, relics boost both. Bought items are equipped immediately; owned items can be swapped on the Hero tab. Items above your level show as `??? (LV n)`. Gear changes the hero's sprite colours.

| Slot | Item | Price | Min Lv | Bonus |
|---|---|---|---|---|
| Weapon | Rusty Dagger | 50 | 1 | +5% XP |
| Weapon | Iron Sword | 150 | 3 | +10% XP |
| Weapon | Silver Rapier | 400 | 6 | +15% XP |
| Weapon | Moonlit Whip | 1000 | 10 | +25% XP |
| Weapon | Blade of Sages | 2400 | 15 | +40% XP, +5% gold |
| Armor | Leather Vest | 60 | 1 | +5% gold |
| Armor | Chain Mail | 180 | 4 | +10% gold |
| Armor | Knight Plate | 500 | 8 | +5% XP, +15% gold |
| Armor | Gothic Aegis | 1200 | 12 | +5% XP, +25% gold |
| Relic | Candle Charm | 80 | 2 | +3% XP, +3% gold |
| Relic | Owl Amulet | 250 | 5 | +10% XP |
| Relic | Hourglass Ring | 600 | 9 | +10% XP, +10% gold |
| Relic | Crown of Focus | 1500 | 14 | +20% XP, +20% gold |

---

## 8. The Siege (idle game)

Your army raids demon keeps, **but only while you are in a running quest**. Paused, resting or idle means no progress. No clicking is ever needed.

- **Souls:** troops produce souls per study minute. The same amount is dealt as damage to the current keep.
- **Live view:** during a quest the siege scene animates (marching troops, arrows/fireballs/boulders, a burning keep) and shows souls gained "this quest" and keeps razed so far.
- **Payout:** souls and keep loot are delivered **when the quest is won**. Fleeing forfeits them.
- **Army is locked mid-quest:** recruiting and upgrades are only available between quests.
- **Start:** 1 Squire, 0 souls, keep level 1.

### Troops
Cost grows **×1.15** per troop owned of that type. A troop type is revealed after you recruit at least one of the previous type.

| Troop | Souls/min each | Base cost |
|---|---|---|
| Squire | 2 | 15 |
| Archer | 8 | 120 |
| Knight | 30 | 800 |
| Battle Mage | 100 | 4,000 |
| Siege Golem | 400 | 20,000 |
| Dragon Rider | 1,500 | 100,000 |

### Demon keeps
- Keep HP = **200 × 1.8^(level − 1)** (200, 360, 648, 1,166 …).
- Razing a keep gives **25 × level gold** and **30 × level XP** (× loot multiplier), then the next, stronger keep appears.
- Names cycle: Imp Outpost, Ghoul Barracks, Bone Tower, Cursed Abbey, Wraith Citadel, Blood Fortress, Infernal Spire, Dread Castle.
- Several keeps can fall in one long quest.

### War Council upgrades (one-time, paid in souls)

| Upgrade | Cost | Effect | Appears when |
|---|---|---|---|
| Sharpened Spears | 100 | Squires ×2 | 5 Squires |
| War Drums | 500 | Whole army +25% | 10 troops total |
| Yew Longbows | 800 | Archers ×2 | 5 Archers |
| Siege Ladders | 1,500 | Keep loot +50% | Keep level 3 |
| Battle Hymns | 2,500 | Hero +5% XP from quests | Keep level 3 |
| Royal Tithe | 2,500 | Hero +5% gold from quests | Keep level 3 |
| Holy Oaths | 5,000 | Knights ×2 | 5 Knights |
| Arcane Tomes | 25,000 | Battle Mages ×2 | 5 Battle Mages |
| Crusader Banners | 60,000 | Whole army +50% | 50 troops total |
| Scholar's Blessing | 80,000 | Hero +10% XP and gold | Keep level 8 |
| Runic Cores | 120,000 | Siege Golems ×2 | 5 Siege Golems |
| Dragon Pact | 600,000 | Dragon Riders ×2 | 5 Dragon Riders |

---

## 9. Options & data

- **Hero name** (max 16 chars).
- **8-bit sound** (on): chiptune jingles for start, victory, level-up, rest over, purchases.
- **Desktop notifications** (off): asks browser permission; notifies when a quest or rest ends.
- **CRT scanlines** (on).
- **Save data** lives in this browser only (localStorage). **Export** downloads a JSON backup; **Import** loads one; **New Game** wipes everything (with confirmation).
- The log keeps the last 200 sessions (shows 50).

## 10. Look & feel

8/16-bit castle-at-night style: pixel fonts (Press Start 2P, VT323), hand-made pixel sprites, moon and castle silhouette, twinkling stars, chunky pixel borders, optional scanlines. Animations respect the OS "reduce motion" setting. Layout fits on one screen on most desktops and stacks on phones.

---

## Not built yet (ideas)

- **Skill tree** (placeholder text on the Hero tab).
- Accounts / login and cloud saves (see `TECHNICAL.md` → Migration).
- Using the spare height on large screens to show bigger scenes.
