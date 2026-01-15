import React from 'react';
import { TERRAIN } from '../../constants/terrain';
import { getIconSprite } from '../../utils/sprites';
import { PathSegment } from './PathSegment';
import type { TerrainType, Unit, Position } from '../../types/game';

interface TileProps {
  x: number;
  y: number;
  terrain: TerrainType;
  unit: Unit | undefined;
  isSelected: boolean;
  canMove: boolean;
  canAttack: boolean;
  onClick: () => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
  isMobile?: boolean;
  isVisible?: boolean;
  isExplored?: boolean;
  path?: Position[];
}

/*
 * PokéTactics Design System - 3D Nintendo-Quality Tiles
 * Based on Advance Wars / Fire Emblem visual style
 *
 * Features:
 * - 3D raised effect with border-b
 * - Tailwind gradients for terrain
 * - Path tiles lift up when hovered
 * - Clean rounded-2xl corners
 */

// Terrain theme configuration - Tailwind classes for 3D tiles
// Each terrain has a unique visual identity through color + texture + decorations
const TERRAIN_THEME: Record<number, {
  gradient: string;
  border: string;
  texture?: 'plains' | 'tallgrass' | 'forest' | 'water' | 'mountain' | 'pokecenter' | 'base';
}> = {
  [TERRAIN.GRASS]: {
    gradient: 'from-lime-400 to-green-500',
    border: 'border-green-700',
    texture: 'plains',
  },
  [TERRAIN.FOREST]: {
    gradient: 'from-emerald-600 to-green-800',
    border: 'border-green-950',
    texture: 'forest',
  },
  [TERRAIN.WATER]: {
    gradient: 'from-cyan-400 to-blue-500',
    border: 'border-blue-700',
    texture: 'water',
  },
  [TERRAIN.MOUNTAIN]: {
    gradient: 'from-amber-600 to-stone-500',
    border: 'border-stone-700',
    texture: 'mountain',
  },
  [TERRAIN.TALL_GRASS]: {
    gradient: 'from-green-500 to-emerald-600',
    border: 'border-emerald-800',
    texture: 'tallgrass',
  },
  [TERRAIN.POKEMON_CENTER]: {
    gradient: 'from-rose-300 to-pink-400',
    border: 'border-pink-600',
    texture: 'pokecenter',
  },
  [TERRAIN.BASE]: {
    gradient: 'from-slate-400 to-slate-500',
    border: 'border-slate-700',
    texture: 'base',
  },
};

