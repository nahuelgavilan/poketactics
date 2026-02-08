import React from 'react';
import {
  Sword,
  Shield,
  Zap,
  Heart,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Mountain,
  X,
  Check
} from 'lucide-react';
import { TYPE_COLORS } from '../constants/types';
import { getTerrainName } from '../constants/terrain';
import type { AttackPreview as AttackPreviewType, GameMap, Move } from '../types/game';

interface AttackPreviewProps {
  preview: AttackPreviewType;
  map: GameMap;
  onConfirm: () => void;
  onCancel: () => void;
}

function EffectivenessLabel({ effectiveness }: { effectiveness: number }) {
  if (effectiveness >= 2) {
    return <span className="text-green-400 text-xs font-bold">×{effectiveness} SUPER EFICAZ</span>;
  }
  if (effectiveness > 1 && effectiveness < 2) {
    return <span className="text-green-300 text-xs font-bold">×{effectiveness.toFixed(1)} Eficaz</span>;
  }
  if (effectiveness < 1 && effectiveness > 0) {
    return <span className="text-orange-400 text-xs font-bold">×{effectiveness} No muy eficaz</span>;
  }
  if (effectiveness === 0) {
    return <span className="text-red-400 text-xs font-bold">INMUNE</span>;
  }
  return null;
}

