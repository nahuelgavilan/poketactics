export type PokemonType =
  | 'normal' | 'fire' | 'water' | 'grass'
  | 'electric' | 'ice' | 'fighting' | 'poison'
  | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

export type Player = 'P1' | 'P2';

export type TerrainType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export type StatusEffect = 'burn' | 'paralysis' | 'poison' | 'sleep' | 'freeze';

export interface Move {
  id: string;
  name: string;
  type: PokemonType;
  category: 'physical' | 'special' | 'status';
  power: number;
  accuracy: number;
  pp: number;
  range: number;
  priority: number;
  effect?: StatusEffect;
  effectChance?: number;
  description: string;
}

export interface Ability {
  id: string;
  name: string;
  description: string;
}

export interface PokemonTemplate {
  id: number;
  name: string;
  types: PokemonType[];
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
  mov: number;
  moves: Move[];
  ability: Ability;
  evolutionChainId?: number;
  evolutionStage?: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface TerrainGameProps {
  def: number;
  moveCost: number;
  capture?: boolean;
  typeBonus?: PokemonType[];
  heals?: boolean;
  visionBonus?: number;
  consumable?: boolean;
  hidesUnit?: boolean;
}

export type GameMap = TerrainType[][];
