import type { VisibilityMap, Unit } from '../../types/game';
import { getAnimatedFrontSprite } from '../../utils/sprites';

interface FogOverlayProps {
  visibility: VisibilityMap;
  tileSize: number;
  hiddenEnemies?: Unit[];
  isMobile?: boolean;
}

export function FogOverlay({ visibility, tileSize, hiddenEnemies = [], isMobile = false }: FogOverlayProps) {
  const { visible, explored } = visibility;
  const gapAdjust = isMobile ? 4 : 6; // Account for grid gap

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {explored.map((row, y) =>
        row.map((isExplored, x) => {
          const isVisible = visible[y][x];

          // Fully visible - no fog
          if (isVisible) {
            return null;
          }

          // Find if there's a hidden enemy at this position (for silhouette)
          const hiddenEnemy = hiddenEnemies.find(u => u.x === x && u.y === y);

          // Explored but not visible - show terrain dimmed with enemy silhouette
          if (isExplored) {
            return (
              <div
                key={`fog-${x}-${y}`}
                className="absolute flex items-center justify-center transition-all duration-300"
                style={{
                  left: x * (tileSize + gapAdjust),
                  top: y * (tileSize + gapAdjust),
                  width: tileSize,
                  height: tileSize,
                  background: 'linear-gradient(135deg, rgba(51,65,85,0.7) 0%, rgba(30,41,59,0.8) 100%)',
                  backdropFilter: 'grayscale(80%) brightness(0.5)'
                }}
              >
                {/* Enemy silhouette - shows there's something there but not what */}
                {hiddenEnemy && (
                  <div className="relative w-3/4 h-3/4 flex items-center justify-center">
                    <img
                      src={getAnimatedFrontSprite(hiddenEnemy.template.id)}
                      alt="?"
                      className="w-full h-full object-contain opacity-40"
                      style={{
                        filter: 'brightness(0) saturate(0)',
                        imageRendering: 'pixelated'
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-slate-400 text-lg font-bold animate-pulse">?</span>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // Never explored - gray fog with subtle pattern
          return (
            <div
              key={`fog-${x}-${y}`}
              className="absolute transition-all duration-500"
              style={{
                left: x * (tileSize + gapAdjust),
                top: y * (tileSize + gapAdjust),
                width: tileSize,
                height: tileSize,
                background: `
                  linear-gradient(135deg,
                    rgba(51,65,85,0.95) 0%,
                    rgba(30,41,59,0.98) 50%,
                    rgba(15,23,42,0.95) 100%
                  )
                `,
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
              }}
            >
              {/* Subtle fog pattern */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `radial-gradient(circle at 30% 30%, rgba(100,116,139,0.3) 0%, transparent 50%),
                                   radial-gradient(circle at 70% 70%, rgba(71,85,105,0.2) 0%, transparent 40%)`
                }}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
