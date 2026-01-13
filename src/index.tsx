/**
 * PokéWar: Capture Edition
 *
 * A tactical turn-based RPG (Advance Wars / Fire Emblem style)
 * where two players compete on the same device (Hot Seat mode).
 *
 * Features:
 * - Type effectiveness system based on real Pokemon types
 * - Terrain bonuses (Forest: +20% DEF, etc.)
 * - Capture mechanic in Tall Grass (30% chance)
 * - Battle cinematics with Gen 5 animated sprites
 * - Procedurally generated maps
 *
 * Tech: React + Tailwind CSS + PokeAPI (external sprites)
 */

export { default as Game } from './Game';
export { default } from './Game';

// Re-export types for external use
export type {
  PokemonType,
  Player,
  GameState,
  TerrainType,
  PokemonTemplate,
  Unit,
  Position,
  BattleData,
  CaptureData,
  GameMap
} from './types/game';
