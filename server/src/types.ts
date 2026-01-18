/**
 * Server types for multiplayer - Server Authoritative Model
 */

export type Player = 'P1' | 'P2';
export type PokemonType = 'normal' | 'fire' | 'water' | 'grass' | 'electric' | 'ice' | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug' | 'rock' | 'ghost' | 'dragon' | 'steel' | 'fairy';

export interface Room {
  id: string;
  hostId: string;
  guestId: string | null;
  gameMode: 'quick' | 'draft';
  draftState: DraftState | null;
  game: ServerGameState | null;
  createdAt: Date;
}

// Draft phase state
export type DraftPhase = 'banning' | 'picking' | 'complete';

export interface DraftState {
  phase: DraftPhase;
  currentTurn: Player; // Who needs to act now
  bannedPokemon: number[]; // Pokemon IDs that have been banned
  p1Picks: number[]; // P1's picked Pokemon IDs
  p2Picks: number[]; // P2's picked Pokemon IDs
  turnHistory: { player: Player; action: 'ban' | 'pick'; pokemonId: number }[];
  timerStartedAt: Date; // When current turn started
  timerDuration: number; // Seconds per turn (default 30)
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
  'draft-started': (state: ClientDraftState) => void;
  'draft-update': (state: ClientDraftState) => void;
  'game-started': (state: ClientGameState) => void;
  'state-update': (state: ClientGameState) => void;
  'action-result': (result: ActionResult) => void;
  'turn-changed': (data: { currentPlayer: Player; turn: number }) => void;
  'error': (message: string) => void;
}

// Client-side draft state (what each player sees)
export interface ClientDraftState {
  phase: DraftPhase;
  myPlayer: Player;
  currentTurn: Player;
  bannedPokemon: number[];
  p1Picks: number[];
  p2Picks: number[];
  turnHistory: { player: Player; action: 'ban' | 'pick'; pokemonId: number }[];
  timeRemaining: number; // Seconds remaining for current turn
}

// Socket events - Client to Server
export interface ClientToServerEvents {
  'create-room': (data: { gameMode: 'quick' | 'draft' }) => void;
  'join-room': (roomId: string) => void;
  'start-game': () => void;
  'draft-ban': (data: { pokemonId: number }) => void;
  'draft-pick': (data: { pokemonId: number }) => void;
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
