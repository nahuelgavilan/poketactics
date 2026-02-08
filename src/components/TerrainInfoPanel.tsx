import { Shield, Footprints, Sparkles, Heart, Eye, Zap } from 'lucide-react';
import { TERRAIN, TERRAIN_PROPS } from '../constants/terrain';
import {
  BASE_TURN_INCOME,
  CENTER_REPAIR_COST_PER_HP,
  CENTER_RESUPPLY_COST_PER_PP,
  CENTER_STATUS_CURE_COST,
  POKEMART_MAX_POTION_COST,
  POKEMART_ELIXIR_COST,
  POKEMART_FULL_HEAL_COST,
  getShowdownItemIconUrl,
  getTerrainEconomyEntity
} from '@poketactics/shared';
import type { TerrainType, Player } from '../types/game';

interface TerrainInfoPanelProps {
  terrain: TerrainType;
  centerOwner?: Player | null;
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

export function TerrainInfoPanel({ terrain, centerOwner = null, onClose }: TerrainInfoPanelProps) {
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
        bg-[#f8efd9]/95 rounded-sm
        border-[3px] border-amber-800/70 shadow-[3px_3px_0_0_rgba(92,66,34,0.22)]
      `}>
        <div className="absolute inset-[2px] border border-amber-300/40 rounded-[2px] pointer-events-none" />
        {/* Colored header bar */}
        <div className={`h-1.5 bg-gradient-to-r ${style.gradient}`} />

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
                <h3 className="text-[10px] uppercase tracking-[0.12em] text-amber-900" style={{ fontFamily: '"Press Start 2P", monospace' }}>{props.name}</h3>
                <span className="text-slate-600 text-[11px] font-ui">Toca para cerrar</span>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-2 mt-2">
                {/* Defense */}
                <div className={`
                  flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold
                  ${props.def > 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-500/35' : 'bg-[#f1e3c4] text-slate-600 border border-amber-700/25'}
                `}>
                  <Shield className="w-3 h-3" />
                  <span>{props.def > 0 ? `+${props.def}%` : '0%'}</span>
                </div>

                {/* Movement cost */}
                <div className={`
                  flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold
                  ${isImpassable ? 'bg-rose-100 text-rose-800 border border-rose-500/35' : props.moveCost > 1 ? 'bg-amber-100 text-amber-900 border border-amber-500/35' : 'bg-[#f1e3c4] text-slate-700 border border-amber-700/25'}
                `}>
                  <Footprints className="w-3 h-3" />
                  <span>{isImpassable ? 'Bloqueado' : `MOV ${props.moveCost}`}</span>
                </div>

                {/* Special: Vision bonus */}
                {hasVisionBonus && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-500/35">
                    <Eye className="w-3 h-3" />
                    <span>+{hasVisionBonus} visión</span>
                  </div>
                )}

                {/* Special: Capture */}
                {hasCapture && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-yellow-100 text-yellow-800 border border-yellow-500/35">
                    <Sparkles className="w-3 h-3" />
                    <span>Captura</span>
                  </div>
                )}

                {/* Special: Heals */}
                {hasHeal && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-pink-100 text-pink-800 border border-pink-500/35">
                    <Heart className="w-3 h-3" />
                    <span>Servicio con coste</span>
                  </div>
                )}

                {/* Special: Consumable (Berry Bush) */}
                {isConsumable && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-500/35">
                    <Heart className="w-3 h-3" />
                    <span>+10% HP (1 uso)</span>
                  </div>
                )}

                {/* Type bonus */}
                {props.typeBonus && props.typeBonus.length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-500/35">
                    <Zap className="w-3 h-3" />
                    <span>+25% ATK: {props.typeBonus.slice(0, 2).join(', ')}</span>
                  </div>
                )}

                {economyEntity && (
                  <div className="w-full mt-1 p-2 rounded-md border border-amber-500/30 bg-[#f2e4c6]">
                    <div className="flex items-center gap-2">
                      <img src={getShowdownItemIconUrl(economyEntity.primaryItemId)} alt="" className="w-4 h-4 object-contain" />
                      {economyEntity.secondaryItemId && (
                        <img src={getShowdownItemIconUrl(economyEntity.secondaryItemId)} alt="" className="w-4 h-4 object-contain" />
                      )}
                      <span className="text-[10px] font-bold text-amber-900">{economyEntity.label}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-slate-700">
                      {economyEntity.description}
                    </div>
                    {terrain === TERRAIN.POKEMON_CENTER && (
                      <>
                        <div className="mt-1 text-[10px] text-slate-700">
                          Reparar: {CENTER_REPAIR_COST_PER_HP} c/HP · PP: {CENTER_RESUPPLY_COST_PER_PP} c/PP · Estado: {CENTER_STATUS_CURE_COST}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-700">
                          Propiedad: {centerOwner ? `Jugador ${centerOwner === 'P1' ? '1' : '2'}` : 'Neutral (se captura con Esperar)'}
                        </div>
                      </>
                    )}
                    {terrain === TERRAIN.BASE && (
                      <div className="mt-1 text-[10px] text-slate-700">
                        Ingreso fijo por turno: +{BASE_TURN_INCOME}
                      </div>
                    )}
                    {terrain === TERRAIN.RUINS && (
                      <div className="mt-1 text-[10px] text-slate-700">
                        Max Potion: {POKEMART_MAX_POTION_COST} · Elixir: {POKEMART_ELIXIR_COST} · Full Heal: {POKEMART_FULL_HEAL_COST}
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