// Terrain-specific decorative elements (CSS only, no icons)
function TerrainDecoration({ texture }: { texture?: string }) {
  switch (texture) {
    // Plains: subtle horizontal lines like mowed grass
    case 'plains':
      return (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,transparent,transparent_8px,rgba(255,255,255,0.4)_8px,rgba(255,255,255,0.4)_10px)]" />
        </div>
      );

    // Tall Grass: vertical grass blade shapes
    case 'tallgrass':
      return (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          {/* Dense vertical grass blades */}
          <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_3px,rgba(0,80,0,0.6)_3px,rgba(0,80,0,0.6)_5px)]" />
          {/* Grass tips pattern */}
          <div className="absolute inset-x-0 top-[15%] h-[40%] opacity-40">
            <div className="w-full h-full bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_4px,rgba(34,197,94,0.8)_4px,transparent_6px,transparent_8px)]"
                 style={{ clipPath: 'polygon(0% 100%, 3% 20%, 6% 100%, 9% 30%, 12% 100%, 15% 10%, 18% 100%, 21% 40%, 24% 100%, 27% 20%, 30% 100%, 33% 35%, 36% 100%, 39% 15%, 42% 100%, 45% 45%, 48% 100%, 51% 25%, 54% 100%, 57% 40%, 60% 100%, 63% 20%, 66% 100%, 69% 50%, 72% 100%, 75% 15%, 78% 100%, 81% 35%, 84% 100%, 87% 25%, 90% 100%, 93% 40%, 96% 100%, 100% 30%, 100% 100%)' }} />
          </div>
        </div>
      );

    // Forest: tree canopy circles
    case 'forest':
      return (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          {/* Dark tree shadows */}
          <div className="absolute inset-0 bg-black/20" />
          {/* Tree canopy circles */}
          <div className="absolute inset-0 opacity-40">
            <div className="absolute w-[60%] h-[60%] rounded-full bg-green-900/60 -top-[10%] -left-[10%]" />
            <div className="absolute w-[50%] h-[50%] rounded-full bg-green-900/50 -bottom-[5%] -right-[5%]" />
            <div className="absolute w-[40%] h-[40%] rounded-full bg-green-900/40 top-[30%] right-[20%]" />
          </div>
          {/* Dappled light effect */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.4)_0%,transparent_20%),radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.3)_0%,transparent_15%)]" />
        </div>
      );

    // Water: animated wave pattern
    case 'water':
      return (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          {/* Wave pattern */}
          <div className="absolute inset-0 opacity-30 animate-wave bg-[repeating-linear-gradient(100deg,transparent,transparent_10px,rgba(255,255,255,0.5)_10px,rgba(255,255,255,0.5)_20px,transparent_20px,transparent_30px)]" />
          {/* Shimmer effect */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.6)_0%,transparent_30%)]" />
          {/* Subtle ripples */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,transparent_30%,rgba(255,255,255,0.3)_32%,transparent_34%)]" />
        </div>
      );

    // Mountain: rocky triangle peaks
    case 'mountain':
      return (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          {/* Rocky texture */}
          <div className="absolute inset-0 opacity-20 bg-[repeating-conic-gradient(from_0deg_at_50%_50%,rgba(0,0,0,0.1)_0deg,transparent_30deg,rgba(0,0,0,0.1)_60deg)]" />
          {/* Mountain peaks */}
          <div className="absolute inset-0 opacity-50">
            <div className="absolute bottom-0 left-[10%] w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-stone-600" />
            <div className="absolute bottom-0 left-[35%] w-0 h-0 border-l-[16px] border-r-[16px] border-b-[28px] border-l-transparent border-r-transparent border-b-stone-500" />
            <div className="absolute bottom-0 right-[15%] w-0 h-0 border-l-[10px] border-r-[10px] border-b-[16px] border-l-transparent border-r-transparent border-b-stone-600" />
          </div>
          {/* Snow caps */}
          <div className="absolute inset-0 opacity-60">
            <div className="absolute bottom-[16px] left-[39%] w-0 h-0 border-l-[8px] border-r-[8px] border-b-[10px] border-l-transparent border-r-transparent border-b-white" />
          </div>
        </div>
      );

    // Pokemon Center: healing cross + glow
    case 'pokecenter':
      return (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          {/* Healing glow pulse */}
          <div className="absolute inset-0 animate-heal-pulse bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.4)_0%,transparent_60%)]" />
          {/* Cross pattern */}
          <div className="absolute inset-0 flex items-center justify-center opacity-50">
            <div className="relative w-[50%] h-[50%]">
              {/* Vertical bar */}
              <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[30%] h-full bg-white rounded-sm" />
              {/* Horizontal bar */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-[30%] bg-white rounded-sm" />
            </div>
          </div>
          {/* Soft inner glow */}
          <div className="absolute inset-[20%] rounded-full bg-white/20 blur-sm" />
        </div>
      );

    // Base: tech grid pattern
    case 'base':
      return (
        <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          {/* Tech grid */}
          <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(0deg,transparent,transparent_6px,rgba(255,255,255,0.4)_6px,rgba(255,255,255,0.4)_7px),repeating-linear-gradient(90deg,transparent,transparent_6px,rgba(255,255,255,0.4)_6px,rgba(255,255,255,0.4)_7px)]" />
          {/* Corner markers */}
          <div className="absolute top-[10%] left-[10%] w-[20%] h-[3px] bg-white/30" />
          <div className="absolute top-[10%] left-[10%] w-[3px] h-[20%] bg-white/30" />
          <div className="absolute bottom-[10%] right-[10%] w-[20%] h-[3px] bg-white/30" />
          <div className="absolute bottom-[10%] right-[10%] w-[3px] h-[20%] bg-white/30" />
        </div>
      );

    default:
      return null;
  }
}

