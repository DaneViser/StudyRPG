# StudyRPG: Technical Guide

How the code is built, how to extend it, and how to move saving to a backend with user accounts later.

> Keep this file in sync with the code. When the state shape, an action, a file's responsibility, the save format or a convention changes, update the matching section here in the same change.

---

## 1. Stack

| | |
|---|---|
| UI | React 19 (function components + hooks), no router, no UI library |
| Language | TypeScript 6 (strict-ish: `noUnusedLocals`, `verbatimModuleSyntax`, `erasableSyntaxOnly`) |
| Build / dev | Vite 8 (`npm run dev`, `npm run build` = `tsc -b && vite build`) |
| Lint | oxlint (`npm run lint`) incl. React hooks/purity rules |
| Fonts | `@fontsource/press-start-2p`, `@fontsource/vt323` (bundled, no network) |
| Storage | `localStorage` (single JSON blob) |
| Audio | WebAudio oscillators (no audio files) |
| Graphics | Inline SVG pixel sprites built from text grids; CSS for scenes/animations |
| Hosting | GitHub Pages via GitHub Actions (§5.1) |

No backend, no external runtime dependencies beyond React.

---

## 2. Project layout

```
src/
  main.tsx            Entry: fonts, global CSS, <App/>
  App.tsx             Shell: background, header (logo + HUD), tabs, active screen, reward modal
  index.css           All styles (tokens, panels, screens, animations, responsive rules)
  game/               Pure game logic; no React except useGame.ts
    types.ts          All shared types incl. GameState (the save format)
    data.ts           Static content: gear (MATERIALS table + mythic list), LEGACY_ITEM_IDS, titles, monster tiers, reward constants
    logic.ts          Formulas: XP curve, rewards, bonuses, streaks, monster lookup, formatting
    idle.ts           Siege: troops, upgrades, ranked boons (RANKS), army multiplier, keep HP/loot, simulateIdle(), formatNum()
    reducer.ts        createInitialState(), gameReducer(), Action union, grantSession(), siegeLocked()
    storage.ts        loadGame / saveGame / normalizeSave / clearSave (localStorage)
    sound.ts          Chiptune sfx
    useGame.ts        Hook: reducer + persistence + ticking clock (+ dev speed) + completion side effects
    dev.ts            DevOp union + devReducer(): pure cheat transforms (grant, warp, simulate, …)
  components/
    Hud.tsx           Name, level/title, XP bar, gold, souls, streak
    QuestScreen.tsx   Battle, Camp (rest), SiegePanel, timer panel, DurationPicker, Controls, SubjectPicker
    Siege.tsx         SiegeScene (army, projectiles, keep) used by Quest and Army screens
    ArmyScreen.tsx    Siege stats, recruit list, War Council
    HeroScreen.tsx    Hero card, equipment, inventory
    ShopScreen.tsx    Gear shop
    LogScreen.tsx     Subject totals + history
    ConfigScreen.tsx  Settings, export/import/reset
    RewardModal.tsx   Victory dialog
    Sprites.tsx       PixelSprite renderer + all sprite grids (hero, monsters, troops, keep, icons)
  dev/
    useDevMode.ts     Dev-tools unlock (?dev / dev server), open state, clock speed, ` hotkey
    DevPanel.tsx      Debug console drawer + snapshot save/restore
docs/                 GAME_FEATURES.md (player-facing), TECHNICAL.md (this file)
.github/workflows/    deploy.yml: build + publish to GitHub Pages
vite.config.ts        React plugin, `base: './'` (relative asset paths)
.claude/launch.json   Preview configs: `studyrpg` (dev server), `studyrpg-pages` (production build at /StudyRPG/)
```

---

## 3. Architecture

```
            ┌──────────── useGame() ─────────────┐
 UI event → │ dispatch(Action) → gameReducer      │ → state → components (props)
            │        ↑                            │
            │  ticking `now` (250 ms, only while  │
            │  running) → 'complete' when due     │
            │  state change → saveGame(state)     │
            └─────────────────────────────────────┘
