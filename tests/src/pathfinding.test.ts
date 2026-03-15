import { describe, expect, it } from 'vitest';
import { findPath } from '@/utils/pathfinding';
import { createMap, createTypedTemplate, createUnit, withTerrain } from '../helpers/factories';
import { TERRAIN } from '@poketactics/shared';

describe('client path preview pathfinding', () => {
  it('can route through allied units but cannot stop on them', () => {
    const map = createMap(1, 3);
    const mover = createUnit({
      x: 0,
      y: 0,
      template: createTypedTemplate(['normal'], { mov: 3 }),
    });
    const ally = createUnit({
      uid: 'ally-1',
      x: 1,
      y: 0,
    });

    const pathToFarTile = findPath(
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      map,
      [mover, ally],
      mover
    );
    const pathToAllyTile = findPath(
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      map,
      [mover, ally],
      mover
    );

    expect(pathToFarTile).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);
    expect(pathToAllyTile).toEqual([]);
  });

  it('reroutes around detours but respects blocked endpoints', () => {
    const mapWithDetour = withTerrain(createMap(2, 3), [
      { x: 1, y: 0, terrain: TERRAIN.WATER },
    ]);
    const corridorMap = withTerrain(createMap(1, 3), [
      { x: 1, y: 0, terrain: TERRAIN.WATER },
    ]);
    const mover = createUnit({
      x: 0,
      y: 0,
      template: createTypedTemplate(['normal'], { mov: 4 }),
    });
    const enemy = createUnit({
      uid: 'enemy-1',
      owner: 'P2',
      x: 1,
      y: 1,
    });

    const reroutedAroundWater = findPath(
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      mapWithDetour,
      [mover],
      mover
    );
    const blockedByWater = findPath(
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      corridorMap,
      [mover],
      mover
    );
    const blockedByEnemy = findPath(
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      createMap(2, 2),
      [mover, enemy],
      mover
    );

    expect(reroutedAroundWater).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 0 },
    ]);
    expect(blockedByWater).toEqual([]);
    expect(blockedByEnemy).toEqual([]);
  });
});
