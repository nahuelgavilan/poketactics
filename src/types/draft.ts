/**
 * Draft System Types
 * Pokemon-style competitive draft for 1v1 battles
 */

import type { PokemonTemplate, Player } from './game';

export type DraftPhase = 'ban' | 'pick' | 'ready';

export interface DraftState {
  phase: DraftPhase;
  pool: PokemonTemplate[];        // Available Pokemon pool (12 Pokemon)
  bannedByP1: number[];           // Pokemon IDs banned by P1
  bannedByP2: number[];           // Pokemon IDs banned by P2
  pickedByP1: PokemonTemplate[];  // Pokemon picked by P1
  pickedByP2: PokemonTemplate[];  // Pokemon picked by P2
  currentPicker: Player;          // Who's picking/banning now
  pickOrder: Player[];            // Order of picks (snake draft)
  currentPickIndex: number;       // Current position in pick order
  bansPerPlayer: number;          // Number of bans each player gets (default 2)
  picksPerPlayer: number;         // Number of picks each player gets (default 3)
}

export interface DraftAction {
  type: 'ban' | 'pick';
  pokemonId: number;
  player: Player;
}

/**
 * Draft configuration
 */
export const DRAFT_CONFIG = {
  POOL_SIZE: 12,          // Total Pokemon in draft pool
  BANS_PER_PLAYER: 2,     // Each player bans 2
  PICKS_PER_PLAYER: 3,    // Each player picks 3
  TIMER_SECONDS: 30,      // Seconds per pick/ban
} as const;
