/**
 * Server types for multiplayer - Server Authoritative Model
 */

export type Player = 'P1' | 'P2';
export type PokemonType = 'normal' | 'fire' | 'water' | 'grass' | 'electric' | 'ice' | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug' | 'rock' | 'ghost' | 'dragon' | 'steel' | 'fairy';

export interface Room {
  id: string;
  hostId: string;
  guestId: string | null;
  game: ServerGameState | null;
  createdAt: Date;
}

// Full server-side game state
export interface ServerGameState {
  map: number[][];
  units: ServerUnit[];
  turn: number;
  currentPlayer: Player;
  status: 'waiting' | 'playing' | 'finished';
  winner: Player | null;
  // Fog of war tracking per player
  exploredP1: boolean[][];
  exploredP2: boolean[][];
}

// Full unit state on server
export interface ServerUnit {
  uid: string;
  owner: Player;
  templateId: number;
  template: PokemonTemplate;
  x: number;
  y: number;
  currentHp: number;
  hasMoved: boolean;
  kills: number;
}

// Pokemon template
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

// What client receives (filtered by fog of war)
export interface ClientGameState {
  map: number[][];
  units: ClientUnit[];
  turn: number;
  currentPlayer: Player;
  myPlayer: Player;
  status: 'waiting' | 'playing' | 'finished';
  winner: Player | null;
  visibility: {
    visible: boolean[][];
    explored: boolean[][];
  };
}

// Unit as seen by client (may be partial for enemies in fog)
export interface ClientUnit {
  uid: string;
  owner: Player;
  templateId: number;
  template: PokemonTemplate;
  x: number;
  y: number;
  currentHp: number;
  hasMoved: boolean;
  kills: number;
}

// Socket events - Server to Client
export interface ServerToClientEvents {
  'room-created': (roomId: string) => void;
  'room-joined': (data: { roomId: string; player: Player }) => void;
  'player-joined': (playerId: string) => void;
  'player-left': () => void;
  'game-started': (state: ClientGameState) => void;
  'state-update': (state: ClientGameState) => void;
  'action-result': (result: ActionResult) => void;
  'turn-changed': (data: { currentPlayer: Player; turn: number }) => void;
  'error': (message: string) => void;
}

// Socket events - Client to Server
export interface ClientToServerEvents {
  'create-room': () => void;
  'join-room': (roomId: string) => void;
  'start-game': () => void;
  'action-move': (data: { unitId: string; x: number; y: number }) => void;
  'action-attack': (data: { attackerId: string; defenderId: string }) => void;
  'action-wait': (data: { unitId: string }) => void;
  'action-capture': (data: { unitId: string; success?: boolean }) => void;
  'action-end-turn': () => void;
  'request-state': () => void;
}

// Position interface for encounter spawn
export interface Position {
  x: number;
  y: number;
}

// Action results sent to clients
export type ActionResult =
  | { type: 'move'; unitId: string; x: number; y: number; success: boolean; encounter?: { pokemon: PokemonTemplate; spawnPos: Position } }
  | { type: 'attack'; attackerId: string; defenderId: string; damage: number; counterDamage: number; attackerDied: boolean; defenderDied: boolean; evolution?: { unitId: string; newTemplate: PokemonTemplate } }
  | { type: 'capture'; unitId: string; success: boolean; newUnit?: ClientUnit; pokemon?: PokemonTemplate }
  | { type: 'wait'; unitId: string }
  | { type: 'turn-end'; nextPlayer: Player; turn: number };
