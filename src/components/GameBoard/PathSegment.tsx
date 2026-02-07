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
 * SVG coordinate space: viewBox="0 0 100 100"
 *   Center: (50, 50)
 *   Line strokeWidth: 18 (half-width = 9)
 *   Arrow base: 32 wide (proportional to line)
 *   Gap bridge extension: 25 units beyond tile edges
 *
 * Segment types:
 * - START: Circle at origin + line toward next tile
 * - MIDDLE: Straight lines or smooth curves at corners
 * - END: Clean triangular arrow pointing in travel direction
 */

// Helper to get extended path for start point
const getExtendedPath = (dir: Direction, ext: number): string => {
  if (dir === 'up') return `M 50 50 L 50 ${-ext}`;
  if (dir === 'down') return `M 50 50 L 50 ${100 + ext}`;
  if (dir === 'left') return `M 50 50 L ${-ext} 50`;
  if (dir === 'right') return `M 50 50 L ${100 + ext} 50`;
  return '';
};

// Direction-aware animation style for arrow tip
const getArrowAnimation = (dir: Direction): React.CSSProperties => {
  const base: React.CSSProperties = { animationDuration: '1.2s', animationIterationCount: 'infinite', animationTimingFunction: 'ease-in-out' };
  switch (dir) {
    case 'up': return { ...base, animationName: 'arrow-nudge-up' };
    case 'down': return { ...base, animationName: 'arrow-nudge-down' };
    case 'left': return { ...base, animationName: 'arrow-nudge-left' };
    case 'right': return { ...base, animationName: 'arrow-nudge-right' };
    default: return { ...base, animationName: 'arrow-nudge-down' };
  }
};

// Get the travel direction (opposite of 'from')
const getTravelDir = (from: Direction): Direction => {
  if (from === 'up') return 'down';
  if (from === 'down') return 'up';
  if (from === 'left') return 'right';
  if (from === 'right') return 'left';
  return 'down';
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

  // Visual style
  const stroke = 'rgba(239, 68, 68, 0.9)';
  const strokeWidth = '18';
  const glow = 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.6))';

  // Extension to bridge gaps between tiles
  const EXT = 25;
  const R = 25; // Curve radius

  // Arrow dimensions — proportional to line width
  // Line is 18 wide, arrow base is 32 wide (clean visual step-up)
  const AW = 16; // arrow half-width (total = 32)
  const AL = 34; // arrow length from base to tip

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

  // 2. END POINT (Arrow) - Clean triangle pointing in travel direction
  if (prev && !next) {
    let linePath = '';
    let arrowPath = '';
    const travelDir = getTravelDir(from);

    // Line connects from previous tile edge to arrow base.
    // Arrow base overlaps line end by a few units for seamless join.
    if (from === 'up') {
      // Traveling DOWN
      const arrowBase = 40;
      const arrowTip = arrowBase + AL;
      linePath = `M 50 ${-EXT} L 50 ${arrowBase}`;
      arrowPath = `M ${50 - AW} ${arrowBase - 4} L 50 ${arrowTip} L ${50 + AW} ${arrowBase - 4} Z`;
    } else if (from === 'down') {
      // Traveling UP
      const arrowBase = 60;
      const arrowTip = arrowBase - AL;
      linePath = `M 50 ${100 + EXT} L 50 ${arrowBase}`;
      arrowPath = `M ${50 - AW} ${arrowBase + 4} L 50 ${arrowTip} L ${50 + AW} ${arrowBase + 4} Z`;
    } else if (from === 'left') {
      // Traveling RIGHT
      const arrowBase = 40;
      const arrowTip = arrowBase + AL;
      linePath = `M ${-EXT} 50 L ${arrowBase} 50`;
      arrowPath = `M ${arrowBase - 4} ${50 - AW} L ${arrowTip} 50 L ${arrowBase - 4} ${50 + AW} Z`;
    } else if (from === 'right') {
      // Traveling LEFT
      const arrowBase = 60;
      const arrowTip = arrowBase - AL;
      linePath = `M ${100 + EXT} 50 L ${arrowBase} 50`;
      arrowPath = `M ${arrowBase + 4} ${50 - AW} L ${arrowTip} 50 L ${arrowBase + 4} ${50 + AW} Z`;
    } else {
      // Fallback: arrow points down
      const arrowBase = 40;
      const arrowTip = arrowBase + AL;
      linePath = `M 50 ${-EXT} L 50 ${arrowBase}`;
      arrowPath = `M ${50 - AW} ${arrowBase - 4} L 50 ${arrowTip} L ${50 + AW} ${arrowBase - 4} Z`;
    }

    return (
      <div className="absolute inset-0 z-20 pointer-events-none overflow-visible">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full overflow-visible"
          style={{ filter: glow, ...getArrowAnimation(travelDir) }}
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
