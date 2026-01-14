import React, { useState, useEffect, useMemo } from 'react';
import { Swords, Zap, Shield, Sparkles, Target } from 'lucide-react';
import { TERRAIN_PROPS } from '../constants/terrain';
import { getAnimatedFrontSprite, getAnimatedBackSprite } from '../utils/sprites';
import { getImpactColor, getEffectivenessText } from '../utils/combat';
import type { BattleData } from '../types/game';

type BattlePhase =
  | 'vs_intro'
  | 'vs_transition'
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

// Type color mapping for visual effects
const TYPE_COLORS: Record<string, { primary: string; secondary: string; glow: string }> = {
  fire: { primary: '#f97316', secondary: '#ea580c', glow: 'rgba(249,115,22,0.6)' },
  water: { primary: '#3b82f6', secondary: '#2563eb', glow: 'rgba(59,130,246,0.6)' },
  grass: { primary: '#22c55e', secondary: '#16a34a', glow: 'rgba(34,197,94,0.6)' },
  electric: { primary: '#eab308', secondary: '#ca8a04', glow: 'rgba(234,179,8,0.6)' },
  ice: { primary: '#06b6d4', secondary: '#0891b2', glow: 'rgba(6,182,212,0.6)' },
  fighting: { primary: '#dc2626', secondary: '#b91c1c', glow: 'rgba(220,38,38,0.6)' },
  poison: { primary: '#a855f7', secondary: '#9333ea', glow: 'rgba(168,85,247,0.6)' },
  ground: { primary: '#a16207', secondary: '#854d0e', glow: 'rgba(161,98,7,0.6)' },
  flying: { primary: '#8b5cf6', secondary: '#7c3aed', glow: 'rgba(139,92,246,0.6)' },
  psychic: { primary: '#ec4899', secondary: '#db2777', glow: 'rgba(236,72,153,0.6)' },
  bug: { primary: '#84cc16', secondary: '#65a30d', glow: 'rgba(132,204,22,0.6)' },
  rock: { primary: '#78716c', secondary: '#57534e', glow: 'rgba(120,113,108,0.6)' },
  ghost: { primary: '#6366f1', secondary: '#4f46e5', glow: 'rgba(99,102,241,0.6)' },
  dragon: { primary: '#7c3aed', secondary: '#6d28d9', glow: 'rgba(124,58,237,0.6)' },
  steel: { primary: '#64748b', secondary: '#475569', glow: 'rgba(100,116,139,0.6)' },
  fairy: { primary: '#f472b6', secondary: '#ec4899', glow: 'rgba(244,114,182,0.6)' },
  normal: { primary: '#a8a29e', secondary: '#78716c', glow: 'rgba(168,162,158,0.6)' },
};

