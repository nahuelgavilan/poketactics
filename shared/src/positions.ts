export interface GridPosition {
  x: number;
  y: number;
}

export function toPositionKey(positionOrX: GridPosition | number, y?: number): string {
  if (typeof positionOrX === 'number') {
    return `${positionOrX},${y ?? 0}`;
  }

  return `${positionOrX.x},${positionOrX.y}`;
}

export function buildPositionSet<T extends GridPosition>(positions: readonly T[]): Set<string> {
  return new Set(positions.map((position) => toPositionKey(position)));
}

export function buildPositionIndex<T extends GridPosition>(positions: readonly T[]): Map<string, T> {
  return new Map(positions.map((position) => [toPositionKey(position), position]));
}
