import { TERRAIN, calculateMoveRange } from '@poketactics/shared';
import { describe, expect, it } from 'vitest';
import { createMap, createTypedTemplate, createUnit, withTerrain } from '../helpers/factories';

describe('shared pathfinding logic', () => {
  it('lets flying units cross impassable terrain that blocks grounded units', () => {
    const baseMap = withTerrain(createMap(1, 3), [
      { x: 1, y: 0, terrain: TERRAIN.WATER },
    ]);

    const grounded = createUnit({
      template: createTypedTemplate(['normal'], { mov: 2 }),
    });
    const flying = createUnit({
      template: createTypedTemplate(['flying'], { mov: 2 }),
      uid: 'flying-1',
    });

    const groundedRange = calculateMoveRange(grounded, baseMap, [grounded]);
    const flyingRange = calculateMoveRange(flying, baseMap, [flying]);

    expect(groundedRange).not.toContainEqual({ x: 2, y: 0 });
    expect(flyingRange).toContainEqual({ x: 2, y: 0 });
  });

  it('reduces movement when the unit is paralyzed', () => {
    const map = createMap(1, 4);
    const paralyzed = createUnit({
      template: createTypedTemplate(['electric'], { mov: 4 }),
      status: 'paralysis',
    });

    const moveRange = calculateMoveRange(paralyzed, map, [paralyzed]);

    expect(moveRange).toContainEqual({ x: 2, y: 0 });
    expect(moveRange).not.toContainEqual({ x: 3, y: 0 });
  });

  it('blocks enemy-occupied tiles while allowing routes around allies', () => {
    const map = createMap(3, 3);
    const unit = createUnit({
      x: 1,
      y: 1,
      template: createTypedTemplate(['normal'], { mov: 2 }),
    });
    const ally = createUnit({
      uid: 'ally-1',
      x: 1,
      y: 0,
    });
    const enemy = createUnit({
      uid: 'enemy-1',
      owner: 'P2',
      x: 2,
      y: 1,
    });

    const moveRange = calculateMoveRange(unit, map, [unit, ally, enemy]);

    expect(moveRange).not.toContainEqual({ x: 1, y: 0 });
    expect(moveRange).not.toContainEqual({ x: 2, y: 1 });
    expect(moveRange).toContainEqual({ x: 0, y: 1 });
    expect(moveRange).toContainEqual({ x: 2, y: 0 });
  });
});
