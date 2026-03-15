import { TERRAIN, type Ability, type GameMap, type Move, type PokemonTemplate, type PokemonType } from '@poketactics/shared';
import type { Player, StatusEffect } from '@/types/game';
import type { Unit } from '@/types/game';

const DEFAULT_ABILITY: Ability = {
  id: 'pressure',
  name: 'Pressure',
  description: 'Factory default ability',
};

export function createMove(overrides: Partial<Move> = {}): Move {
  return {
    id: 'tackle',
    name: 'Tackle',
    type: 'normal',
    category: 'physical',
    power: 40,
    accuracy: 100,
    pp: 35,
    range: 1,
    priority: 0,
    description: 'Factory move',
    ...overrides,
  };
}

export function createTemplate(overrides: Partial<PokemonTemplate> = {}): PokemonTemplate {
  return {
    id: 1,
    name: 'Factorymon',
    types: ['normal'],
    hp: 100,
    atk: 80,
    def: 70,
    spa: 75,
    spd: 70,
    spe: 60,
    mov: 3,
    moves: [createMove()],
    ability: DEFAULT_ABILITY,
    ...overrides,
  };
}

export function createUnit(overrides: Partial<Unit> = {}): Unit {
  const template = overrides.template ?? createTemplate();

  return {
    uid: 'unit-1',
    owner: 'P1',
    template,
    x: 0,
    y: 0,
    currentHp: template.hp,
    hasMoved: false,
    kills: 0,
    pp: template.moves.map((move) => move.pp),
    status: null,
    statusTurns: 0,
    ...overrides,
  };
}

export function createMap(rows: number, cols: number, terrain = TERRAIN.GRASS): GameMap {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => terrain)
  );
}

export function withTerrain(
  map: GameMap,
  positions: Array<{ x: number; y: number; terrain: number }>
): GameMap {
  const nextMap = map.map((row) => [...row]);

  positions.forEach(({ x, y, terrain }) => {
    nextMap[y][x] = terrain;
  });

  return nextMap;
}

export function createAbility(id: string, name = id): Ability {
  return {
    id,
    name,
    description: `${name} ability`,
  };
}

export function createTypedTemplate(
  types: PokemonType[],
  overrides: Partial<PokemonTemplate> = {}
): PokemonTemplate {
  return createTemplate({
    types,
    ...overrides,
  });
}

export function createStatusUnit(status: StatusEffect, overrides: Partial<Unit> = {}): Unit {
  return createUnit({
    status,
    statusTurns: 0,
    ...overrides,
  });
}

export function createUnitForPlayer(player: Player, overrides: Partial<Unit> = {}): Unit {
  return createUnit({
    owner: player,
    ...overrides,
  });
}
