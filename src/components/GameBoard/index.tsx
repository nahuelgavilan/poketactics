import { useState, useMemo, useCallback } from 'react';
import { Tile } from './Tile';
import { UnitActionMenu } from '../UnitActionMenu';
import { isInRange, isInAttackRange, findPath } from '../../utils/pathfinding';
import { TERRAIN } from '../../constants/terrain';
import { getBridgeOrientation } from '../../utils/mapGenerator';
import type { GameMap, Unit, Position, AttackTarget, Player, VisibilityMap } from '../../types/game';

interface GameBoardProps {
  map: GameMap;
  units: Unit[];
  selectedUnit: Unit | null;
  moveRange: Position[];
  attackRange: AttackTarget[];
  pendingPosition: Position | null;
  onTileClick: (x: number, y: number) => void;
  isMobile?: boolean;
  currentPlayer: Player;
  visibility: VisibilityMap | null;
  // Action menu props
  showActionMenu?: boolean;
  canAttack?: boolean;
  onAttack?: () => void;
  onWait?: () => void;
  onCancel?: () => void;
}

export function GameBoard({
  map,
  units,
  selectedUnit,
  moveRange,
  attackRange,
  pendingPosition,
  onTileClick,
  isMobile = false,
  currentPlayer,
  visibility,
  showActionMenu = false,
  canAttack = false,
  onAttack,
  onWait,
  onCancel
}: GameBoardProps) {
  // Fixed tile sizes for touch-friendliness (min 48px on mobile)
  const tileSize = isMobile ? 48 : 56;
  const gapSize = isMobile ? 4 : 8;
  const padSize = isMobile ? 8 : 16;
  const cols = map[0]?.length || 10;
  const rows = map.length || 12;

  // Hovered tile for path visualization
  const [hoveredTile, setHoveredTile] = useState<Position | null>(null);

  // Calculate path - to pendingPosition (confirmed) or hoveredTile (preview)
  const activePath = useMemo(() => {
    if (!selectedUnit) return [];

    // If there's a pending position, always show path to it (ACTION_MENU phase)
    const targetTile = pendingPosition || hoveredTile;
    if (!targetTile) return [];

    // Don't show path if target is the unit itself
    if (targetTile.x === selectedUnit.x && targetTile.y === selectedUnit.y) return [];

    // Only show path for valid move tiles (skip check if pendingPosition since it's already validated)
    if (!pendingPosition) {
      const canMoveHere = isInRange(targetTile, moveRange);
      if (!canMoveHere) return [];
    }

    // Calculate shortest path
    const path = findPath(
      { x: selectedUnit.x, y: selectedUnit.y },
      targetTile,
      map,
      units,
      selectedUnit
    );

    return path;
  }, [selectedUnit, hoveredTile, pendingPosition, moveRange, map, units]);

  // Handle hover
  const handleTileHover = useCallback((x: number, y: number) => {
    setHoveredTile({ x, y });
  }, []);

  const handleTileHoverEnd = useCallback(() => {
    setHoveredTile(null);
  }, []);

  // Check if a unit should be visible
  const isUnitVisible = (unit: Unit): boolean => {
    // Own units are always visible
    if (unit.owner === currentPlayer) return true;
    // No fog enabled - show all
    if (!visibility) return true;
    // Check visibility map
    return visibility.visible[unit.y]?.[unit.x] ?? false;
  };


  return (
    <div
      className="relative bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 select-none touch-manipulation overflow-visible w-fit"
      style={{ padding: `${padSize}px` }}
    >
      {/* Subtle inner glow */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 to-red-500/5 pointer-events-none" />

      <div
        className="grid relative overflow-visible"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${tileSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${tileSize}px)`,
          gap: `${gapSize}px`,
        }}
      >
        {map.map((row, y) =>
          row.map((terrain, x) => {
            const unit = units.find(u => u.x === x && u.y === y);
            // Only show unit if visible (fog of war check)
            const visibleUnit = unit && isUnitVisible(unit) ? unit : undefined;
            const isSelected = selectedUnit?.x === x && selectedUnit?.y === y;
            const canMoveTo = isInRange({ x, y }, moveRange);
            const tileCanAttack = isInAttackRange({ x, y }, attackRange);

            // Visibility state for fog of war
            const isVisible = visibility ? visibility.visible[y]?.[x] ?? true : true;
            const isExplored = visibility ? visibility.explored[y]?.[x] ?? true : true;

            // Check if this tile should show the action menu
            const isPendingTile = pendingPosition && pendingPosition.x === x && pendingPosition.y === y;
            const shouldShowMenu = showActionMenu && isPendingTile && onAttack && onWait && onCancel;

            return (
              <div key={`${x}-${y}`} className="relative overflow-visible">
                <Tile
                  x={x}
                  y={y}
                  terrain={terrain}
                  unit={visibleUnit}
                  isSelected={isSelected}
                  canMove={canMoveTo}
                  canAttack={tileCanAttack}
                  onClick={() => onTileClick(x, y)}
                  onHover={() => handleTileHover(x, y)}
                  onHoverEnd={handleTileHoverEnd}
                  isMobile={isMobile}
                  isVisible={isVisible}
                  isExplored={isExplored}
                  path={activePath}
                  bridgeDir={terrain === TERRAIN.BRIDGE ? getBridgeOrientation(map, x, y) : undefined}
                />
                {/* Action menu - rendered at pending tile position */}
                {shouldShowMenu && (
                  <UnitActionMenu
                    canAttack={canAttack}
                    onAttack={onAttack}
                    onWait={onWait}
                    onCancel={onCancel}
                    gridX={x}
                    gridY={y}
                    boardWidth={cols}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