```

- **Single source of truth:** one `GameState` object held by `useReducer` in `useGame()`, passed down as props (`state`, `dispatch`, `remainingMs`, `now`). No context, no global store.
- **The reducer is pure.** Anything non-deterministic is computed by the caller and put in the action: `now` (timestamps) and ids (`crypto.randomUUID()`). This matters because React StrictMode runs reducers twice, and it makes the reducer reusable on a server (see §9).
- **Side effects live in `useGame`**: saving, ticking, completion sounds/notifications, document title. Purchase/start sounds are played by the components that dispatch.
- **Derived, not stored:** remaining time, live siege progress, bonuses, titles and monster tier are computed from state on render.

### 3.1 Time model
- A running phase stores `timer.endsAt` (epoch ms). Remaining time = `endsAt - now`. No per-second state updates, so background-tab throttling and closed tabs don't drift.
- Paused/idle phases store `timer.remainingMs` instead.
- `useGame` updates a local `now` every 250 ms only while running. When `now >= endsAt` it dispatches `complete` once (guarded by a ref keyed on `endsAt`); the reducer also ignores `complete` unless `status === 'running' && endsAt <= now`, so double dispatch is harmless.
- On load, a phase that ended while the app was closed completes on the first tick.

### 3.2 Idle siege model
- Siege progress is a **pure function of focused minutes**: `simulateIdle(idle, minutes, gearSiege) → { idle, loot }` (`idle.ts`). `gearSiege` is `gearBonuses(state.equipped).siege`; every caller (reducer, live preview, Army stats) must pass it so they agree.
- Army power: `soulsPerMinute = Σ(units × unitRate) × armyMultiplier(idle, gearSiege)`, where the multiplier is `(1 + engineers ranks × 5%) × (1 + gearSiege) × Π(army upgrade mults)`.
- **During a quest** the UI calls it with elapsed minutes `(durationMs - remainingMs) / 60000` to animate live progress; nothing is written to state. `SiegeScene` draws the previewed army/keep but takes `banked` (= `state.idle.souls`) separately, so the souls counter never shows unpaid souls.
- **On `complete`** the reducer calls it with the full duration and commits the result plus keep loot (gold/XP into the hero).
- Recruiting and upgrades are rejected while `siegeLocked(state)` (focus phase not idle), so the army used for the live preview equals the army used at payout.
- Souls are stored as floats; display uses `formatNum` (floors, K/M/B/T suffixes).

### 3.3 Rewards pipeline (`reducer.ts` → `complete` → `grantSession`)
1. `streak = nextStreak(state.streak, endsAt)`
2. `sessionRewards(minutes, state, streak.count)` → XP/gold with `heroBonuses()` (gear + siege hero upgrades) and streak bonus
3. `simulateIdle(state.idle, minutes, gearSiege)` → souls, keeps, keep gold/XP
4. `addXp(hero + gold, sessionXp + keepXp)` → level-ups (+20 × level gold each)
5. Update subject totals, prepend a `SessionRecord` (history capped at `HISTORY_LIMIT` = 200), set `state.reward` for the modal.

Steps 1–5 live in `grantSession(state, minutes, subjectId, at, recordId)`, which never touches the timer. `complete` calls it and then moves the timer to a short/long rest (optionally auto-started). The dev "Simulate study" tool calls the same function, so simulated sessions follow the real rules.

### 3.4 Developer tools
- **Actions:** one wrapper action `{ type: 'dev', dev: DevOp }` delegates to `devReducer` in `game/dev.ts`. It is pure like the main reducer (`now`/ids in the payload) and reuses real rules (`grantSession`, `addXp`, `keepLoot`).
- **Clock speed:** `useGame(speed)`. On each 250 ms tick of a running phase it dispatches `dev/warp` with `elapsed × (speed − 1)` ms, which pulls `timer.endsAt` closer. Everything downstream (remaining time, live siege, completion) works unchanged.
- **Unlock & prefs:** `useDevMode()` keeps `{ unlocked, speed }` in localStorage key `studyrpg.dev` (separate from the save, so it never syncs to a future backend). It is unlocked when `import.meta.env.DEV`, or when the URL has `?dev` (`?dev=0` locks). Speed is forced to 1 while locked.
- **Snapshot:** one slot in `studyrpg.dev.snapshot` (`{ at, state }`), restored through `normalizeSave` + `load`.
- **Not a security boundary:** the code ships in the production bundle and anyone can add `?dev`. That's fine for a local single-player game. With accounts (§9), dev ops must be rejected server-side (or the dev bundle excluded from production).

---

## 4. State model (`GameState`, the save format)

```ts
GameState {
  version: 1
  hero:      { name, level, xp /*into current level*/, totalXp, gold }
  subjects:  Subject[]          // { id, name, color, minutes, sessions }
  selectedSubjectId: string | null
  settings:  { focusMinutes, shortBreakMinutes, longBreakMinutes, sessionsBeforeLongBreak,
               autoStartBreaks, sound, notifications, scanlines }
  inventory: string[]           // owned item ids
  equipped:  { weapon, armor, accessory: string | null }
  history:   SessionRecord[]    // { id, subjectId, subjectName, minutes, xp, gold, completedAt }, newest first
  streak:    { count, lastDay: 'YYYY-MM-DD' (local) | null }
  timer:     { phase: 'focus'|'short'|'long', status: 'idle'|'running'|'paused',
               endsAt: number|null, remainingMs, durationMs, subjectId, focusCount }
  reward:    RewardEvent | null // pending Victory dialog
  idle:      { souls, totalSouls, units: Record<unitId, count>, upgrades: string[], ranks: Record<rankId, number>,
               keepLevel, keepDamage }
}
```

Static content (items, monsters, troops, upgrades) is **not** saved; saves reference it by id. Renaming an id breaks old saves; add a migration instead (§6).

### Actions (`Action` in `reducer.ts`)
| Action | Payload | Notes |
|---|---|---|
| `setName` | name | max 16 chars |
| `addSubject` / `removeSubject` / `selectSubject` | id, name, color | remove blocked for the running quest's subject |
| `updateSettings` | patch | reshapes timer only when idle |
| `start` / `pause` / `resume` | now | start requires a selected subject in focus phase |
| `abandon` | | flee: resets phase, no rewards |
| `skipBreak` | | |
| `complete` | now, recordId | see §3.3 |
| `buy` / `equip` / `unequip` | itemId / slot | buy checks gold + level, auto-equips |
| `recruit` / `buyUpgrade` / `buyRank` | unitId / upgradeId / rankId | blocked by `siegeLocked`; ranks also capped at `maxRank` |
| `dismissReward` | | |
| `load` | state | import / New Game / dev snapshot restore |
| `dev` | dev: `DevOp` | developer tools, see §3.4 |

---

## 5. Persistence (`storage.ts`)

- Key: `studyrpg.save.v1`. Whole state as JSON, written on every state change (changes happen only on actions, not ticks).
- `loadGame()` → parse → `normalizeSave()` → fallback to `createInitialState()` on any error.
- `normalizeSave()` deep-merges each top-level object over defaults, so **adding new fields with defaults needs no migration**. Rejects anything whose `version !== 1`. It also maps legacy item ids (`LEGACY_ITEM_IDS`) in `inventory` and `equipped`, dropping ids that no longer exist.
- All storage calls are wrapped in try/catch (private mode, quota).
- Export/Import (Config) uses the same JSON + `normalizeSave()`.

### 5.1 Hosting (GitHub Pages)

- Live URL: https://daneviser.github.io/StudyRPG/
- `.github/workflows/deploy.yml` runs on every push to `master` (or manually via *Run workflow*): `npm ci` → `npm run lint` → `npm run build` → upload `dist/` → deploy.
- One-time repo setting: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
- `base: './'` makes all asset URLs relative, so the build works at any subpath (and would keep working if the repo is renamed or a custom domain is added). If a client-side router is ever added, switch to `base: '/StudyRPG/'` and add a `404.html` fallback.
- Saves are per visitor and per browser: each friend gets their own localStorage save on `daneviser.github.io`. The key `studyrpg.save.v1` is shared by every Pages site on that domain, so keep it unique.
- Test the production build locally like Pages serves it: `npm run build && npx vite preview --base /StudyRPG/`, then open `http://localhost:4173/StudyRPG/`.

