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

export const VERSION = '0.16.0';

// Version history (Alpha - v0.x.x):
// 0.16.0 - Premium capture system: dramatic encounter intro, ring-based minigame, Pokeball physics, GBA-style modal
// 0.15.0 - Premium GBA-style battle cinematic: VS intro, segmented HP bars, stat panels, particles, typewriter text
// 0.14.0 - True multiplayer: each player is P1/P2, own fog of war, no turn transition screen, server-authoritative
// 0.13.1 - Refined main menu: layered backgrounds, ambient particles, signature Pokemon glows, premium buttons
// 0.13.0 - Premium GBA-style main menu: diagonal split design, rotating Pokemon, tactical aesthetic
// 0.12.1 - Fix: turn transition now fully blocks game view (no flash), smooth dropdown menu animation
// 0.12.0 - Header dropdown menu: end turn + actions in compact GBA-style menu, removed blocking floating panel
// 0.11.0 - GBA-style turn controls: always-visible end turn button, progress bar, fully opaque transition
// 0.10.3 - Fire Emblem style turn transition: diagonal slash, shield emblem, GBA-era button panel
// 0.10.2 - Tutorial uses actual game Tile component - identical graphics, real PathSegment arrows
// 0.10.1 - Fix: terrain panel UX - click anywhere to close (toggle same tile, click panel, or click elsewhere)
// 0.10.0 - Terrain info panel (click empty tile), updated tutorial with Pikachu and action menu graphics
// 0.9.1 - Distinctive terrain visuals: grass blades, tree canopies, mountain peaks, water waves, healing cross
// 0.9.0 - Fire Emblem style contextual action menu: appears next to unit with notch pointer, smart positioning
// 0.8.1 - Fix: click other tiles during ACTION_MENU to change destination, fix arrow direction
// 0.8.0 - Fire Emblem style preview: click destination → preview path + attack range → confirm with Mover/Atacar/Cancelar
// 0.7.0 - Action menu after moving: Atacar/Esperar buttons, fixed path arrows clipping
// 0.6.0 - Multiplayer perspective: each player sees own fog/turn, "Tu turno" vs "Turno enemigo" UI
// 0.5.0 - Fire Emblem style pathfinding arrows with gap bridging, smooth curves at corners
// 0.4.0 - Server-authoritative multiplayer: fog of war per player, validated turns, server game state
// 0.3.0 - Remove action menu, Advance Wars style direct flow, random encounters on tall grass
// 0.2.2 - Professional Nintendo-style tiles (no emojis), Fire Emblem movement/attack overlays
// 0.2.1 - Fix auto-wait bug, capture on tall grass after moving, cleaner tile indicators
// 0.2.0 - Redesigned tiles with rich gradients, mobile stats panel, visual juice
// 0.1.0 - SPA layout fix, mobile improvements, visual polish
// 0.0.1 - Initial alpha with core features:
//         Action menu, Fog of War, Evolution, Capture minigame,
//         Pokémon Centers, Multiplayer lobby
