# StudyRPG

A pixel-art study timer (Pomodoro-style) where every finished study session is a battle won. Earn XP to level up your hero and gold to buy gear that boosts future rewards.

```bash
npm install
npm run dev
```

## How it plays

- **Quest**: pick (or add) the subject you're studying, choose a length (presets or 1–180 min), and start. The monster's HP drains as time passes. Fleeing forfeits the loot.
- **Rewards**: 4 XP and 1 gold per minute studied, multiplied by gear bonuses and a daily streak bonus (+5% per consecutive day, max +25%). Each level-up also grants bonus gold.
- **Rests**: short rest after each quest, long rest every N quests (configurable).
- **Foes**: longer sessions summon tougher monsters: Slime (<15 min), Bat, Skeleton (25+), Gargoyle (45+), Demon Lord (75+), capped at the Archdemon boss (120+).
- **The Siege (idle)**: an army raids demon keeps, but only during study time. Troops earn souls per study minute; souls recruit more troops (+15% cost each) and buy War Council upgrades. Razed keeps drop gold and XP. Souls and loot arrive when a quest is won; fleeing forfeits them, and the army can't be changed mid-quest.
- **Hero / Shop**: weapons boost XP, armour boosts gold, relics boost both. Higher-tier items unlock by level.
- **Log**: time per subject and a history of completed sessions.

All progress is stored in the browser's `localStorage` under `studyrpg.save.v1`. Use **Config → Export / Import** to back it up or move it to another browser.

## Code map

- `src/game/` — pure game logic: types, item data, reward/level formulas, the idle siege (`idle.ts`), the reducer, storage, and the WebAudio chiptune sounds.
- `src/components/` — one component per screen plus the pixel sprites (drawn from text grids as SVG).
