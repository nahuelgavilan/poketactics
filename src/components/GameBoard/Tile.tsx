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
const TERRAIN_THEME: Record<number, {
  gradient: string;
  border: string;
  overlay?: boolean;
  texture?: 'grid' | 'stripes' | 'dots';
}> = {
  [TERRAIN.GRASS]: {
    gradient: 'from-green-500 to-emerald-600',
    border: 'border-emerald-800',
    texture: 'grid',
  },
  [TERRAIN.FOREST]: {
    gradient: 'from-emerald-700 to-teal-900',
    border: 'border-teal-950',
    overlay: true,
  },
  [TERRAIN.WATER]: {
    gradient: 'from-blue-400 to-indigo-600',
    border: 'border-indigo-900',
  },
  [TERRAIN.MOUNTAIN]: {
    gradient: 'from-stone-400 to-stone-600',
    border: 'border-stone-800',
  },
  [TERRAIN.TALL_GRASS]: {
    gradient: 'from-green-400 to-emerald-500',
    border: 'border-emerald-700',
    texture: 'stripes',
  },
  [TERRAIN.POKEMON_CENTER]: {
    gradient: 'from-pink-400 to-rose-500',
    border: 'border-rose-700',
  },
  [TERRAIN.BASE]: {
    gradient: 'from-slate-400 to-slate-600',
    border: 'border-slate-800',
    texture: 'dots',
  },
};

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
        {/* Texture overlay */}
        {theme.texture === 'grid' && (
          <div className="absolute inset-0 opacity-10 rounded-xl bg-[repeating-linear-gradient(0deg,transparent,transparent_4px,rgba(255,255,255,0.3)_4px,rgba(255,255,255,0.3)_5px),repeating-linear-gradient(90deg,transparent,transparent_4px,rgba(255,255,255,0.3)_4px,rgba(255,255,255,0.3)_5px)]" />
        )}
        {theme.texture === 'stripes' && (
          <div className="absolute inset-0 opacity-15 rounded-xl bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,60,30,0.4)_3px,rgba(0,60,30,0.4)_5px)]" />
        )}
        {theme.texture === 'dots' && (
          <div className="absolute inset-0 opacity-10 rounded-xl bg-[radial-gradient(circle,rgba(255,255,255,0.3)_1px,transparent_1px)] bg-[length:8px_8px]" />
        )}

        {/* Dark overlay for forest */}
        {theme.overlay && (
          <div className="absolute inset-0 bg-black/20 rounded-xl" />
        )}

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

        {/* === PATH SEGMENT === */}
        {path.length > 0 && <PathSegment x={x} y={y} path={path} />}
      </div>

      {/* === POKEMON UNIT === */}
      {unit && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          {/* Selection ping effect */}
          {isSelected && (
            <div className="absolute w-full h-full border-4 border-white/40 rounded-2xl animate-ping opacity-30" />
          )}

          <div className={`
            relative w-[90%] h-[90%] transition-transform duration-300
            ${isSelected ? 'scale-110 -translate-y-3' : ''}
            ${unit.hasMoved ? 'opacity-40 saturate-0' : ''}
          `}>
            {/* Pokemon sprite */}
            <img
              src={getIconSprite(unit.template.id)}
              className={`
                w-full h-full object-contain
                ${unit.owner === 'P1' ? 'scale-x-[-1]' : ''}
                drop-shadow-lg
              `}
              style={{ imageRendering: 'pixelated' }}
              draggable="false"
              alt={unit.template.name}
            />

            {/* HP Bar */}
            <div className={`
              absolute -top-1 left-1/2 -translate-x-1/2
              ${isMobile ? 'w-10' : 'w-10'} h-1.5
              bg-slate-900 rounded-full overflow-hidden
              border border-white/20 shadow-sm
            `}>
              <div
                className={`h-full transition-all duration-300 ${
                  unit.currentHp / unit.template.hp > 0.5
                    ? 'bg-green-400'
                    : unit.currentHp / unit.template.hp > 0.25
                    ? 'bg-yellow-400'
                    : 'bg-red-500 animate-pulse'
                }`}
                style={{ width: `${(unit.currentHp / unit.template.hp) * 100}%` }}
              />
            </div>

            {/* Player indicator badge */}
            <div className={`
              absolute bottom-0 right-1 w-3 h-3 rounded-full
              border border-slate-900
              ${unit.owner === 'P1' ? 'bg-blue-500' : 'bg-red-500'}
            `} />
          </div>
        </div>
      )}
    </div>
  );
}
