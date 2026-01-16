/**
 * Battle Statistics Types
 * Track in-game stats for post-battle summary
 */

import type { Player } from './game';

export interface UnitStats {
  pokemonId: number;
  pokemonName: string;
  damageDealt: number;
  damageTaken: number;
  kills: number;
  deaths: number;
  captures: number;
  evolutions: number;
  tilesMovedturnsSurvived: number;
}

export interface PlayerStats {
  totalDamageDealt: number;
  totalDamageTaken: number;
  totalKills: number;
  totalDeaths: number;
  totalCaptures: number;
  totalEvolutions: number;
  unitStats: Map<string, UnitStats>;  // uid -> stats
  turnsPlayed: number;
  mvpUnitId: string | null;
}

export interface BattleStats {
  p1: PlayerStats;
  p2: PlayerStats;
  totalTurns: number;
  battleStartTime: number;
  battleEndTime: number | null;
}

export function createEmptyPlayerStats(): PlayerStats {
  return {
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    totalKills: 0,
    totalDeaths: 0,
    totalCaptures: 0,
    totalEvolutions: 0,
    unitStats: new Map(),
    turnsPlayed: 0,
    mvpUnitId: null,
  };
}

export function createEmptyBattleStats(): BattleStats {
  return {
    p1: createEmptyPlayerStats(),
    p2: createEmptyPlayerStats(),
    totalTurns: 0,
    battleStartTime: Date.now(),
    battleEndTime: null,
  };
}

/**
 * Calculate MVP based on damage dealt and kills
 */
export function calculateMVP(stats: PlayerStats): string | null {
  let maxScore = 0;
  let mvpId: string | null = null;

  stats.unitStats.forEach((unitStat, uid) => {
    // Score = damage dealt + (kills * 50)
    const score = unitStat.damageDealt + (unitStat.kills * 50);
    if (score > maxScore) {
      maxScore = score;
      mvpId = uid;
    }
  });

  return mvpId;
}
