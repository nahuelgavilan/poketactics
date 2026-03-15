import { TERRAIN, calculateBaseDamage, rollDamage } from '@poketactics/shared';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { createAbility, createMove, createTemplate } from '../helpers/factories';

describe('shared combat logic', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies STAB, effectiveness and terrain modifiers to base damage', () => {
    const attacker = createTemplate({
      types: ['fire'],
      spa: 80,
    });
    const defender = createTemplate({
      types: ['grass'],
      spd: 40,
    });
    const move = createMove({
      id: 'ember',
      name: 'Ember',
      type: 'fire',
      category: 'special',
      power: 60,
    });

    const result = calculateBaseDamage({
      move,
      attackerTemplate: attacker,
      attackerTypes: attacker.types,
      defenderTemplate: defender,
      defenderTypes: defender.types,
      attackerTerrain: TERRAIN.SAND,
      defenderTerrain: TERRAIN.FOREST,
    });

    expect(result).toEqual({
      base: 172.5,
      effectiveness: 2,
      isStab: true,
      typeTerrainBonus: true,
      terrainBonus: 20,
    });
  });

  it('lets status moves apply effects without dealing damage', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const move = createMove({
      id: 'thunder-wave',
      name: 'Thunder Wave',
      type: 'electric',
      category: 'status',
      power: 0,
      effect: 'paralysis',
      effectChance: 100,
    });

    const result = rollDamage({
      move,
      attackerTemplate: createTemplate(),
      attackerTypes: ['electric'],
      defenderTemplate: createTemplate(),
      defenderTypes: ['water'],
      attackerTerrain: TERRAIN.GRASS,
      defenderTerrain: TERRAIN.GRASS,
      attackerAbility: createAbility('pressure'),
      defenderAbility: createAbility('pressure'),
      attackerCurrentHp: 100,
      attackerMaxHp: 100,
      defenderCurrentHp: 100,
      defenderMaxHp: 100,
    });

    expect(result.damage).toBe(0);
    expect(result.missed).toBe(false);
    expect(result.statusApplied).toBe('paralysis');
  });

  it('respects ability immunities when rolling damage', () => {
    const move = createMove({
      id: 'earthquake',
      name: 'Earthquake',
      type: 'ground',
      power: 100,
    });

    const result = rollDamage({
      move,
      attackerTemplate: createTemplate(),
      attackerTypes: ['ground'],
      defenderTemplate: createTemplate({
        types: ['electric'],
      }),
      defenderTypes: ['electric'],
      attackerTerrain: TERRAIN.GRASS,
      defenderTerrain: TERRAIN.GRASS,
      attackerAbility: createAbility('pressure'),
      defenderAbility: createAbility('levitate'),
      attackerCurrentHp: 100,
      attackerMaxHp: 100,
      defenderCurrentHp: 100,
      defenderMaxHp: 100,
      forceCrit: false,
    });

    expect(result.damage).toBe(0);
    expect(result.effectiveness).toBe(0);
    expect(result.missed).toBe(false);
  });

  it('caps lethal damage with Sturdy when the defender is at full health', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const move = createMove({
      id: 'close-combat',
      name: 'Close Combat',
      type: 'fighting',
      power: 120,
    });

    const attacker = createTemplate({
      atk: 150,
      types: ['fighting'],
    });
    const defender = createTemplate({
      hp: 100,
      def: 40,
      ability: createAbility('sturdy'),
    });

    const result = rollDamage({
      move,
      attackerTemplate: attacker,
      attackerTypes: attacker.types,
      defenderTemplate: defender,
      defenderTypes: defender.types,
      attackerTerrain: TERRAIN.GRASS,
      defenderTerrain: TERRAIN.GRASS,
      attackerAbility: createAbility('pressure'),
      defenderAbility: defender.ability,
      attackerCurrentHp: attacker.hp,
      attackerMaxHp: attacker.hp,
      defenderCurrentHp: defender.hp,
      defenderMaxHp: defender.hp,
      forceCrit: false,
    });

    expect(result.damage).toBe(defender.hp - 1);
  });
});
