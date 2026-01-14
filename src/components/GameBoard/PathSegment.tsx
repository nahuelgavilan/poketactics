import type { Position } from '../../types/game';

interface PathSegmentProps {
  x: number;
  y: number;
  path: Position[];
}

type Direction = 'up' | 'down' | 'left' | 'right' | null;

/**
 * PathSegment - Draws continuous path arrows with gap bridging
 * Based on Fire Emblem / Advance Wars path visualization
 *
 * Features:
 * - START: Circle at origin + line toward next tile
 * - MIDDLE: Straight lines or smooth curves at corners
 * - END: Arrow pointing in travel direction
 * - Gap bridging: Lines extend beyond tile boundaries for seamless connections
 */

// Helper to get extended path for start point
const getExtendedPath = (dir: Direction, ext: number): string => {
  if (dir === 'up') return `M 50 50 L 50 ${-ext}`;
  if (dir === 'down') return `M 50 50 L 50 ${100 + ext}`;
  if (dir === 'left') return `M 50 50 L ${-ext} 50`;
  if (dir === 'right') return `M 50 50 L ${100 + ext} 50`;
  return '';
};

export function PathSegment({ x, y, path }: PathSegmentProps) {
  const index = path.findIndex(p => p.x === x && p.y === y);
  if (index === -1) return null;

  const prev = path[index - 1];
  const next = path[index + 1];
  const curr = path[index];

  // Get relative direction from another node
  const getRel = (node: Position | undefined): Direction => {
    if (!node) return null;
    if (node.x > curr.x) return 'right';
    if (node.x < curr.x) return 'left';
    if (node.y > curr.y) return 'down';
    if (node.y < curr.y) return 'up';
    return null;
  };

  const from = getRel(prev);
  const to = getRel(next);

  // Visual style - RED like the showcase
  const stroke = 'rgba(239, 68, 68, 0.9)';
  const strokeWidth = '18';
  const glow = 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.6))';

  // Extension to bridge gaps between tiles (100 -> 125, 0 -> -25)
  const EXT = 25;
  const R = 25; // Curve radius

  // 1. START POINT (Circle)
  if (!prev && next) {
    return (
      <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center overflow-visible">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" style={{ filter: glow }}>
          <path d={getExtendedPath(to, EXT)} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
          <circle cx="50" cy="50" r="14" fill={stroke} />
        </svg>
      </div>
    );
  }

  // 2. END POINT (Arrow) - Points in travel direction
  if (prev && !next) {
    // Draw arrow directly in the correct direction (no CSS rotation needed)
    // 'from' tells us where we came from, arrow points opposite direction
    let linePath = '';
    let arrowPath = '';

    if (from === 'up') {
      // Came from above → traveling DOWN → arrow points down
      linePath = `M 50 ${-EXT} L 50 35`;
      arrowPath = 'M 25 35 L 50 75 L 75 35 L 50 45 Z';
    } else if (from === 'down') {
      // Came from below → traveling UP → arrow points up
      linePath = `M 50 ${100 + EXT} L 50 65`;
      arrowPath = 'M 25 65 L 50 25 L 75 65 L 50 55 Z';
    } else if (from === 'left') {
      // Came from left → traveling RIGHT → arrow points right
      linePath = `M ${-EXT} 50 L 35 50`;
      arrowPath = 'M 35 25 L 75 50 L 35 75 L 45 50 Z';
    } else if (from === 'right') {
      // Came from right → traveling LEFT → arrow points left
      linePath = `M ${100 + EXT} 50 L 65 50`;
      arrowPath = 'M 65 25 L 25 50 L 65 75 L 55 50 Z';
    } else {
      // Fallback: arrow points down
      linePath = `M 50 ${-EXT} L 50 35`;
      arrowPath = 'M 25 35 L 50 75 L 75 35 L 50 45 Z';
    }

    return (
      <div className="absolute inset-0 z-20 pointer-events-none overflow-visible">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full overflow-visible animate-bounce-subtle"
          style={{ filter: glow }}
        >
          <path d={linePath} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
          <path d={arrowPath} fill={stroke} />
        </svg>
      </div>
    );
  }

  // 3. MIDDLE (Straight line or curved corner)
  if (prev && next) {
    let d = '';

    // Straight lines (extended beyond tile bounds)
    if ((from === 'up' && to === 'down') || (from === 'down' && to === 'up')) {
      d = `M 50 ${-EXT} L 50 ${100 + EXT}`;
    }
    if ((from === 'left' && to === 'right') || (from === 'right' && to === 'left')) {
      d = `M ${-EXT} 50 L ${100 + EXT} 50`;
    }

    // Curved corners with extended straight ends
    // Up <-> Right
    if ((from === 'up' && to === 'right') || (from === 'right' && to === 'up')) {
      d = `M 50 ${-EXT} L 50 ${50 - R} Q 50 50 ${50 + R} 50 L ${100 + EXT} 50`;
    }

    // Up <-> Left
    if ((from === 'up' && to === 'left') || (from === 'left' && to === 'up')) {
      d = `M 50 ${-EXT} L 50 ${50 - R} Q 50 50 ${50 - R} 50 L ${-EXT} 50`;
    }

    // Down <-> Right
    if ((from === 'down' && to === 'right') || (from === 'right' && to === 'down')) {
      d = `M 50 ${100 + EXT} L 50 ${50 + R} Q 50 50 ${50 + R} 50 L ${100 + EXT} 50`;
    }

    // Down <-> Left
    if ((from === 'down' && to === 'left') || (from === 'left' && to === 'down')) {
      d = `M 50 ${100 + EXT} L 50 ${50 + R} Q 50 50 ${50 - R} 50 L ${-EXT} 50`;
    }

    return (
      <div className="absolute inset-0 z-20 pointer-events-none overflow-visible">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" style={{ filter: glow }}>
          <path d={d} stroke={stroke} strokeWidth={strokeWidth} fill="none" strokeLinecap="square" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  return null;
}
