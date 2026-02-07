export type PokemonType =
  | 'normal' | 'fire' | 'water' | 'grass'
  | 'electric' | 'ice' | 'fighting' | 'poison'
  | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

export type Player = 'P1' | 'P2';

export type TerrainType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

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
