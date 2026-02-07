import { useMemo } from 'react';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../constants/board';
import { VISION_RANGE } from '../constants/vision';
import { TERRAIN_PROPS } from '../constants/terrain';
import type { Unit, Player, VisibilityMap, GameMap } from '../types/game';


/**
 * Calculate visibility map for fog of war
 */
export function useVision(
  units: Unit[],
  currentPlayer: Player,
  previousExplored: boolean[][],
  map?: GameMap
): VisibilityMap {
  return useMemo(() => {
    // Derive dimensions from map (dynamic) or fall back to constants
    const rows = map ? map.length : BOARD_HEIGHT;
    const cols = map && map[0] ? map[0].length : BOARD_WIDTH;

    // Initialize visibility arrays
    const visible: boolean[][] = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(false));

    const explored: boolean[][] = previousExplored.length > 0
      ? previousExplored.map(row => [...row])
      : Array(rows).fill(null).map(() => Array(cols).fill(false));

    // Get current player's units
    const playerUnits = units.filter(u => u.owner === currentPlayer);

    // Calculate visible tiles based on unit positions
    for (const unit of playerUnits) {
      // Check if unit is on terrain with vision bonus (e.g., mountain)
      let unitVisionRange = VISION_RANGE;
      if (map && map[unit.y] && map[unit.y][unit.x] !== undefined) {
        const terrainType = map[unit.y][unit.x];
        const terrainProps = TERRAIN_PROPS[terrainType];
        if (terrainProps?.visionBonus) {
          unitVisionRange += terrainProps.visionBonus;
        }
      }

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // Manhattan distance
          const distance = Math.abs(x - unit.x) + Math.abs(y - unit.y);

          if (distance <= unitVisionRange) {
            visible[y][x] = true;
            explored[y][x] = true;
          }
        }
      }
    }

    return { visible, explored };
  }, [units, currentPlayer, previousExplored, map]);
}

/**
 * Check if a position is visible to a player
 */
export function isPositionVisible(
  x: number,
  y: number,
  visibility: VisibilityMap
): boolean {
  const rows = visibility.visible.length;
  const cols = rows > 0 ? visibility.visible[0].length : 0;
  if (y < 0 || y >= rows || x < 0 || x >= cols) {
    return false;
  }
  return visibility.visible[y][x];
}

/**
 * Check if an enemy unit is visible
 */
export function isUnitVisible(
  unit: Unit,
  currentPlayer: Player,
  visibility: VisibilityMap
): boolean {
  // Own units are always visible
  if (unit.owner === currentPlayer) {
    return true;
  }

  return isPositionVisible(unit.x, unit.y, visibility);
}
