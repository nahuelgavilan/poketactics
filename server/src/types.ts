/**
 * Server types for multiplayer
 */

export type Player = 'P1' | 'P2';

export interface Room {
  id: string;
  hostId: string;
  guestId: string | null;
  gameState: GameState | null;
  createdAt: Date;
}

export interface GameState {
  map: number[][];
  units: UnitState[];
  turn: number;
  currentPlayer: Player;
  status: 'waiting' | 'playing' | 'finished';
  winner: Player | null;
}

export interface UnitState {
  uid: string;
  owner: Player;
  templateId: number;
  x: number;
  y: number;
  currentHp: number;
  hasMoved: boolean;
  kills: number;
}

// Socket events
export interface ServerToClientEvents {
  'room-created': (roomId: string) => void;
  'room-joined': (data: { roomId: string; player: Player }) => void;
  'player-joined': (playerId: string) => void;
  'player-left': () => void;
  'game-started': (gameState: GameState) => void;
  'game-action': (action: GameAction) => void;
  'turn-changed': (data: { currentPlayer: Player; turn: number }) => void;
  'error': (message: string) => void;
}

export interface ClientToServerEvents {
  'create-room': () => void;
  'join-room': (roomId: string) => void;
  'start-game': () => void;
  'game-action': (action: GameAction) => void;
  'end-turn': () => void;
}

export type GameAction =
  | { type: 'move'; unitId: string; x: number; y: number }
  | { type: 'attack'; attackerId: string; defenderId: string; damage: number; counterDamage: number }
  | { type: 'capture'; unitId: string; newUnit: UnitState }
  | { type: 'evolve'; unitId: string; newTemplateId: number; newHp: number }
  | { type: 'wait'; unitId: string };
