import { Shield, Footprints, Sparkles, Heart, Eye, Zap } from 'lucide-react';
import { TERRAIN, TERRAIN_PROPS } from '../constants/terrain';
import {
  BASE_TURN_INCOME,
  CENTER_REPAIR_COST_PER_HP,
  CENTER_RESUPPLY_COST_PER_PP,
  CENTER_STATUS_CURE_COST,
  getShowdownItemIconUrl,
  getTerrainEconomyEntity
} from '@poketactics/shared';
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
  },
  [TERRAIN.SAND]: {
    gradient: 'from-yellow-400 to-amber-500',
    border: 'border-yellow-400',
    icon: '🏜️'
  },
  [TERRAIN.BRIDGE]: {
    gradient: 'from-amber-500 to-amber-700',
    border: 'border-amber-400',
    icon: '🌉'
  },
  [TERRAIN.BERRY_BUSH]: {
    gradient: 'from-fuchsia-400 to-green-500',
    border: 'border-fuchsia-400',
    icon: '🫐'
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
  const isConsumable = props.consumable;
  const economyEntity = getTerrainEconomyEntity(terrain);

  return (
    <div
      className="absolute bottom-2 left-2 right-2 z-40 animate-slide-up cursor-pointer"
      onClick={onClose}
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
                <span className="text-slate-600 text-[10px]">Toca para cerrar</span>
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
                    <span>Servicio con coste</span>
                  </div>
                )}

                {/* Special: Consumable (Berry Bush) */}
                {isConsumable && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-fuchsia-900/80 text-fuchsia-400">
                    <Heart className="w-3 h-3" />
                    <span>+10% HP (1 uso)</span>
                  </div>
                )}

                {/* Type bonus */}
                {props.typeBonus && props.typeBonus.length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-orange-900/80 text-orange-400">
                    <Zap className="w-3 h-3" />
                    <span>+25% ATK: {props.typeBonus.slice(0, 2).join(', ')}</span>
                  </div>
                )}

                {economyEntity && (
                  <div className="w-full mt-1 p-2 rounded-md border border-amber-500/30 bg-amber-950/20">
                    <div className="flex items-center gap-2">
                      <img src={getShowdownItemIconUrl(economyEntity.primaryItemId)} alt="" className="w-4 h-4 object-contain" />
                      {economyEntity.secondaryItemId && (
                        <img src={getShowdownItemIconUrl(economyEntity.secondaryItemId)} alt="" className="w-4 h-4 object-contain" />
                      )}
                      <span className="text-[10px] font-bold text-amber-300">{economyEntity.label}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-amber-100/80">
                      {economyEntity.description}
                    </div>
                    {terrain === TERRAIN.POKEMON_CENTER && (
                      <div className="mt-1 text-[10px] text-amber-200/80">
                        Reparar: {CENTER_REPAIR_COST_PER_HP} c/HP · PP: {CENTER_RESUPPLY_COST_PER_PP} c/PP · Estado: {CENTER_STATUS_CURE_COST}
                      </div>
                    )}
                    {terrain === TERRAIN.BASE && (
                      <div className="mt-1 text-[10px] text-amber-200/80">
                        Ingreso fijo por turno: +{BASE_TURN_INCOME}
                      </div>
                    )}
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