---

## 6. Conventions & recipes

**General:** keep game rules in `src/game/` (pure, testable); components only render and dispatch. Pass `now` into anything time-dependent instead of calling `Date.now()` during render (lint enforces this). Match existing style: no semicolons, single quotes, 2 spaces.

**Add gear:** a new material rank is one row in `MATERIALS` (`data.ts`), which generates `<key>-weapon`, `<key>-armor`, `<key>-accessory`. A one-off item goes in `mythicItems` (`rarity: 'mythic'`, `xpBonus`, `goldBonus`, `siegeBonus`, `color`). The shop, hero screen, bonuses and sprite colours (shade/highlight are computed with `mix()`) pick it up automatically. **Never rename or remove an item id** that players may own; if you must, add the old id to `LEGACY_ITEM_IDS`. `normalizeSave` maps old ids and drops unknown ones.

**Add a boon (repeatable):** append to `RANKS` in `idle.ts` (`perRank` with `xp` / `gold` / `army`, `baseCost`, `growth`, `maxRank`, `req`). Cost of the next rank = `ceil(baseCost × growth^owned)`. New `perRank` keys need handling in `rankTotal` users.

**Add a monster tier:** add a grid to `Sprites.tsx` + `MONSTER_GRIDS`, extend `MonsterTier['sprite']`, add an entry to `MONSTERS` (sorted by `minMinutes`), and add a `fight-<sprite>` keyframe (see §6.1). Palette keys: `o` outline, `M` subject colour, others per `MonsterSprite`. Check it fits the 260 px stage (224 px in short-screen mode) without covering the top-left info box.

