import React from 'react';
import { Trees, Mountain, Droplets, Sprout, Cross } from 'lucide-react';
import { TERRAIN, getTileColor } from '../../constants/terrain';
import { getIconSprite } from '../../utils/sprites';
import type { TerrainType, Unit } from '../../types/game';

interface TileProps {
  x: number;
  y: number;
  terrain: TerrainType;
  unit: Unit | undefined;
  isSelected: boolean;
  canMove: boolean;
  canAttack: boolean;
  onClick: () => void;
  isMobile?: boolean;
  isVisible?: boolean;    // Currently in vision range
  isExplored?: boolean;   // Has been seen before
}

export function Tile({
  terrain,
  unit,
  isSelected,
  canMove,
  canAttack,
  onClick,
  isMobile = false,
  isVisible = true,
  isExplored = true
}: TileProps) {
  // Fog state: unexplored = dark gray, explored but not visible = desaturated
  const isInFog = !isVisible;
  const isUnexplored = !isExplored;
  // Icon sizes based on mobile/desktop
  const iconSize = isMobile ? 'w-5 h-5' : 'w-8 h-8';
  const sproutSize = isMobile ? 16 : 24;

  return (
    <div
      onClick={onClick}
      onTouchEnd={(e) => {
        // Prevent double-tap zoom on mobile
        e.preventDefault();
        onClick();
      }}
      className={`
        aspect-square rounded-md border-b-2 relative cursor-pointer
        transition-all duration-200 overflow-hidden
        ${getTileColor(terrain)}
        ${canMove ? 'ring-2 ring-blue-400/70 z-10 scale-[0.94] shadow-md shadow-blue-500/20' : ''}
        ${canAttack ? 'ring-2 ring-red-500/80 z-10 scale-[0.94] bg-red-900/50 shadow-md shadow-red-500/30' : ''}
        ${isSelected ? 'ring-2 ring-white z-20 scale-[0.96]' : ''}
        ${isMobile ? 'active:scale-90 active:brightness-125' : 'hover:brightness-110'}
        ${isUnexplored ? 'grayscale brightness-[0.3]' : isInFog ? 'grayscale-[70%] brightness-[0.6]' : ''}
      `}
    >
      {/* Terrain icons */}
      {terrain === TERRAIN.FOREST && (
        <Trees className={`absolute inset-0 m-auto text-emerald-900 opacity-40 ${iconSize} pointer-events-none`} />
      )}
      {terrain === TERRAIN.MOUNTAIN && (
        <Mountain className={`absolute inset-0 m-auto text-stone-800 opacity-40 ${iconSize} pointer-events-none`} />
      )}
      {terrain === TERRAIN.WATER && (
        <Droplets className={`absolute inset-0 m-auto text-blue-800 opacity-30 ${isMobile ? 'w-4 h-4' : 'w-6 h-6'} pointer-events-none`} />
      )}
      {terrain === TERRAIN.TALL_GRASS && (
        <div className="absolute inset-0 flex items-center justify-center opacity-40">
          <Sprout size={sproutSize} className="text-teal-900 animate-pulse" />
        </div>
      )}
      {terrain === TERRAIN.POKEMON_CENTER && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`bg-white rounded-lg ${isMobile ? 'w-5 h-5' : 'w-7 h-7'} flex items-center justify-center shadow-md`}>
            <Cross className={`text-red-500 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Move indicator - animated gradient */}
      {canMove && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-blue-400/25 animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-400/40 to-transparent" />
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50"
            style={{ animation: 'bounce 1s infinite' }}
          />
        </div>
      )}

      {/* Attack indicator - danger pulse */}
      {canAttack && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-red-500/25 animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-t from-red-500/40 to-transparent" />
          <div className="absolute inset-0 border-2 border-red-500/50 rounded-md animate-ping opacity-30" />
        </div>
      )}

      {/* Unit */}
      {unit && (
        <div className={`
          absolute inset-0 flex items-center justify-center z-20
          transition-all duration-200
          ${unit.hasMoved ? 'grayscale opacity-50 scale-90' : ''}
        `}>
          {/* Unit sprite with glow */}
          <div className={`
            relative w-[85%] h-[85%]
            ${isSelected ? 'animate-bounce' : ''}
            ${!unit.hasMoved ? 'drop-shadow-lg' : 'drop-shadow-sm'}
          `}>
            {/* Glow behind unit */}
            {!unit.hasMoved && (
              <div className={`
                absolute inset-0 rounded-full blur-md opacity-40
                ${unit.owner === 'P1' ? 'bg-blue-500' : 'bg-red-500'}
              `} />
            )}
            <img
              src={getIconSprite(unit.template.id)}
              className={`
                relative w-full h-full object-contain
                ${unit.owner === 'P1' ? 'scale-x-[-1]' : ''}
              `}
              style={{ imageRendering: 'pixelated' }}
              draggable="false"
              alt={unit.template.name}
            />
          </div>

          {/* HP bar - sleeker design */}
          <div className={`
            absolute top-0.5 ${isMobile ? 'w-7' : 'w-9'} h-1.5
            bg-black/60 rounded-full overflow-hidden
            border border-white/10 shadow-inner
          `}>
            <div
              className={`
                h-full transition-all duration-500 ease-out
                ${unit.currentHp / unit.template.hp > 0.5
                  ? unit.owner === 'P1' ? 'bg-gradient-to-r from-blue-400 to-cyan-400' : 'bg-gradient-to-r from-red-500 to-orange-400'
                  : unit.currentHp / unit.template.hp > 0.25
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                  : 'bg-gradient-to-r from-red-600 to-red-500 animate-pulse'
                }
              `}
              style={{ width: `${(unit.currentHp / unit.template.hp) * 100}%` }}
            />
          </div>

          {/* Owner indicator - subtle bottom glow */}
          <div className={`
            absolute -bottom-0.5 ${isMobile ? 'w-4' : 'w-5'} h-1
            rounded-full opacity-70
            ${unit.owner === 'P1' ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'}
          `} />
        </div>
      )}
    </div>
  );
}
