import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getAnimatedFrontSprite } from '../utils/sprites';
import { useSFX } from '../hooks/useSFX';
import { calculateBaseDamage, checkAccuracy, getFullEffectiveness, isStab as checkIsStab, CRIT_CHANCE, CRIT_MULTIPLIER, VARIANCE_MIN, VARIANCE_MAX } from '@poketactics/shared';
import type { PokemonTemplate, Player, PokemonType, Move } from '../types/game';

interface CaptureMinigameProps {
  pokemon: PokemonTemplate;
  player: Player;
  playerPokemon?: PokemonTemplate;
  playerPP?: number[];
  onSuccess: (damageTaken: number, ppUsed: number[]) => void;
  onFail: (damageTaken: number, ppUsed: number[]) => void;
  onFlee: (damageTaken: number, ppUsed: number[]) => void;
}

type Phase =
  | 'flash'
  | 'alert'
  | 'silhouette'
  | 'reveal'
  | 'battle'
  | 'move_select'       // Player choosing which move to use
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
  dark: { primary: '#705848', secondary: '#49392D', glow: 'rgba(112,88,72,0.8)', dark: '#2A1F17' },
};

// Ring difficulty - speeds (milliseconds for full shrink)
const RING_SPEEDS = [2200, 1600, 1100]; // Ring 1: 2.2s, Ring 2: 1.6s, Ring 3: 1.1s

// The ring starts at 100% and shrinks toward center
// These define the SIZE thresholds for each tier
// Smaller ring = better result (closer to center/pokemon)
const RING_ZONES = [
  { perfect: 20, great: 40, good: 60 },  // Ring 1: Forgiving
  { perfect: 15, great: 32, good: 52 },  // Ring 2: Medium
  { perfect: 12, great: 25, good: 45 },  // Ring 3: Tight
];

// Bonus each ring gives to its corresponding shake check
const RING_SHAKE_BONUS = { perfect: 20, great: 12, good: 5, miss: -5 };

function getBaseRate(pokemon: PokemonTemplate): number {
  const statTotal = pokemon.hp + pokemon.atk + pokemon.def + pokemon.spa + pokemon.spd + pokemon.spe;
  if (statTotal < 250) return 55;  // Weak pokemon: easier to catch
  if (statTotal < 350) return 45;
  if (statTotal < 450) return 35;
  return 25;  // Strong pokemon: harder base rate
}

function getHpBonus(currentHp: number, maxHp: number): number {
  const hpRatio = currentHp / maxHp;
  return Math.floor((1 - hpRatio) * 30);  // Up to +30% if HP is low
}

// Get the zone result based on ring index and current size
function getRingResult(ringIndex: number, size: number): RingResult {
  const zones = RING_ZONES[ringIndex] || RING_ZONES[0];
  if (size <= zones.perfect) return 'perfect';
  if (size <= zones.great) return 'great';
  if (size <= zones.good) return 'good';
  return 'miss';
}

// Calculate probability for a single shake check
// baseChance is the per-shake base, ringResult affects this specific shake
function getShakeCheckProbability(basePerShake: number, ringResult: RingResult): number {
  const bonus = RING_SHAKE_BONUS[ringResult || 'miss'];
  return Math.min(95, Math.max(15, basePerShake + bonus));
}

// Calculate damage using the shared formula with move, Physical/Special split, STAB, accuracy
function calcMoveDamage(move: Move, attacker: PokemonTemplate, defender: PokemonTemplate): {
  damage: number; effectiveness: number; stab: boolean; missed: boolean; critical: boolean;
} {
  // Accuracy check
  if (!checkAccuracy(move)) {
    return { damage: 0, effectiveness: 1, stab: false, missed: true, critical: false };
  }

  const result = calculateBaseDamage({
    move,
    attackerTemplate: attacker,
    attackerTypes: attacker.types,
    defenderTemplate: defender,
    defenderTypes: defender.types,
    attackerTerrain: 1 as any, // grass (capture happens in tall grass)
    defenderTerrain: 1 as any,
  });

  // Crit check
  const critical = Math.random() < CRIT_CHANCE;
  const critMul = critical ? CRIT_MULTIPLIER : 1;

  // Variance
  const variance = VARIANCE_MIN + Math.random() * (VARIANCE_MAX - VARIANCE_MIN);

  const finalDamage = Math.max(1, Math.floor(result.base * critMul * variance));
  return { damage: finalDamage, effectiveness: result.effectiveness, stab: result.isStab, missed: false, critical };
}

