import type { VisibilityMap } from '../../types/game';

interface FogOverlayProps {
  visibility: VisibilityMap;
  tileSize: number;
}

export function FogOverlay({ visibility, tileSize }: FogOverlayProps) {
  const { visible, explored } = visibility;

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {explored.map((row, y) =>
        row.map((isExplored, x) => {
          const isVisible = visible[y][x];

          // Fully visible - no fog
          if (isVisible) {
            return null;
          }

          // Explored but not visible - semi-transparent fog
          if (isExplored) {
            return (
              <div
                key={`fog-${x}-${y}`}
                className="absolute bg-slate-900/60 transition-opacity duration-300"
                style={{
                  left: x * tileSize,
                  top: y * tileSize,
                  width: tileSize,
                  height: tileSize
                }}
              />
            );
          }

          // Never explored - full black fog
          return (
            <div
              key={`fog-${x}-${y}`}
              className="absolute bg-black transition-opacity duration-500"
              style={{
                left: x * tileSize,
                top: y * tileSize,
                width: tileSize,
                height: tileSize
              }}
            />
          );
        })
      )}
    </div>
  );
}
