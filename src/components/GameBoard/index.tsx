import { Tile } from './Tile';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../../constants/board';
import { isInRange, isInAttackRange } from '../../utils/pathfinding';
import type { GameMap, Unit, Position, AttackTarget, Player, VisibilityMap } from '../../types/game';

interface GameBoardProps {
  map: GameMap;
  units: Unit[];
  selectedUnit: Unit | null;
  moveRange: Position[];
  attackRange: AttackTarget[];
  onTileClick: (x: number, y: number) => void;
  isMobile?: boolean;
  currentPlayer: Player;
  visibility: VisibilityMap | null;
}

export function GameBoard({
  map,
  units,
  selectedUnit,
  moveRange,
  attackRange,
  onTileClick,
  isMobile = false,
  currentPlayer,
  visibility
}: GameBoardProps) {
  // Calculate tile size to fit viewport properly
  // Mobile: Use viewport units to ensure board fits without scroll
  // Desktop: fixed comfortable size with max constraint
  const gap = isMobile ? 'gap-0.5' : 'gap-1';
  const padding = isMobile ? 'p-1.5' : 'p-3';

  // Calculate tile size using CSS calc to fit within viewport
  // Account for: header (~56px), main padding (16px), board padding (12px), gaps
  // Available height = 100vh - 60px header - 16px padding - 12px board padding
  // Each tile = (available - gaps) / BOARD_HEIGHT
  const tileSizeCalc = isMobile
    ? `calc((100vh - 80px - ${BOARD_HEIGHT - 1} * 2px) / ${BOARD_HEIGHT})`
    : `clamp(3rem, calc((100vh - 120px) / ${BOARD_HEIGHT}), 4.5rem)`;

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
      className={`
        relative bg-slate-800/90 backdrop-blur-sm ${padding} rounded-xl
        shadow-2xl border border-slate-700
        select-none touch-manipulation
        max-h-full
      `}
      style={{
        // Constrain board width based on tile size and columns
        maxWidth: isMobile ? '95vw' : 'auto'
      }}
    >
      {/* Subtle inner glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/5 to-red-500/5 pointer-events-none" />

      <div
        className={`grid ${gap} relative`}
        style={{
          gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${tileSizeCalc})`,
          gridTemplateRows: `repeat(${BOARD_HEIGHT}, ${tileSizeCalc})`,
        }}
      >
        {map.map((row, y) =>
          row.map((terrain, x) => {
            const unit = units.find(u => u.x === x && u.y === y);
            // Only show unit if visible (fog of war check)
            const visibleUnit = unit && isUnitVisible(unit) ? unit : undefined;
            const isSelected = selectedUnit?.x === x && selectedUnit?.y === y;
            const canMove = isInRange({ x, y }, moveRange);
            const canAttack = isInAttackRange({ x, y }, attackRange);

            // Visibility state for fog of war
            const isVisible = visibility ? visibility.visible[y]?.[x] ?? true : true;
            const isExplored = visibility ? visibility.explored[y]?.[x] ?? true : true;

            return (
              <Tile
                key={`${x}-${y}`}
                x={x}
                y={y}
                terrain={terrain}
                unit={visibleUnit}
                isSelected={isSelected}
                canMove={canMove}
                canAttack={canAttack}
                onClick={() => onTileClick(x, y)}
                isMobile={isMobile}
                isVisible={isVisible}
                isExplored={isExplored}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
