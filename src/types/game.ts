/**
 * Type definitions for PokéWar: Capture Edition
 */

export type PokemonType =
  | 'normal' | 'fire' | 'water' | 'grass'
  | 'electric' | 'ice' | 'fighting' | 'poison'
  | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'steel' | 'fairy';

export type Player = 'P1' | 'P2';

export type GameState =
  | 'menu'
  | 'setup'
  | 'transition'
  | 'playing'
  | 'battle'
  | 'victory'
  | 'capture'
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

export type TerrainType = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface PokemonTemplate {
  id: number;
  name: string;
  types: PokemonType[];
  hp: number;
  atk: number;
  def: number;
  mov: number;
  rng: number;
  moveName: string;
  moveType: PokemonType;
  // Evolution fields
  evolutionChainId?: number;  // Reference to evolution chain
  evolutionStage?: number;    // 0=base, 1=stage1, 2=final
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

export interface Position {
  x: number;
  y: number;
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

export type GameMap = TerrainType[][];

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
