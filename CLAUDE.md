# StudyRPG

Pixel-art study timer (React + TypeScript + Vite, frontend only, saves in localStorage).

## Living documentation (always keep in sync)

- `docs/GAME_FEATURES.md`: every player-facing feature, screen, number, item, monster, troop and upgrade.
- `docs/TECHNICAL.md`: architecture, state/save format, actions, conventions, recipes, backend/login migration plan.

Whenever a change affects either document (new or changed feature, balance number, content entry, state field, action, file responsibility, save format, convention), update the affected sections **in the same change/commit**. Move items out of "Not built yet" when they ship. If nothing in a doc is affected, leave it alone.

## Working rules

- Game rules belong in `src/game/` and stay pure; the reducer gets `now` and ids via actions. Components render and dispatch.
- New state fields need defaults in `createInitialState()` (old saves are merged over defaults by `normalizeSave`). Incompatible changes bump `version` with a migration.
- Check before committing: `npx tsc -b && npm run lint && npm run build`.