export function CaptureMinigame({
  pokemon,
  player,
  playerPokemon,
  playerPP,
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
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [effectivenessText, setEffectivenessText] = useState<string | null>(null);
  const [showInfoOverlay, setShowInfoOverlay] = useState(false);

  // PP tracking: count how many times each move was used during encounter
  const [ppUsed, setPpUsed] = useState<number[]>(() => new Array(playerPokemon?.moves.length || 4).fill(0));
  // Local PP state for the encounter (decremented from initial)
  const [localPP, setLocalPP] = useState<number[]>(() =>
    playerPP || playerPokemon?.moves.map(m => m.pp) || []
  );

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
    hp: 60, atk: 25, def: 15, spa: 20, spd: 20, spe: 30, mov: 3,
    moves: [{ id: 'thunderbolt', name: 'Rayo', type: 'electric' as PokemonType, category: 'special' as const, power: 90, accuracy: 100, pp: 15, range: 2, priority: 0, description: 'A strong electric attack.' }],
    ability: { id: 'static', name: 'Static', description: 'Contact may paralyze.' },
  };

  const playerTypeColor = TYPE_COLORS[activePlayerPokemon.types[0]] || TYPE_COLORS.normal;

  const baseRate = getBaseRate(pokemon);
  const hpBonus = getHpBonus(wildHp, pokemon.hp);
  // Base probability per shake = cube root of total desired probability
  // We add ring bonuses during shake checks, not here
  const basePerShake = Math.pow((baseRate + hpBonus) / 100, 1 / 3) * 100;
  // For UI display: show approximate total chance (assuming all "good" rings)
  const estimatedTotalChance = Math.min(95, Math.max(5, baseRate + hpBonus));

  // Ambient floating particles (type-colored)
  const ambientParticles = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 6,
      opacity: 0.3 + Math.random() * 0.3,
    })), []);

  // Confetti particles for success (useMemo to avoid re-render randomness)
  const confettiParticles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      color: [typeColor.primary, typeColor.secondary, '#FFD700', '#FCD34D', '#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#a855f7'][Math.floor(Math.random() * 9)],
      rotation: Math.random() * 360,
      shape: Math.random() > 0.6 ? 'circle' : Math.random() > 0.3 ? 'square' : 'diamond',
      size: 3 + Math.random() * 5,
      drift: -30 + Math.random() * 60,
    })), [typeColor.primary, typeColor.secondary]);

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

  // Open move selection
  const handleAttack = useCallback(() => {
    if (phase !== 'battle' || hasAttacked) return;
    setPhase('move_select');
  }, [phase, hasAttacked]);

  // Handle move selection and start attack sequence
  const handleMoveSelect = useCallback((move: Move, moveIndex: number) => {
    setSelectedMove(move);
    setHasAttacked(true);

    // Deduct PP
    setPpUsed(prev => {
      const next = [...prev];
      next[moveIndex] = (next[moveIndex] || 0) + 1;
      return next;
    });
    setLocalPP(prev => {
      const next = [...prev];
      next[moveIndex] = Math.max(0, (next[moveIndex] || 0) - 1);
      return next;
    });

    setPhase('attack_intro');

    // Intro -> Execute
    setTimeout(() => {
      const result = calcMoveDamage(move, activePlayerPokemon, pokemon);

      if (result.missed) {
        setDamageDealt(0);
        setEffectivenessText('¡Falló!');
      } else {
        setDamageDealt(result.damage);
        setWildHp(hp => Math.max(1, hp - result.damage));

        // Set effectiveness text
        if (result.effectiveness >= 2) setEffectivenessText('¡Súper Eficaz!');
        else if (result.effectiveness > 0 && result.effectiveness < 1) setEffectivenessText('No muy eficaz...');
        else if (result.effectiveness === 0) setEffectivenessText('No afecta...');
        else if (result.critical) setEffectivenessText('¡Golpe Crítico!');
        else setEffectivenessText(null);
      }
      setPhase('attack_execute');

      // Execute -> Counter (wild Pokemon uses its first attack move)
      setTimeout(() => {
        const wildAttackMoves = pokemon.moves.filter(m => m.category !== 'status' && m.power > 0);
        const counterMove = wildAttackMoves[0] || pokemon.moves[0];
        if (counterMove && counterMove.category !== 'status') {
          const counterResult = calcMoveDamage(counterMove, pokemon, activePlayerPokemon);
          setDamageTaken(counterResult.missed ? 0 : counterResult.damage);
        } else {
          setDamageTaken(0);
        }
        setPhase('attack_counter');

        // Counter -> Outro
        setTimeout(() => {
          setPhase('attack_outro');

          // Outro -> Battle
          setTimeout(() => {
            setDamageDealt(0);
            setDamageTaken(0);
            setEffectivenessText(null);
            setPhase('battle');
          }, 600);
        }, 800);
      }, 800);
    }, 800);
  }, [activePlayerPokemon, pokemon]);

  // Cancel move selection -> return to battle
  const handleCancelMoveSelect = useCallback(() => {
    setPhase('battle');
  }, []);

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

    // Use ring-specific zones for difficulty scaling
    const quality = getRingResult(ringIndex, currentRingSize);

    completeRing(ringIndex, quality);
  }, [phase, currentRingSize, completeRing]);

  // Shake sequence - 3 individual checks, one per shake
  useEffect(() => {
    if (phase !== 'shaking') return;

    const shakeTimers: ReturnType<typeof setTimeout>[] = [];

    // Perform all 3 checks upfront to determine which shakes will happen
    const shakesEarned: boolean[] = [];
    for (let i = 0; i < 3; i++) {
      const ringResult = ringResults[i];
      const shakeProb = getShakeCheckProbability(basePerShake, ringResult);
      const passed = Math.random() * 100 < shakeProb;
      shakesEarned.push(passed);
      // Once one fails, no more shakes can happen
      if (!passed) break;
    }

    // Count how many consecutive shakes were earned (0, 1, 2, or 3)
    const shakesCount = shakesEarned.filter(Boolean).length;

    // Capture is only successful if ALL 3 shakes happened
    setCaptureSuccess(shakesCount === 3);

    // Visual timing constants
    const SHAKE_INTERVAL = 700; // Time between each shake
    const PAUSE_AFTER_LAST = 700; // Pause after last shake before result

    // Schedule shakes based on how many were earned
    if (shakesCount >= 1) {
      shakeTimers.push(setTimeout(() => {
        playSFX('pokeball_shake', 0.5);
        setShakeIndex(1);
      }, SHAKE_INTERVAL));
    }

    if (shakesCount >= 2) {
      shakeTimers.push(setTimeout(() => {
        playSFX('pokeball_shake', 0.5);
        setShakeIndex(2);
      }, SHAKE_INTERVAL * 2));
    }

    if (shakesCount >= 3) {
      shakeTimers.push(setTimeout(() => {
        playSFX('pokeball_shake', 0.5);
        setShakeIndex(3);
      }, SHAKE_INTERVAL * 3));
    }

    // Go to result after appropriate time
    const resultTime = Math.max(1, shakesCount) * SHAKE_INTERVAL + PAUSE_AFTER_LAST;
    shakeTimers.push(setTimeout(() => setPhase('result'), resultTime));

    return () => shakeTimers.forEach(t => clearTimeout(t));
  }, [phase, basePerShake, ringResults, playSFX]);

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
      if (captureSuccess) onSuccess(damageTaken, ppUsed);
      else onFail(damageTaken, ppUsed);
    }, 2500);
    return () => clearTimeout(timer);
  }, [phase, captureSuccess, damageTaken, ppUsed, onSuccess, onFail, playSFX]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    };
  }, []);

  const handleFlee = useCallback(() => {
    if (phase !== 'battle') return;
    playSFX('flee_success', 0.6);
    onFlee(damageTaken, ppUsed);
  }, [phase, damageTaken, ppUsed, onFlee, playSFX]);

  const hpPercentage = (wildHp / pokemon.hp) * 100;
  const isRingPhase = phase === 'ring1' || phase === 'ring2' || phase === 'ring3';
  const isAttackPhase = phase === 'attack_intro' || phase === 'attack_execute' || phase === 'attack_counter' || phase === 'attack_outro';
  const isMoveSelect = phase === 'move_select';
  const showWildPokemon = phase !== 'flash' && phase !== 'alert' && phase !== 'silhouette' && phase !== 'reveal';

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
        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]" />
        {/* CRT Scanlines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)' }}
        />
      </div>

      {/* === AMBIENT FLOATING PARTICLES === */}
      {phase !== 'flash' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
          {ambientParticles.map(p => (
            <div
              key={p.id}
              className="absolute rounded-full animate-[float-up-ambient_var(--dur)_linear_infinite]"
              style={{
                left: `${p.x}%`,
                bottom: '-5%',
                width: p.size,
                height: p.size,
                background: typeColor.primary,
                boxShadow: `0 0 ${p.size * 2}px ${typeColor.glow}`,
                opacity: 0,
                ['--dur' as string]: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* === ALERT (!) === */}
      {phase === 'alert' && (
        <div className="absolute inset-0 flex items-center justify-center z-20 animate-[screen-vibrate_0.3s_ease-in-out]">
          <div className="animate-[alert-pop_0.4s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
            <div className="relative">
              {/* Radial energy lines */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2 w-1 h-16 md:h-20 rounded-full animate-[energy-line-burst_0.6s_ease-out_forwards]"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-80px)`,
                    background: 'linear-gradient(to bottom, rgba(239,68,68,0.9), transparent)',
                    animationDelay: `${i * 0.04}s`,
                  }}
                />
              ))}
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
            {/* Rising energy particles from ground */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute bottom-0 rounded-full animate-[rising-particle_1s_ease-out_forwards]"
                style={{
                  left: `${15 + i * 14}%`,
                  width: 4 + Math.random() * 4,
                  height: 4 + Math.random() * 4,
                  background: typeColor.primary,
                  boxShadow: `0 0 8px ${typeColor.glow}`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
            {/* Ground glow bar */}
            <div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-3 rounded-full blur-md"
              style={{ background: typeColor.glow }}
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
          {/* Brief screen flash */}
          <div className="absolute inset-0 bg-white/30 animate-[flash-out_0.3s_ease-out_forwards]" />
          <div className="relative animate-[reveal-pokemon_0.8s_ease-out_forwards]">
            <div className="absolute inset-0 blur-[60px] scale-150 animate-pulse" style={{ background: typeColor.glow }} />
            {/* Radial energy explosion */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 w-2 h-8 rounded-full animate-[particle-burst-reveal_0.8s_ease-out_forwards]"
                style={{
                  transform: `translate(-50%, -50%) rotate(${i * 30}deg)`,
                  background: `linear-gradient(to bottom, ${typeColor.primary}, transparent)`,
                  animationDelay: `${i * 0.03}s`,
                }}
              />
            ))}
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
                        className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${hpPercentage > 50 ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400' :
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
                    <div className={`w-2 h-2 rounded-full ${estimatedTotalChance >= 50 ? 'bg-emerald-400' : estimatedTotalChance >= 30 ? 'bg-amber-400' : 'bg-red-400'} animate-pulse`} />
                    <span
                      className={`text-sm font-bold ${estimatedTotalChance >= 50 ? 'text-emerald-400' : estimatedTotalChance >= 30 ? 'text-amber-400' : 'text-red-400'}`}
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      ~{estimatedTotalChance}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Wild Pokemon Sprite */}
            <div className={`relative ${phase === 'attack_execute' ? 'animate-[wild-hit_0.5s_ease-out]' : ''}`}>
              {/* Ground glow under wild Pokemon */}
              <div
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-40 h-6 rounded-full blur-lg"
                style={{ background: typeColor.glow, opacity: 0.3 }}
              />
              <div className="absolute inset-0 blur-[60px] scale-150" style={{ background: typeColor.glow, opacity: 0.5 }} />
              {/* Orbiting particles around wild Pokemon */}
              {!isAttackPhase && phase === 'battle' && [...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full animate-[orbit-pokemon_6s_linear_infinite]"
                  style={{
                    background: typeColor.primary,
                    boxShadow: `0 0 6px ${typeColor.glow}`,
                    animationDelay: `${i * -0.75}s`,
                    ['--orbit-radius' as string]: `${70 + (i % 3) * 15}px`,
                  }}
                />
              ))}
              <img
                src={getAnimatedFrontSprite(pokemon.id)}
                alt={pokemon.name}
                className={`relative w-40 h-40 md:w-52 md:h-52 object-contain drop-shadow-2xl transition-all duration-200 ${phase === 'attack_execute' ? 'brightness-[3]' : ''
                  } ${phase === 'battle' ? 'animate-[pokemon-idle-battle_3s_ease-in-out_infinite]' : ''}`}
                style={{ imageRendering: 'pixelated' }}
              />

              {/* Damage Number with impact flash */}
              {phase === 'attack_execute' && (damageDealt > 0 || effectivenessText) && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2">
                  {damageDealt > 0 && (
                    <>
                      <div
                        className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full animate-[impact-circle_0.4s_ease-out_forwards]"
                        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)' }}
                      />
                      <div className="animate-[damage-fly_0.8s_ease-out_forwards]">
                        <span
                          className="text-4xl font-black text-red-400"
                          style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '3px 3px 0 #000, 0 0 20px rgba(239,68,68,0.8)' }}
                        >
                          -{damageDealt}
                        </span>
                      </div>
                    </>
                  )}
                  {effectivenessText && (
                    <div className="absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap animate-[fade-in_0.3s_ease-out_forwards]">
                      <span
                        className={`text-sm font-bold ${
                          effectivenessText.includes('Súper') ? 'text-emerald-400' :
                          effectivenessText.includes('No muy') || effectivenessText.includes('No afecta') ? 'text-slate-400' :
                          effectivenessText.includes('Falló') ? 'text-amber-400' :
                          effectivenessText.includes('Crítico') ? 'text-yellow-400' : 'text-white'
                        }`}
                        style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '2px 2px 0 #000' }}
                      >
                        {effectivenessText}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* === ATTACK CINEMATIC - Player Pokemon === */}
          {isAttackPhase && (
            <div className="absolute bottom-32 left-0 right-0 flex items-end justify-start px-8">
              <div className={`relative ${phase === 'attack_intro' ? 'animate-[slide-in-left_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards]' :
                phase === 'attack_outro' ? 'animate-[slide-out-left_0.5s_ease-in_forwards]' :
                  phase === 'attack_counter' ? 'animate-[player-hit_0.4s_ease-out]' : ''
                }`}>
                <div className="absolute inset-0 blur-[40px] scale-125" style={{ background: playerTypeColor.glow, opacity: 0.6 }} />
                <img
                  src={getAnimatedFrontSprite(activePlayerPokemon.id)}
                  alt={activePlayerPokemon.name}
                  className={`relative w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl scale-x-[-1] ${phase === 'attack_counter' ? 'brightness-[3]' : ''
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

              {/* Action Buttons Panel */}
              <div
                className="rounded-2xl p-4 backdrop-blur-md"
                style={{
                  background: 'linear-gradient(180deg, rgba(20,20,40,0.95) 0%, rgba(10,10,25,0.98) 100%)',
                  border: `3px solid ${typeColor.primary}60`,
                  boxShadow: `0 -10px 40px ${typeColor.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
                }}
              >
                {/* Main row: Attack + Capture + Flee + Info */}
                <div className="grid grid-cols-3 gap-3">
                  {/* ATTACK Button - opens move selection */}
                  <button
                    onClick={handleAttack}
                    disabled={hasAttacked}
                    onMouseEnter={() => setHoveredButton('attack')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className={`relative group rounded-xl overflow-hidden transition-all duration-200 ${hasAttacked ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                    style={{
                      background: hasAttacked ? '#1a1a2e' : 'linear-gradient(180deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%)',
                      boxShadow: hasAttacked ? 'none' : '0 6px 0 #450a0a, inset 0 1px 0 rgba(255,255,255,0.2)',
                    }}
                  >
                    <div className="px-4 py-4 flex flex-col items-center gap-2">
                      <svg className={`w-8 h-8 ${hasAttacked ? 'text-slate-600' : 'text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
                        <path d="M13 19l6-6" />
                        <path d="M16 16l4 4" />
                        <path d="M19 21l2-2" />
                      </svg>
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${hasAttacked ? 'text-slate-600' : 'text-white'}`} style={{ fontFamily: '"Press Start 2P", monospace' }}>
                        {hasAttacked ? 'Usado' : 'Atacar'}
                      </span>
                    </div>
                  </button>

                  {/* CAPTURE Button */}
                  <button
                    onClick={handleCapture}
                    onMouseEnter={() => setHoveredButton('capture')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className="relative group rounded-xl overflow-hidden transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
                      boxShadow: '0 6px 0 #78350f, inset 0 1px 0 rgba(255,255,255,0.2)',
                    }}
                  >
                    <div className="px-4 py-4 flex flex-col items-center gap-2">
                      <div className="relative w-8 h-8">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-red-500 to-red-600 border-2 border-slate-900 overflow-hidden">
                          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 bg-slate-900" />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-slate-900" />
                          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-slate-100 to-white" />
                        </div>
                        <div className="absolute inset-0 rounded-full animate-ping bg-amber-400/30" style={{ animationDuration: '2s' }} />
                      </div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wide" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                        Capturar
                      </span>
                    </div>
                  </button>

                  {/* FLEE Button */}
                  <button
                    onClick={handleFlee}
                    onMouseEnter={() => setHoveredButton('flee')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className="relative group rounded-xl overflow-hidden transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(180deg, #475569 0%, #334155 50%, #1e293b 100%)',
                      boxShadow: '0 6px 0 #0f172a, inset 0 1px 0 rgba(255,255,255,0.1)',
                    }}
                  >
                    <div className="px-4 py-4 flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 4v4l4-2" />
                        <path d="M5 12h14" />
                        <path d="M13 16v4l4-2" />
                        <path d="M19 12l-6-6" />
                        <path d="M19 12l-6 6" />
                      </svg>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wide" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                        Huir
                      </span>
                    </div>
                  </button>
                </div>

                {/* Info toggle button */}
                <button
                  onClick={() => setShowInfoOverlay(v => !v)}
                  className="mt-3 w-full py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 transition-all"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {showInfoOverlay ? 'Ocultar Info' : 'Ver Info Pokémon'}
                </button>
              </div>
            </div>
          )}

          {/* === MOVE SELECT OVERLAY === */}
          {isMoveSelect && (
            <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
              <div className="w-full max-w-md p-4 pb-6 animate-[slide-up_0.3s_ease-out]">
                <div
                  className="rounded-2xl p-4 backdrop-blur-md"
                  style={{
                    background: 'linear-gradient(180deg, rgba(20,20,40,0.98) 0%, rgba(10,10,25,0.99) 100%)',
                    border: `3px solid ${typeColor.primary}60`,
                    boxShadow: `0 -10px 40px ${typeColor.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
                  }}
                >
                  <div className="text-center mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      Elegir Movimiento
                    </span>
                  </div>

                  {/* 2x2 Move Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {activePlayerPokemon.moves.map((move, i) => {
                      const hasPP = localPP[i] > 0;
                      const isStab = activePlayerPokemon.types.includes(move.type);
                      const isUsable = hasPP && move.category !== 'status';
                      const moveTypeColor = TYPE_COLORS[move.type] || TYPE_COLORS.normal;

                      return (
                        <button
                          key={move.id}
                          onClick={() => isUsable && handleMoveSelect(move, i)}
                          disabled={!isUsable}
                          className={`relative rounded-lg overflow-hidden text-left transition-all duration-100 ${
                            isUsable ? 'hover:scale-[1.03] active:scale-[0.97] cursor-pointer' : 'opacity-40 cursor-not-allowed'
                          }`}
                          style={{
                            background: isUsable
                              ? `linear-gradient(135deg, ${moveTypeColor.dark}cc 0%, #0a0a15ee 100%)`
                              : '#1a1a2e',
                            border: `2px solid ${isUsable ? moveTypeColor.primary + '80' : '#333'}`,
                          }}
                        >
                          {/* Type color bar */}
                          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: moveTypeColor.primary }} />

                          <div className="pl-3 pr-2 py-2.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              {/* Category icon */}
                              <span className="text-[10px]">
                                {move.category === 'physical' ? '⚔️' : move.category === 'special' ? '✨' : '🛡️'}
                              </span>
                              <span className="text-[10px] font-bold text-white truncate" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                                {move.name}
                              </span>
                              {isStab && hasPP && (
                                <span className="text-[7px] px-1 py-0.5 rounded bg-amber-500/30 text-amber-300 font-bold">STAB</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[7px] px-1.5 py-0.5 rounded text-white font-bold"
                                style={{ background: moveTypeColor.primary }}
                              >
                                {move.type.toUpperCase()}
                              </span>
                              {move.power > 0 && (
                                <span className="text-[9px] text-slate-400 font-mono">Pow {move.power}</span>
                              )}
                              <span className={`text-[9px] font-mono font-bold ${
                                !hasPP ? 'text-red-400' : localPP[i] <= 1 ? 'text-amber-400' : 'text-slate-300'
                              }`}>
                                {localPP[i]}/{move.pp}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Cancel */}
                  <button
                    onClick={handleCancelMoveSelect}
                    className="mt-3 w-full py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 transition-all"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* === INFO OVERLAY — Wild Pokemon stats/moves/ability === */}
          {showInfoOverlay && phase === 'battle' && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]" onClick={() => setShowInfoOverlay(false)}>
              <div className="w-full max-w-sm mx-4 animate-[result-pop_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
                <div
                  className="rounded-xl p-4 overflow-hidden"
                  style={{
                    background: `linear-gradient(180deg, ${typeColor.dark}ee 0%, #0a0a15f0 100%)`,
                    border: `3px solid ${typeColor.primary}`,
                    boxShadow: `0 0 30px ${typeColor.glow}`,
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-white uppercase" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      {pokemon.name}
                    </span>
                    <div className="flex gap-1">
                      {pokemon.types.map(type => (
                        <span key={type} className="px-2 py-0.5 text-[7px] font-bold uppercase rounded text-white"
                          style={{ background: (TYPE_COLORS[type] || TYPE_COLORS.normal).primary }}>
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Ability */}
                  <div className="mb-3 px-2 py-1.5 rounded bg-slate-800/60 border border-slate-700">
                    <span className="text-[8px] text-slate-500 block">HABILIDAD</span>
                    <span className="text-[10px] font-bold text-white" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      {pokemon.ability.name}
                    </span>
                    <span className="text-[8px] text-slate-400 block mt-0.5">{pokemon.ability.description}</span>
                  </div>

                  {/* 6-Stat Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
                    {[
                      { label: 'HP', value: pokemon.hp, color: '#22C55E' },
                      { label: 'SPA', value: pokemon.spa, color: '#A855F7' },
                      { label: 'ATK', value: pokemon.atk, color: '#EF4444' },
                      { label: 'SPD', value: pokemon.spd, color: '#14B8A6' },
                      { label: 'DEF', value: pokemon.def, color: '#3B82F6' },
                      { label: 'SPE', value: pokemon.spe, color: '#F59E0B' },
                    ].map(stat => (
                      <div key={stat.label} className="flex items-center gap-1.5">
                        <span className="w-8 text-[8px] font-bold text-slate-400" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                          {stat.label}
                        </span>
                        <div className="flex-1 h-2 bg-slate-800 rounded-sm overflow-hidden">
                          <div className="h-full rounded-sm" style={{ width: `${Math.min(100, (stat.value / 200) * 100)}%`, background: stat.color }} />
                        </div>
                        <span className="w-6 text-[8px] font-bold text-white text-right" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Moves */}
                  <div className="space-y-1">
                    <span className="text-[8px] text-slate-500 font-bold">MOVIMIENTOS</span>
                    {pokemon.moves.map(move => {
                      const mColor = TYPE_COLORS[move.type] || TYPE_COLORS.normal;
                      return (
                        <div key={move.id} className="flex items-center gap-2 px-2 py-1 rounded bg-slate-800/40 border-l-2" style={{ borderColor: mColor.primary }}>
                          <span className="text-[10px]">{move.category === 'physical' ? '⚔️' : move.category === 'special' ? '✨' : '🛡️'}</span>
                          <span className="text-[9px] font-bold text-white flex-1 truncate">{move.name}</span>
                          <span className="text-[7px] px-1 py-0.5 rounded text-white font-bold" style={{ background: mColor.primary }}>
                            {move.type.toUpperCase()}
                          </span>
                          {move.power > 0 && <span className="text-[8px] text-slate-400 font-mono">{move.power}</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Close */}
                  <button
                    onClick={() => setShowInfoOverlay(false)}
                    className="mt-3 w-full py-2 rounded-lg text-[9px] font-bold uppercase text-slate-400 hover:text-white bg-slate-800/50 border border-slate-700 transition-all"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* === CAPTURE RING - POKEMON GO STYLE === */}
          {(isRingPhase || phase === 'ring_result') && (
            <div
              className="absolute inset-0 flex items-center justify-center z-30 cursor-pointer"
              onClick={isRingPhase ? handleRingTap : undefined}
            >
              {/* Premium ring background */}
              <div className="absolute inset-0" style={{
                background: `radial-gradient(ellipse at 50% 50%, ${typeColor.dark}40 0%, #0a0a0f 60%)`,
              }} />
              {/* Scanlines for ring phase */}
              <div
                className="absolute inset-0 pointer-events-none opacity-30"
                style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)' }}
              />
              {/* Vignette */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)]" />
              {/* Ambient particles for ring phase */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full animate-[float-up-ambient_var(--dur)_linear_infinite]"
                    style={{
                      left: `${10 + i * 8}%`,
                      bottom: '-5%',
                      width: 2 + (i % 3),
                      height: 2 + (i % 3),
                      background: typeColor.primary,
                      boxShadow: `0 0 4px ${typeColor.glow}`,
                      opacity: 0,
                      ['--dur' as string]: `${5 + i * 0.8}s`,
                      animationDelay: `${i * 0.6}s`,
                    }}
                  />
                ))}
              </div>

              {/* Progress dots - top */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-3">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${ringResults[i]
                      ? ringResults[i] === 'perfect' ? 'bg-green-400 border-green-400'
                        : ringResults[i] === 'great' ? 'bg-blue-400 border-blue-400'
                          : ringResults[i] === 'good' ? 'bg-yellow-400 border-yellow-400'
                            : 'bg-red-400 border-red-400'
                      : currentRingIndex === i ? 'border-white bg-white/20 animate-pulse'
                        : 'border-white/30'
                      }`}
                  />
                ))}
              </div>

              {/* Ring counter */}
              <div className="absolute top-16 left-1/2 -translate-x-1/2">
                <span className="text-white/60 text-sm font-bold">
                  RING {currentRingIndex + 1} / 3
                </span>
              </div>

              {/* Main capture area */}
              <div className="relative">
                {/* Orbiting particles around target circle */}
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full animate-[orbit-ring_8s_linear_infinite]"
                    style={{
                      background: typeColor.primary,
                      boxShadow: `0 0 6px ${typeColor.glow}`,
                      animationDelay: `${i * -1.33}s`,
                    }}
                  />
                ))}

                {/* Target circle with VISIBLE ZONES */}
                <div
                  className="w-64 h-64 md:w-80 md:h-80 rounded-full relative overflow-hidden"
                  style={{
                    background: '#1a1a2e',
                    border: `3px solid ${typeColor.primary}`,
                    boxShadow: `0 0 40px ${typeColor.glow}`,
                  }}
                >
                  {/* MISS zone - outer red ring */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'radial-gradient(circle, transparent 60%, rgba(239,68,68,0.3) 60%, rgba(239,68,68,0.15) 100%)',
                    }}
                  />

                  {/* GOOD zone - yellow ring */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: `${(100 - RING_ZONES[currentRingIndex].good) / 2}%`,
                      background: 'rgba(250,204,21,0.25)',
                      border: '2px solid rgba(250,204,21,0.6)',
                    }}
                  />

                  {/* GREAT zone - blue ring */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      inset: `${(100 - RING_ZONES[currentRingIndex].great) / 2}%`,
                      background: 'rgba(59,130,246,0.3)',
                      border: '2px solid rgba(59,130,246,0.7)',
                    }}
                  />

                  {/* PERFECT zone - green center (THE GOAL!) */}
                  <div
                    className="absolute rounded-full animate-pulse"
                    style={{
                      inset: `${(100 - RING_ZONES[currentRingIndex].perfect) / 2}%`,
                      background: 'rgba(34,197,94,0.4)',
                      border: '3px solid rgba(34,197,94,0.9)',
                      boxShadow: '0 0 20px rgba(34,197,94,0.5)',
                    }}
                  />

                  {/* Zone labels */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] text-red-400/80 font-bold">MISS</div>
                  <div
                    className="absolute text-[8px] text-yellow-400/90 font-bold"
                    style={{
                      top: `${(100 - RING_ZONES[currentRingIndex].good) / 2 + 2}%`,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  >GOOD</div>
                  <div
                    className="absolute text-[8px] text-blue-400 font-bold"
                    style={{
                      top: `${(100 - RING_ZONES[currentRingIndex].great) / 2 + 2}%`,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  >GREAT</div>

                  {/* Shrinking ring - THE INDICATOR */}
                  {isRingPhase && (
                    <div
                      className="absolute top-1/2 left-1/2 rounded-full pointer-events-none"
                      style={{
                        width: `${currentRingSize}%`,
                        height: `${currentRingSize}%`,
                        transform: 'translate(-50%, -50%)',
                        border: `4px solid ${currentRingSize <= RING_ZONES[currentRingIndex].perfect ? '#22c55e' :
                            currentRingSize <= RING_ZONES[currentRingIndex].great ? '#3b82f6' :
                              currentRingSize <= RING_ZONES[currentRingIndex].good ? '#facc15' :
                                '#fff'
                          }`,
                        boxShadow: `0 0 15px ${currentRingSize <= RING_ZONES[currentRingIndex].perfect ? 'rgba(34,197,94,1)' :
                            currentRingSize <= RING_ZONES[currentRingIndex].great ? 'rgba(59,130,246,0.8)' :
                              currentRingSize <= RING_ZONES[currentRingIndex].good ? 'rgba(250,204,21,0.6)' :
                                'rgba(255,255,255,0.4)'
                          }`,
                      }}
                    />
                  )}

                  {/* Pokemon in center - BIG and clear with breathing */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 animate-[pokemon-idle_3s_ease-in-out_infinite]" style={{ transformOrigin: 'center center' }}>
                    <img
                      src={getAnimatedFrontSprite(pokemon.id)}
                      alt={pokemon.name}
                      className="w-28 h-28 md:w-36 md:h-36"
                      style={{
                        imageRendering: 'pixelated',
                        filter: `drop-shadow(0 0 15px ${typeColor.glow})`,
                      }}
                    />
                  </div>

                  {/* Tap feedback flash */}
                  {ringTapFeedback && (
                    <div className="absolute inset-0 rounded-full bg-white/50 animate-[flash-out_0.2s_ease-out_forwards]" />
                  )}
                </div>

                {/* Result display with enhanced feedback */}
                {phase === 'ring_result' && lastRingResult && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* White screen flash burst */}
                    <div className="absolute inset-[-50%] rounded-full bg-white/40 animate-[flash-out_0.3s_ease-out_forwards]" />
                    {/* Radial particle burst from center */}
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute left-1/2 top-1/2 w-2 h-6 rounded-full animate-[ring-result-burst_0.5s_ease-out_forwards]"
                        style={{
                          transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
                          background: lastRingResult === 'perfect' ? '#22c55e' :
                            lastRingResult === 'great' ? '#3b82f6' :
                              lastRingResult === 'good' ? '#facc15' : '#ef4444',
                          animationDelay: `${i * 0.03}s`,
                        }}
                      />
                    ))}
                    <div
                      className="text-center animate-[result-text-bounce_0.4s_cubic-bezier(0.34,1.56,0.64,1)]"
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      <div className={`text-5xl md:text-6xl font-black ${lastRingResult === 'perfect' ? 'text-green-400' :
                        lastRingResult === 'great' ? 'text-blue-400' :
                          lastRingResult === 'good' ? 'text-yellow-400' : 'text-red-400'
                        }`}
                        style={{
                          textShadow: `0 0 30px ${lastRingResult === 'perfect' ? 'rgba(34,197,94,0.8)' :
                            lastRingResult === 'great' ? 'rgba(59,130,246,0.8)' :
                              lastRingResult === 'good' ? 'rgba(250,204,21,0.8)' : 'rgba(239,68,68,0.8)'
                            }, 0 0 60px ${lastRingResult === 'perfect' ? 'rgba(34,197,94,0.4)' :
                              lastRingResult === 'great' ? 'rgba(59,130,246,0.4)' :
                                lastRingResult === 'good' ? 'rgba(250,204,21,0.4)' : 'rgba(239,68,68,0.4)'
                            }, 3px 3px 0 #000`,
                        }}
                      >
                        {lastRingResult === 'perfect' ? 'PERFECT!' :
                          lastRingResult === 'great' ? 'GREAT!' :
                            lastRingResult === 'good' ? 'GOOD!' : 'MISS!'}
                      </div>
                      <div className={`text-lg mt-2 ${lastRingResult === 'perfect' ? 'text-green-300' :
                        lastRingResult === 'great' ? 'text-blue-300' :
                          lastRingResult === 'good' ? 'text-yellow-300' : 'text-red-300'
                        }`}>
                        {lastRingResult === 'perfect' ? '+20%' :
                          lastRingResult === 'great' ? '+12%' :
                            lastRingResult === 'good' ? '+5%' : '-5%'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Instruction - only during ring phase */}
              {isRingPhase && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center">
                  {/* Pulsing ring below TAP */}
                  <div className="relative inline-block">
                    <div
                      className="absolute -inset-4 rounded-full animate-[tap-ring-pulse_1.5s_ease-in-out_infinite]"
                      style={{ border: `2px solid ${typeColor.primary}40` }}
                    />
                    <div
                      className="text-white text-lg font-bold animate-pulse"
                      style={{
                        fontFamily: '"Press Start 2P", monospace',
                        textShadow: `0 0 20px ${typeColor.glow}`,
                      }}
                    >
                      TAP!
                    </div>
                  </div>
                  <div className="text-white/50 text-xs mt-4">
                    Tap when the ring is smallest
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === THROW ANIMATION WITH SHOWDOWN SPRITE === */}
          {phase === 'throw' && (
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#080810] to-slate-950 z-30 overflow-hidden">
              {/* Pokeball throw arc with Showdown sprite */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-[throw-arc_1s_cubic-bezier(0.22,0.61,0.36,1)_forwards]">
                  {/* Motion blur trail */}
                  <div className="absolute inset-[-50%] animate-[motion-blur_1s_ease-out_forwards] opacity-50">
                    <div
                      className="w-full h-full rounded-full"
                      style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.6) 0%, transparent 70%)' }}
                    />
                  </div>

                  {/* Trailing energy particles */}
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full animate-[throw-trail_0.4s_ease-out_forwards]"
                      style={{
                        background: i % 2 === 0 ? '#ef4444' : '#facc15',
                        boxShadow: `0 0 6px ${i % 2 === 0 ? 'rgba(239,68,68,0.8)' : 'rgba(250,204,21,0.8)'}`,
                        animationDelay: `${0.1 + i * 0.08}s`,
                        transform: `translate(-50%, -50%) translate(${-10 - i * 5}px, ${5 + i * 3}px)`,
                      }}
                    />
                  ))}

                  {/* Showdown Pokeball Sprite - spinning */}
                  <div className="relative animate-[throw-spin_0.25s_linear_infinite]">
                    <img
                      src="https://play.pokemonshowdown.com/sprites/itemicons/poke-ball.png"
                      alt="Pokeball"
                      className="w-16 h-16 md:w-20 md:h-20"
                      style={{
                        imageRendering: 'pixelated',
                        transform: 'scale(2.5)',
                        filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.8)) drop-shadow(0 0 40px rgba(239,68,68,0.4))',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Bigger impact flash at landing with burst particles */}
              <div className="absolute inset-0 flex items-center justify-center animate-[impact-flash_1s_ease-out_forwards] opacity-0">
                <div className="w-64 h-64 rounded-full bg-white/50 blur-3xl" />
                {/* Radial burst particles at impact */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 rounded-full bg-white animate-[impact-burst-particle_0.5s_ease-out_forwards]"
                    style={{
                      transform: `rotate(${i * 45}deg) translateY(-60px)`,
                      animationDelay: '0.9s',
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* === POKEBALL CAPTURE ANIMATION WITH SHOWDOWN SPRITE === */}
          {phase === 'shaking' && (
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#080810] to-slate-950 z-30 overflow-hidden">
              {/* Subtle ambient glow with tension pulse */}
              <div
                className="absolute inset-0 animate-[tension-pulse_0.7s_ease-in-out_infinite]"
                style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(239,68,68,0.15) 0%, transparent 50%)' }}
              />

              <div className="relative h-full flex flex-col items-center justify-center">
                {/* Hatch Counter Stars - positioned above pokeball */}
                <div className="flex justify-center gap-4 md:gap-6 mb-8 md:mb-12">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
                      {/* Star arrival effects */}
                      {shakeIndex === i && (
                        <>
                          {/* Bright flash */}
                          <div className="absolute inset-[-100%] animate-[star-flash-burst_0.4s_ease-out_forwards]">
                            <div
                              className="w-full h-full rounded-full"
                              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(250,204,21,0.6) 30%, transparent 60%)' }}
                            />
                          </div>
                          {/* Sparkle ring */}
                          {[...Array(8)].map((_, idx) => (
                            <div
                              key={idx}
                              className="absolute w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-yellow-200 animate-[sparkle-explode_0.5s_ease-out_forwards]"
                              style={{
                                left: '50%',
                                top: '50%',
                                transformOrigin: 'center',
                                transform: `rotate(${idx * 45}deg) translateY(-20px)`,
                                animationDelay: `${idx * 0.03}s`,
                              }}
                            />
                          ))}
                        </>
                      )}

                      {/* The star itself */}
                      <svg
                        className={`w-10 h-10 md:w-14 md:h-14 transition-all duration-300 ${shakeIndex >= i
                          ? 'text-yellow-400 scale-110 animate-[star-pop-in_0.3s_ease-out]'
                          : 'text-slate-800 scale-75'
                          }`}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        style={{
                          filter: shakeIndex >= i
                            ? 'drop-shadow(0 0 15px rgba(250,204,21,1)) drop-shadow(0 0 30px rgba(250,204,21,0.5))'
                            : 'none',
                        }}
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                  ))}
                </div>

                {/* Main Pokeball Container */}
                <div className="relative">
                  {/* Energy ripple on each shake */}
                  {shakeIndex >= 1 && shakeIndex <= 3 && (
                    <div
                      key={`ripple-${shakeIndex}`}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full pointer-events-none z-20 animate-[ripple-expand_0.6s_ease-out_forwards]"
                      style={{
                        border: `2px solid ${typeColor.primary}`,
                        boxShadow: `0 0 10px ${typeColor.glow}`,
                      }}
                    />
                  )}

                  {/* Star emerging from pokeball center and flying up */}
                  {shakeIndex >= 1 && shakeIndex <= 3 && (
                    <div
                      key={`star-${shakeIndex}`}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
                    >
                      {/* Flying star with trail */}
                      <div
                        className="relative"
                        style={{
                          animation: `star-emerge-fly-${shakeIndex} 0.55s cubic-bezier(0.22, 0.61, 0.36, 1) forwards`,
                        }}
                      >
                        {/* Glow trail behind star */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-16 animate-[trail-fade_0.55s_ease-out_forwards]">
                          <div
                            className="w-full h-full"
                            style={{ background: 'linear-gradient(to bottom, rgba(250,204,21,0) 0%, rgba(250,204,21,0.6) 50%, rgba(255,255,255,0.8) 100%)' }}
                          />
                        </div>

                        {/* Main star */}
                        <svg
                          className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 animate-[star-spin-fly_0.55s_linear_forwards]"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          style={{
                            filter: 'drop-shadow(0 0 12px rgba(250,204,21,1)) drop-shadow(0 0 25px rgba(255,255,255,0.8))',
                          }}
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Pokeball with single wobble per shake - micro-shake container */}
                  {shakeIndex === 0 ? (
                    <div
                      className="relative"
                      style={{ transformOrigin: 'center bottom' }}
                    >
                      <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 rounded-full z-10 pointer-events-none opacity-0"
                      />
                      <img
                        src="https://play.pokemonshowdown.com/sprites/itemicons/poke-ball.png"
                        alt="Pokeball"
                        className="w-16 h-16 md:w-20 md:h-20"
                        style={{
                          imageRendering: 'pixelated',
                          transform: 'scale(2)',
                          transformOrigin: 'center',
                          filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      key={`wobble-${shakeIndex}`}
                      className="relative animate-[pokeball-single-wobble_0.5s_ease-in-out]"
                      style={{ transformOrigin: 'center bottom' }}
                    >
                      {/* Center button glow overlay */}
                      <div
                        key={`glow-${shakeIndex}`}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 rounded-full z-10 pointer-events-none opacity-100 animate-[center-button-flash_0.3s_ease-out]"
                        style={{
                          background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(250,204,21,0.8) 40%, rgba(250,204,21,0) 70%)',
                        }}
                      />
                      <img
                        src="https://play.pokemonshowdown.com/sprites/itemicons/poke-ball.png"
                        alt="Pokeball"
                        className="w-16 h-16 md:w-20 md:h-20"
                        style={{
                          imageRendering: 'pixelated',
                          transform: 'scale(2)',
                          transformOrigin: 'center',
                          filter: 'drop-shadow(0 0 12px rgba(239,68,68,0.6)) drop-shadow(0 0 20px rgba(250,204,21,0.4))',
                        }}
                      />
                    </div>
                  )}

                  {/* Ground shadow */}
                  {shakeIndex === 0 ? (
                    <div
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-2 md:w-16 md:h-3 rounded-full blur-sm bg-black/30"
                    />
                  ) : (
                    <div
                      key={`shadow-${shakeIndex}`}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-2 md:w-16 md:h-3 rounded-full blur-sm bg-black/50 animate-[shadow-single-wobble_0.5s_ease-in-out]"
                    />
                  )}
                </div>

                {/* Tension dots */}
                <div className="mt-10 md:mt-14 text-center">
                  <div
                    className={`text-xl md:text-2xl tracking-[0.4em] ${shakeIndex > 0 ? 'text-yellow-400/70 animate-[dots-pulse_0.8s_ease-in-out_infinite]' : 'text-slate-600'
                      }`}
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    . . .
                  </div>
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
                    {/* Screen flash */}
                    <div className="fixed inset-0 bg-white/40 animate-[flash-out_0.3s_ease-out_forwards] pointer-events-none" />

                    {/* Golden energy explosion - 16 radial particles */}
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(16)].map((_, i) => (
                        <div
                          key={`energy-${i}`}
                          className="absolute left-1/2 top-1/2 w-2 h-8 rounded-full animate-[golden-burst_0.8s_ease-out_forwards]"
                          style={{
                            transform: `translate(-50%, -50%) rotate(${i * 22.5}deg)`,
                            background: `linear-gradient(to bottom, ${i % 2 === 0 ? '#FFD700' : '#F59E0B'}, transparent)`,
                            animationDelay: `${i * 0.03}s`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Enhanced confetti - 40 pieces with varied shapes */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      {confettiParticles.map(p => (
                        <div
                          key={p.id}
                          className="absolute animate-[confetti-fall-v2_2.5s_ease-out_forwards]"
                          style={{
                            left: `${p.x}%`,
                            top: '-5%',
                            animationDelay: `${p.delay}s`,
                            ['--drift' as string]: `${p.drift}px`,
                          }}
                        >
                          <div
                            style={{
                              width: p.size,
                              height: p.size,
                              background: p.color,
                              transform: `rotate(${p.rotation}deg)`,
                              borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'diamond' ? '2px' : '2px',
                              ...(p.shape === 'diamond' ? { transform: `rotate(45deg)` } : {}),
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Radial light rays behind text */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] animate-[radial-rays_8s_linear_infinite] opacity-30 pointer-events-none"
                      style={{
                        background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,215,0,0.4) 10deg, transparent 20deg, transparent 45deg, rgba(255,215,0,0.4) 55deg, transparent 65deg, transparent 90deg, rgba(255,215,0,0.4) 100deg, transparent 110deg, transparent 135deg, rgba(255,215,0,0.4) 145deg, transparent 155deg, transparent 180deg, rgba(255,215,0,0.4) 190deg, transparent 200deg, transparent 225deg, rgba(255,215,0,0.4) 235deg, transparent 245deg, transparent 270deg, rgba(255,215,0,0.4) 280deg, transparent 290deg, transparent 315deg, rgba(255,215,0,0.4) 325deg, transparent 335deg, transparent 360deg)',
                      }}
                    />

                    {/* Golden star SVG */}
                    <div className="mb-6 animate-[star-entrance_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
                      <svg className="w-20 h-20 mx-auto text-yellow-400" viewBox="0 0 24 24" fill="currentColor"
                        style={{ filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.9)) drop-shadow(0 0 40px rgba(255,215,0,0.5))' }}
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <h2
                      className="text-3xl md:text-4xl font-black text-emerald-400 mb-4 animate-[title-pulse-glow_2s_ease-in-out_infinite]"
                      style={{
                        fontFamily: '"Press Start 2P", monospace',
                        textShadow: '0 0 40px rgba(34,197,94,0.8), 0 0 80px rgba(34,197,94,0.4), 4px 4px 0 #065f46',
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
                    {/* Red screen flash */}
                    <div className="fixed inset-0 bg-red-500/20 animate-[flash-out_0.4s_ease-out_forwards] pointer-events-none" />

                    {/* Pokeball burst-open effect - 8 red energy lines */}
                    <div className="absolute inset-0 pointer-events-none">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute left-1/2 top-1/2 w-1.5 h-10 rounded-full animate-[escape-burst_0.6s_ease-out_forwards]"
                          style={{
                            transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
                            background: 'linear-gradient(to bottom, #ef4444, transparent)',
                            animationDelay: `${i * 0.04}s`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Pokemon escape sprite - scales up and fades */}
                    <div className="mb-6 animate-[escape-fly_1s_ease-out_forwards]">
                      <img
                        src={getAnimatedFrontSprite(pokemon.id)}
                        alt={pokemon.name}
                        className="w-20 h-20 mx-auto"
                        style={{
                          imageRendering: 'pixelated',
                          filter: `drop-shadow(0 0 15px ${typeColor.glow})`,
                        }}
                      />
                    </div>
                    <h2
                      className="text-3xl md:text-4xl font-black text-red-400 mb-4 animate-[shake-text_0.5s_ease-out]"
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
      )
      }

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

        @keyframes screen-vibrate {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-2px, 1px); }
          20% { transform: translate(2px, -1px); }
          30% { transform: translate(-1px, 2px); }
          40% { transform: translate(1px, -2px); }
          50% { transform: translate(-2px, -1px); }
          60% { transform: translate(2px, 1px); }
          70% { transform: translate(-1px, -2px); }
          80% { transform: translate(1px, 2px); }
          90% { transform: translate(-2px, 1px); }
        }

        @keyframes energy-line-burst {
          0% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--r, 0deg)) translateY(-40px) scaleY(0); }
          30% { opacity: 1; transform: translate(-50%, -50%) rotate(var(--r, 0deg)) translateY(-60px) scaleY(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--r, 0deg)) translateY(-100px) scaleY(0.5); }
        }

        @keyframes silhouette-appear {
          0% { transform: scale(0.3) translateY(80px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }

        @keyframes rising-particle {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          20% { opacity: 0.8; transform: translateY(-20px) scale(1); }
          100% { transform: translateY(-120px) scale(0.3); opacity: 0; }
        }

        @keyframes reveal-pokemon {
          0% { transform: scale(1.3); filter: brightness(4); }
          100% { transform: scale(1); filter: brightness(1); }
        }

        @keyframes particle-burst-reveal {
          0% { opacity: 1; transform: translate(-50%, -50%) rotate(var(--r, 0deg)) translateY(0) scaleY(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--r, 0deg)) translateY(-100px) scaleY(0.3); }
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

        @keyframes impact-circle {
          0% { opacity: 0.8; transform: translate(-50%, 0) scale(0.5); }
          100% { opacity: 0; transform: translate(-50%, 0) scale(2); }
        }

        @keyframes pokemon-idle-battle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes orbit-pokemon {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(var(--orbit-radius, 70px)) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg) translateX(var(--orbit-radius, 70px)) rotate(-360deg); }
        }

        @keyframes orbit-ring {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(160px) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg) translateX(160px) rotate(-360deg); }
        }

        @keyframes float-up-ambient {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          10% { opacity: 0.5; transform: translateY(-10vh) scale(1); }
          90% { opacity: 0.3; }
          100% { transform: translateY(-110vh) scale(0.5); opacity: 0; }
        }

        @keyframes ring-result-burst {
          0% { opacity: 1; transform: translate(-50%, -50%) rotate(var(--r, 0deg)) translateY(0) scaleY(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--r, 0deg)) translateY(-80px) scaleY(0.3); }
        }

        @keyframes result-text-bounce {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); }
          80% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes tap-ring-pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.4); opacity: 0; }
        }

        /* === PREMIUM THROW ANIMATIONS === */
        @keyframes throw-arc {
          0% {
            transform: translate(-50vw, 100vh) scale(0.3) rotate(0deg);
            opacity: 0;
          }
          15% {
            transform: translate(-30vw, 40vh) scale(0.6) rotate(180deg);
            opacity: 1;
          }
          40% {
            transform: translate(0, -10vh) scale(1) rotate(360deg);
          }
          60% {
            transform: translate(0, 0) scale(1.1) rotate(450deg);
          }
          80% {
            transform: translate(0, 3vh) scale(0.95) rotate(520deg);
          }
          90% {
            transform: translate(0, 0) scale(1.05) rotate(540deg);
          }
          100% {
            transform: translate(0, 0) scale(1) rotate(540deg);
            opacity: 1;
          }
        }

        @keyframes throw-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(1080deg); }
        }

        @keyframes throw-trail {
          0% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) translate(-30px, 15px) scale(0); }
        }

        @keyframes motion-blur {
          0%, 60% { opacity: 0.6; transform: scale(1.5) translateX(-20px); }
          100% { opacity: 0; transform: scale(1) translateX(0); }
        }

        @keyframes impact-flash {
          0%, 90% { opacity: 0; }
          95% { opacity: 1; }
          100% { opacity: 0; }
        }

        @keyframes impact-burst-particle {
          0% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(0) scale(1); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(-80px) scale(0); }
        }

        /* === POKEBALL SINGLE WOBBLE ANIMATION === */
        @keyframes pokeball-single-wobble {
          0% { transform: rotate(0deg); }
          20% { transform: rotate(-20deg); }
          40% { transform: rotate(18deg); }
          60% { transform: rotate(-10deg); }
          80% { transform: rotate(5deg); }
          100% { transform: rotate(0deg); }
        }

        @keyframes shadow-single-wobble {
          0% { transform: translateX(-50%) scaleX(1); }
          20% { transform: translateX(-60%) scaleX(0.85); }
          40% { transform: translateX(-40%) scaleX(0.85); }
          60% { transform: translateX(-55%) scaleX(0.92); }
          80% { transform: translateX(-47%) scaleX(0.96); }
          100% { transform: translateX(-50%) scaleX(1); }
        }

        /* === SHAKE PHASE EFFECTS === */
        @keyframes ripple-expand {
          0% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(2.5); }
        }

        @keyframes tension-pulse {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.4; }
        }

        /* === STAR FLIGHT FROM CENTER TO TOP === */
        @keyframes star-emerge-fly-1 {
          0% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          15% {
            transform: translateY(0) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translateY(-120px) translateX(-55px) scale(0.7);
            opacity: 0;
          }
        }

        @keyframes star-emerge-fly-2 {
          0% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          15% {
            transform: translateY(0) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translateY(-120px) translateX(0) scale(0.7);
            opacity: 0;
          }
        }

        @keyframes star-emerge-fly-3 {
          0% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          15% {
            transform: translateY(0) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translateY(-120px) translateX(55px) scale(0.7);
            opacity: 0;
          }
        }

        @keyframes star-spin-fly {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes trail-fade {
          0% { opacity: 0; transform: scaleY(0); }
          20% { opacity: 0.8; transform: scaleY(1); }
          100% { opacity: 0; transform: scaleY(1.5); }
        }

        /* === STAR ARRIVAL EFFECTS === */
        @keyframes star-flash-burst {
          0% { opacity: 0; transform: scale(0.3); }
          30% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.8); }
        }

        @keyframes sparkle-explode {
          0% {
            opacity: 1;
            transform: rotate(var(--r, 0deg)) translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: rotate(var(--r, 0deg)) translateY(-30px) scale(0);
          }
        }

        @keyframes star-pop-in {
          0% { transform: scale(0) rotate(-180deg); }
          60% { transform: scale(1.3) rotate(10deg); }
          80% { transform: scale(0.9) rotate(-5deg); }
          100% { transform: scale(1.1) rotate(0deg); }
        }

        @keyframes center-button-flash {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          30% { opacity: 1; transform: translate(-50%, -50%) scale(1.5); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
        }

        @keyframes dots-pulse {
          0%, 100% { opacity: 0.5; letter-spacing: 0.3em; }
          50% { opacity: 1; letter-spacing: 0.5em; }
        }

        /* === RESULT ANIMATIONS === */
        @keyframes result-pop {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes golden-burst {
          0% { opacity: 1; transform: translate(-50%, -50%) rotate(var(--r, 0deg)) translateY(0) scaleY(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--r, 0deg)) translateY(-120px) scaleY(0.3); }
        }

        @keyframes confetti-fall-v2 {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(500px) translateX(var(--drift, 0px)) rotate(720deg); opacity: 0; }
        }

        @keyframes radial-rays {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes star-entrance {
          0% { transform: scale(0) rotate(-180deg); opacity: 0; }
          60% { transform: scale(1.2) rotate(10deg); opacity: 1; }
          80% { transform: scale(0.9) rotate(-5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }

        @keyframes title-pulse-glow {
          0%, 100% { text-shadow: 0 0 40px rgba(34,197,94,0.8), 4px 4px 0 #065f46; }
          50% { text-shadow: 0 0 60px rgba(34,197,94,1), 0 0 100px rgba(34,197,94,0.5), 4px 4px 0 #065f46; }
        }

        @keyframes escape-burst {
          0% { opacity: 1; transform: translate(-50%, -50%) rotate(var(--r, 0deg)) translateY(0) scaleY(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--r, 0deg)) translateY(-80px) scaleY(0.3); }
        }

        @keyframes escape-fly {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3) translateY(-10px); opacity: 0.8; }
          100% { transform: scale(1.8) translateY(-40px); opacity: 0; }
        }

        @keyframes shake-text {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-6px); }
          30% { transform: translateX(6px); }
          45% { transform: translateX(-4px); }
          60% { transform: translateX(4px); }
          75% { transform: translateX(-2px); }
          90% { transform: translateX(2px); }
        }

        /* === RING MINIGAME KEPT ANIMATIONS === */
        @keyframes pokemon-idle {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.03) translateY(-2px); }
        }

        @keyframes pop-in {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div >
  );
}
