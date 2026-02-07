import { TERRAIN_GAME_PROPS } from './terrain';
import type { PokemonType, Position, GameMap } from './types';

export interface PathfindingUnit {
  x: number;
  y: number;
  owner: string;
  uid: string;
  hasMoved: boolean;
  template: {
    types: PokemonType[];
    mov: number;
  };
}

interface QueueNode {
  x: number;
  y: number;
  cost: number;
}

const DIRECTIONS: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];

export function calculateMoveRange(
  unit: PathfindingUnit,
  map: GameMap,
  units: PathfindingUnit[]
): Position[] {
  if (unit.hasMoved) return [];

  const costs: Record<string, number> = {};
  const queue: QueueNode[] = [{ x: unit.x, y: unit.y, cost: 0 }];
  costs[`${unit.x},${unit.y}`] = 0;
  const validMoves: Position[] = [];

  const isFlying = unit.template.types.includes('flying' as PokemonType);

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const curr = queue.shift()!;

    if (curr.cost < unit.template.mov) {
      for (const [dx, dy] of DIRECTIONS) {
        const nx = curr.x + dx;
        const ny = curr.y + dy;

        if (nx < 0 || nx >= map[0].length || ny < 0 || ny >= map.length) continue;

        const terrain = map[ny][nx];
        const props = TERRAIN_GAME_PROPS[terrain];
        const cost = isFlying ? 1 : props.moveCost;

        if (cost > 10) continue;

        const occupant = units.find(u => u.x === nx && u.y === ny);
        if (occupant && occupant.owner !== unit.owner) continue;

        const newCost = curr.cost + cost;

        if (newCost <= unit.template.mov) {
          const key = `${nx},${ny}`;

          if (costs[key] === undefined || newCost < costs[key]) {
            costs[key] = newCost;
            queue.push({ x: nx, y: ny, cost: newCost });

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

export function getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}
