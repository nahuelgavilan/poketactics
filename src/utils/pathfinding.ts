import { TERRAIN_PROPS } from '../constants/terrain';
import { TYPES } from '../constants/types';
import { calculateMoveRange as sharedCalculateMoveRange, getMaxAttackRange } from '@poketactics/shared';
import type { Unit, Position, AttackTarget, GameMap } from '../types/game';

/**
 * Calculate Manhattan distance between two positions
 */
export function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

const DIRECTIONS: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];

/**
 * Calculate all valid movement positions for a unit using Dijkstra's algorithm
 * Delegates to shared implementation
 */
export function calculateMoveRange(
  unit: Unit,
  map: GameMap,
  units: Unit[]
): Position[] {
  return sharedCalculateMoveRange(unit, map, units);
}

/**
 * Calculate all attackable enemy positions for a unit
 * Uses the max range across all moves with PP remaining
 */
export function calculateAttackRange(
  unit: Unit,
  units: Unit[]
): AttackTarget[] {
  const maxRange = getMaxAttackRange(unit.template, unit.pp);
  return units
    .filter(u => u.owner !== unit.owner)
    .filter(u => getDistance(unit, u) <= maxRange)
    .map(u => ({ x: u.x, y: u.y, uid: u.uid }));
}

/**
 * Check if a position is within a list of positions
 */
export function isInRange(pos: Position, range: Position[]): boolean {
  return range.some(p => p.x === pos.x && p.y === pos.y);
}

/**
 * Check if a position is in attack range
 */
export function isInAttackRange(pos: Position, range: AttackTarget[]): boolean {
  return range.some(a => a.x === pos.x && a.y === pos.y);
}

/**
 * Find the shortest path from start to end using BFS
 * Returns array of positions forming the path (including start and end)
 * Returns empty array if no valid path exists
 */
export function findPath(
  start: Position,
  end: Position,
  map: GameMap,
  units: Unit[],
  movingUnit: Unit
): Position[] {
  if (start.x === end.x && start.y === end.y) return [start];

  const queue: Position[][] = [[start]];
  const visited = new Set([`${start.x},${start.y}`]);
  const isFlying = movingUnit.template.types.includes(TYPES.FLYING);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const curr = path[path.length - 1];

    if (curr.x === end.x && curr.y === end.y) return path;

    for (const [dx, dy] of DIRECTIONS) {
      const nx = curr.x + dx;
      const ny = curr.y + dy;

      // Check bounds
      if (nx < 0 || nx >= map[0].length || ny < 0 || ny >= map.length) continue;

      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;

      const terrain = map[ny][nx];
      const props = TERRAIN_PROPS[terrain];
      const cost = isFlying ? 1 : props.moveCost;

      // Skip impassable terrain
      if (cost > 10) continue;

      // Check for units blocking
      const occupant = units.find(u => u.x === nx && u.y === ny);

      // Enemy units always block (can't pass through)
      if (occupant && occupant.owner !== movingUnit.owner) continue;

      // Friendly units: can pass through, but can't stop on them (unless it's our own tile)
      const isDestination = nx === end.x && ny === end.y;
      if (isDestination && occupant && occupant.uid !== movingUnit.uid) continue;

      visited.add(key);
      queue.push([...path, { x: nx, y: ny }]);
    }
  }

  return [];
}
