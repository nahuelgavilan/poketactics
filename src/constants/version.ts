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

export const VERSION = '1.10.1';

// Version history:
// 1.10.1 - Fix: terrain panel UX - click anywhere to close (toggle same tile, click panel, or click elsewhere)
// 1.10.0 - Terrain info panel (click empty tile), updated tutorial with Pikachu and action menu graphics
// 1.9.1 - Distinctive terrain visuals: grass blades, tree canopies, mountain peaks, water waves, healing cross
// 1.9.0 - Fire Emblem style contextual action menu: appears next to unit with notch pointer, smart positioning
// 1.8.1 - Fix: click other tiles during ACTION_MENU to change destination, fix arrow direction
// 1.8.0 - Fire Emblem style preview: click destination → preview path + attack range → confirm with Mover/Atacar/Cancelar
// 1.7.0 - Action menu after moving: Atacar/Esperar buttons, fixed path arrows clipping
// 1.6.0 - Multiplayer perspective: each player sees own fog/turn, "Tu turno" vs "Turno enemigo" UI
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
