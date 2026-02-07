import { useState, useEffect, useCallback, useRef } from 'react';
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
  const statTotal = pokemon.hp + pokemon.atk + pokemon.def;
  if (statTotal < 100) return 55;  // Weak pokemon: easier to catch
  if (statTotal < 150) return 45;
  if (statTotal < 200) return 35;
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
  // Base probability per shake = cube root of total desired probability
  // We add ring bonuses during shake checks, not here
  const basePerShake = Math.pow((baseRate + hpBonus) / 100, 1 / 3) * 100;
  // For UI display: show approximate total chance (assuming all "good" rings)
  const estimatedTotalChance = Math.min(95, Math.max(5, baseRate + hpBonus));

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

    // Use ring-specific zones for difficulty scaling
    const quality = getRingResult(ringIndex, currentRingSize);

    completeRing(ringIndex, quality);
  }, [phase, currentRingSize, completeRing]);

  // Shake sequence - 3 individual checks, one per shake
  // Each check determines if that shake happens
  // Only if ALL 3 shakes happen = capture success
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
    // Shake 1 (at 700ms)
    if (shakesCount >= 1) {
      shakeTimers.push(setTimeout(() => {
        playSFX('pokeball_shake', 0.5);
        setShakeIndex(1);
      }, SHAKE_INTERVAL));
    }

    // Shake 2 (at 1400ms)
    if (shakesCount >= 2) {
      shakeTimers.push(setTimeout(() => {
        playSFX('pokeball_shake', 0.5);
        setShakeIndex(2);
      }, SHAKE_INTERVAL * 2));
    }

    // Shake 3 (at 2100ms)
    if (shakesCount >= 3) {
      shakeTimers.push(setTimeout(() => {
        playSFX('pokeball_shake', 0.5);
        setShakeIndex(3);
      }, SHAKE_INTERVAL * 3));
    }

    // Go to result after appropriate time
    // Time = (shakes earned * interval) + pause, minimum 1 interval for "no shakes" case
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
              <div className="absolute inset-0 blur-[60px] scale-150" style={{ background: typeColor.glow, opacity: 0.5 }} />
              <img
                src={getAnimatedFrontSprite(pokemon.id)}
                alt={pokemon.name}
                className={`relative w-40 h-40 md:w-52 md:h-52 object-contain drop-shadow-2xl transition-all duration-200 ${phase === 'attack_execute' ? 'brightness-[3]' : ''
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
                    className={`relative group rounded-xl overflow-hidden transition-all duration-200 ${hasAttacked ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
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

          {/* === CAPTURE RING - POKEMON GO STYLE === */}
          {(isRingPhase || phase === 'ring_result') && (
            <div
              className="absolute inset-0 flex items-center justify-center z-30 cursor-pointer"
              onClick={isRingPhase ? handleRingTap : undefined}
              style={{ background: '#0a0a0f' }}
            >
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

                  {/* Pokemon in center - BIG and clear */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
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

                {/* Result display - BIG and clear */}
                {phase === 'ring_result' && lastRingResult && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="text-center animate-[pop-in_0.3s_ease-out]"
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      <div className={`text-4xl md:text-5xl font-black ${lastRingResult === 'perfect' ? 'text-green-400' :
                        lastRingResult === 'great' ? 'text-blue-400' :
                          lastRingResult === 'good' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
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
                  <div
                    className="text-white text-lg font-bold animate-pulse"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    TAP!
                  </div>
                  <div className="text-white/50 text-xs mt-2">
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

              {/* Impact flash at end */}
              <div className="absolute inset-0 flex items-center justify-center animate-[impact-flash_1s_ease-out_forwards] opacity-0">
                <div className="w-64 h-64 rounded-full bg-white/40 blur-3xl" />
              </div>
            </div>
          )}

          {/* === POKEBALL CAPTURE ANIMATION WITH SHOWDOWN SPRITE === */}
          {phase === 'shaking' && (
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#080810] to-slate-950 z-30 overflow-hidden">
              {/* Subtle ambient glow */}
              <div
                className="absolute inset-0 opacity-30"
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

                  {/* Pokeball with single wobble per shake - use fragment with key to force remount */}
                  {shakeIndex === 0 ? (
                    <div
                      className="relative"
                      style={{ transformOrigin: 'center bottom' }}
                    >
                      {/* Center button glow overlay - hidden when no shake */}
                      <div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 rounded-full z-10 pointer-events-none opacity-0"
                      />

                      {/* Pokemon Showdown Pokeball Sprite - smaller size */}
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

                      {/* Pokemon Showdown Pokeball Sprite - smaller size */}
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

        @keyframes motion-blur {
          0%, 60% { opacity: 0.6; transform: scale(1.5) translateX(-20px); }
          100% { opacity: 0; transform: scale(1) translateX(0); }
        }

        @keyframes trail-particle {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          100% {
            transform: translate(
              calc(var(--random-x, 0) * 30px),
              calc(-80vh + var(--random-y, 0) * 20px)
            ) scale(0);
            opacity: 0;
          }
        }

        @keyframes energy-pulse {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.5); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }

        @keyframes impact-flash {
          0%, 90% { opacity: 0; }
          95% { opacity: 1; }
          100% { opacity: 0; }
        }

        /* === POKEBALL SINGLE WOBBLE ANIMATION === */
        /* One wobble per shake - tilts left then right then settles */
        @keyframes pokeball-single-wobble {
          0% { transform: rotate(0deg); }
          20% { transform: rotate(-20deg); }
          40% { transform: rotate(18deg); }
          60% { transform: rotate(-10deg); }
          80% { transform: rotate(5deg); }
          100% { transform: rotate(0deg); }
        }

        /* Shadow follows the single wobble */
        @keyframes shadow-single-wobble {
          0% { transform: translateX(-50%) scaleX(1); }
          20% { transform: translateX(-60%) scaleX(0.85); }
          40% { transform: translateX(-40%) scaleX(0.85); }
          60% { transform: translateX(-55%) scaleX(0.92); }
          80% { transform: translateX(-47%) scaleX(0.96); }
          100% { transform: translateX(-50%) scaleX(1); }
        }

        /* === STAR FLIGHT FROM CENTER TO TOP === */
        /* Star emerges from pokeball center, flies to first indicator (left) */
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

        /* Star flies to second indicator (center) */
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

        /* Star flies to third indicator (right) */
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

        /* Star spinning while flying */
        @keyframes star-spin-fly {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Trail fading behind flying star */
        @keyframes trail-fade {
          0% { opacity: 0; transform: scaleY(0); }
          20% { opacity: 0.8; transform: scaleY(1); }
          100% { opacity: 0; transform: scaleY(1.5); }
        }

        /* === STAR ARRIVAL EFFECTS === */
        /* Flash burst when star arrives at indicator */
        @keyframes star-flash-burst {
          0% { opacity: 0; transform: scale(0.3); }
          30% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.8); }
        }

        /* Sparkles exploding from star arrival */
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

        /* Star popping into place */
        @keyframes star-pop-in {
          0% { transform: scale(0) rotate(-180deg); }
          60% { transform: scale(1.3) rotate(10deg); }
          80% { transform: scale(0.9) rotate(-5deg); }
          100% { transform: scale(1.1) rotate(0deg); }
        }

        /* === CENTER BUTTON EFFECTS === */
        /* Center button flash when star emerges */
        @keyframes center-button-flash {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          30% { opacity: 1; transform: translate(-50%, -50%) scale(1.5); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
        }

        /* Dots pulsing animation */
        @keyframes dots-pulse {
          0%, 100% { opacity: 0.5; letter-spacing: 0.3em; }
          50% { opacity: 1; letter-spacing: 0.5em; }
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

        /* === PREMIUM RING MINIGAME ANIMATIONS === */
        
        /* Floating background particles */
        @keyframes float-up {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          10% { opacity: 0.6; transform: translateY(-10vh) scale(1); }
          90% { opacity: 0.4; }
          100% { transform: translateY(-110vh) scale(0.5); opacity: 0; }
        }

        /* Ring pulsing glow */
        @keyframes ring-pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.5; }
        }

        /* Zone glow animation */
        @keyframes zone-glow {
          0%, 100% { opacity: 0.7; box-shadow: inset 0 0 25px rgba(52,211,153,0.4), 0 0 15px rgba(52,211,153,0.3); }
          50% { opacity: 1; box-shadow: inset 0 0 35px rgba(52,211,153,0.6), 0 0 25px rgba(52,211,153,0.5); }
        }

        /* Pokemon idle breathing */
        @keyframes pokemon-idle {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.03) translateY(-2px); }
        }

        /* Pokemon struggling - medium intensity */
        @keyframes pokemon-struggle {
          0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          25% { transform: translate(-50%, -50%) scale(1.05) rotate(-3deg) translateX(-3px); }
          50% { transform: translate(-50%, -50%) scale(0.98) rotate(0deg); }
          75% { transform: translate(-50%, -50%) scale(1.05) rotate(3deg) translateX(3px); }
        }

        /* Pokemon fierce struggle - high intensity */
        @keyframes pokemon-fierce {
          0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          10% { transform: translate(-50%, -50%) scale(1.08) rotate(-5deg) translateX(-5px); }
          30% { transform: translate(-50%, -50%) scale(0.95) rotate(3deg) translateX(3px); }
          50% { transform: translate(-50%, -50%) scale(1.1) rotate(-3deg) translateY(-5px); }
          70% { transform: translate(-50%, -50%) scale(0.97) rotate(5deg) translateX(-3px); }
          90% { transform: translate(-50%, -50%) scale(1.05) rotate(-2deg) translateX(5px); }
        }

        /* Flash burst on tap */
        @keyframes flash-burst {
          0% { opacity: 0.8; transform: scale(1); }
          100% { opacity: 0; transform: scale(2); }
        }

        /* Particle burst outward */
        @keyframes particle-burst {
          0% { opacity: 1; transform: rotate(var(--r)) translateY(0) scaleY(1); }
          100% { opacity: 0; transform: rotate(var(--r)) translateY(-120px) scaleY(0.3); }
        }

        /* Ring expanding outward */
        @keyframes ring-expand {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(2); border-width: 1px; }
        }

        /* Result flash background */
        @keyframes result-flash {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.5); }
        }

        /* Result text pop in */
        @keyframes result-text-pop {
          0% { transform: translate(-50%, -50%) scale(0) rotate(-10deg); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.2) rotate(3deg); }
          70% { transform: translate(-50%, -50%) scale(0.9) rotate(-2deg); }
          100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
        }

        /* Pokeball animations for ring minigame */
        @keyframes pokeball-idle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes pokeball-shake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-8deg); }
          40% { transform: rotate(8deg); }
          60% { transform: rotate(-5deg); }
          80% { transform: rotate(5deg); }
        }

        @keyframes pokeball-intense {
          0%, 100% { transform: rotate(0deg) scale(1); }
          10% { transform: rotate(-12deg) scale(1.1); }
          30% { transform: rotate(12deg) scale(0.95); }
          50% { transform: rotate(-10deg) scale(1.08); }
          70% { transform: rotate(10deg) scale(0.97); }
          90% { transform: rotate(-8deg) scale(1.05); }
        }

        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
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
