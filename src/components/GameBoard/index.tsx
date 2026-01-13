import { Tile } from './Tile';
import { FogOverlay } from './FogOverlay';
import { BOARD_WIDTH } from '../../constants/board';
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
  // Calculate tile size based on viewport
  // Mobile: fit 6 columns with gaps in ~95vw
  // Desktop: fixed comfortable size
  const tileSize = isMobile ? 'minmax(2.8rem, 1fr)' : 'minmax(3.5rem, 5rem)';
  const gap = isMobile ? 'gap-1' : 'gap-1.5';
  const padding = isMobile ? 'p-2' : 'p-4';

  // Numeric tile size for fog overlay (approximate)
  const numericTileSize = isMobile ? 48 : 64;

  // Check if a unit should be visible
  const isUnitVisible = (unit: Unit): boolean => {
    // Own units are always visible
    if (unit.owner === currentPlayer) return true;
    // No fog enabled - show all
    if (!visibility) return true;
    // Check visibility map
    return visibility.visible[unit.y]?.[unit.x] ?? false;
  };

  // Get hidden enemies for silhouette display (in explored but not visible areas)
  const hiddenEnemies = visibility
    ? units.filter(u =>
        u.owner !== currentPlayer &&
        visibility.explored[u.y]?.[u.x] &&
        !visibility.visible[u.y]?.[u.x]
      )
    : [];

  return (
    <div
      className={`
        relative bg-slate-800/90 backdrop-blur-sm ${padding} rounded-2xl
        shadow-2xl border border-slate-700
        select-none touch-manipulation
        ${isMobile ? 'w-full max-w-[95vw]' : ''}
      `}
    >
      {/* Subtle inner glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-red-500/5 pointer-events-none" />

      <div
        className={`grid ${gap} relative`}
        style={{
          gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${tileSize})`,
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
              />
            );
          })
        )}

        {/* Fog of War overlay */}
        {visibility && (
          <FogOverlay
            visibility={visibility}
            tileSize={numericTileSize}
            hiddenEnemies={hiddenEnemies}
            isMobile={isMobile}
          />
        )}
      </div>
    </div>
  );
}