export function BattleCinematic({
  attacker,
  defender,
  attackerResult,
  defenderResult,
  terrainType,
  onComplete
}: BattleCinematicProps) {
  const [phase, setPhase] = useState<BattlePhase>('vs_intro');
  const [defenderHp, setDefenderHp] = useState(defender.currentHp);
  const [attackerHp, setAttackerHp] = useState(attacker.currentHp);
  const [displayedText, setDisplayedText] = useState('');
  const [textToDisplay, setTextToDisplay] = useState('');

  const hasCounter = defenderResult !== null;
  const attackerDamage = attackerResult.damage;
  const counterDamage = defenderResult?.damage || 0;

  // Generate particles for background
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 2
    }));
  }, []);

  // Generate impact particles
  const impactParticles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      angle: (i * 30) + Math.random() * 15,
      distance: 50 + Math.random() * 100,
      size: 4 + Math.random() * 8
    }));
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (!textToDisplay) {
      setDisplayedText('');
      return;
    }

    setDisplayedText('');
    let index = 0;
    const interval = setInterval(() => {
      if (index < textToDisplay.length) {
        setDisplayedText(textToDisplay.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [textToDisplay]);

  // Battle phase timeline
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let t = 0;

    // VS Intro
    timers.push(setTimeout(() => setPhase('vs_transition'), t += 1500));
    timers.push(setTimeout(() => setPhase('intro'), t += 600));

    // Attacker's turn
    timers.push(setTimeout(() => {
      setPhase('charge');
      setTextToDisplay(`¡${attacker.template.name} usa ${attacker.template.moveName}!`);
    }, t += 600));
    timers.push(setTimeout(() => setPhase('lunge'), t += 700));
    timers.push(setTimeout(() => {
      setPhase('impact');
      setTextToDisplay('');
    }, t += 350));
    timers.push(setTimeout(() => {
      setPhase('result');
      setDefenderHp(Math.max(0, defender.currentHp - attackerDamage));
      const effText = getEffectivenessText(attackerResult.effectiveness);
      const critText = attackerResult.isCritical ? '¡GOLPE CRÍTICO! ' : '';
      setTextToDisplay(critText + (effText || `¡${attackerDamage} de daño!`));
    }, t += 500));

    // Counter-attack if applicable
    if (hasCounter && defender.currentHp - attackerDamage > 0) {
      timers.push(setTimeout(() => {
        setPhase('counter_intro');
        setTextToDisplay(`¡${defender.template.name} contraataca!`);
      }, t += 1800));
      timers.push(setTimeout(() => {
        setPhase('counter_charge');
        setTextToDisplay(`¡${defender.template.name} usa ${defender.template.moveName}!`);
      }, t += 700));
      timers.push(setTimeout(() => setPhase('counter_lunge'), t += 700));
      timers.push(setTimeout(() => {
        setPhase('counter_impact');
        setTextToDisplay('');
      }, t += 350));
      timers.push(setTimeout(() => {
        setPhase('counter_result');
        setAttackerHp(Math.max(0, attacker.currentHp - counterDamage));
        const effText = defenderResult ? getEffectivenessText(defenderResult.effectiveness) : '';
        const critText = defenderResult?.isCritical ? '¡CRÍTICO! ' : '';
        setTextToDisplay(critText + (effText || `¡${counterDamage} de daño!`));
      }, t += 500));
      timers.push(setTimeout(() => {
        setPhase('end');
        setTextToDisplay('');
      }, t += 1500));
      timers.push(setTimeout(onComplete, t += 400));
    } else {
      timers.push(setTimeout(() => {
        setPhase('end');
        setTextToDisplay('');
      }, t += 1500));
      timers.push(setTimeout(onComplete, t += 400));
    }

    return () => timers.forEach(clearTimeout);
  }, [onComplete, hasCounter, attackerDamage, counterDamage, attacker, defender, attackerResult, defenderResult]);

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

  const moveType = currentAttacker.template.moveType;
  const typeColors = TYPE_COLORS[moveType] || TYPE_COLORS.normal;
  const bgGradient = TERRAIN_PROPS[terrainType]?.bg || 'from-slate-800 to-black';

  const getSimplePhase = () => {
    if (phase.startsWith('counter_')) {
      return phase.replace('counter_', '') as 'intro' | 'charge' | 'lunge' | 'impact' | 'result';
    }
    if (phase === 'vs_intro' || phase === 'vs_transition') return 'intro';
    return phase as 'intro' | 'charge' | 'lunge' | 'impact' | 'result' | 'end';
  };

  const simplePhase = getSimplePhase();
  const defenderDied = !isCounterPhase && defender.currentHp - attackerDamage <= 0;
  const attackerDied = isCounterPhase && attacker.currentHp - counterDamage <= 0;
  const isVsPhase = phase === 'vs_intro' || phase === 'vs_transition';

  // HP Bar with segments (Fire Emblem style)
  const HpBar = ({ current, max, isEnemy }: { current: number; max: number; isEnemy?: boolean }) => {
    const percentage = (current / max) * 100;
    const segments = 10;
    const filledSegments = Math.ceil((current / max) * segments);

    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-bold text-amber-200 w-6">HP</span>
        <div className="flex-1 flex gap-[2px]">
          {Array.from({ length: segments }, (_, i) => (
            <div
              key={i}
              className={`
                h-3 flex-1 rounded-sm transition-all duration-300
                ${i < filledSegments
                  ? percentage > 50
                    ? 'bg-gradient-to-b from-emerald-400 to-emerald-600'
                    : percentage > 25
                    ? 'bg-gradient-to-b from-amber-400 to-amber-600'
                    : 'bg-gradient-to-b from-red-400 to-red-600'
                  : 'bg-slate-700/50'
                }
              `}
            />
          ))}
        </div>
        <span className="text-[10px] font-mono text-white w-14 text-right">
          {Math.round(current)}/{max}
        </span>
      </div>
    );
  };

  // GBA-style stat panel
  const StatPanel = ({ unit, hp, isLeft }: { unit: typeof attacker; hp: number; isLeft: boolean }) => {
    const isP1 = unit.owner === 'P1';

    return (
      <div className={`
        relative
        ${isLeft ? 'rounded-br-xl' : 'rounded-bl-xl'}
      `}>
        {/* GBA-style frame */}
        <div className={`
          relative bg-gradient-to-b from-slate-800 to-slate-900
          border-2 border-amber-600
          ${isLeft ? 'rounded-br-xl border-l-4 border-l-amber-500' : 'rounded-bl-xl border-r-4 border-r-amber-500'}
          shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_4px_12px_rgba(0,0,0,0.5)]
          overflow-hidden
        `}>
          {/* Inner glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />

          {/* Content */}
          <div className="relative p-3 min-w-[200px] md:min-w-[240px]">
            {/* Header with name and player indicator */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`
                  px-2 py-0.5 rounded text-[10px] font-bold uppercase
                  ${isP1 ? 'bg-blue-600 text-blue-100' : 'bg-red-600 text-red-100'}
                `}>
                  P{isP1 ? '1' : '2'}
                </span>
                <span className="font-bold text-white text-sm tracking-wide">
                  {unit.template.name}
                </span>
              </div>
              {/* Type badge */}
              <div className="flex gap-1">
                {unit.template.types.slice(0, 2).map((type, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase"
                    style={{
                      backgroundColor: TYPE_COLORS[type]?.primary || '#666',
                      color: 'white',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                    }}
                  >
                    {type.slice(0, 3)}
                  </span>
                ))}
              </div>
            </div>

            {/* HP Bar */}
            <HpBar current={hp} max={unit.template.hp} />

            {/* Stats row */}
            <div className="flex gap-3 mt-2 pt-2 border-t border-amber-900/50">
              <div className="flex items-center gap-1">
                <Swords className="w-3 h-3 text-orange-400" />
                <span className="text-[10px] font-bold text-orange-300">{unit.template.atk}</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-sky-400" />
                <span className="text-[10px] font-bold text-sky-300">{unit.template.def}</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3 text-purple-400" />
                <span className="text-[10px] font-bold text-purple-300">{unit.template.rng}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      {/* VS Intro Screen */}
      {isVsPhase && (
        <div className={`
          absolute inset-0 z-60 flex items-center justify-center
          transition-all duration-500
          ${phase === 'vs_transition' ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}
        `}>
          {/* Diagonal split background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950"
              style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-tl from-red-900 via-red-950 to-slate-950"
              style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
            />
            {/* Center divider line */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[150%] h-2 bg-gradient-to-r from-transparent via-amber-500 to-transparent rotate-[45deg] shadow-[0_0_30px_rgba(245,158,11,0.5)]" />
            </div>
          </div>

          {/* Attacker side (left) */}
          <div className="absolute left-0 top-0 w-1/2 h-full flex flex-col items-center justify-center p-8 animate-slide-in-left">
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
              <img
                src={getAnimatedBackSprite(attacker.template.id)}
                className="w-32 h-32 md:w-48 md:h-48 object-contain drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                style={{ imageRendering: 'pixelated', transform: 'scaleX(-1)' }}
                alt={attacker.template.name}
              />
            </div>
            <div className="mt-4 text-center">
              <div className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">
                P{attacker.owner === 'P1' ? '1' : '2'}
              </div>
              <div className="text-white text-xl md:text-2xl font-black uppercase tracking-wide">
                {attacker.template.name}
              </div>
            </div>
          </div>

          {/* Defender side (right) */}
          <div className="absolute right-0 top-0 w-1/2 h-full flex flex-col items-center justify-center p-8 animate-slide-in-right">
            <div className="relative">
              <div className="absolute -inset-4 bg-red-500/20 rounded-full blur-2xl animate-pulse" />
              <img
                src={getAnimatedFrontSprite(defender.template.id)}
                className="w-32 h-32 md:w-48 md:h-48 object-contain drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                style={{ imageRendering: 'pixelated' }}
                alt={defender.template.name}
              />
            </div>
            <div className="mt-4 text-center">
              <div className="text-red-400 text-xs font-bold uppercase tracking-widest mb-1">
                P{defender.owner === 'P1' ? '1' : '2'}
              </div>
              <div className="text-white text-xl md:text-2xl font-black uppercase tracking-wide">
                {defender.template.name}
              </div>
            </div>
          </div>

          {/* VS Badge */}
          <div className="absolute z-10 animate-vs-pop">
            <div className="relative">
              <div className="absolute -inset-4 bg-amber-500/30 rounded-full blur-xl animate-ping" />
              <div className="relative bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 text-slate-900 font-black text-4xl md:text-6xl px-6 py-2 rounded-lg shadow-[0_4px_0_0_rgba(0,0,0,0.3),0_8px_20px_rgba(0,0,0,0.4)] border-2 border-amber-300">
                VS
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Battle View */}
      <div className={`
        relative w-full max-w-5xl h-[70vh] md:h-[550px] overflow-hidden
        rounded-xl border-4 border-amber-700
        shadow-[0_0_0_2px_rgba(0,0,0,0.5),0_8px_32px_rgba(0,0,0,0.5)]
        transition-opacity duration-300
        ${isVsPhase ? 'opacity-0' : 'opacity-100'}
      `}>
        {/* Dynamic background */}
        <div className={`absolute inset-0 bg-gradient-to-b ${bgGradient}`}>
          {/* Animated particles */}
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute rounded-full bg-white/20 animate-float"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`
              }}
            />
          ))}

          {/* Atmospheric gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        </div>

        {/* Impact flash overlay */}
        <div
          className={`
            absolute inset-0 z-20 transition-opacity duration-75
            ${simplePhase === 'impact' ? 'opacity-80' : 'opacity-0'}
          `}
          style={{ backgroundColor: simplePhase === 'impact' ? typeColors.primary : 'transparent' }}
        />

        {/* Impact particles */}
        {simplePhase === 'impact' && (
          <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none">
            {impactParticles.map(p => (
              <div
                key={p.id}
                className="absolute animate-impact-particle"
                style={{
                  '--angle': `${p.angle}deg`,
                  '--distance': `${p.distance}px`,
                  width: p.size,
                  height: p.size,
                  backgroundColor: typeColors.primary,
                  borderRadius: '50%',
                  boxShadow: `0 0 10px ${typeColors.glow}`
                } as React.CSSProperties}
              />
            ))}
          </div>
        )}

        {/* Speed lines during lunge */}
        {simplePhase === 'lunge' && (
          <div className="absolute inset-0 z-15 overflow-hidden pointer-events-none">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="absolute h-1 bg-gradient-to-r from-white/60 to-transparent animate-speed-line"
                style={{
                  top: `${20 + i * 10}%`,
                  left: '-100%',
                  width: '150%',
                  animationDelay: `${i * 0.05}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Counter-attack indicator */}
        {isCounterPhase && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-bounce-in">
            <div className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 rounded-full border-2 border-amber-400 shadow-[0_4px_0_0_rgba(0,0,0,0.3)]">
              <Shield className="w-5 h-5 text-amber-200" />
              <span className="text-amber-100 font-black text-sm uppercase tracking-wider">Contraataque</span>
            </div>
          </div>
        )}

        {/* Critical hit indicator */}
        {currentResult?.isCritical && ['impact', 'result'].includes(simplePhase) && (
          <div className="absolute top-4 right-4 z-30 animate-crit-flash">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 rounded-full border-2 border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.5)]">
              <Zap className="w-5 h-5 text-yellow-300" />
              <span className="text-yellow-100 font-black text-sm uppercase">¡Crítico!</span>
            </div>
          </div>
        )}

        {/* Main battle area */}
        <div className={`
          w-full h-full relative
          ${simplePhase === 'impact' ? 'animate-battle-shake' : ''}
        `}>
          {/* Perspective grid floor */}
          <div
            className="absolute bottom-0 w-full h-1/2 opacity-15"
            style={{
              background: 'linear-gradient(transparent 3%, rgba(255,255,255,0.3) 3%), linear-gradient(90deg, transparent 3%, rgba(255,255,255,0.3) 3%)',
              backgroundSize: '50px 50px',
              transform: 'perspective(600px) rotateX(65deg)',
              transformOrigin: 'bottom'
            }}
          />

          {/* Defender UI (top-left) */}
          <div className="absolute top-4 left-4 z-10">
            <StatPanel unit={currentDefender} hp={defHpForBar} isLeft={true} />
          </div>

          {/* Attacker UI (bottom-right) */}
          <div className="absolute bottom-28 right-4 z-10">
            <StatPanel unit={currentAttacker} hp={curHpAtk} isLeft={false} />
          </div>

          {/* Defender sprite */}
          <div className={`
            absolute top-20 right-8 md:right-24 transition-all
            ${simplePhase === 'impact' ? 'brightness-[2] duration-100 translate-x-4' : 'duration-300'}
            ${(simplePhase === 'result' || phase === 'end') && (isCounterPhase ? attackerDied : defenderDied)
              ? 'translate-y-16 opacity-0 grayscale blur-sm duration-1000' : ''}
          `}>
            <div className="relative">
              {/* Shadow */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black/30 rounded-full blur-md" />
              <img
                src={defSprite}
                className="w-36 h-36 md:w-52 md:h-52 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                style={{ imageRendering: 'pixelated' }}
                alt="Defensor"
              />
            </div>
            {/* Damage number */}
            {simplePhase === 'result' && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-damage-pop">
                <span className={`
                  text-5xl md:text-6xl font-black
                  ${currentResult?.isCritical ? 'text-orange-400' : 'text-white'}
                `}
                style={{
                  textShadow: '0 2px 0 rgba(0,0,0,0.8), 0 4px 8px rgba(0,0,0,0.5)',
                  WebkitTextStroke: '2px rgba(0,0,0,0.5)'
                }}>
                  -{currentDamage}
                </span>
              </div>
            )}
          </div>

          {/* Attacker sprite */}
          <div className={`
            absolute bottom-12 left-8 md:left-24 transition-all
            ${simplePhase === 'charge' ? 'brightness-125 duration-200' : ''}
            ${simplePhase === 'lunge' ? 'translate-x-24 md:translate-x-40 -translate-y-8 scale-110 duration-300' : ''}
            ${simplePhase === 'impact' ? 'translate-x-16 md:translate-x-28 duration-100' : ''}
            ${simplePhase === 'result' || phase === 'end' ? 'duration-500' : ''}
          `}>
            <div className="relative">
              {/* Charge glow effect */}
              {simplePhase === 'charge' && (
                <div
                  className="absolute -inset-8 rounded-full animate-pulse blur-xl"
                  style={{ backgroundColor: typeColors.glow }}
                />
              )}
              {/* Shadow */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black/30 rounded-full blur-md" />
              <img
                src={atkSprite}
                className="w-44 h-44 md:w-60 md:h-60 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                style={{ imageRendering: 'pixelated' }}
                alt="Atacante"
              />
            </div>
          </div>
        </div>

        {/* GBA-style message box */}
        <div className="absolute bottom-0 w-full z-30">
          <div className="
            relative mx-2 mb-2
            bg-gradient-to-b from-slate-800 to-slate-900
            border-4 border-amber-600
            rounded-lg
            shadow-[inset_0_2px_0_rgba(255,255,255,0.1),0_4px_0_0_rgba(0,0,0,0.3)]
            overflow-hidden
          ">
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-400" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-400" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-amber-400" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-400" />

            {/* Inner glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />

            {/* Text content */}
            <div className="relative px-6 py-4 min-h-[80px] flex items-center justify-center">
              <p className="text-white font-bold text-lg md:text-xl text-center leading-relaxed">
                {phase === 'intro' && (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span>¡{attacker.template.name} ataca!</span>
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </span>
                )}
                {phase === 'end' && (
                  <span className="text-slate-400 italic">Fin del combate</span>
                )}
                {!['vs_intro', 'vs_transition', 'intro', 'end'].includes(phase) && displayedText && (
                  <span className={`
                    ${currentResult?.isCritical && simplePhase === 'result' ? 'text-orange-400' : ''}
                    ${currentResult?.effectiveness && currentResult.effectiveness > 1 && simplePhase === 'result' ? 'text-emerald-400' : ''}
                    ${currentResult?.effectiveness && currentResult.effectiveness < 1 && simplePhase === 'result' ? 'text-slate-400' : ''}
                  `}>
                    {displayedText}
                    <span className="animate-blink">▌</span>
                  </span>
                )}
                {['impact', 'counter_impact'].includes(phase) && (
                  <span className="text-3xl animate-pulse">💥</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.6; }
        }

        .animate-float {
          animation: float var(--duration, 4s) ease-in-out infinite;
        }

        @keyframes slide-in-left {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes vs-pop {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        .animate-vs-pop {
          animation: vs-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards;
          opacity: 0;
        }

        @keyframes battle-shake {
          0%, 100% { transform: translateX(0) translateY(0); }
          10% { transform: translateX(-8px) translateY(4px); }
          20% { transform: translateX(8px) translateY(-4px); }
          30% { transform: translateX(-6px) translateY(2px); }
          40% { transform: translateX(6px) translateY(-2px); }
          50% { transform: translateX(-4px) translateY(1px); }
          60% { transform: translateX(4px) translateY(-1px); }
          70% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
          90% { transform: translateX(-1px); }
        }

        .animate-battle-shake {
          animation: battle-shake 0.5s ease-out;
        }

        @keyframes damage-pop {
          0% { transform: translateX(-50%) scale(0.5) translateY(20px); opacity: 0; }
          50% { transform: translateX(-50%) scale(1.2) translateY(-10px); }
          100% { transform: translateX(-50%) scale(1) translateY(0); opacity: 1; }
        }

        .animate-damage-pop {
          animation: damage-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes bounce-in {
          0% { transform: translateX(-50%) scale(0) translateY(-20px); }
          50% { transform: translateX(-50%) scale(1.1) translateY(5px); }
          100% { transform: translateX(-50%) scale(1) translateY(0); }
        }

        .animate-bounce-in {
          animation: bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes crit-flash {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .animate-crit-flash {
          animation: crit-flash 0.3s ease-in-out infinite;
        }

        @keyframes impact-particle {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% {
            transform: translate(
              calc(cos(var(--angle)) * var(--distance)),
              calc(sin(var(--angle)) * var(--distance))
            ) scale(0);
            opacity: 0;
          }
        }

        .animate-impact-particle {
          animation: impact-particle 0.4s ease-out forwards;
        }

        @keyframes speed-line {
          0% { transform: translateX(0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }

        .animate-speed-line {
          animation: speed-line 0.3s ease-out forwards;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .animate-blink {
          animation: blink 0.8s step-end infinite;
        }
      `}</style>
    </div>
  );
}