export function Tile({
  x,
  y,
  terrain,
  unit,
  isSelected,
  canMove,
  canAttack,
  onClick,
  onHover,
  onHoverEnd,
  isMobile = false,
  isVisible = true,
  isExplored = true,
  path = []
}: TileProps) {
  const isOnPath = path.some(p => p.x === x && p.y === y);
  const isInFog = !isVisible;
  const isUnexplored = !isExplored;
  const theme = TERRAIN_THEME[terrain] || TERRAIN_THEME[TERRAIN.GRASS];

  return (
    <div
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      onTouchEnd={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="relative group cursor-pointer overflow-visible"
    >
      {/* Main tile with 3D effect */}
      <div
        className={`
          relative aspect-square w-full rounded-2xl
          bg-gradient-to-br ${theme.gradient}
          border-b-[6px] ${theme.border}
          shadow-lg transition-all duration-200
          ${isOnPath && !isSelected ? 'translate-y-[-2px] brightness-110' : ''}
          ${!isMobile ? 'hover:brightness-110' : 'active:scale-95'}
          ${isUnexplored ? 'grayscale brightness-[0.15]' : ''}
          ${isInFog && !isUnexplored ? 'brightness-[0.4] saturate-[0.3]' : ''}
          overflow-visible z-10
        `}
      >
        {/* Terrain-specific decoration */}
        <TerrainDecoration texture={theme.texture} />

        {/* Top highlight */}
        <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-white/20 to-transparent rounded-t-xl pointer-events-none" />

        {/* === MOVE INDICATOR === */}
        {canMove && !isSelected && !isOnPath && (
          <div className="absolute inset-0 rounded-xl bg-blue-400/40 border-2 border-blue-300/60 pointer-events-none" />
        )}

        {/* === ATTACK INDICATOR === */}
        {canAttack && (
          <div className="absolute inset-0 rounded-xl bg-red-500/50 border-2 border-red-400/70 pointer-events-none" />
        )}

        {/* === SELECTED INDICATOR === */}
        {isSelected && (
          <div className="absolute inset-0 rounded-xl border-4 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] pointer-events-none" />
        )}
      </div>

      {/* === PATH SEGMENT - Outside main tile to avoid clipping === */}
      {path.length > 0 && <PathSegment x={x} y={y} path={path} />}

      {/* === POKEMON UNIT === */}
      {unit && (
        <div className={`
          absolute inset-0 flex items-center justify-center z-30 pointer-events-none
          transition-transform duration-300
          ${isSelected ? 'scale-110 -translate-y-2 z-40' : ''}
          ${unit.hasMoved ? 'opacity-40 saturate-0' : ''}
        `}>
          {/* Selection ping effect */}
          {isSelected && (
            <div className="absolute inset-0 border-4 border-white/40 rounded-2xl animate-ping opacity-30" />
          )}

          {/* Pokemon sprite - allowed to overflow tile naturally (like Fire Emblem) */}
          <img
            src={getIconSprite(unit.template.id)}
            className={`
              ${unit.owner === 'P1' ? '-scale-x-100' : ''}
              drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]
            `}
            style={{
              imageRendering: 'pixelated',
              width: 'clamp(40px, 120%, 64px)',
              height: 'auto',
            }}
            draggable="false"
            alt={unit.template.name}
          />

          {/* HP Bar - positioned at top of tile */}
          <div className={`
            absolute top-[4%] left-1/2 -translate-x-1/2
            w-[80%] h-1.5 md:h-2
            bg-slate-900/90 rounded-full overflow-hidden
            border border-white/30 shadow-md
          `}>
            <div
              className={`h-full transition-all duration-300 ${
                unit.currentHp / unit.template.hp > 0.5
                  ? 'bg-gradient-to-r from-green-400 to-green-500'
                  : unit.currentHp / unit.template.hp > 0.25
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                  : 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse'
              }`}
              style={{ width: `${(unit.currentHp / unit.template.hp) * 100}%` }}
            />
          </div>

          {/* Player indicator badge */}
          <div className={`
            absolute bottom-[6%] right-[6%] w-5 h-5 md:w-4 md:h-4 rounded-full
            border-2 border-slate-900 shadow-md
            ${unit.owner === 'P1' ? 'bg-blue-500' : 'bg-red-500'}
          `} />
        </div>
      )}
    </div>
  );
}
