import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getAnimatedFrontSprite } from '../utils/sprites';
import { useSFX } from '../hooks/useSFX';
import type { PokemonTemplate, Player, PokemonType } from '../types/game';

interface CaptureMinigameProps {
  pokemon: PokemonTemplate;
  player: Player;
  playerPokemon?: PokemonTemplate;
  onSuccess: (damageTaken: number) => void;
  onFail: (damageTaken: number) => void;
  onFlee: (damageTaken: number) => void;
}

type Phase =
  | 'flash'
  | 'alert'
  | 'silhouette'
  | 'reveal'
  | 'battle'
  | 'attack_intro'      // Player Pokemon slides in
  | 'attack_execute'    // Attack happens
  | 'attack_counter'    // Wild counters
  | 'attack_outro'      // Player Pokemon slides out
  | 'ring1'
  | 'ring2'
  | 'ring3'
  | 'ring_result'       // Show ring result before next
  | 'throw'             // Pokeball throw animation
  | 'shaking'
  | 'result';

type RingResult = 'perfect' | 'great' | 'good' | 'miss' | null;

const TYPE_COLORS: Record<PokemonType, { primary: string; secondary: string; glow: string; dark: string }> = {
  normal: { primary: '#A8A878', secondary: '#6D6D4E', glow: 'rgba(168,168,120,0.6)', dark: '#4A4A34' },
  fire: { primary: '#F08030', secondary: '#9C531F', glow: 'rgba(240,128,48,0.8)', dark: '#5C2A0A' },
  water: { primary: '#6890F0', secondary: '#445E9C', glow: 'rgba(104,144,240,0.8)', dark: '#1E3A6E' },
  grass: { primary: '#78C850', secondary: '#4E8234', glow: 'rgba(120,200,80,0.8)', dark: '#2A4A1A' },
  electric: { primary: '#F8D030', secondary: '#A1871F', glow: 'rgba(248,208,48,0.8)', dark: '#5A4A0A' },
  ice: { primary: '#98D8D8', secondary: '#638D8D', glow: 'rgba(152,216,216,0.8)', dark: '#3A5A5A' },
  fighting: { primary: '#C03028', secondary: '#7D1F1A', glow: 'rgba(192,48,40,0.8)', dark: '#4A1410' },
  poison: { primary: '#A040A0', secondary: '#682A68', glow: 'rgba(160,64,160,0.8)', dark: '#3A1A3A' },
  ground: { primary: '#E0C068', secondary: '#927D44', glow: 'rgba(224,192,104,0.8)', dark: '#4A3A1A' },
  flying: { primary: '#A890F0', secondary: '#6D5E9C', glow: 'rgba(168,144,240,0.8)', dark: '#3A2A5A' },
  psychic: { primary: '#F85888', secondary: '#A13959', glow: 'rgba(248,88,136,0.8)', dark: '#5A1A2A' },
  bug: { primary: '#A8B820', secondary: '#6D7815', glow: 'rgba(168,184,32,0.8)', dark: '#3A4A0A' },
  rock: { primary: '#B8A038', secondary: '#786824', glow: 'rgba(184,160,56,0.8)', dark: '#3A3010' },
  ghost: { primary: '#705898', secondary: '#493963', glow: 'rgba(112,88,152,0.8)', dark: '#2A1A3A' },
  dragon: { primary: '#7038F8', secondary: '#4924A1', glow: 'rgba(112,56,248,0.8)', dark: '#1A0A4A' },
  steel: { primary: '#B8B8D0', secondary: '#787887', glow: 'rgba(184,184,208,0.8)', dark: '#3A3A4A' },
  fairy: { primary: '#EE99AC', secondary: '#9B6470', glow: 'rgba(238,153,172,0.8)', dark: '#5A3A4A' },
};

const RING_BONUS = { perfect: 10, great: 6, good: 3, miss: 0 };
const RING_SPEEDS = [1800, 1400, 1000];

function getBaseRate(pokemon: PokemonTemplate): number {
  const statTotal = pokemon.hp + pokemon.atk + pokemon.def;
  if (statTotal < 100) return 45;
  if (statTotal < 150) return 35;
  if (statTotal < 200) return 25;
  return 15;
}

function getHpBonus(currentHp: number, maxHp: number): number {
  const hpRatio = currentHp / maxHp;
  return Math.floor((1 - hpRatio) * 40);
}

function getRingBonus(result: RingResult): number {
  if (!result) return 0;
  return RING_BONUS[result];
}

function calculateDamage(attacker: PokemonTemplate, defender: PokemonTemplate): number {
  const baseDamage = Math.floor(attacker.atk * 0.7);
  const defense = Math.floor(defender.def * 0.25);
  return Math.max(8, baseDamage - defense + Math.floor(Math.random() * 8));
}

