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

The **HUD** (top bar) shows hero name, level and title, the XP bar, **gold**, **souls** (current, spendable) and the daily streak.

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
- **Combat animation** (while the timer runs, a 2.4 s loop): the hero lunges and slashes (white arc, the foe flashes and is knocked back), then the foe answers and the hero flashes as it's hit. Each foe fights differently:
  - **Slime:** squashes, hops and splats onto the hero.
  - **Bat:** rises, then swoops down at the hero.
  - **Skeleton:** winds up and lunges with a sword swing.
  - **Gargoyle:** hovers, then dives with its wings spread.
  - **Demon Lord / Archdemon:** stomps and hurls a fireball (the Archdemon's is bigger and purple), on top of the boss quake.
  Animations pause with the timer and respect "reduce motion".
- Monster HP = **10 × minutes** (display only; it drains with the timer).
- Monster type is cosmetic: rewards depend only on minutes studied (and bonuses).

---

## 6. Rewards & progression

### Per completed quest
- **XP = minutes × 4 × (1 + XP bonuses)**
- **Gold = minutes × 3 × (1 + gold bonuses)**
- Plus siege loot (see §8).
- The Quest screen previews the loot before you start.

### Bonuses
- **Gear** (§7), **War Council hero upgrades** and **Boons** (§8) add XP%/gold%. All bonuses add together (e.g. +50% gear + 20% boons = +70%).
- **Daily streak:** study on consecutive days. Day 1 = +0%, each further day +5% XP, max **+25%** (day 6+). Missing a day resets it. Shown as 🔥 in the HUD.

### Levels
- XP needed for the next level = **floor(100 × level^1.5)** (Lv1→2: 100, 2→3: 282, 3→4: 519, 4→5: 800 …).
- Each level-up grants **40 × new level** bonus gold.
- Titles: Lv1 Novice · Lv3 Squire · Lv5 Apprentice · Lv8 Knight · Lv12 Night Hunter · Lv16 Archmage · Lv20 Legend.

### Victory dialog
Shows XP, gold, streak bonus, siege report (souls, keeps razed with their loot) and any level-up, with jingles.

---

## 7. Gear (Shop, paid in gold)

Three slots, browsed with the Shop's Weapons / Armors / Relics tabs. **Weapons boost XP, armor boosts gold, relics boost both, and every item above wood also strengthens the siege army** (+% army power, i.e. more souls and keep damage). Bought items are equipped immediately; owned items can be swapped on the Hero tab. Items above your level show as `??? (LV n)`.

Gear changes the hero's look: armor colours the suit (with computed light/shade), the weapon colours the blade, the relic colours the belt gem. A **mythic relic** also recolours the cape and plume, and **any mythic item makes the hero glow** in that item's colour.

### Material ranks
Each rank has a Sword (weapon), Armor and Amulet (relic) at the same price and level.

| Rank | Min Lv | Price (each) | Sword: XP | Armor: gold | Amulet: XP + gold | Siege (each) |
|---|---|---|---|---|---|---|
| Wooden | 1 | 60 | +3% | +3% | +2% / +2% | +0% |
| Stone | 3 | 200 | +6% | +6% | +3% / +3% | +2% |
| Copper | 5 | 500 | +10% | +10% | +5% / +5% | +4% |
| Iron | 7 | 1,200 | +15% | +15% | +8% / +8% | +6% |
| Silver | 10 | 2,500 | +21% | +21% | +11% / +11% | +9% |
| Golden | 13 | 5,000 | +28% | +28% | +14% / +14% | +12% |
| Platinum | 16 | 9,000 | +36% | +36% | +18% / +18% | +16% |
| Diamond | 18 | 15,000 | +45% | +45% | +23% / +23% | +20% |

A full diamond set gives +68% XP, +68% gold and +60% siege.

### Mythic items
Each has a different hero-vs-siege trade-off.

| Slot | Item | Min Lv | Price | Bonus |
|---|---|---|---|---|
| Weapon | Elderwood Bow | 20 | 28,000 | +50% XP, +35% siege |
| Weapon | Phoenix Blade | 24 | 45,000 | +65% XP, +5% gold, +25% siege |
| Armor | Icecrystal Mail | 20 | 28,000 | +50% gold, +35% siege |
| Armor | Dragonscale Plate | 24 | 45,000 | +5% XP, +65% gold, +25% siege |
| Relic | Phoenix Feather | 22 | 36,000 | +25% XP, +25% gold, +30% siege |
| Relic | Starfall Crown | 26 | 55,000 | +30% XP, +30% gold, +45% siege |

Saves from before this catalogue keep their gear: old items are converted to the closest material rank (e.g. Rusty Dagger → Wooden Sword, Gothic Aegis → Iron Armor, Crown of Focus → Iron Amulet).

---

## 8. The Siege (idle game)

Your army raids demon keeps, **but only while you are in a running quest**. Paused, resting or idle means no progress. No clicking is ever needed.

- **Souls:** troops produce souls per study minute. The same amount is dealt as damage to the current keep.
- **Army power** multiplies all troops: War Council army upgrades × Siege Engineers boon × **(1 + the hero's gear siege bonus)**. The Army tab shows the total and the part that comes from gear.
- **Where to see your souls:** the HUD, the "souls available" box at the top of the Army tab's recruit list, and the siege scene's footer. The Army stats also show souls earned all time.
- **Live view:** during a quest the siege scene animates (marching troops, arrows/fireballs/boulders, a burning keep). It shows your banked souls, plus the souls and keeps gathered so far as "pending (paid on victory)".
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
- Razing a keep gives **50 × level gold** and **30 × level XP** (× loot multipliers), then the next, stronger keep appears.
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
| Merchant Guild | 12,000 | Hero +10% gold from quests | Keep level 5 |
| Sage's Library | 12,000 | Hero +10% XP from quests | Keep level 5 |
| Lords of Plunder | 250,000 | Keep loot ×2 | Keep level 10 |
| Golden Age | 1,500,000 | Hero +15% gold from quests | Keep level 12 |
| Enlightenment | 1,500,000 | Hero +15% XP from quests | Keep level 12 |

The list is shown cheapest first.

### Boons (repeatable, paid in souls)
Each rank adds the same bonus; the next rank costs **growth ×** the previous one, up to a cap. Locked boons show what unlocks them.

| Boon | Per rank | Max ranks | First rank | Growth | Unlocks at |
|---|---|---|---|---|---|
| Royal Treasury | Hero +2% gold | 20 (+40%) | 2,000 | ×1.9 | Keep level 4 |
| Grand Academy | Hero +2% XP | 20 (+40%) | 2,000 | ×1.9 | Keep level 4 |
| Siege Engineers | Army +5% | 20 (+100%) | 1,500 | ×1.8 | 25 troops |

Rank costs climb fast (the 11th Treasury rank costs ≈ 1.2M souls, the 20th ≈ 400M), so boons are a long-term soul sink.

### Balance overview (maximum possible hero bonuses)
| Source | XP | Gold |
|---|---|---|
| Best gear (Phoenix Blade + Dragonscale Plate + Starfall Crown) | +100% | +100% |
| War Council (one-time) | +40% | +40% |
| Boons (max) | +40% | +40% |
| Daily streak | +25% | — |
| **Total** | **+205%** (≈3× base) | **+180%** |

These maximums take months of study; early game sits around +10–30%.

---

## 9. Options & data

- **Hero name** (max 16 chars).
- **8-bit sound** (on): chiptune jingles for start, victory, level-up, rest over, purchases.
- **Desktop notifications** (off): asks browser permission; notifies when a quest or rest ends.
- **CRT scanlines** (on).
- **Save data** lives in this browser only (localStorage). **Export** downloads a JSON backup; **Import** loads one; **New Game** wipes everything (with confirmation).
- The log keeps the last 200 sessions (shows 50).

## 10. Developer tools (hidden)

A debug console for testing and previewing late-game content without waiting. Normal players never see it.

- **Unlock:** always on with the local dev server (`npm run dev`). On the live site, open it once with `?dev` (https://daneviser.github.io/StudyRPG/?dev). This browser remembers it; **Hide dev tools** in the console (or `?dev=0`) turns it off again.
- **Open/close:** the green **DEV** button (bottom-right) or the <kbd>`</kbd> key; <kbd>Esc</kbd> closes. While the clock is sped up the button blinks and shows the speed (e.g. `DEV ×300`).

| Section | Tools |
|---|---|
| Time | **Clock speed** ×1 / ×10 / ×60 / ×300 / ×1000 for running quests and rests (the siege speeds up too). **Skip ahead** +1 / +5 / +15 min, **Finish now**. **Simulate study** 25m / 1h / 4h / 1 day / 1 week: an instant win paid out by the normal rules (rewards, siege, Victory dialog), using the selected subject. |
| Hero | Gold +100 / +1K / +10K / +1M · XP +100 / +1K / +10K / +100K (normal level-ups) · set level 1–99 · streak 0 / 3 / 6 days · **All gear** into inventory. |
| Siege | Souls +1K / +100K / +10M / +1B · +1 / +10 / +100 of every troop · **All upgrades** (also maxes every boon) · **Raze** 1 / 10 keeps (loot paid). |
| Snapshot | **Save** the whole game state, **Restore** it later to undo experiments (one slot, stored in this browser). |

Dev tool changes are real changes to your save. Take a snapshot first if you want to go back.

## 11. Where to play

https://daneviser.github.io/StudyRPG/ (updates automatically after each push to `master`). Every player has their own save in their own browser.

## 12. Look & feel

8/16-bit castle-at-night style: pixel fonts (Press Start 2P, VT323), hand-made pixel sprites, moon and castle silhouette, twinkling stars, chunky pixel borders, optional scanlines. Animations respect the OS "reduce motion" setting. Layout fits on one screen on most desktops and stacks on phones.

---

## Not built yet (ideas)

- **Skill tree** (placeholder text on the Hero tab).
- Accounts / login and cloud saves (see `TECHNICAL.md` → Migration).
- Using the spare height on large screens to show bigger scenes.
