import { Shield, Footprints, Sparkles, Heart, Eye, Zap } from 'lucide-react';
import { TERRAIN, TERRAIN_PROPS } from '../constants/terrain';
import type { TerrainType } from '../types/game';

interface TerrainInfoPanelProps {
  terrain: TerrainType;
  onClose: () => void;
}

// Terrain type to visual style mapping
const TERRAIN_STYLES: Record<number, { gradient: string; border: string; icon: string }> = {
  [TERRAIN.GRASS]: {
    gradient: 'from-lime-500 to-green-600',
    border: 'border-green-400',
    icon: '🌿'
  },
  [TERRAIN.TALL_GRASS]: {
    gradient: 'from-green-500 to-emerald-600',
    border: 'border-emerald-400',
    icon: '🌾'
  },
  [TERRAIN.FOREST]: {
    gradient: 'from-emerald-600 to-green-800',
    border: 'border-emerald-500',
    icon: '🌲'
  },
  [TERRAIN.WATER]: {
    gradient: 'from-cyan-400 to-blue-500',
    border: 'border-cyan-400',
    icon: '💧'
  },
  [TERRAIN.MOUNTAIN]: {
    gradient: 'from-amber-500 to-stone-600',
    border: 'border-amber-400',
    icon: '⛰️'
  },
  [TERRAIN.POKEMON_CENTER]: {
    gradient: 'from-rose-400 to-pink-500',
    border: 'border-pink-400',
    icon: '🏥'
  },
  [TERRAIN.BASE]: {
    gradient: 'from-slate-500 to-slate-600',
    border: 'border-slate-400',
    icon: '🏠'
  }
};

export function TerrainInfoPanel({ terrain, onClose }: TerrainInfoPanelProps) {
  const props = TERRAIN_PROPS[terrain];
  const style = TERRAIN_STYLES[terrain] || TERRAIN_STYLES[TERRAIN.GRASS];

  if (!props) return null;

  const isImpassable = props.moveCost >= 99;
  const hasCapture = props.capture;
  const hasHeal = props.heals;
  const hasVisionBonus = (props as any).visionBonus;

  return (
    <div
      className="absolute bottom-2 left-2 right-2 z-40 animate-slide-up"
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`
        relative overflow-hidden
        bg-slate-950/95 backdrop-blur-xl rounded-xl
        border-2 ${style.border} shadow-2xl
      `}>
        {/* Colored header bar */}
        <div className={`h-1 bg-gradient-to-r ${style.gradient}`} />

        <div className="p-3">
          <div className="flex items-start gap-3">
            {/* Terrain icon tile */}
            <div className={`
              w-12 h-12 rounded-lg flex-shrink-0
              bg-gradient-to-br ${style.gradient}
              border-b-[4px] border-black/30
              flex items-center justify-center text-xl
              shadow-lg
            `}>
              {style.icon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">{props.name}</h3>
                <button
                  onClick={onClose}
                  className="text-slate-500 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-2 mt-2">
                {/* Defense */}
                <div className={`
                  flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold
                  ${props.def > 0 ? 'bg-emerald-900/80 text-emerald-400' : 'bg-slate-800 text-slate-500'}
                `}>
                  <Shield className="w-3 h-3" />
                  <span>{props.def > 0 ? `+${props.def}%` : '0%'}</span>
                </div>

                {/* Movement cost */}
                <div className={`
                  flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold
                  ${isImpassable ? 'bg-red-900/80 text-red-400' : props.moveCost > 1 ? 'bg-amber-900/80 text-amber-400' : 'bg-slate-800 text-slate-400'}
                `}>
                  <Footprints className="w-3 h-3" />
                  <span>{isImpassable ? 'Bloqueado' : `MOV ${props.moveCost}`}</span>
                </div>

                {/* Special: Vision bonus */}
                {hasVisionBonus && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-purple-900/80 text-purple-400">
                    <Eye className="w-3 h-3" />
                    <span>+{hasVisionBonus} visión</span>
                  </div>
                )}

                {/* Special: Capture */}
                {hasCapture && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-yellow-900/80 text-yellow-400">
                    <Sparkles className="w-3 h-3" />
                    <span>Captura</span>
                  </div>
                )}

                {/* Special: Heals */}
                {hasHeal && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-pink-900/80 text-pink-400">
                    <Heart className="w-3 h-3" />
                    <span>+20% HP/turno</span>
                  </div>
                )}

                {/* Type bonus */}
                {props.typeBonus && props.typeBonus.length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-orange-900/80 text-orange-400">
                    <Zap className="w-3 h-3" />
                    <span>+25% ATK: {props.typeBonus.slice(0, 2).join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
