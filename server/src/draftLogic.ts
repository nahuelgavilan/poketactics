import type { DraftState, DraftPhase, Player, ClientDraftState, PokemonTemplate } from './types';
import { EVOLUTION_CHAINS } from '@poketactics/shared';

// Get all base Pokemon (first stage of each evolution chain)
const PLAYABLE_POKEMON: PokemonTemplate[] = EVOLUTION_CHAINS.map(chain => chain.stages[0].pokemon);

/**
 * Draft turn order:
 * Ban phase: P1 ban -> P2 ban -> P1 ban -> P2 ban (4 bans total)
 * Pick phase: P1 pick -> P2 pick -> P2 pick -> P1 pick -> P1 pick -> P2 pick (6 picks total)
 */

const BAN_ORDER: Player[] = ['P1', 'P2', 'P1', 'P2'];
const PICK_ORDER: Player[] = ['P1', 'P2', 'P2', 'P1', 'P1', 'P2'];
const TIMER_DURATION = 30; // seconds

export function initializeDraft(): DraftState {
  return {
    phase: 'banning',
    currentTurn: 'P1',
    bannedPokemon: [],
    p1Picks: [],
    p2Picks: [],
    turnHistory: [],
    timerStartedAt: new Date(),
    timerDuration: TIMER_DURATION
  };
}

export function getClientDraftState(draft: DraftState, myPlayer: Player): ClientDraftState {
  const now = new Date();
  const elapsed = (now.getTime() - draft.timerStartedAt.getTime()) / 1000;
  const timeRemaining = Math.max(0, draft.timerDuration - elapsed);

  return {
    phase: draft.phase,
    myPlayer,
    currentTurn: draft.currentTurn,
    bannedPokemon: draft.bannedPokemon,
    p1Picks: draft.p1Picks,
    p2Picks: draft.p2Picks,
    turnHistory: draft.turnHistory,
    timeRemaining: Math.floor(timeRemaining)
  };
}

export function executeBan(draft: DraftState, player: Player, pokemonId: number): { success: boolean; error?: string } {
  if (draft.phase !== 'banning') {
    return { success: false, error: 'No es fase de baneo' };
  }

  if (draft.currentTurn !== player) {
    return { success: false, error: 'No es tu turno' };
  }

  const pokemon = PLAYABLE_POKEMON.find(p => p.id === pokemonId);
  if (!pokemon) {
    return { success: false, error: 'Pokémon no válido' };
  }

  if (draft.bannedPokemon.includes(pokemonId)) {
    return { success: false, error: 'Pokémon ya baneado' };
  }

  draft.bannedPokemon.push(pokemonId);
  draft.turnHistory.push({ player, action: 'ban', pokemonId });

  advanceTurn(draft);

  return { success: true };
}

export function executePick(draft: DraftState, player: Player, pokemonId: number): { success: boolean; error?: string } {
  if (draft.phase !== 'picking') {
    return { success: false, error: 'No es fase de selección' };
  }

  if (draft.currentTurn !== player) {
    return { success: false, error: 'No es tu turno' };
  }

  const pokemon = PLAYABLE_POKEMON.find(p => p.id === pokemonId);
  if (!pokemon) {
    return { success: false, error: 'Pokémon no válido' };
  }

  if (draft.bannedPokemon.includes(pokemonId)) {
    return { success: false, error: 'Pokémon baneado' };
  }

  if (draft.p1Picks.includes(pokemonId) || draft.p2Picks.includes(pokemonId)) {
    return { success: false, error: 'Pokémon ya seleccionado' };
  }

  if (player === 'P1') {
    draft.p1Picks.push(pokemonId);
  } else {
    draft.p2Picks.push(pokemonId);
  }
  draft.turnHistory.push({ player, action: 'pick', pokemonId });

  advanceTurn(draft);

  return { success: true };
}

function advanceTurn(draft: DraftState): void {
  if (draft.phase === 'banning') {
    const banCount = draft.bannedPokemon.length;
    if (banCount >= BAN_ORDER.length) {
      draft.phase = 'picking';
      draft.currentTurn = PICK_ORDER[0];
    } else {
      draft.currentTurn = BAN_ORDER[banCount];
    }
  } else if (draft.phase === 'picking') {
    const pickCount = draft.p1Picks.length + draft.p2Picks.length;
    if (pickCount >= PICK_ORDER.length) {
      draft.phase = 'complete';
    } else {
      draft.currentTurn = PICK_ORDER[pickCount];
    }
  }

  draft.timerStartedAt = new Date();
}

export function handleTimeout(draft: DraftState): { player: Player; action: 'ban' | 'pick'; pokemonId: number } | null {
  const now = new Date();
  const elapsed = (now.getTime() - draft.timerStartedAt.getTime()) / 1000;

  if (elapsed < draft.timerDuration) {
    return null;
  }

  const player = draft.currentTurn;
  const availablePokemon = PLAYABLE_POKEMON.filter(p =>
    !draft.bannedPokemon.includes(p.id) &&
    !draft.p1Picks.includes(p.id) &&
    !draft.p2Picks.includes(p.id)
  );

  if (availablePokemon.length === 0) {
    return null;
  }

  const randomPokemon = availablePokemon[Math.floor(Math.random() * availablePokemon.length)];

  if (draft.phase === 'banning') {
    executeBan(draft, player, randomPokemon.id);
    return { player, action: 'ban', pokemonId: randomPokemon.id };
  } else if (draft.phase === 'picking') {
    executePick(draft, player, randomPokemon.id);
    return { player, action: 'pick', pokemonId: randomPokemon.id };
  }

  return null;
}

export function getPlayerTeam(draft: DraftState, player: Player): PokemonTemplate[] {
  const pickedIds = player === 'P1' ? draft.p1Picks : draft.p2Picks;
  return pickedIds.map(id => PLAYABLE_POKEMON.find(p => p.id === id)!).filter(Boolean);
}
