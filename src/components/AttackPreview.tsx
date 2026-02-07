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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 px-4 py-3 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sword className="w-5 h-5 text-red-400" />
              <h3 className="font-bold text-white">PREVISIÓN DE COMBATE</h3>
            </div>
            <button
              onClick={onCancel}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Battle preview */}
        <div className="p-4">
          {/* Combatants */}
          <div className="flex items-center justify-between gap-4">
            {/* Attacker */}
            <div className="flex-1 text-center">
              <div className={`inline-block p-3 rounded-xl mb-2 ${
                attacker.owner === 'P1' ? 'bg-blue-500/20 ring-2 ring-blue-500/50' : 'bg-red-500/20 ring-2 ring-red-500/50'
              }`}>
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${attacker.template.id}.gif`}
                  alt={attacker.template.name}
                  className="w-16 h-16 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div className="font-bold text-white text-sm">{attacker.template.name}</div>
              <div className="flex justify-center gap-1 mt-1">
                {attacker.template.types.map(type => (
                  <span key={type} className={`text-[9px] px-1.5 py-0.5 rounded text-white font-bold ${TYPE_COLORS[type]}`}>
                    {type.slice(0, 3).toUpperCase()}
                  </span>
                ))}
              </div>

              {/* HP bar */}
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>HP</span>
                  <span>{attackerMinHp === attackerMaxHp ? attackerMinHp : `${attackerMinHp}-${attackerMaxHp}`}/{attacker.template.hp}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${(attacker.currentHp / attacker.template.hp) * 100}%` }}
                  />
                </div>
                {canCounter && counterDamage && (
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-1 opacity-60">
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
              <ArrowRight className="w-8 h-8 text-red-400" />
              <span className="text-xs text-slate-500 font-bold">VS</span>
              {canCounter && (
                <ArrowLeft className="w-6 h-6 text-yellow-400 opacity-60" />
              )}
            </div>

            {/* Defender */}
            <div className="flex-1 text-center">
              <div className={`inline-block p-3 rounded-xl mb-2 ${
                defender.owner === 'P1' ? 'bg-blue-500/20 ring-2 ring-blue-500/50' : 'bg-red-500/20 ring-2 ring-red-500/50'
              }`}>
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${defender.template.id}.gif`}
                  alt={defender.template.name}
                  className="w-16 h-16 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <div className="font-bold text-white text-sm">{defender.template.name}</div>
              <div className="flex justify-center gap-1 mt-1">
                {defender.template.types.map(type => (
                  <span key={type} className={`text-[9px] px-1.5 py-0.5 rounded text-white font-bold ${TYPE_COLORS[type]}`}>
                    {type.slice(0, 3).toUpperCase()}
                  </span>
                ))}
              </div>

              {/* HP bar */}
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>HP</span>
                  <span>{defenderMinHp === defenderMaxHp ? defenderMinHp : `${defenderMinHp}-${defenderMaxHp}`}/{defender.template.hp}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${(defender.currentHp / defender.template.hp) * 100}%` }}
                  />
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-1 opacity-60">
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
            <div className="bg-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sword className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-white font-medium">{move.name}</span>
                  <span className={`text-[9px] px-1 py-0.5 rounded text-white font-bold ${TYPE_COLORS[move.type]}`}>
                    {move.type.slice(0, 3).toUpperCase()}
                  </span>
                  {isStab && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-yellow-600 text-white font-bold">STAB</span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-red-400">
                    {predictedDamage.min === predictedDamage.max
                      ? predictedDamage.min
                      : `${predictedDamage.min}-${predictedDamage.max}`
                    } DMG
                  </div>
                  <EffectivenessLabel effectiveness={effectiveness} />
                </div>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Precisión: {accuracy}% · {move.category === 'physical' ? 'Físico' : move.category === 'special' ? 'Especial' : 'Estado'}
              </div>
              {willKO && (
                <div className="mt-2 flex items-center gap-1 text-green-400 text-xs">
                  <Zap className="w-3 h-3" />
                  <span className="font-bold">¡PUEDE NOQUEAR!</span>
                </div>
              )}
            </div>

            {/* Counter attack */}
            {canCounter && counterDamage && counterEffectiveness !== null && (
              <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-yellow-200 font-medium">CONTRAATAQUE</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-yellow-400">
                      {counterDamage.min === counterDamage.max
                        ? counterDamage.min
                        : `${counterDamage.min}-${counterDamage.max}`
                      } DMG
                    </div>
                    <EffectivenessLabel effectiveness={counterEffectiveness} />
                  </div>
                </div>
                <div className="mt-1 text-xs text-yellow-300/60">
                  Contraataque{counterMove ? `: ${counterMove.name}` : ''} (75% daño)
                </div>
              </div>
            )}

            {!canCounter && (
              <div className="text-xs text-slate-500 text-center py-2">
                El defensor no puede contraatacar
                {defender.currentHp - predictedDamage.min <= 0
                  ? ' (será noqueado)'
                  : ` (fuera de rango)`
                }
              </div>
            )}
          </div>

          {/* Crit chance note */}
          <div className="mt-3 flex items-center justify-center gap-1 text-xs text-slate-500">
            <Sparkles className="w-3 h-3" />
            <span>{critChance}% probabilidad de crítico (×1.5 daño)</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-slate-700 bg-slate-800/50">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
          >
            <Check className="w-5 h-5" />
            ¡Atacar!
          </button>
        </div>
      </div>
    </div>
  );
}