export function AttackPreview({ preview, map, onConfirm, onCancel }: AttackPreviewProps) {
  const {
    attacker,
    defender,
    move,
    predictedDamage,
    effectiveness,
    isStab,
    accuracy,
    canCounter,
    counterDamage,
    counterEffectiveness,
    counterMove,
    attackerTerrainBonus,
    defenderTerrainBonus,
    critChance
  } = preview;

  const attackerTerrain = map[attacker.y][attacker.x];
  const defenderTerrain = map[defender.y][defender.x];

  // Calculate HP predictions
  const defenderMinHp = Math.max(0, defender.currentHp - predictedDamage.max);
  const defenderMaxHp = Math.max(0, defender.currentHp - predictedDamage.min);
  const willKO = defenderMinHp === 0;

  let attackerMinHp = attacker.currentHp;
  let attackerMaxHp = attacker.currentHp;
  if (canCounter && counterDamage) {
    attackerMinHp = Math.max(0, attacker.currentHp - counterDamage.max);
    attackerMaxHp = Math.max(0, attacker.currentHp - counterDamage.min);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/72 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#f3e7c7] to-[#e1d0a7] rounded-sm border-[3px] border-amber-900 shadow-[0_18px_40px_rgba(0,0,0,0.75)] overflow-hidden animate-scale-in">
        <div className="absolute inset-[2px] border border-amber-300/85 rounded-[2px] pointer-events-none" />
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 px-4 py-3 border-b-2 border-amber-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sword className="w-5 h-5 text-amber-200" />
              <h3 className="font-bold text-amber-100">PREVISION DE COMBATE</h3>
            </div>
            <button
              onClick={onCancel}
              className="p-1 rounded-sm border border-amber-300/40 hover:bg-amber-950/25 transition-colors"
            >
              <X className="w-5 h-5 text-amber-200" />
            </button>
          </div>
        </div>

        {/* Battle preview */}
        <div className="p-4 bg-gradient-to-b from-[#f3e7c7] to-[#e0cea5]">
          {/* Combatants */}
          <div className="flex items-center justify-between gap-4">
            {/* Attacker */}
            <div className="flex-1 text-center">
              <div className={`inline-block p-3 rounded-sm mb-2 border-2 ${
                attacker.owner === 'P1' ? 'bg-sky-100 border-sky-400/70' : 'bg-rose-100 border-rose-400/70'
              }`}>
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${attacker.template.id}.gif`}
                  alt={attacker.template.name}
                  className="w-16 h-16 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div className="font-bold text-slate-800 text-sm">{attacker.template.name}</div>
              <div className="flex justify-center gap-1 mt-1">
                {attacker.template.types.map(type => (
                  <span key={type} className={`text-[9px] px-1.5 py-0.5 rounded text-white font-bold ${TYPE_COLORS[type]}`}>
                    {type.slice(0, 3).toUpperCase()}
                  </span>
                ))}
              </div>

              {/* HP bar */}
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>HP</span>
                  <span>{attackerMinHp === attackerMaxHp ? attackerMinHp : `${attackerMinHp}-${attackerMaxHp}`}/{attacker.template.hp}</span>
                </div>
                <div className="h-2 bg-slate-300 rounded-full overflow-hidden border border-slate-500/30">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${(attacker.currentHp / attacker.template.hp) * 100}%` }}
                  />
                </div>
                {canCounter && counterDamage && (
                  <div className="h-2 bg-slate-300 rounded-full overflow-hidden mt-1 opacity-70 border border-slate-500/30">
                    <div
                      className="h-full bg-yellow-500"
                      style={{ width: `${(attackerMaxHp / attacker.template.hp) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Terrain bonus */}
              {attackerTerrainBonus && (
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-green-400">
                  <Mountain className="w-3 h-3" />
                  <span>+25% ATK ({getTerrainName(attackerTerrain)})</span>
                </div>
              )}
            </div>

            {/* VS / Arrow */}
            <div className="flex flex-col items-center gap-2">
              <ArrowRight className="w-8 h-8 text-rose-500" />
              <span className="text-xs text-slate-600 font-bold">VS</span>
              {canCounter && (
                <ArrowLeft className="w-6 h-6 text-amber-600 opacity-70" />
              )}
            </div>

            {/* Defender */}
            <div className="flex-1 text-center">
              <div className={`inline-block p-3 rounded-sm mb-2 border-2 ${
                defender.owner === 'P1' ? 'bg-sky-100 border-sky-400/70' : 'bg-rose-100 border-rose-400/70'
              }`}>
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${defender.template.id}.gif`}
                  alt={defender.template.name}
                  className="w-16 h-16 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div className="font-bold text-slate-800 text-sm">{defender.template.name}</div>
              <div className="flex justify-center gap-1 mt-1">
                {defender.template.types.map(type => (
                  <span key={type} className={`text-[9px] px-1.5 py-0.5 rounded text-white font-bold ${TYPE_COLORS[type]}`}>
                    {type.slice(0, 3).toUpperCase()}
                  </span>
                ))}
              </div>

              {/* HP bar */}
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>HP</span>
                  <span>{defenderMinHp === defenderMaxHp ? defenderMinHp : `${defenderMinHp}-${defenderMaxHp}`}/{defender.template.hp}</span>
                </div>
                <div className="h-2 bg-slate-300 rounded-full overflow-hidden border border-slate-500/30">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${(defender.currentHp / defender.template.hp) * 100}%` }}
                  />
                </div>
                <div className="h-2 bg-slate-300 rounded-full overflow-hidden mt-1 opacity-70 border border-slate-500/30">
                  <div
                    className={`h-full ${willKO ? 'bg-red-500' : 'bg-yellow-500'}`}
                    style={{ width: `${(defenderMaxHp / defender.template.hp) * 100}%` }}
                  />
                </div>
              </div>

              {/* Terrain bonus */}
              {defenderTerrainBonus && (
                <div className="mt-2 flex items-center justify-center gap-1 text-xs text-green-400">
                  <Shield className="w-3 h-3" />
                  <span>Bonus terreno</span>
                </div>
              )}
            </div>
          </div>

          {/* Damage prediction */}
          <div className="mt-4 space-y-2">
            {/* Your attack */}
            <div className="bg-[#16282c] rounded-md p-3 border border-amber-700/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sword className="w-4 h-4 text-rose-300" />
                  <span className="text-sm text-amber-50 font-medium">{move.name}</span>
                  <span className={`text-[9px] px-1 py-0.5 rounded text-white font-bold ${TYPE_COLORS[move.type]}`}>
                    {move.type.slice(0, 3).toUpperCase()}
                  </span>
                  {isStab && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-yellow-600 text-white font-bold">STAB</span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-rose-300">
                    {predictedDamage.min === predictedDamage.max
                      ? predictedDamage.min
                      : `${predictedDamage.min}-${predictedDamage.max}`
                    } DMG
                  </div>
                  <EffectivenessLabel effectiveness={effectiveness} />
                </div>
              </div>
              <div className="mt-1 text-xs text-amber-100/70">
                Precisión: {accuracy}% · {move.category === 'physical' ? 'Físico' : move.category === 'special' ? 'Especial' : 'Estado'}
              </div>
              {willKO && (
                <div className="mt-2 flex items-center gap-1 text-emerald-300 text-xs">
                  <Zap className="w-3 h-3" />
                  <span className="font-bold">¡PUEDE NOQUEAR!</span>
                </div>
              )}
            </div>

            {/* Counter attack */}
            {canCounter && counterDamage && counterEffectiveness !== null && (
              <div className="bg-amber-950/30 border border-amber-700/50 rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-300" />
                    <span className="text-sm text-amber-100 font-medium">CONTRAATAQUE</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-amber-300">
                      {counterDamage.min === counterDamage.max
                        ? counterDamage.min
                        : `${counterDamage.min}-${counterDamage.max}`
                      } DMG
                    </div>
                    <EffectivenessLabel effectiveness={counterEffectiveness} />
                  </div>
                </div>
                <div className="mt-1 text-xs text-amber-200/70">
                  Contraataque{counterMove ? `: ${counterMove.name}` : ''} (75% daño)
                </div>
              </div>
            )}

            {!canCounter && (
              <div className="text-xs text-slate-600 text-center py-2">
                El defensor no puede contraatacar
                {defender.currentHp - predictedDamage.min <= 0
                  ? ' (será noqueado)'
                  : ` (fuera de rango)`
                }
              </div>
            )}
          </div>

          {/* Crit chance note */}
          <div className="mt-3 flex items-center justify-center gap-1 text-xs text-slate-600">
            <Sparkles className="w-3 h-3" />
            <span>{critChance}% probabilidad de crítico (×1.5 daño)</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-amber-800/45 bg-[#d9c79c]/35">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-gradient-to-b from-stone-100 to-stone-200 hover:from-stone-50 hover:to-stone-100 text-stone-800 font-bold rounded-sm border-[2px] border-b-[3px] border-stone-500/80 transition-all flex items-center justify-center gap-2 active:translate-y-[1px] active:border-b-[2px]"
          >
            <X className="w-5 h-5" />
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-sm border-[2px] border-b-[3px] border-rose-900/70 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-700/25 active:translate-y-[1px] active:border-b-[2px]"
          >
            <Check className="w-5 h-5" />
            ¡Atacar!
          </button>
        </div>
      </div>
    </div>
  );
}
