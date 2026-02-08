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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm">
      <div className="w-[380px] max-w-[95vw] rounded-xl border-2 border-amber-700 bg-slate-950 shadow-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-amber-700/60 bg-gradient-to-r from-amber-800 to-amber-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-amber-200" />
            <span className="text-xs font-bold uppercase tracking-wide text-amber-100">Base · Desplegar</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-1 rounded ${player === 'P1' ? 'bg-blue-800 text-blue-200' : 'bg-red-800 text-red-200'}`}>
              {player}
            </span>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900/80 border border-amber-500/40">
              <img src={creditIcon} alt="credit" className="w-3.5 h-3.5 object-contain" />
              <span className="text-[10px] font-mono text-amber-200">{credits}</span>
            </div>
          </div>
        </div>

        <div className="p-2 max-h-[55vh] overflow-y-auto space-y-1.5">
          {reserve.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-slate-400">
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
                    ? 'border-slate-700 bg-slate-900/90 hover:bg-slate-800'
                    : 'border-slate-800 bg-slate-900/60 opacity-55 cursor-not-allowed'
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
                    <div className="text-sm font-bold text-white truncate">{pokemon.name}</div>
                    <div className="flex gap-1 mt-0.5">
                      {pokemon.types.map(type => (
                        <span key={type} className={`text-[8px] px-1 py-0.5 rounded text-white font-bold ${TYPE_COLORS[type]}`}>
                          {type.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-right">
                    <div className="text-slate-400">HP {pokemon.hp}</div>
                    <div className="flex items-center justify-end gap-1 text-slate-400"><Zap className="w-3 h-3" /> MOV {pokemon.mov}</div>
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

        <div className="p-2 border-t border-slate-800">
          <button
            onClick={onCancel}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wide rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
