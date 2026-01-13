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
        aspect-square rounded-lg border-b-4 relative cursor-pointer
        transition-all duration-300 overflow-hidden
        ${getTileColor(terrain)}
        ${canMove ? 'ring-[3px] ring-blue-400/70 z-10 scale-[0.92] shadow-lg shadow-blue-500/20' : ''}
        ${canAttack ? 'ring-[3px] ring-red-500/80 z-10 scale-[0.92] bg-red-900/50 shadow-lg shadow-red-500/30' : ''}
        ${isSelected ? 'ring-2 ring-white z-20 scale-[0.95]' : ''}
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

      {/* Move indicator pulse */}
      {canMove && (
        <div className="absolute inset-0 bg-blue-400/20 animate-pulse pointer-events-none" />
      )}

      {/* Attack indicator pulse */}
      {canAttack && (
        <div className="absolute inset-0 bg-red-500/20 animate-pulse pointer-events-none" />
      )}

      {/* Unit */}
      {unit && (
        <div className={`absolute inset-0 flex items-center justify-center z-20 ${unit.hasMoved ? 'grayscale opacity-60' : ''}`}>
          <img
            src={getIconSprite(unit.template.id)}
            className={`
              w-[85%] h-[85%] object-contain drop-shadow-md
              ${unit.owner === 'P1' ? 'scale-x-[-1]' : ''}
              ${isSelected ? 'animate-bounce' : ''}
            `}
            style={{ imageRendering: 'pixelated' }}
            draggable="false"
            alt={unit.template.name}
          />
          {/* HP bar */}
          <div className={`absolute top-0.5 ${isMobile ? 'w-6' : 'w-8'} h-1 bg-black/50 rounded-full overflow-hidden backdrop-blur-sm`}>
            <div
              className={`h-full transition-all duration-300 ${
                unit.currentHp / unit.template.hp > 0.5
                  ? unit.owner === 'P1' ? 'bg-blue-400' : 'bg-red-500'
                  : unit.currentHp / unit.template.hp > 0.25
                  ? 'bg-yellow-400'
                  : 'bg-red-600 animate-pulse'
              }`}
              style={{ width: `${(unit.currentHp / unit.template.hp) * 100}%` }}
            />
          </div>
          {/* Owner indicator glow */}
          <div className={`absolute -bottom-0.5 ${isMobile ? 'w-3' : 'w-4'} h-1.5 rounded-full blur-[2px] ${unit.owner === 'P1' ? 'bg-blue-500' : 'bg-red-500'}`} />
        </div>
      )}
    </div>
  );
}
