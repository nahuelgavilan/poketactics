import { TERRAIN_PROPS } from '../constants/terrain';
import { TYPES } from '../constants/types';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../constants/board';
import type { Unit, Position, AttackTarget, GameMap } from '../types/game';

/**
 * Calculate Manhattan distance between two positions
 */
export function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

interface QueueNode {
  x: number;
  y: number;
  cost: number;
}

const DIRECTIONS: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];

/**
 * Calculate all valid movement positions for a unit using Dijkstra's algorithm
 * Considers terrain costs and flying type immunity
 */
export function calculateMoveRange(
  unit: Unit,
  map: GameMap,
  units: Unit[]
): Position[] {
  if (unit.hasMoved) return [];

  const costs: Record<string, number> = {};
  const queue: QueueNode[] = [{ x: unit.x, y: unit.y, cost: 0 }];
  costs[`${unit.x},${unit.y}`] = 0;
  const validMoves: Position[] = [];

  const isFlying = unit.template.types.includes(TYPES.FLYING);

  while (queue.length > 0) {
    // Sort by cost (priority queue)
    queue.sort((a, b) => a.cost - b.cost);
    const curr = queue.shift()!;

    if (curr.cost < unit.template.mov) {
      for (const [dx, dy] of DIRECTIONS) {
        const nx = curr.x + dx;
        const ny = curr.y + dy;

        // Check bounds
        if (nx < 0 || nx >= BOARD_WIDTH || ny < 0 || ny >= BOARD_HEIGHT) continue;

        const terrain = map[ny][nx];
        const props = TERRAIN_PROPS[terrain];
        const cost = isFlying ? 1 : props.moveCost;

        // Skip impassable terrain
        if (cost > 10) continue;

        // Check for enemy units blocking
        const occupant = units.find(u => u.x === nx && u.y === ny);
        if (occupant && occupant.owner !== unit.owner) continue;

        const newCost = curr.cost + cost;

        if (newCost <= unit.template.mov) {
          const key = `${nx},${ny}`;

          if (costs[key] === undefined || newCost < costs[key]) {
            costs[key] = newCost;
            queue.push({ x: nx, y: ny, cost: newCost });

            // Only add as valid move if not occupied or is self
            if (!occupant || occupant.uid === unit.uid) {
              validMoves.push({ x: nx, y: ny });
            }
          }
        }
      }
    }
  }

  return validMoves;
}

/**
 * Calculate all attackable enemy positions for a unit
 */
export function calculateAttackRange(
  unit: Unit,
  units: Unit[]
): AttackTarget[] {
  return units
    .filter(u => u.owner !== unit.owner)
    .filter(u => getDistance(unit, u) <= unit.template.rng)
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
      if (nx < 0 || nx >= BOARD_WIDTH || ny < 0 || ny >= BOARD_HEIGHT) continue;

      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;

      const terrain = map[ny][nx];
      const props = TERRAIN_PROPS[terrain];
      const cost = isFlying ? 1 : props.moveCost;

      // Skip impassable terrain
      if (cost > 10) continue;

      // Check for enemy units blocking (but allow passing through the target)
      const occupant = units.find(u => u.x === nx && u.y === ny);
      if (occupant && occupant.owner !== movingUnit.owner && !(nx === end.x && ny === end.y)) continue;

      // Skip occupied tiles (can't stop on them), unless it's the moving unit's position
      if (occupant && occupant.uid !== movingUnit.uid && !(nx === end.x && ny === end.y)) continue;

      visited.add(key);
      queue.push([...path, { x: nx, y: ny }]);
    }
  }

  return [];
}
