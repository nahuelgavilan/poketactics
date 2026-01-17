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

export const VERSION = '0.27.4';

// Version history (Alpha - v0.x.x):
// 0.27.4 - UX: Allow deselecting units by clicking them again in MOVING phase, fix unit_deselect sound only on manual cancel
// 0.27.3 - Audio fixes: prevent multiple audio instances, improve playback stability, lower board_theme volume (0.5→0.3), lower battle_theme (0.6→0.5)
// 0.27.2 - Capture minigame SFX: wild encounter, ring hits (perfect/good/miss), pokeball throw/shake/open, capture fail, flee success
// 0.27.1 - Sound effects system: unit select/deselect/move, menu open/close, button clicks with useSFX hook
// 0.27.0 - Music system: menu theme (start screen), board theme (gameplay), battle theme (combat) with automatic transitions
// 0.26.2 - Movement fix: Can now walk through friendly units (but not stop on them)
// 0.26.1 - Premium Draft Screen: Neon Arena aesthetic, mobile-first, P1 VS P2 intro, animated cards, sticky footer, dramatic popups
// 0.26.0 - Draft redesign: two-panel layout, animated popups, confirm flow. Menu restructure: Local Battle submenu. Fixed turn-end bug when attacker dies
// 0.25.0 - Competitive 1v1: Draft System (ban/pick), Turn Timer (45s auto-wait), Post-Battle Stats (MVP, damage, KOs)
// 0.24.2 - Battle theme music: plays during battle transition and cinematic with fade out
// 0.24.1 - Pokemon-style spiral wipe transition: 6-arm spiral that closes to center with glowing tips and flash
// 0.24.0 - Epic VS transition: board zoom, tiles with stats facing each other (position-aware), clockwise wipe. Removed redundant VS from BattleCinematic
// 0.23.1 - Simplified battle transition: board zoom + classic Pokemon pixelated circular wipe (no VS screen)
// 0.23.0 - Pre-battle zoom transition: zooms into game board on both Pokemon, Pokemon-style encounter effect. Fixed flee bug (unit turn ends after fleeing)
// 0.22.6 - Wild Pokemon counter-attack damage now applies to player's Pokemon HP
// 0.22.5 - Move indicator: white brightness + glowing border (clean, universal contrast)
// 0.22.4 - Sprites centered with clamp(40px, 120%, 64px), natural overflow like Fire Emblem
// 0.22.3 - Larger Pokemon sprites on tiles (115% of tile size for better visibility)
// 0.22.2 - Desktop responsive design: board uses height-based sizing (max 600px), HP bars and badges scale with tiles
// 0.22.1 - Multiplayer fix: evolution cinematic now shows after kills (was being ignored from server response)
// 0.22.0 - Multiplayer fixes: attacks now wait for server confirmation (no race condition), wild Pokemon encounters work
// 0.21.4 - Tutorial fix: TutorialTile wrapper fills container (w-full h-full) so tiles render at proper size
// 0.21.3 - Tutorial fix: REAL UnitActionMenu (Fire Emblem style next to tile, not floating bar), correct icons
// 0.21.2 - Tutorial fix: EXACT ActionMenu.tsx styling (buttons, spacing, icons, badge), proper Sword icon
// 0.21.1 - Tutorial fix: accurate floating action menu, real gameplay grids with Pokemon on tiles, attack range preview
// 0.21.0 - Premium tutorial: GBA-style slides, animated ring preview, action menu mockup, battle preview, terrain guide
// 0.20.0 - Ultra-premium capture: cinematic attack (slide-in/out), juicy ring with orbiting particles, GBA-style buttons
// 0.19.0 - GBA-style capture: mini battle with attack/capture/flee, HP weakening, probability-based, ring timing
// 0.18.0 - Premium screens: GBA boot sequence, letter-by-letter title, team showcase, confetti victory, version badges
// 0.17.0 - Micro-combat capture: type-specific attack patterns, swipe controls, combo system, flee mechanic, skill-based
// 0.16.1 - Challenging capture: will bar, multiple attempts, Pokemon movement, escalating difficulty, flee chance
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
