/**
 * Type definitions for PokéTactics
 */

// Shared types re-exported from @poketactics/shared
export type { PokemonType, Player, TerrainType, PokemonTemplate, Position, GameMap, Move, StatusEffect, Ability } from '@poketactics/shared';

import type { PokemonTemplate, PokemonType, Player, Position, TerrainType, Move, StatusEffect } from '@poketactics/shared';

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
  | 'MOVE_SELECT'  // Player choosing which move to use
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
  kills: number;
  pp: number[];
  status: StatusEffect | null;
  statusTurns: number;
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
  typeBonus?: PokemonType[];
  heals?: boolean;
  visionBonus?: number;
  consumable?: boolean;
  hidesUnit?: boolean;
}

/**
 * Combat result for a single attack
 */
export interface CombatResult {
  damage: number;
  effectiveness: number;
  isCritical: boolean;
  isStab: boolean;
  missed: boolean;
  terrainBonus: number;
  typeTerrainBonus: boolean;
  statusApplied?: StatusEffect;
}

/**
 * Full battle data including counter-attack
 */
export interface BattleData {
  attacker: Unit;
  defender: Unit;
  attackerMove: Move;
  attackerResult: CombatResult;
  defenderResult: CombatResult | null;
  defenderMove: Move | null;
  terrainType: TerrainType;
}

/**
 * Attack preview before confirming (per-move)
 */
export interface AttackPreview {
  attacker: Unit;
  defender: Unit;
  move: Move;
  predictedDamage: { min: number; max: number };
  effectiveness: number;
  isStab: boolean;
  accuracy: number;
  canCounter: boolean;
  counterDamage: { min: number; max: number } | null;
  counterEffectiveness: number | null;
  counterMove: Move | null;
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
  explored: boolean[][];
  visible: boolean[][];
}
