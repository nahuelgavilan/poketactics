/**
 * App version - follows Semantic Versioning (semver)
 *
 * Version format: MAJOR.MINOR.PATCH
 * - MAJOR: Breaking changes, major rewrites
 * - MINOR: New features (feat: commits)
 * - PATCH: Bug fixes (fix: commits)
 *
 * Conventional Commits mapping:
 * - fix: → PATCH bump (1.0.0 → 1.0.1)
 * - feat: → MINOR bump (1.0.0 → 1.1.0)
 * - feat!: or BREAKING CHANGE → MAJOR bump (1.0.0 → 2.0.0)
 *
 * Other commit types (docs, style, refactor, perf, test, chore)
 * don't trigger version bumps unless they include breaking changes.
 */

export const VERSION = '1.5.0';

// Version history:
// 1.5.0 - Fire Emblem style pathfinding arrows with gap bridging, smooth curves at corners
// 1.4.0 - Server-authoritative multiplayer: fog of war per player, validated turns, server game state
// 1.3.0 - Remove action menu, Advance Wars style direct flow, random encounters on tall grass
// 1.2.2 - Professional Nintendo-style tiles (no emojis), Fire Emblem movement/attack overlays
// 1.2.1 - Fix auto-wait bug, capture on tall grass after moving, cleaner tile indicators
// 1.2.0 - Redesigned tiles with rich gradients, mobile stats panel, visual juice
// 1.1.0 - SPA layout fix, mobile improvements, visual polish
// 1.0.0 - Initial release with all core features:
//         Action menu, Fog of War, Evolution, Capture minigame,
//         Pokémon Centers, Multiplayer lobby