**Add a troop:** append to `UNITS` in `idle.ts` (order = unlock order) and add a look in `UNIT_LOOKS` (+ optional projectile in `SHOT_KIND` in `Siege.tsx`).

**Add an upgrade:** append to `UPGRADES` with an `effect` (`unit` / `army` / `loot` / `hero`) and a `req`. New effect kinds must be handled in `idle.ts` (and `heroBonuses` if they affect the hero).

**Add a screen:** create `components/XScreen.tsx`, add it to `TABS` and the render switch in `App.tsx`.

### 6.1 Battle animation
- Markup: `.battle.fighting` > `.enemy-sprite` (position + entrance) > `.monster-body.fight-<sprite>` (combat motion + hit flash) > `svg.monster` (aura filter; flying foes also flap). A `.slash` arc lives in `.enemy-sprite`; demons add a `.fireball` in the stage.
- Every combat keyframe shares one **2.4 s loop, `steps(24)`**: the hero strikes at ~16–24% (foe flashes at 20%), the foe hits at ~64–70% (hero flashes at 70% and 78%). Keep new foes on that timeline.
- Horizontal travel uses **`cqw`** (the stage is `container-type: inline-size`), so lunges meet in the middle at any width. Vertical offsets stay in px.
- `.paused` stops everything; `prefers-reduced-motion` disables all animation.
- Hero sprite: 18×22 grid, palette keys documented above `HERO` in `Sprites.tsx`. `HeroSprite` wraps the svg in `.hero-wrap` and adds `.mythic` + `--aura` when a mythic item is equipped.

**Sprites:** each sprite is an array of equal-length strings; each char maps to a colour in a palette (`.` = transparent). `PixelSprite` merges horizontal runs into `<rect>`s. Keep widths consistent (a quick script check is worth it).

**Styling:** colour tokens in `:root` (`--gold`, `--xp`, `--hp` …), `--px` = 4 px pixel unit, `.panel` / `.btn` / `.bar` primitives. Breakpoints: `max-width: 760px` (phone stack), `min-width: 761px and max-height: 760px` (short laptops). `prefers-reduced-motion` disables animations.

**Changing the save format incompatibly:** bump `version`, write a `migrate(vN → vN+1)` step in `storage.ts` before `normalizeSave`, keep reading the old key.

