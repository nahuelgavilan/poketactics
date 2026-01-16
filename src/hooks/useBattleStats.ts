import { useState, useCallback } from 'react';
import type { Player, Unit, BattleData } from '../types/game';
import {
  BattleStats,
  createEmptyBattleStats,
  calculateMVP,
} from '../types/stats';

export function useBattleStats() {
  const [stats, setStats] = useState<BattleStats>(createEmptyBattleStats());

  // Reset stats for new game
  const resetStats = useCallback(() => {
    setStats(createEmptyBattleStats());
  }, []);

  // Initialize unit stats
  const initUnitStats = useCallback((units: Unit[]) => {
    setStats(prev => {
      const newStats = { ...prev };

      units.forEach(unit => {
        const playerStats = unit.owner === 'P1' ? newStats.p1 : newStats.p2;
        if (!playerStats.unitStats.has(unit.uid)) {
          playerStats.unitStats.set(unit.uid, {
            pokemonId: unit.template.id,
            pokemonName: unit.template.name,
            damageDealt: 0,
            damageTaken: 0,
            kills: 0,
            deaths: 0,
            captures: 0,
            evolutions: 0,
            tilesMovedturnsSurvived: 0,
          });
        }
      });

      return newStats;
    });
  }, []);

  // Record battle damage
  const recordBattle = useCallback((battleData: BattleData) => {
    setStats(prev => {
      const newStats = { ...prev };

      const { attacker, defender, attackerResult, defenderResult } = battleData;
      const attackerDamage = attackerResult.damage;
      const counterDamage = defenderResult?.damage || 0;

      // Get player stats
      const attackerPlayerStats = attacker.owner === 'P1' ? newStats.p1 : newStats.p2;
      const defenderPlayerStats = defender.owner === 'P1' ? newStats.p1 : newStats.p2;

      // Update attacker stats
      attackerPlayerStats.totalDamageDealt += attackerDamage;
      attackerPlayerStats.totalDamageTaken += counterDamage;

      const attackerUnitStats = attackerPlayerStats.unitStats.get(attacker.uid);
      if (attackerUnitStats) {
        attackerUnitStats.damageDealt += attackerDamage;
        attackerUnitStats.damageTaken += counterDamage;
      }

      // Update defender stats
      defenderPlayerStats.totalDamageDealt += counterDamage;
      defenderPlayerStats.totalDamageTaken += attackerDamage;

      const defenderUnitStats = defenderPlayerStats.unitStats.get(defender.uid);
      if (defenderUnitStats) {
        defenderUnitStats.damageDealt += counterDamage;
        defenderUnitStats.damageTaken += attackerDamage;
      }

      // Check for kills
      if (defender.currentHp - attackerDamage <= 0) {
        attackerPlayerStats.totalKills += 1;
        defenderPlayerStats.totalDeaths += 1;

        if (attackerUnitStats) attackerUnitStats.kills += 1;
        if (defenderUnitStats) defenderUnitStats.deaths += 1;
      }

      // Check if attacker died from counter
      if (defenderResult && attacker.currentHp - counterDamage <= 0) {
        defenderPlayerStats.totalKills += 1;
        attackerPlayerStats.totalDeaths += 1;

        if (defenderUnitStats) defenderUnitStats.kills += 1;
        if (attackerUnitStats) attackerUnitStats.deaths += 1;
      }

      return newStats;
    });
  }, []);

  // Record capture
  const recordCapture = useCallback((player: Player, unitId: string) => {
    setStats(prev => {
      const newStats = { ...prev };
      const playerStats = player === 'P1' ? newStats.p1 : newStats.p2;

      playerStats.totalCaptures += 1;

      const unitStats = playerStats.unitStats.get(unitId);
      if (unitStats) {
        unitStats.captures += 1;
      }

      return newStats;
    });
  }, []);

  // Record evolution
  const recordEvolution = useCallback((player: Player, unitId: string) => {
    setStats(prev => {
      const newStats = { ...prev };
      const playerStats = player === 'P1' ? newStats.p1 : newStats.p2;

      playerStats.totalEvolutions += 1;

      const unitStats = playerStats.unitStats.get(unitId);
      if (unitStats) {
        unitStats.evolutions += 1;
      }

      return newStats;
    });
  }, []);

  // Record turn end
  const recordTurnEnd = useCallback((player: Player) => {
    setStats(prev => {
      const newStats = { ...prev };
      const playerStats = player === 'P1' ? newStats.p1 : newStats.p2;

      playerStats.turnsPlayed += 1;
      newStats.totalTurns = Math.max(newStats.p1.turnsPlayed, newStats.p2.turnsPlayed);

      return newStats;
    });
  }, []);

  // Finalize stats at game end
  const finalizeStats = useCallback((winner: Player) => {
    setStats(prev => {
      const newStats = { ...prev };
      newStats.battleEndTime = Date.now();

      // Calculate MVPs
      newStats.p1.mvpUnitId = calculateMVP(newStats.p1);
      newStats.p2.mvpUnitId = calculateMVP(newStats.p2);

      return newStats;
    });
  }, []);

  // Add new unit stats (for captured Pokemon)
  const addUnitStats = useCallback((unit: Unit) => {
    setStats(prev => {
      const newStats = { ...prev };
      const playerStats = unit.owner === 'P1' ? newStats.p1 : newStats.p2;

      if (!playerStats.unitStats.has(unit.uid)) {
        playerStats.unitStats.set(unit.uid, {
          pokemonId: unit.template.id,
          pokemonName: unit.template.name,
          damageDealt: 0,
          damageTaken: 0,
          kills: 0,
          deaths: 0,
          captures: 0,
          evolutions: 0,
          tilesMovedturnsSurvived: 0,
        });
      }

      return newStats;
    });
  }, []);

  return {
    stats,
    resetStats,
    initUnitStats,
    recordBattle,
    recordCapture,
    recordEvolution,
    recordTurnEnd,
    finalizeStats,
    addUnitStats,
  };
}
