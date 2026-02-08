import { Undo2, Home, Zap, Coins } from 'lucide-react';
import {
  SHOWDOWN_SERVICE_ITEMS,
  calculateDeployCost,
  getShowdownItemIconUrl
} from '@poketactics/shared';
import { TYPE_COLORS } from '../constants/types';
import type { PokemonTemplate, Player } from '../types/game';

interface BaseDeploySelectorProps {
  player: Player;
  reserve: PokemonTemplate[];
  credits: number;
  onDeploy: (templateId: number) => void;
  onCancel: () => void;
}

export function BaseDeploySelector({ player, reserve, credits, onDeploy, onCancel }: BaseDeploySelectorProps) {
  const creditIcon = getShowdownItemIconUrl(SHOWDOWN_SERVICE_ITEMS.credits.id);
  const deployIcon = getShowdownItemIconUrl(SHOWDOWN_SERVICE_ITEMS.deploy.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/68 backdrop-blur-sm">
      <div className="relative w-[390px] max-w-[95vw] rounded-sm border-[3px] border-amber-900 bg-gradient-to-b from-[#f3e7c7] to-[#e2d1a9] shadow-[0_16px_36px_rgba(0,0,0,0.74)] overflow-hidden">
        <div className="absolute inset-[2px] border border-amber-300/85 rounded-[2px] pointer-events-none" />

        <div className="px-4 py-3 border-b-2 border-amber-900 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-amber-200" />
            <span className="text-xs font-bold uppercase tracking-wide text-amber-100">Base · Desplegar</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-1 rounded border ${player === 'P1' ? 'bg-sky-950/85 border-sky-500/45 text-sky-200' : 'bg-rose-950/85 border-rose-500/45 text-rose-200'}`}>
              {player}
            </span>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-[#16272b]/90 border border-amber-500/40">
              <img src={creditIcon} alt="credit" className="w-3.5 h-3.5 object-contain" />
              <span className="text-[10px] font-mono text-amber-200">{credits}</span>
            </div>
          </div>
        </div>

        <div className="p-2 max-h-[55vh] overflow-y-auto space-y-1.5">
          {reserve.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-slate-600">
              No hay Pokémon en la base.
            </div>
          )}

          {reserve.map((pokemon, i) => {
            const deployCost = calculateDeployCost(pokemon);
            const canAfford = credits >= deployCost;

            return (
              <button
                key={`${pokemon.id}-${i}`}
                onClick={() => canAfford && onDeploy(pokemon.id)}
                disabled={!canAfford}
                className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                  canAfford
                    ? 'border-amber-700/80 bg-[#16272b]/92 hover:bg-[#1c3136]'
                    : 'border-stone-700/70 bg-[#1a2528]/74 opacity-55 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2">
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.id}.gif`}
                    className="w-9 h-9 object-contain"
                    style={{ imageRendering: 'pixelated' }}
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-amber-100 truncate">{pokemon.name}</div>
                    <div className="flex gap-1 mt-0.5">
                      {pokemon.types.map(type => (
                        <span key={type} className={`text-[8px] px-1 py-0.5 rounded text-white font-bold ${TYPE_COLORS[type]}`}>
                          {type.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-right">
                    <div className="text-amber-100/70">HP {pokemon.hp}</div>
                    <div className="flex items-center justify-end gap-1 text-amber-100/70"><Zap className="w-3 h-3" /> MOV {pokemon.mov}</div>
                    <div className={`flex items-center justify-end gap-1 mt-0.5 ${canAfford ? 'text-amber-300' : 'text-red-300'}`}>
                      <img src={deployIcon} alt="deploy" className="w-3 h-3 object-contain" />
                      <span>{deployCost}</span>
                    </div>
                  </div>
                </div>
                {!canAfford && (
                  <div className="mt-1.5 text-[10px] text-red-300 flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    Créditos insuficientes
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-2 border-t border-amber-900/45">
          <button
            onClick={onCancel}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wide rounded-sm bg-gradient-to-b from-stone-100 to-stone-200 hover:from-stone-50 hover:to-stone-100 border-[2px] border-b-[3px] border-stone-500/80 text-stone-700 active:translate-y-[1px] active:border-b-[2px]"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