**Before committing:** `npx tsc -b && npm run lint && npm run build`, and update `docs/GAME_FEATURES.md` / this file.

---

## 7. Known limitations

- **Client-authoritative:** the save can be edited in DevTools (e.g. set `endsAt` in the past for instant rewards). Acceptable for a single-player local app; must change with accounts (§9).
- No automated tests yet. `logic.ts`, `idle.ts` and `reducer.ts` are pure and are the natural first targets (Vitest).
- One save per browser profile; no sync between devices.
- Timestamps use the device clock; changing it affects timers and streaks.
- The streak uses the device's local date.

---

## 8. Ideas already designed for

- **Skill tree:** add `skills` to `GameState`, a bonus function like `heroBonuses()`, and include it in `sessionRewards`.
- **More idle content:** new `UpgradeEffect` kinds plug into `idle.ts`; scene visuals into `Siege.tsx`.

---

## 9. Migration plan: backend saves + user login

### 9.1 What makes it easy today
- One serialisable `GameState` with a version number.
- A pure reducer whose inputs (`now`, ids) are explicit, so the **same reducer can run on the server**.
- Storage isolated in `storage.ts` (3 functions).

### 9.2 Step 1: storage adapter (no backend yet)
Replace direct calls with an interface so the app doesn't care where saves go:
```ts
interface SaveStore {
  load(): Promise<GameState | null>
  save(state: GameState): Promise<void>
}
// LocalSaveStore (today) → ApiSaveStore (later)
```
`useGame` loads asynchronously (show a loading screen), then debounces saves (e.g. 1–2 s after the last change, and on `visibilitychange`/`pagehide`).

### 9.3 Step 2: accounts + "save blob" API (quick win)
- Auth via a provider (e.g. Supabase Auth, Firebase Auth, Auth0, or your own JWT).
- Endpoints: `GET /api/save`, `PUT /api/save` storing the JSON blob per user with an `updated_at` / revision number.
- Conflicts (two devices): send the revision with `PUT`; the server rejects stale writes and the client reloads or asks the user.
- First login: offer to upload the existing localStorage save (and keep Export/Import).
- Still cheatable (client sends the whole state), but simple.

### 9.4 Step 3: server-authoritative actions (when it matters, e.g. leaderboards)
- Client sends **actions**, not state: `POST /api/actions { type, ... }`.
- The server stamps `now` itself, runs the shared `gameReducer`, stores the result and returns the new state. Move `src/game/` into a shared package used by both sides.
- Key validations: `start` records server `startedAt`; `complete` is only accepted if server time ≥ `endsAt`; purchases are re-checked against server state. The pure reducer already does the game-rule checks.
- Pause/resume are server-stamped too, so elapsed study time can't be faked.

### 9.5 Possible relational schema (if not storing a blob)
| Table | Columns (main) |
|---|---|
| `users` | id, email, created_at |
| `heroes` | user_id, name, level, xp, total_xp, gold, streak_count, streak_last_day |
| `settings` | user_id, focus_minutes, short_break, long_break, sessions_before_long, auto_start_breaks, sound, notifications, scanlines |
| `subjects` | id, user_id, name, color, minutes, sessions, deleted_at |
| `sessions` (history) | id, user_id, subject_id, subject_name, minutes, xp, gold, completed_at |
| `inventory` | user_id, item_id, equipped_slot nullable |
| `siege` | user_id, souls, total_souls, keep_level, keep_damage |
| `siege_units` / `siege_upgrades` | user_id, unit_id, count / user_id, upgrade_id |
| `active_timer` | user_id, phase, status, ends_at, remaining_ms, duration_ms, subject_id, focus_count |

Ids are already UUIDs (subjects, history), so client-created rows can be inserted as-is. Static content stays in code; the DB stores ids only.

### 9.6 Things to decide at migration time
- Streak timezone: store the user's IANA timezone and compute days server-side.
- Offline play: queue actions locally and replay, or require online for quests.
- Whether `history` stays capped at 200 (DB can keep everything; the UI shows 50).
