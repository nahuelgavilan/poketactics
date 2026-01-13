import React, { useState, useEffect } from 'react';
import { Zap, Shield } from 'lucide-react';
import { TERRAIN_PROPS } from '../constants/terrain';
import { getAnimatedFrontSprite, getAnimatedBackSprite } from '../utils/sprites';
import { getImpactColor, getEffectivenessText } from '../utils/combat';
import type { BattleData } from '../types/game';

type BattlePhase =
  | 'intro'
  | 'charge'
  | 'lunge'
  | 'impact'
  | 'result'
  | 'counter_intro'
  | 'counter_charge'
  | 'counter_lunge'
  | 'counter_impact'
  | 'counter_result'
  | 'end';

interface BattleCinematicProps extends BattleData {
  onComplete: () => void;
}

export function BattleCinematic({
  attacker,
  defender,
  attackerResult,
  defenderResult,
  terrainType,
  onComplete
}: BattleCinematicProps) {
  const [phase, setPhase] = useState<BattlePhase>('intro');
  const [defenderHp, setDefenderHp] = useState(defender.currentHp);
  const [attackerHp, setAttackerHp] = useState(attacker.currentHp);

  const hasCounter = defenderResult !== null;
  const attackerDamage = attackerResult.damage;
  const counterDamage = defenderResult?.damage || 0;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let t = 0;

    // Attacker's turn
    timers.push(setTimeout(() => setPhase('charge'), t += 800));
    timers.push(setTimeout(() => setPhase('lunge'), t += 800));
    timers.push(setTimeout(() => setPhase('impact'), t += 400));
    timers.push(setTimeout(() => {
      setPhase('result');
      setDefenderHp(Math.max(0, defender.currentHp - attackerDamage));
    }, t += 600));

    // Counter-attack if applicable
    if (hasCounter && defender.currentHp - attackerDamage > 0) {
      timers.push(setTimeout(() => setPhase('counter_intro'), t += 1500));
      timers.push(setTimeout(() => setPhase('counter_charge'), t += 800));
      timers.push(setTimeout(() => setPhase('counter_lunge'), t += 800));
      timers.push(setTimeout(() => setPhase('counter_impact'), t += 400));
      timers.push(setTimeout(() => {
        setPhase('counter_result');
        setAttackerHp(Math.max(0, attacker.currentHp - counterDamage));
      }, t += 600));
      timers.push(setTimeout(() => setPhase('end'), t += 1500));
      timers.push(setTimeout(onComplete, t += 500));
    } else {
      timers.push(setTimeout(() => setPhase('end'), t += 1500));
      timers.push(setTimeout(onComplete, t += 500));
    }

    return () => timers.forEach(clearTimeout);
  }, [onComplete, hasCounter, attackerDamage, counterDamage, attacker.currentHp, defender.currentHp]);

  const isCounterPhase = phase.startsWith('counter_');
  const currentAttacker = isCounterPhase ? defender : attacker;
  const currentDefender = isCounterPhase ? attacker : defender;
  const currentDamage = isCounterPhase ? counterDamage : attackerDamage;
  const currentResult = isCounterPhase ? defenderResult : attackerResult;

  const atkSprite = getAnimatedBackSprite(currentAttacker.template.id);
  const defSprite = getAnimatedFrontSprite(currentDefender.template.id);

  const maxHpAtk = currentAttacker.template.hp;
  const curHpAtk = isCounterPhase ? defenderHp : attackerHp;
  const maxHpDef = currentDefender.template.hp;
  const curHpDef = isCounterPhase ? attackerHp : defenderHp;

  const showAttackerDamage = phase === 'result' || (isCounterPhase && ['counter_result', 'end'].includes(phase));
  const showCounterDamage = ['counter_result', 'end'].includes(phase);

  const defHpForBar = isCounterPhase
    ? (showCounterDamage ? Math.max(0, attacker.currentHp - counterDamage) : attackerHp)
    : (showAttackerDamage && !isCounterPhase ? Math.max(0, defender.currentHp - attackerDamage) : defenderHp);

  const impactColor = getImpactColor(currentAttacker.template.moveType);
  const effText = currentResult ? getEffectivenessText(currentResult.effectiveness) : '';
  const bgGradient = TERRAIN_PROPS[terrainType]?.bg || 'from-slate-800 to-black';

  const getSimplePhase = () => {
    if (phase.startsWith('counter_')) {
      return phase.replace('counter_', '') as 'intro' | 'charge' | 'lunge' | 'impact' | 'result';
    }
    return phase as 'intro' | 'charge' | 'lunge' | 'impact' | 'result' | 'end';
  };

  const simplePhase = getSimplePhase();
  const defenderDied = !isCounterPhase && defender.currentHp - attackerDamage <= 0;
  const attackerDied = isCounterPhase && attacker.currentHp - counterDamage <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className={`relative w-full max-w-4xl h-[60vh] md:h-[500px] overflow-hidden rounded-xl border-4 border-slate-700 bg-gradient-to-b ${bgGradient} shadow-2xl`}>

        {/* Impact flash overlay */}
        <div className={`absolute inset-0 z-20 transition-opacity duration-100 ${simplePhase === 'impact' ? `opacity-60 ${impactColor}` : 'opacity-0'}`} />

        {/* Counter-attack indicator */}
        {isCounterPhase && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 bg-yellow-900/80 rounded-full border border-yellow-500/50">
            <Shield className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 font-bold text-sm">CONTRAATAQUE</span>
          </div>
        )}

        {/* Critical hit indicator */}
        {currentResult?.isCritical && ['impact', 'result'].includes(simplePhase) && (
          <div className="absolute top-4 right-4 z-30 flex items-center gap-1 px-3 py-1 bg-orange-900/80 rounded-full border border-orange-500/50 animate-pulse">
            <Zap className="w-4 h-4 text-orange-400" />
            <span className="text-orange-300 font-bold text-xs">¡CRÍTICO!</span>
          </div>
        )}

        {/* Main battle area with shake effect */}
        <div className={`w-full h-full relative ${simplePhase === 'impact' ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>

          {/* Perspective grid floor */}
          <div
            className="absolute bottom-0 w-full h-1/2 opacity-20"
            style={{
              background: 'linear-gradient(transparent 5%, #000 5%), linear-gradient(90deg, transparent 5%, #000 5%)',
              backgroundSize: '40px 40px',
              transform: 'perspective(500px) rotateX(60deg)'
            }}
          />

          {/* Defender UI (top-left) */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
            <div className="bg-gray-900/80 backdrop-blur border-l-4 border-red-500 p-3 rounded-br-2xl shadow-lg w-64 transform skew-x-[-10deg]">
              <div className="skew-x-[10deg]">
                <div className="flex justify-between text-white font-bold uppercase text-sm mb-1">
                  <span>{currentDefender.template.name}</span>
                  <span className={currentDefender.owner === 'P1' ? 'text-blue-400' : 'text-red-400'}>
                    P{currentDefender.owner === 'P1' ? '1' : '2'}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                  <div
                    className="h-full bg-green-500 transition-all duration-500 ease-out"
                    style={{ width: `${(defHpForBar / maxHpDef) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {Math.round(defHpForBar)}/{maxHpDef}
                </div>
              </div>
            </div>
          </div>

          {/* Attacker UI (bottom-right) */}
          <div className="absolute bottom-24 right-6 z-10">
            <div className="bg-gray-900/80 backdrop-blur border-r-4 border-blue-500 p-3 rounded-tl-2xl shadow-lg w-64 transform skew-x-[-10deg]">
              <div className="skew-x-[10deg]">
                <div className="flex justify-between text-white font-bold uppercase text-sm mb-1">
                  <span>{currentAttacker.template.name}</span>
                  <span className={currentAttacker.owner === 'P1' ? 'text-blue-400' : 'text-red-400'}>
                    P{currentAttacker.owner === 'P1' ? '1' : '2'}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${(curHpAtk / maxHpAtk) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {Math.round(curHpAtk)}/{maxHpAtk}
                </div>
              </div>
            </div>
          </div>

          {/* Defender sprite */}
          <div className={`absolute top-16 right-16 md:right-32 transition-all duration-200
            ${simplePhase === 'impact' ? 'brightness-200 opacity-80 translate-x-2' : ''}
            ${(simplePhase === 'result' || phase === 'end') && (isCounterPhase ? attackerDied : defenderDied) ? 'translate-y-10 opacity-0 grayscale duration-1000' : ''}
          `}>
            <img
              src={defSprite}
              className="w-32 h-32 md:w-48 md:h-48 object-contain rendering-pixelated scale-150"
              alt="Defensor"
            />
            {simplePhase === 'result' && (
              <div className="absolute -top-10 left-0 w-full text-center">
                <span className={`text-5xl font-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] animate-bounce block ${currentResult?.isCritical ? 'text-orange-400' : 'text-red-500'}`}>
                  -{currentDamage}
                  {currentResult?.isCritical && <span className="text-2xl ml-1">!</span>}
                </span>
              </div>
            )}
          </div>

          {/* Attacker sprite */}
          <div className={`absolute bottom-8 left-16 md:left-32 transition-all duration-300
            ${simplePhase === 'charge' ? 'brightness-125 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]' : ''}
            ${simplePhase === 'lunge' ? 'translate-x-32 -translate-y-10 scale-110' : ''}
            ${simplePhase === 'impact' ? 'translate-x-20' : ''}
            ${simplePhase === 'result' || phase === 'end' ? 'translate-x-0 translate-y-0' : ''}
          `}>
            <img
              src={atkSprite}
              className="w-40 h-40 md:w-56 md:h-56 object-contain rendering-pixelated scale-150"
              alt="Atacante"
            />
            {simplePhase === 'charge' && (
              <div className="absolute inset-0 bg-white opacity-20 rounded-full animate-ping" />
            )}
          </div>
        </div>

        {/* Message box */}
        <div className="absolute bottom-0 w-full h-24 bg-slate-900 border-t-4 border-slate-600 p-4 flex items-center justify-center z-30">
          <p className="text-white font-mono text-lg md:text-xl text-center leading-tight">
            {phase === 'intro' && `¡${attacker.template.name} ataca!`}
            {(phase === 'charge' || phase === 'lunge') && (
              <span className="text-yellow-300">
                ¡{attacker.template.name} usó {attacker.template.moveName}!
              </span>
            )}
            {phase === 'impact' && '...'}
            {phase === 'result' && (
              <span>
                {attackerResult.isCritical && <span className="text-orange-400">¡GOLPE CRÍTICO! </span>}
                {effText || (attackerDamage > 0 ? '¡Golpe directo!' : '¡Falló!')}
              </span>
            )}
            {phase === 'counter_intro' && (
              <span className="text-yellow-300">¡{defender.template.name} contraataca!</span>
            )}
            {(phase === 'counter_charge' || phase === 'counter_lunge') && (
              <span className="text-yellow-300">
                ¡{defender.template.name} usó {defender.template.moveName}!
              </span>
            )}
            {phase === 'counter_impact' && '...'}
            {phase === 'counter_result' && defenderResult && (
              <span>
                {defenderResult.isCritical && <span className="text-orange-400">¡CRÍTICO! </span>}
                {getEffectivenessText(defenderResult.effectiveness) || '¡Contraataque conectado!'}
              </span>
            )}
            {phase === 'end' && (
              <span className="text-slate-400">Fin del combate</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