export function CaptureMinigame({
  pokemon,
  player,
  playerPokemon,
  onSuccess,
  onFail,
  onFlee
}: CaptureMinigameProps) {
  const { playSFX } = useSFX();
  const [phase, setPhase] = useState<Phase>('flash');
  const [wildHp, setWildHp] = useState(pokemon.hp);
  const [hasAttacked, setHasAttacked] = useState(false);
  const [damageDealt, setDamageDealt] = useState(0);
  const [damageTaken, setDamageTaken] = useState(0);

  // Ring states
  const [ringResults, setRingResults] = useState<[RingResult, RingResult, RingResult]>([null, null, null]);
  const [currentRingIndex, setCurrentRingIndex] = useState(0);
  const [currentRingSize, setCurrentRingSize] = useState(100);
  const [lastRingResult, setLastRingResult] = useState<RingResult>(null);
  const [ringTapFeedback, setRingTapFeedback] = useState(false);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringStartTimeRef = useRef<number>(0);

  // Shake state
  const [shakeIndex, setShakeIndex] = useState(0);
  const [captureSuccess, setCaptureSuccess] = useState(false);

  // Button hover state
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const typeColor = TYPE_COLORS[pokemon.types[0]] || TYPE_COLORS.normal;

  const activePlayerPokemon: PokemonTemplate = playerPokemon || {
    id: 25, name: 'Pikachu', types: ['electric'] as PokemonType[],
    hp: 60, atk: 25, def: 15, mov: 3, rng: 2,
    moveName: 'Rayo', moveType: 'electric' as PokemonType
  };

  const playerTypeColor = TYPE_COLORS[activePlayerPokemon.types[0]] || TYPE_COLORS.normal;

  const baseRate = getBaseRate(pokemon);
  const hpBonus = getHpBonus(wildHp, pokemon.hp);
  const ringBonus = ringResults.reduce((sum, r) => sum + getRingBonus(r), 0);
  const totalChance = Math.min(95, Math.max(5, baseRate + hpBonus + ringBonus));

  // Intro sequence
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => {
      playSFX('wild_encounter', 0.6);
      setPhase('alert');
    }, 150));
    timers.push(setTimeout(() => setPhase('silhouette'), 700));
    timers.push(setTimeout(() => setPhase('reveal'), 1400));
    timers.push(setTimeout(() => setPhase('battle'), 2200));
    return () => timers.forEach(t => clearTimeout(t));
  }, [playSFX]);

  // Attack sequence
  const handleAttack = useCallback(() => {
    if (phase !== 'battle' || hasAttacked) return;
    setHasAttacked(true);
    setPhase('attack_intro');

    // Intro → Execute
    setTimeout(() => {
      const damage = calculateDamage(activePlayerPokemon, pokemon);
      setDamageDealt(damage);
      setWildHp(hp => Math.max(1, hp - damage));
      setPhase('attack_execute');

      // Execute → Counter
      setTimeout(() => {
        const counter = calculateDamage(pokemon, activePlayerPokemon);
        setDamageTaken(counter);
        setPhase('attack_counter');

        // Counter → Outro
        setTimeout(() => {
          setPhase('attack_outro');

          // Outro → Battle
          setTimeout(() => {
            setDamageDealt(0);
            setDamageTaken(0);
            setPhase('battle');
          }, 600);
        }, 800);
      }, 800);
    }, 800);
  }, [phase, hasAttacked, activePlayerPokemon, pokemon]);

  // Ring system
  const handleCapture = useCallback(() => {
    if (phase !== 'battle') return;
    setCurrentRingIndex(0);
    setCurrentRingSize(100);
    setPhase('ring1');
    ringStartTimeRef.current = Date.now();

    const startRing = (index: number) => {
      const speed = RING_SPEEDS[index];
      const decrementPerFrame = 100 / (speed / 16);

      ringIntervalRef.current = setInterval(() => {
        setCurrentRingSize(size => {
          const newSize = size - decrementPerFrame;
          if (newSize <= 0) {
            if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
            completeRing(index, 'miss');
            return 100;
          }
          return newSize;
        });
      }, 16);
    };

    setTimeout(() => startRing(0), 300);
  }, [phase]);

  const completeRing = useCallback((ringIndex: number, quality: RingResult) => {
    // Play ring sound based on quality
    if (quality === 'perfect') {
      playSFX('ring_hit_perfect', 0.6);
    } else if (quality === 'great' || quality === 'good') {
      playSFX('ring_hit_good', 0.5);
    } else {
      playSFX('ring_miss', 0.4);
    }

    setRingResults(prev => {
      const newResults = [...prev] as [RingResult, RingResult, RingResult];
      newResults[ringIndex] = quality;
      return newResults;
    });
    setLastRingResult(quality);
    setCurrentRingSize(100);
    setPhase('ring_result');

    setTimeout(() => {
      if (ringIndex < 2) {
        const nextPhase = ringIndex === 0 ? 'ring2' : 'ring3';
        setCurrentRingIndex(ringIndex + 1);
        setPhase(nextPhase);

        const speed = RING_SPEEDS[ringIndex + 1];
        const decrementPerFrame = 100 / (speed / 16);

        setTimeout(() => {
          ringIntervalRef.current = setInterval(() => {
            setCurrentRingSize(size => {
              const newSize = size - decrementPerFrame;
              if (newSize <= 0) {
                if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
                completeRing(ringIndex + 1, 'miss');
                return 100;
              }
              return newSize;
            });
          }, 16);
        }, 300);
      } else {
        playSFX('pokeball_throw', 0.6);
        setPhase('throw');
        setTimeout(() => {
          setPhase('shaking');
          setShakeIndex(0);
        }, 1000);
      }
    }, 500);
  }, [playSFX]);

  const handleRingTap = useCallback(() => {
    const ringIndex = phase === 'ring1' ? 0 : phase === 'ring2' ? 1 : phase === 'ring3' ? 2 : -1;
    if (ringIndex === -1) return;

    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    setRingTapFeedback(true);
    setTimeout(() => setRingTapFeedback(false), 200);

    let quality: RingResult;
    if (currentRingSize <= 20) quality = 'perfect';
    else if (currentRingSize <= 40) quality = 'great';
    else if (currentRingSize <= 65) quality = 'good';
    else quality = 'miss';

    completeRing(ringIndex, quality);
  }, [phase, currentRingSize, completeRing]);

  // Shake sequence
  useEffect(() => {
    if (phase !== 'shaking') return;

    const finalChance = Math.min(95, Math.max(5, baseRate + hpBonus + ringBonus));
    const success = Math.random() * 100 < finalChance;
    setCaptureSuccess(success);

    const shakeTimers: ReturnType<typeof setTimeout>[] = [];
    shakeTimers.push(setTimeout(() => {
      playSFX('pokeball_shake', 0.5);
      setShakeIndex(1);
    }, 700));
    shakeTimers.push(setTimeout(() => {
      playSFX('pokeball_shake', 0.5);
      setShakeIndex(2);
    }, 1400));
    shakeTimers.push(setTimeout(() => {
      playSFX('pokeball_shake', 0.5);
      setShakeIndex(3);
    }, 2100));
    shakeTimers.push(setTimeout(() => setPhase('result'), 2800));

    return () => shakeTimers.forEach(t => clearTimeout(t));
  }, [phase, baseRate, hpBonus, ringBonus, playSFX]);

  // Result handler - pass damageTaken to callbacks
  useEffect(() => {
    if (phase !== 'result') return;

    // Play appropriate sound based on capture result
    if (captureSuccess) {
      // Success - no sound here (visual effect plays)
    } else {
      playSFX('pokeball_open', 0.6);
      setTimeout(() => playSFX('capture_fail', 0.5), 400);
    }

    const timer = setTimeout(() => {
      if (captureSuccess) onSuccess(damageTaken);
      else onFail(damageTaken);
    }, 2500);
    return () => clearTimeout(timer);
  }, [phase, captureSuccess, damageTaken, onSuccess, onFail, playSFX]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    };
  }, []);

  const handleFlee = useCallback(() => {
    if (phase !== 'battle') return;
    playSFX('flee_success', 0.6);
    onFlee(damageTaken); // Pass damage taken (usually 0 if fleeing without attacking)
  }, [phase, damageTaken, onFlee, playSFX]);

  const hpPercentage = (wildHp / pokemon.hp) * 100;
  const isRingPhase = phase === 'ring1' || phase === 'ring2' || phase === 'ring3';
  const isAttackPhase = phase === 'attack_intro' || phase === 'attack_execute' || phase === 'attack_counter' || phase === 'attack_outro';
  const showWildPokemon = phase !== 'flash' && phase !== 'alert' && phase !== 'silhouette' && phase !== 'reveal';

  // Generate ring particles
  const ringParticles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      angle: (i * 30) * (Math.PI / 180),
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden select-none">
      {/* === FLASH === */}
      {phase === 'flash' && (
        <div className="absolute inset-0 bg-white animate-[flash-out_0.15s_ease-out_forwards]" />
      )}

      {/* === BACKGROUND === */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${phase === 'flash' ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0a0a15] to-slate-950" />
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: `radial-gradient(ellipse at 50% 30%, ${typeColor.glow} 0%, transparent 60%)` }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-emerald-950/50 via-emerald-900/20 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]" />
      </div>

      {/* === ALERT (!) === */}
      {phase === 'alert' && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="animate-[alert-pop_0.4s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
            <div
              className="text-[120px] md:text-[160px] font-black text-red-500 animate-[alert-shake_0.12s_ease-in-out_infinite]"
              style={{
                fontFamily: '"Press Start 2P", monospace',
                textShadow: '0 0 80px rgba(239,68,68,1), 0 0 160px rgba(239,68,68,0.6), 6px 6px 0 #450a0a',
                filter: 'drop-shadow(0 0 40px rgba(239,68,68,0.9))',
              }}
            >
              !
            </div>
          </div>
        </div>
      )}

      {/* === SILHOUETTE === */}
      {phase === 'silhouette' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <div className="relative animate-[silhouette-appear_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
            <div className="absolute inset-0 blur-[80px] scale-150" style={{ background: typeColor.glow }} />
            <img
              src={getAnimatedFrontSprite(pokemon.id)}
              alt=""
              className="w-48 h-48 md:w-64 md:h-64 object-contain"
              style={{ imageRendering: 'pixelated', filter: 'brightness(0) drop-shadow(0 0 30px rgba(255,255,255,0.4))' }}
            />
          </div>
          <span
            className="mt-4 text-2xl text-slate-500 animate-pulse"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            ¿...?
          </span>
        </div>
      )}

      {/* === REVEAL === */}
      {phase === 'reveal' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <div className="relative animate-[reveal-pokemon_0.8s_ease-out_forwards]">
            <div className="absolute inset-0 blur-[60px] scale-150 animate-pulse" style={{ background: typeColor.glow }} />
            <img
              src={getAnimatedFrontSprite(pokemon.id)}
              alt={pokemon.name}
              className="relative w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-2xl"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div className="mt-4 animate-[fade-in_0.5s_ease-out_forwards]">
            <span
              className="text-2xl md:text-3xl font-bold text-white"
              style={{
                fontFamily: '"Press Start 2P", monospace',
                textShadow: `0 0 30px ${typeColor.glow}, 3px 3px 0 #000`,
              }}
            >
              ¡{pokemon.name.toUpperCase()}!
            </span>
          </div>
        </div>
      )}

      {/* === MAIN BATTLE SCENE === */}
      {showWildPokemon && (
        <div className="absolute inset-0 flex flex-col">
          {/* Top: Wild Pokemon Area */}
          <div className="flex-1 relative flex items-center justify-center pt-8">
            {/* Wild Pokemon Info Panel */}
            <div className="absolute top-4 left-4 right-4 md:left-auto md:right-8 md:w-72">
              <div
                className="rounded-2xl p-3 backdrop-blur-sm"
                style={{
                  background: `linear-gradient(135deg, ${typeColor.dark}ee 0%, #0a0a15ee 100%)`,
                  border: `3px solid ${typeColor.primary}`,
                  boxShadow: `0 0 30px ${typeColor.glow}, inset 0 1px 0 ${typeColor.primary}40`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-sm font-bold text-white uppercase tracking-wide"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    {pokemon.name}
                  </span>
                  <div className="flex gap-1">
                    {pokemon.types.map(type => (
                      <span
                        key={type}
                        className="px-2 py-0.5 text-[8px] font-bold uppercase rounded-md text-white"
                        style={{
                          background: `linear-gradient(180deg, ${TYPE_COLORS[type]?.primary || '#888'}, ${TYPE_COLORS[type]?.secondary || '#666'})`,
                          boxShadow: `0 2px 0 ${TYPE_COLORS[type]?.dark || '#444'}`,
                        }}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                {/* HP Bar - GBA Style */}
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-yellow-400" style={{ fontFamily: '"Press Start 2P", monospace' }}>HP</span>
                    <div className="flex-1 h-5 rounded-full bg-slate-900 border-2 border-slate-700 overflow-hidden relative">
                      <div
                        className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${
                          hpPercentage > 50 ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400' :
                          hpPercentage > 25 ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400' :
                          'bg-gradient-to-r from-red-600 via-red-500 to-orange-500'
                        }`}
                        style={{ width: `${hpPercentage}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent h-1/2" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-end pr-2">
                        <span className="text-[9px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                          {wildHp}/{pokemon.hp}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Capture Chance */}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[8px] text-slate-400">CAPTURA</span>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${totalChance >= 50 ? 'bg-emerald-400' : totalChance >= 30 ? 'bg-amber-400' : 'bg-red-400'} animate-pulse`} />
                    <span
                      className={`text-sm font-bold ${totalChance >= 50 ? 'text-emerald-400' : totalChance >= 30 ? 'text-amber-400' : 'text-red-400'}`}
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      {totalChance}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Wild Pokemon Sprite */}
            <div className={`relative ${phase === 'attack_execute' ? 'animate-[wild-hit_0.5s_ease-out]' : ''}`}>
              <div className="absolute inset-0 blur-[60px] scale-150" style={{ background: typeColor.glow, opacity: 0.5 }} />
              <img
                src={getAnimatedFrontSprite(pokemon.id)}
                alt={pokemon.name}
                className={`relative w-40 h-40 md:w-52 md:h-52 object-contain drop-shadow-2xl transition-all duration-200 ${
                  phase === 'attack_execute' ? 'brightness-[3]' : ''
                }`}
                style={{ imageRendering: 'pixelated' }}
              />

              {/* Damage Number */}
              {phase === 'attack_execute' && damageDealt > 0 && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-[damage-fly_0.8s_ease-out_forwards]">
                  <span
                    className="text-4xl font-black text-red-400"
                    style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '3px 3px 0 #000, 0 0 20px rgba(239,68,68,0.8)' }}
                  >
                    -{damageDealt}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* === ATTACK CINEMATIC - Player Pokemon === */}
          {isAttackPhase && (
            <div className="absolute bottom-32 left-0 right-0 flex items-end justify-start px-8">
              <div className={`relative ${
                phase === 'attack_intro' ? 'animate-[slide-in-left_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards]' :
                phase === 'attack_outro' ? 'animate-[slide-out-left_0.5s_ease-in_forwards]' :
                phase === 'attack_counter' ? 'animate-[player-hit_0.4s_ease-out]' : ''
              }`}>
                <div className="absolute inset-0 blur-[40px] scale-125" style={{ background: playerTypeColor.glow, opacity: 0.6 }} />
                <img
                  src={getAnimatedFrontSprite(activePlayerPokemon.id)}
                  alt={activePlayerPokemon.name}
                  className={`relative w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl scale-x-[-1] ${
                    phase === 'attack_counter' ? 'brightness-[3]' : ''
                  }`}
                  style={{ imageRendering: 'pixelated' }}
                />

                {/* Counter Damage */}
                {phase === 'attack_counter' && damageTaken > 0 && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-[damage-fly_0.8s_ease-out_forwards]">
                    <span
                      className="text-3xl font-black text-red-400"
                      style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '3px 3px 0 #000' }}
                    >
                      -{damageTaken}
                    </span>
                  </div>
                )}

                {/* Player Pokemon Label */}
                <div
                  className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg whitespace-nowrap"
                  style={{
                    background: `linear-gradient(180deg, ${playerTypeColor.primary}dd, ${playerTypeColor.secondary}dd)`,
                    boxShadow: `0 2px 0 ${playerTypeColor.dark}`,
                  }}
                >
                  <span className="text-[9px] font-bold text-white" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    {activePlayerPokemon.name}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* === ACTION MENU === */}
          {phase === 'battle' && (
            <div className="absolute bottom-0 left-0 right-0 p-4 animate-[slide-up_0.4s_ease-out_forwards]">
              {/* Stats Bar */}
              <div className="flex justify-center gap-4 mb-3">
                <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700">
                  <span className="text-[8px] text-slate-500 block">BASE</span>
                  <span className="text-[11px] font-bold text-white" style={{ fontFamily: '"Press Start 2P", monospace' }}>{baseRate}%</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700">
                  <span className="text-[8px] text-slate-500 block">HP BONUS</span>
                  <span className={`text-[11px] font-bold ${hpBonus > 0 ? 'text-emerald-400' : 'text-slate-400'}`} style={{ fontFamily: '"Press Start 2P", monospace' }}>+{hpBonus}%</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700">
                  <span className="text-[8px] text-slate-500 block">RINGS</span>
                  <span className="text-[11px] font-bold text-slate-400" style={{ fontFamily: '"Press Start 2P", monospace' }}>+?%</span>
                </div>
              </div>

              {/* Premium Action Buttons */}
              <div
                className="rounded-2xl p-4 backdrop-blur-md"
                style={{
                  background: 'linear-gradient(180deg, rgba(20,20,40,0.95) 0%, rgba(10,10,25,0.98) 100%)',
                  border: `3px solid ${typeColor.primary}60`,
                  boxShadow: `0 -10px 40px ${typeColor.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
                }}
              >
                <div className="grid grid-cols-3 gap-3">
                  {/* ATTACK Button */}
                  <button
                    onClick={handleAttack}
                    disabled={hasAttacked}
                    onMouseEnter={() => setHoveredButton('attack')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className={`relative group rounded-xl overflow-hidden transition-all duration-200 ${
                      hasAttacked ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                    }`}
                    style={{
                      background: hasAttacked ? '#1a1a2e' : 'linear-gradient(180deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%)',
                      boxShadow: hasAttacked ? 'none' : hoveredButton === 'attack'
                        ? '0 0 30px rgba(220,38,38,0.6), 0 8px 0 #450a0a, inset 0 1px 0 rgba(255,255,255,0.3)'
                        : '0 6px 0 #450a0a, inset 0 1px 0 rgba(255,255,255,0.2)',
                      transform: hoveredButton === 'attack' && !hasAttacked ? 'translateY(-2px)' : 'translateY(0)',
                    }}
                  >
                    <div className="px-4 py-4 flex flex-col items-center gap-2">
                      {/* Sword Icon */}
                      <div className="relative">
                        <svg className={`w-8 h-8 ${hasAttacked ? 'text-slate-600' : 'text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
                          <path d="M13 19l6-6" />
                          <path d="M16 16l4 4" />
                          <path d="M19 21l2-2" />
                        </svg>
                        {!hasAttacked && (
                          <div className="absolute inset-0 animate-pulse">
                            <svg className="w-8 h-8 text-red-300 blur-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide ${hasAttacked ? 'text-slate-600' : 'text-white'}`}
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                      >
                        {hasAttacked ? 'Usado' : 'Atacar'}
                      </span>
                    </div>
                    {!hasAttacked && <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10" />}
                  </button>

                  {/* CAPTURE Button */}
                  <button
                    onClick={handleCapture}
                    onMouseEnter={() => setHoveredButton('capture')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className="relative group rounded-xl overflow-hidden transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
                      boxShadow: hoveredButton === 'capture'
                        ? '0 0 30px rgba(245,158,11,0.6), 0 8px 0 #78350f, inset 0 1px 0 rgba(255,255,255,0.3)'
                        : '0 6px 0 #78350f, inset 0 1px 0 rgba(255,255,255,0.2)',
                      transform: hoveredButton === 'capture' ? 'translateY(-2px)' : 'translateY(0)',
                    }}
                  >
                    <div className="px-4 py-4 flex flex-col items-center gap-2">
                      {/* Pokeball Icon */}
                      <div className="relative w-8 h-8">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-red-500 to-red-600 border-2 border-slate-900 overflow-hidden">
                          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 bg-slate-900" />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-slate-900" />
                          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-slate-100 to-white" />
                        </div>
                        <div className="absolute inset-0 rounded-full animate-ping bg-amber-400/30" style={{ animationDuration: '2s' }} />
                      </div>
                      <span
                        className="text-[10px] font-bold text-white uppercase tracking-wide"
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                      >
                        Capturar
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10" />
                  </button>

                  {/* FLEE Button */}
                  <button
                    onClick={handleFlee}
                    onMouseEnter={() => setHoveredButton('flee')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className="relative group rounded-xl overflow-hidden transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(180deg, #475569 0%, #334155 50%, #1e293b 100%)',
                      boxShadow: hoveredButton === 'flee'
                        ? '0 0 20px rgba(71,85,105,0.5), 0 8px 0 #0f172a, inset 0 1px 0 rgba(255,255,255,0.2)'
                        : '0 6px 0 #0f172a, inset 0 1px 0 rgba(255,255,255,0.1)',
                      transform: hoveredButton === 'flee' ? 'translateY(-2px)' : 'translateY(0)',
                    }}
                  >
                    <div className="px-4 py-4 flex flex-col items-center gap-2">
                      {/* Run Icon */}
                      <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 4v4l4-2" />
                        <path d="M5 12h14" />
                        <path d="M13 16v4l4-2" />
                        <path d="M19 12l-6-6" />
                        <path d="M19 12l-6 6" />
                      </svg>
                      <span
                        className="text-[10px] font-bold text-white uppercase tracking-wide"
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                      >
                        Huir
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* === RING MINIGAME === */}
          {(isRingPhase || phase === 'ring_result') && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/80 z-30 cursor-pointer"
              onClick={isRingPhase ? handleRingTap : undefined}
            >
              <div className="relative">
                {/* Ring Number Indicator */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex items-center gap-4">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        ringResults[i] === 'perfect' ? 'bg-emerald-500 scale-110' :
                        ringResults[i] === 'great' ? 'bg-blue-500 scale-105' :
                        ringResults[i] === 'good' ? 'bg-amber-500' :
                        ringResults[i] === 'miss' ? 'bg-red-500/60' :
                        currentRingIndex === i ? 'bg-white/20 animate-pulse' : 'bg-slate-800/60'
                      }`}
                      style={{
                        border: `3px solid ${
                          ringResults[i] === 'perfect' ? '#34d399' :
                          ringResults[i] === 'great' ? '#60a5fa' :
                          ringResults[i] === 'good' ? '#fbbf24' :
                          ringResults[i] === 'miss' ? '#f87171' :
                          currentRingIndex === i ? '#fff' : '#475569'
                        }`,
                        boxShadow: ringResults[i] ? `0 0 20px ${
                          ringResults[i] === 'perfect' ? 'rgba(52,211,153,0.5)' :
                          ringResults[i] === 'great' ? 'rgba(96,165,250,0.5)' :
                          ringResults[i] === 'good' ? 'rgba(251,191,36,0.5)' : 'rgba(248,113,113,0.3)'
                        }` : currentRingIndex === i ? '0 0 30px rgba(255,255,255,0.3)' : 'none',
                      }}
                    >
                      <span className="text-[10px] font-bold text-white" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                        {ringResults[i] === 'perfect' ? '★' :
                         ringResults[i] === 'great' ? '◆' :
                         ringResults[i] === 'good' ? '●' :
                         ringResults[i] === 'miss' ? '✕' : i + 1}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Target Ring with particles */}
                <div className="relative w-44 h-44 md:w-52 md:h-52">
                  {/* Outer glow */}
                  <div
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{ background: `radial-gradient(circle, ${typeColor.glow} 0%, transparent 70%)` }}
                  />

                  {/* Particle orbit */}
                  {isRingPhase && ringParticles.map(p => (
                    <div
                      key={p.id}
                      className="absolute w-2 h-2 rounded-full bg-white animate-[orbit_3s_linear_infinite]"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${p.angle}rad) translateX(90px)`,
                        animationDelay: `${p.id * 0.25}s`,
                        opacity: 0.6,
                        boxShadow: '0 0 10px #fff',
                      }}
                    />
                  ))}

                  {/* Target circle */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      border: `6px solid ${typeColor.primary}`,
                      boxShadow: `0 0 40px ${typeColor.glow}, inset 0 0 60px ${typeColor.glow}`,
                    }}
                  />

                  {/* Zone indicators */}
                  <div className="absolute inset-[15%] rounded-full border-2 border-emerald-500/30" />
                  <div className="absolute inset-[30%] rounded-full border-2 border-blue-500/20" />
                  <div className="absolute inset-[45%] rounded-full border-2 border-amber-500/15" />

                  {/* Shrinking ring */}
                  {isRingPhase && (
                    <div
                      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-50 ${
                        ringTapFeedback ? 'scale-90' : ''
                      }`}
                      style={{
                        width: `${currentRingSize * (window.innerWidth < 768 ? 1.76 : 2.08)}px`,
                        height: `${currentRingSize * (window.innerWidth < 768 ? 1.76 : 2.08)}px`,
                        border: `5px solid ${
                          currentRingSize <= 20 ? '#22c55e' :
                          currentRingSize <= 40 ? '#3b82f6' :
                          currentRingSize <= 65 ? '#f59e0b' : '#ef4444'
                        }`,
                        boxShadow: `0 0 ${currentRingSize <= 20 ? '40px #22c55e' : currentRingSize <= 40 ? '30px #3b82f6' : '20px rgba(239,68,68,0.5)'}, inset 0 0 ${currentRingSize <= 20 ? '30px rgba(34,197,94,0.4)' : '20px rgba(255,255,255,0.1)'}`,
                        transition: 'box-shadow 0.1s, border-color 0.1s',
                      }}
                    />
                  )}

                  {/* Pokeball center */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-b from-red-500 to-red-600 border-4 border-slate-900 relative overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2.5 bg-slate-900" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 md:w-7 md:h-7 rounded-full bg-white border-[3px] border-slate-900 shadow-inner" />
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-slate-100 to-white" />
                    </div>
                  </div>

                  {/* Tap feedback burst */}
                  {ringTapFeedback && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-3 h-3 rounded-full bg-white animate-[burst_0.4s_ease-out_forwards]"
                          style={{
                            transform: `rotate(${i * 45}deg) translateY(-50px)`,
                            animationDelay: `${i * 0.02}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Ring result message */}
                {phase === 'ring_result' && lastRingResult && (
                  <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 animate-[result-bounce_0.5s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
                    <span
                      className={`text-2xl font-black ${
                        lastRingResult === 'perfect' ? 'text-emerald-400' :
                        lastRingResult === 'great' ? 'text-blue-400' :
                        lastRingResult === 'good' ? 'text-amber-400' : 'text-red-400'
                      }`}
                      style={{
                        fontFamily: '"Press Start 2P", monospace',
                        textShadow: lastRingResult === 'perfect' ? '0 0 30px rgba(34,197,94,0.8), 3px 3px 0 #000' :
                                   lastRingResult === 'great' ? '0 0 20px rgba(59,130,246,0.6), 3px 3px 0 #000' :
                                   '3px 3px 0 #000',
                      }}
                    >
                      {lastRingResult === 'perfect' ? '¡¡PERFECTO!!' :
                       lastRingResult === 'great' ? '¡GENIAL!' :
                       lastRingResult === 'good' ? '¡BIEN!' : 'Fallaste...'}
                    </span>
                  </div>
                )}

                {/* Instruction */}
                {isRingPhase && (
                  <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span
                      className="text-sm text-white/80 animate-pulse"
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      ¡TOCA!
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === THROW ANIMATION === */}
          {phase === 'throw' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-30">
              <div className="animate-[throw-ball_0.8s_cubic-bezier(0.25,0.46,0.45,0.94)_forwards]">
                <div className="w-20 h-20 rounded-full bg-gradient-to-b from-red-500 to-red-600 border-4 border-slate-900 relative overflow-hidden shadow-2xl animate-spin">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2.5 bg-slate-900" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-[3px] border-slate-900" />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-slate-100 to-white" />
                </div>
              </div>
            </div>
          )}

          {/* === SHAKING === */}
          {phase === 'shaking' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-30">
              <div className="text-center">
                {/* Stars */}
                <div className="flex justify-center gap-6 mb-8">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`text-4xl transition-all duration-500 ${
                        shakeIndex >= i ? 'text-yellow-400 scale-125 animate-[star-pop_0.3s_ease-out]' : 'text-slate-700'
                      }`}
                      style={{
                        filter: shakeIndex >= i ? 'drop-shadow(0 0 15px rgba(250,204,21,0.8))' : 'none',
                      }}
                    >
                      ★
                    </div>
                  ))}
                </div>

                {/* Pokeball */}
                <div className={`relative inline-block ${shakeIndex > 0 && shakeIndex <= 3 ? 'animate-[pokeball-wobble_0.6s_ease-in-out]' : ''}`}>
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-b from-red-500 to-red-600 border-4 border-slate-900 relative overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.3)]">
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 bg-slate-900" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border-4 border-slate-900">
                      <div className={`absolute inset-1 rounded-full transition-colors duration-300 ${shakeIndex > 0 ? 'bg-red-400 animate-pulse' : 'bg-slate-200'}`} />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-slate-100 to-white" />
                  </div>

                  {/* Sparkles on shake */}
                  {shakeIndex > 0 && (
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-[sparkle-fly_0.6s_ease-out_forwards]"
                          style={{
                            top: '50%',
                            left: '50%',
                            transform: `rotate(${i * 45}deg)`,
                            animationDelay: `${i * 0.05}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <span className="text-2xl text-slate-500 animate-[dots_1.5s_ease-in-out_infinite]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    ...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* === RESULT === */}
          {phase === 'result' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/85 z-30">
              <div className="text-center animate-[result-pop_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
                {captureSuccess ? (
                  <>
                    {/* Confetti */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {[...Array(30)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute animate-[confetti-fall_2.5s_ease-out_forwards]"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: '-5%',
                            animationDelay: `${Math.random() * 0.8}s`,
                          }}
                        >
                          <div
                            className="w-3 h-3"
                            style={{
                              background: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#a855f7'][Math.floor(Math.random() * 5)],
                              transform: `rotate(${Math.random() * 360}deg)`,
                              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="text-7xl mb-6 animate-[bounce_0.6s_ease-out]">🎉</div>
                    <h2
                      className="text-3xl md:text-4xl font-black text-emerald-400 mb-4"
                      style={{
                        fontFamily: '"Press Start 2P", monospace',
                        textShadow: '0 0 40px rgba(34,197,94,0.8), 4px 4px 0 #065f46',
                      }}
                    >
                      ¡CAPTURADO!
                    </h2>
                    <p className="text-base text-white mb-2" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      {pokemon.name}
                    </p>
                    <p className="text-sm text-emerald-300" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      se unió al equipo
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-7xl mb-6 animate-[shake_0.5s_ease-out]">💨</div>
                    <h2
                      className="text-3xl md:text-4xl font-black text-red-400 mb-4"
                      style={{
                        fontFamily: '"Press Start 2P", monospace',
                        textShadow: '0 0 30px rgba(239,68,68,0.6), 4px 4px 0 #7f1d1d',
                      }}
                    >
                      ¡ESCAPÓ!
                    </h2>
                    <p className="text-base text-slate-400" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      {pokemon.name} se liberó
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* === ANIMATIONS === */}
      <style>{`
        @keyframes flash-out {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes alert-pop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.4); }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes alert-shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-8px) rotate(-8deg); }
          75% { transform: translateX(8px) rotate(8deg); }
        }

        @keyframes silhouette-appear {
          0% { transform: scale(0.3) translateY(80px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }

        @keyframes reveal-pokemon {
          0% { transform: scale(1.3); filter: brightness(4); }
          100% { transform: scale(1); filter: brightness(1); }
        }

        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-in-left {
          0% { transform: translateX(-200px) scale(0.8); opacity: 0; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }

        @keyframes slide-out-left {
          0% { transform: translateX(0) scale(1); opacity: 1; }
          100% { transform: translateX(-200px) scale(0.8); opacity: 0; }
        }

        @keyframes wild-hit {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(20px); }
          40% { transform: translateX(-15px); }
          60% { transform: translateX(10px); }
          80% { transform: translateX(-5px); }
        }

        @keyframes player-hit {
          0%, 100% { transform: translateX(0) scaleX(-1); }
          20% { transform: translateX(-20px) scaleX(-1); }
          40% { transform: translateX(15px) scaleX(-1); }
          60% { transform: translateX(-10px) scaleX(-1); }
          80% { transform: translateX(5px) scaleX(-1); }
        }

        @keyframes damage-fly {
          0% { transform: translateX(-50%) translateY(0) scale(0.5); opacity: 0; }
          20% { transform: translateX(-50%) translateY(-10px) scale(1.2); opacity: 1; }
          100% { transform: translateX(-50%) translateY(-60px) scale(1); opacity: 0; }
        }

        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(90px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(90px) rotate(-360deg); }
        }

        @keyframes burst {
          0% { transform: rotate(var(--r, 0deg)) translateY(0) scale(1); opacity: 1; }
          100% { transform: rotate(var(--r, 0deg)) translateY(-80px) scale(0); opacity: 0; }
        }

        @keyframes result-bounce {
          0% { transform: translateX(-50%) scale(0) translateY(20px); }
          60% { transform: translateX(-50%) scale(1.2) translateY(-5px); }
          100% { transform: translateX(-50%) scale(1) translateY(0); }
        }

        @keyframes throw-ball {
          0% { transform: translateY(300px) scale(0.5); opacity: 0; }
          30% { transform: translateY(0) scale(1); opacity: 1; }
          50% { transform: translateY(-50px) scale(1.1); }
          70% { transform: translateY(0) scale(1); }
          100% { transform: translateY(0) scale(0.9); opacity: 1; }
        }

        @keyframes pokeball-wobble {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-30deg); }
          40% { transform: rotate(30deg); }
          60% { transform: rotate(-20deg); }
          80% { transform: rotate(15deg); }
        }

        @keyframes star-pop {
          0% { transform: scale(0.5); }
          50% { transform: scale(1.4); }
          100% { transform: scale(1.25); }
        }

        @keyframes sparkle-fly {
          0% { transform: rotate(var(--r, 0deg)) translateY(0) scale(1); opacity: 1; }
          100% { transform: rotate(var(--r, 0deg)) translateY(-60px) scale(0); opacity: 0; }
        }

        @keyframes dots {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(500px) rotate(720deg); opacity: 0; }
        }

        @keyframes result-pop {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
