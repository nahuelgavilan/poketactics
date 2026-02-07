/**
 * Type definitions for PokéWar: Capture Edition
 */

// Shared types re-exported from @poketactics/shared
export type { PokemonType, Player, TerrainType, PokemonTemplate, Position, GameMap } from '@poketactics/shared';

import type { PokemonTemplate, PokemonType, Player, Position, TerrainType } from '@poketactics/shared';

export type GameState =
  | 'menu'
  | 'setup'
  | 'transition'
  | 'playing'
  | 'battle_zoom'
  | 'battle'
  | 'victory'
  | 'capture'
  | 'capture_minigame'
  | 'evolution';

/**
 * Game interaction phase (within 'playing' state)
 */
export type GamePhase =
  | 'SELECT'       // Player selecting a unit
  | 'ACTION_MENU'  // Unit selected, showing action menu
  | 'MOVING'       // Player selecting move destination
  | 'ATTACKING'    // Player selecting attack target
  | 'WAITING';     // Unit waiting

/**
 * Action menu state
 */
export interface ActionMenuState {
  isOpen: boolean;
  canMove: boolean;
  canAttack: boolean;
  canCapture: boolean;
  canWait: boolean;
}

export interface Unit {
  uid: string;
  owner: Player;
  template: PokemonTemplate;
  x: number;
  y: number;
  currentHp: number;
  hasMoved: boolean;
  kills: number;  // Track kills for evolution
}

export interface AttackTarget extends Position {
  uid: string;
}

export interface TerrainProps {
  def: number;
  moveCost: number;
  name: string;
  bg: string;
  capture?: boolean;
  typeBonus?: PokemonType[]; // Types that get bonus on this terrain
  heals?: boolean; // Pokemon Center healing
  visionBonus?: number; // Extra vision range on this terrain
  consumable?: boolean; // Berry bush: consumed on step, heals 10% HP, becomes grass
  hidesUnit?: boolean; // Cave: unit hidden from enemies unless adjacent
}

/**
 * Combat result for a single attack
 */
export interface CombatResult {
  damage: number;
  effectiveness: number;
  isCritical: boolean;
  terrainBonus: number;
  typeTerrainBonus: boolean;
}

/**
 * Full battle data including counter-attack
 */
export interface BattleData {
  attacker: Unit;
  defender: Unit;
  attackerResult: CombatResult;
  defenderResult: CombatResult | null; // null if defender can't counter
  terrainType: TerrainType;
  // Legacy support
  damage: number;
  effectiveness: number;
}

/**
 * Attack preview before confirming
 */
export interface AttackPreview {
  attacker: Unit;
  defender: Unit;
  predictedDamage: { min: number; max: number };
  effectiveness: number;
  canCounter: boolean;
  counterDamage: { min: number; max: number } | null;
  counterEffectiveness: number | null;
  attackerTerrainBonus: boolean;
  defenderTerrainBonus: boolean;
  critChance: number;
}

export interface CaptureData {
  pokemon: PokemonTemplate;
  player: Player;
  spawnPos: Position;
}

/**
 * Hovered unit info for tooltip
 */
export interface HoveredUnit {
  unit: Unit;
  screenX: number;
  screenY: number;
}

/**
 * Evolution event data
 */
export interface EvolutionData {
  unitId: string;
  fromTemplate: PokemonTemplate;
  toTemplate: PokemonTemplate;
}

/**
 * Fog of War visibility map
 */
export interface VisibilityMap {
  explored: boolean[][];  // Tiles that have been seen (permanent)
  visible: boolean[][];   // Tiles currently visible
}
