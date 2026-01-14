import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getAnimatedFrontSprite } from '../utils/sprites';
import type { PokemonTemplate, Player, PokemonType } from '../types/game';

interface CaptureMinigameProps {
  pokemon: PokemonTemplate;
  player: Player;
  onSuccess: () => void;
  onFail: () => void;
}

type Phase =
  | 'encounter_flash'
  | 'encounter_alert'
  | 'encounter_reveal'
  | 'encounter_intro'
  | 'ready'
  | 'throwing'
  | 'impact'
  | 'hit_react'        // NEW: Show hit feedback
  | 'miss_react'       // NEW: Show miss feedback
  | 'catching'
  | 'result';

// Type colors for visual effects
const TYPE_COLORS: Record<PokemonType, { primary: string; secondary: string; glow: string }> = {
  normal: { primary: '#A8A878', secondary: '#6D6D4E', glow: 'rgba(168,168,120,0.5)' },
  fire: { primary: '#F08030', secondary: '#9C531F', glow: 'rgba(240,128,48,0.6)' },
  water: { primary: '#6890F0', secondary: '#445E9C', glow: 'rgba(104,144,240,0.6)' },
  grass: { primary: '#78C850', secondary: '#4E8234', glow: 'rgba(120,200,80,0.6)' },
  electric: { primary: '#F8D030', secondary: '#A1871F', glow: 'rgba(248,208,48,0.6)' },
  ice: { primary: '#98D8D8', secondary: '#638D8D', glow: 'rgba(152,216,216,0.6)' },
  fighting: { primary: '#C03028', secondary: '#7D1F1A', glow: 'rgba(192,48,40,0.6)' },
  poison: { primary: '#A040A0', secondary: '#682A68', glow: 'rgba(160,64,160,0.6)' },
  ground: { primary: '#E0C068', secondary: '#927D44', glow: 'rgba(224,192,104,0.6)' },
  flying: { primary: '#A890F0', secondary: '#6D5E9C', glow: 'rgba(168,144,240,0.6)' },
  psychic: { primary: '#F85888', secondary: '#A13959', glow: 'rgba(248,88,136,0.6)' },
  bug: { primary: '#A8B820', secondary: '#6D7815', glow: 'rgba(168,184,32,0.6)' },
  rock: { primary: '#B8A038', secondary: '#786824', glow: 'rgba(184,160,56,0.6)' },
  ghost: { primary: '#705898', secondary: '#493963', glow: 'rgba(112,88,152,0.6)' },
  dragon: { primary: '#7038F8', secondary: '#4924A1', glow: 'rgba(112,56,248,0.6)' },
  steel: { primary: '#B8B8D0', secondary: '#787887', glow: 'rgba(184,184,208,0.6)' },
  fairy: { primary: '#EE99AC', secondary: '#9B6470', glow: 'rgba(238,153,172,0.6)' },
};

// Calculate base difficulty (0-1)
function calculateDifficulty(pokemon: PokemonTemplate): number {
  const totalStats = pokemon.hp + pokemon.atk + pokemon.def;
  const normalized = Math.min(1, Math.max(0, (totalStats - 120) / 250));
  return normalized;
}

// Calculate max will based on difficulty (2-5 segments)
function calculateMaxWill(difficulty: number): number {
  return Math.floor(2 + difficulty * 3);
}

// Generate particles
function generateGrassParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 40 + Math.random() * 20,
    y: 70 + Math.random() * 20,
    angle: Math.random() * 360,
    speed: 2 + Math.random() * 3,
    size: 8 + Math.random() * 12,
    delay: Math.random() * 0.3,
  }));
}

function generateSparkles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (i / count) * 360,
    distance: 60 + Math.random() * 40,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 0.5,
  }));
}

function generateConfetti(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 20 + Math.random() * 60,
    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 6)],
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1,
    rotation: Math.random() * 720 - 360,
  }));
}

// Will Bar Component
function WillBar({ current, max, color }: { current: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-[10px] text-slate-400 font-bold"
        style={{ fontFamily: "'Press Start 2P', monospace" }}
      >
        VOLUNTAD
      </span>
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className={`w-6 h-4 rounded-sm border-2 transition-all duration-300 ${
              i < current
                ? 'border-white/50'
                : 'border-slate-700 bg-slate-800'
            }`}
            style={{
              background: i < current
                ? `linear-gradient(to bottom, ${color}, ${color}aa)`
                : undefined,
              boxShadow: i < current ? `0 0 8px ${color}60` : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function CaptureMinigame({ pokemon, player, onSuccess, onFail }: CaptureMinigameProps) {
  const [phase, setPhase] = useState<Phase>('encounter_flash');
  const [ringScale, setRingScale] = useState(2.5);
  const [ringDirection, setRingDirection] = useState(-1);
  const [catchResult, setCatchResult] = useState<'success' | 'fail' | null>(null);
  const [shakeCount, setShakeCount] = useState(0);
  const [pokeballPos, setPokeballPos] = useState({ x: 50, y: 120, rotation: 0, scale: 1 });
  const [lastHitQuality, setLastHitQuality] = useState<'perfect' | 'good' | 'ok' | 'miss'>('miss');

  // NEW: Multi-phase resistance system
  const [attempt, setAttempt] = useState(0);
  const [will, setWill] = useState(0);
  const [maxWill, setMaxWill] = useState(0);
  const [pokemonOffset, setPokemonOffset] = useState({ x: 0, y: 0 });
  const [isAngry, setIsAngry] = useState(false);

  const animationRef = useRef<number | null>(null);
  const pokemonMoveRef = useRef<number | null>(null);
  const throwStartTime = useRef<number>(0);

  const difficulty = calculateDifficulty(pokemon);
  const typeColors = TYPE_COLORS[pokemon.types[0]] || TYPE_COLORS.normal;

  // Ring zones
  const perfectZone = { min: 0.85, max: 1.15 };
  const goodZone = { min: 0.6, max: 1.4 };
  const okZone = { min: 0.4, max: 1.6 };

  // Ring speed increases with each attempt
  const baseRingSpeed = 0.018 + difficulty * 0.015;
  const ringSpeed = baseRingSpeed * (1 + attempt * 0.25);

  // Pokemon movement amplitude increases with attempts
  const moveAmplitude = 10 + attempt * 8;

  const grassParticles = useMemo(() => generateGrassParticles(12), []);
  const sparkles = useMemo(() => generateSparkles(16), []);
  const confetti = useMemo(() => generateConfetti(30), []);

  // Initialize will on first render
  useEffect(() => {
    const calculatedMaxWill = calculateMaxWill(difficulty);
    setMaxWill(calculatedMaxWill);
    setWill(calculatedMaxWill);
  }, [difficulty]);

  // Phase progression
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (phase === 'encounter_flash') {
      timers.push(setTimeout(() => setPhase('encounter_alert'), 300));
    } else if (phase === 'encounter_alert') {
      timers.push(setTimeout(() => setPhase('encounter_reveal'), 600));
    } else if (phase === 'encounter_reveal') {
      timers.push(setTimeout(() => setPhase('encounter_intro'), 1200));
    } else if (phase === 'encounter_intro') {
      timers.push(setTimeout(() => setPhase('ready'), 1500));
    } else if (phase === 'hit_react') {
      // After hit reaction, check if captured or continue
      timers.push(setTimeout(() => {
        if (will <= 0) {
          // Will depleted - start catching phase
          setPhase('catching');
          animateCatch(true);
        } else {
          // Reset for next attempt
          setAttempt(a => a + 1);
          setRingScale(2.5);
          setRingDirection(-1);
          setPokeballPos({ x: 50, y: 120, rotation: 0, scale: 1 });
          setPhase('ready');
        }
      }, 800));
    } else if (phase === 'miss_react') {
      // After miss reaction, Pokemon might flee or continue
      timers.push(setTimeout(() => {
        const fleeChance = 0.1 + attempt * 0.1 + difficulty * 0.15;
        if (Math.random() < fleeChance) {
          // Pokemon flees!
          setPhase('result');
          setCatchResult('fail');
          setTimeout(() => onFail(), 1500);
        } else {
          // Continue - Pokemon gets angrier
          setIsAngry(false);
          setAttempt(a => a + 1);
          setRingScale(2.5);
          setRingDirection(-1);
          setPokeballPos({ x: 50, y: 120, rotation: 0, scale: 1 });
          setPhase('ready');
        }
      }, 1000));
    }

    return () => timers.forEach(t => clearTimeout(t));
  }, [phase, will, attempt, difficulty, onFail]);

  // Ring animation
  useEffect(() => {
    if (phase !== 'ready') return;

    const animate = () => {
      setRingScale(prev => {
        let next = prev + ringDirection * ringSpeed;
        if (next <= 0.3) {
          setRingDirection(1);
          next = 0.3;
        } else if (next >= 2.5) {
          setRingDirection(-1);
          next = 2.5;
        }
        return next;
      });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [phase, ringDirection, ringSpeed]);

  // Pokemon movement animation (after first attempt)
  useEffect(() => {
    if (phase !== 'ready' || attempt === 0) {
      setPokemonOffset({ x: 0, y: 0 });
      return;
    }

    let time = 0;
    const animate = () => {
      time += 0.05;
      // Lissajous-like movement pattern
      const x = Math.sin(time * 1.3) * moveAmplitude;
      const y = Math.sin(time * 2.1) * (moveAmplitude * 0.6);
      setPokemonOffset({ x, y });
      pokemonMoveRef.current = requestAnimationFrame(animate);
    };

    pokemonMoveRef.current = requestAnimationFrame(animate);
    return () => {
      if (pokemonMoveRef.current) cancelAnimationFrame(pokemonMoveRef.current);
    };
  }, [phase, attempt, moveAmplitude]);

  // Handle throw action
  const handleThrow = useCallback(() => {
    if (phase !== 'ready') return;

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (pokemonMoveRef.current) cancelAnimationFrame(pokemonMoveRef.current);

    // Determine hit quality
    const inPerfect = ringScale >= perfectZone.min && ringScale <= perfectZone.max;
    const inGood = ringScale >= goodZone.min && ringScale <= goodZone.max;
    const inOk = ringScale >= okZone.min && ringScale <= okZone.max;

    let hitQuality: 'perfect' | 'good' | 'ok' | 'miss' = 'miss';
    let willDamage = 0;

    if (inPerfect) {
      hitQuality = 'perfect';
      willDamage = 2; // Perfect hits do double damage
    } else if (inGood) {
      hitQuality = 'good';
      willDamage = 1;
    } else if (inOk) {
      hitQuality = 'ok';
      willDamage = Math.random() > 0.5 ? 1 : 0; // 50% chance to deal damage
    } else {
      hitQuality = 'miss';
      willDamage = 0;
    }

    setLastHitQuality(hitQuality);
    setPhase('throwing');
    throwStartTime.current = Date.now();

    // Animate pokeball throw
    const targetX = 50 + pokemonOffset.x * 0.5;
    const targetY = 50 + pokemonOffset.y * 0.3;

    const animateThrow = () => {
      const elapsed = Date.now() - throwStartTime.current;
      const duration = 500;
      const progress = Math.min(1, elapsed / duration);

      const startY = 120;
      const arcHeight = -50;

      const x = 50 + (targetX - 50) * progress;
      const y = startY + (targetY - startY) * progress + arcHeight * Math.sin(progress * Math.PI);
      const rotation = progress * 720;
      const scale = 1 - progress * 0.25;

      setPokeballPos({ x, y, rotation, scale });

      if (progress < 1) {
        requestAnimationFrame(animateThrow);
      } else {
        setPhase('impact');

        setTimeout(() => {
          if (hitQuality === 'miss') {
            setIsAngry(true);
            setPhase('miss_react');
          } else {
            // Deal damage to will
            setWill(w => Math.max(0, w - willDamage));
            setPhase('hit_react');
          }
        }, 300);
      }
    };

    requestAnimationFrame(animateThrow);
  }, [phase, ringScale, pokemonOffset, perfectZone, goodZone, okZone]);

  const animateCatch = (success: boolean) => {
    let shakes = 0;
    const maxShakes = 3;

    const doShake = () => {
      shakes++;
      setShakeCount(shakes);

      if (shakes < maxShakes) {
        setTimeout(doShake, 900);
      } else {
        setTimeout(() => {
          setPhase('result');
          setCatchResult('success');
          setTimeout(() => onSuccess(), 2500);
        }, 700);
      }
    };

    setTimeout(doShake, 600);
  };

  // Handle input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleThrow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleThrow]);

  // Get ring color based on size
  const getRingColor = () => {
    if (ringScale >= perfectZone.min && ringScale <= perfectZone.max) return '#FFD700';
    if (ringScale >= goodZone.min && ringScale <= goodZone.max) return '#22C55E';
    if (ringScale >= okZone.min && ringScale <= okZone.max) return '#EAB308';
    return '#EF4444';
  };

  // Get hit quality text and color
  const getHitFeedback = () => {
    switch (lastHitQuality) {
      case 'perfect': return { text: '¡PERFECTO!', color: '#FFD700', damage: '-2' };
      case 'good': return { text: '¡BIEN!', color: '#22C55E', damage: '-1' };
      case 'ok': return { text: 'OK', color: '#EAB308', damage: '-1' };
      case 'miss': return { text: '¡FALLO!', color: '#EF4444', damage: '' };
    }
  };

  const hitFeedback = getHitFeedback();

  return (
    <div
      className="fixed inset-0 z-[60] overflow-hidden"
      onClick={handleThrow}
    >
      {/* Dynamic background */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          background: phase === 'encounter_flash'
            ? '#FFFFFF'
            : isAngry
              ? `radial-gradient(ellipse at center, rgba(239,68,68,0.4) 0%, #0a0a0a 70%)`
              : `radial-gradient(ellipse at center, ${typeColors.glow} 0%, #0a0a0a 70%)`,
        }}
      />

      {/* Grass particles on encounter */}
      {(phase === 'encounter_alert' || phase === 'encounter_reveal') && (
        <div className="absolute inset-0 pointer-events-none">
          {grassParticles.map(p => (
            <div
              key={p.id}
              className="absolute animate-grass-burst"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size * 2,
                background: 'linear-gradient(to top, #22C55E, #4ADE80)',
                borderRadius: '50% 50% 0 0',
                transform: `rotate(${p.angle}deg)`,
                animationDelay: `${p.delay}s`,
                '--burst-angle': `${p.angle}deg`,
                '--burst-distance': `${p.speed * 30}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Alert icon "!" */}
      {phase === 'encounter_alert' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="animate-alert-pop">
            <div className="relative">
              <div
                className="text-[120px] font-black text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)]"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                !
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 border-4 border-yellow-400/60 rounded-full animate-shockwave" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 border-4 border-yellow-400/40 rounded-full animate-shockwave" style={{ animationDelay: '0.15s' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pokemon reveal and game */}
      {(phase === 'encounter_reveal' || phase === 'encounter_intro' || phase === 'ready' ||
        phase === 'throwing' || phase === 'impact' || phase === 'hit_react' || phase === 'miss_react') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`relative transition-all duration-300 ${
              phase === 'encounter_reveal' ? 'animate-pokemon-emerge' : ''
            } ${phase === 'miss_react' ? 'animate-pokemon-angry' : ''}`}
            style={{
              transform: phase === 'ready'
                ? `translate(${pokemonOffset.x}px, ${pokemonOffset.y}px)`
                : undefined,
            }}
          >
            {/* Type-colored glow */}
            <div
              className={`absolute inset-0 rounded-full blur-3xl transition-all duration-300 ${
                isAngry ? 'bg-red-500/40' : ''
              }`}
              style={{
                background: isAngry ? undefined : typeColors.glow,
                transform: 'scale(2)',
                animation: phase === 'ready' ? 'pulse 2s ease-in-out infinite' : undefined,
              }}
            />

            {/* Pokemon sprite */}
            <img
              src={getAnimatedFrontSprite(pokemon.id)}
              alt={pokemon.name}
              className={`w-40 h-40 sm:w-48 sm:h-48 object-contain relative z-10 transition-all duration-300 ${
                phase === 'encounter_reveal' ? 'brightness-0' : 'brightness-100'
              } ${phase === 'impact' || phase === 'hit_react' ? 'animate-impact-flash' : ''}`}
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Targeting ring - only in ready phase */}
            {phase === 'ready' && (
              <>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-4 border-white/30 pointer-events-none" />
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[6px] pointer-events-none transition-colors duration-100"
                  style={{
                    width: `${ringScale * 96}px`,
                    height: `${ringScale * 96}px`,
                    borderColor: getRingColor(),
                    boxShadow: `0 0 20px ${getRingColor()}, inset 0 0 20px ${getRingColor()}40`,
                  }}
                />
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-yellow-400/50 pointer-events-none"
                  style={{
                    width: `${perfectZone.max * 96}px`,
                    height: `${perfectZone.max * 96}px`,
                  }}
                />
              </>
            )}

            {/* Hit feedback popup */}
            {phase === 'hit_react' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full animate-hit-popup">
                <div
                  className="text-2xl font-black whitespace-nowrap px-4 py-2"
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    color: hitFeedback.color,
                    textShadow: `0 0 20px ${hitFeedback.color}`,
                  }}
                >
                  {hitFeedback.text}
                </div>
                {hitFeedback.damage && (
                  <div
                    className="text-center text-lg font-bold text-white"
                    style={{ fontFamily: "'Press Start 2P', monospace" }}
                  >
                    {hitFeedback.damage}
                  </div>
                )}
              </div>
            )}

            {/* Miss feedback */}
            {phase === 'miss_react' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full animate-miss-popup">
                <div
                  className="text-2xl font-black text-red-500 whitespace-nowrap"
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    textShadow: '0 0 20px #EF4444',
                  }}
                >
                  ¡FALLO!
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pokeball */}
      {(phase === 'throwing' || phase === 'impact' || phase === 'hit_react' ||
        phase === 'catching' || phase === 'result') && (
        <div
          className={`absolute pointer-events-none transition-all ${
            phase === 'catching' ? 'animate-pokeball-shake-heavy' : ''
          } ${phase === 'result' && catchResult === 'fail' ? 'animate-ball-break-open' : ''}`}
          style={{
            left: `${pokeballPos.x}%`,
            top: `${phase === 'catching' || phase === 'result' ? 55 : pokeballPos.y}%`,
            transform: `translate(-50%, -50%) rotate(${phase === 'catching' || phase === 'result' ? 0 : pokeballPos.rotation}deg) scale(${phase === 'catching' || phase === 'result' ? 1.2 : pokeballPos.scale})`,
          }}
        >
          <div className={`relative ${phase === 'result' && catchResult === 'success' ? 'animate-catch-success' : ''}`}>
            <div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/30 rounded-full blur-sm"
              style={{ transform: 'translateX(-50%) scaleX(1.2)' }}
            />
            <div className="w-20 h-20 rounded-full relative overflow-hidden shadow-2xl border-2 border-slate-900">
              <div className="absolute inset-0 bg-gradient-to-b from-red-500 via-red-600 to-red-700"
                   style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }} />
              <div className="absolute top-1 left-2 w-6 h-3 bg-white/40 rounded-full blur-sm" />
              <div className="absolute inset-0 bg-gradient-to-b from-gray-100 via-white to-gray-200"
                   style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)' }} />
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-3 bg-slate-900" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
                  <div className={`w-5 h-5 rounded-full bg-white border-2 border-slate-700 transition-all ${
                    phase === 'catching' && shakeCount > 0 ? 'animate-button-glow' : ''
                  } ${phase === 'result' && catchResult === 'success' ? 'bg-yellow-400 border-yellow-600' : ''}`}>
                    <div className="w-2 h-2 bg-white/60 rounded-full mt-0.5 ml-0.5" />
                  </div>
                </div>
              </div>
            </div>
            {phase === 'catching' && shakeCount > 0 && (
              <>
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute animate-shake-star"
                    style={{
                      top: '50%',
                      left: '50%',
                      '--star-angle': `${i * 90 + 45}deg`,
                    } as React.CSSProperties}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFD700">
                      <polygon points="12,0 15,9 24,9 17,14 20,24 12,18 4,24 7,14 0,9 9,9" />
                    </svg>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Miss - pokeball bouncing away */}
      {phase === 'miss_react' && (
        <div
          className="absolute pointer-events-none animate-ball-miss"
          style={{
            left: `${pokeballPos.x}%`,
            top: `${pokeballPos.y}%`,
          }}
        >
          <div className="w-16 h-16 rounded-full relative overflow-hidden shadow-lg border-2 border-slate-900 opacity-60">
            <div className="absolute inset-0 bg-red-500" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }} />
            <div className="absolute inset-0 bg-white" style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)' }} />
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-2 bg-slate-900" />
            </div>
          </div>
        </div>
      )}

      {/* Pokemon breaking free on result fail */}
      {phase === 'result' && catchResult === 'fail' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="animate-break-free">
            <img
              src={getAnimatedFrontSprite(pokemon.id)}
              alt={pokemon.name}
              className="w-40 h-40 sm:w-48 sm:h-48 object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>
      )}

      {/* Success confetti */}
      {phase === 'result' && catchResult === 'success' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confetti.map(c => (
            <div
              key={c.id}
              className="absolute animate-confetti-fall"
              style={{
                left: `${c.x}%`,
                top: '-20px',
                width: '12px',
                height: '12px',
                background: c.color,
                animationDelay: `${c.delay}s`,
                animationDuration: `${c.duration}s`,
                '--rotation': `${c.rotation}deg`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-between py-8 px-4 pointer-events-none">
        {/* Top: Title, Will Bar, Pokemon info */}
        <div className="text-center w-full max-w-md">
          {/* Will bar - show during gameplay */}
          {(phase === 'ready' || phase === 'throwing' || phase === 'impact' ||
            phase === 'hit_react' || phase === 'miss_react') && maxWill > 0 && (
            <div className="mb-4 animate-fade-in">
              <WillBar current={will} max={maxWill} color={typeColors.primary} />
            </div>
          )}

          {/* Encounter text */}
          {(phase === 'encounter_intro' || phase === 'ready' || phase === 'throwing' ||
            phase === 'hit_react' || phase === 'miss_react') && (
            <div className="animate-slide-down">
              {/* Attempt counter */}
              {attempt > 0 && phase === 'ready' && (
                <div
                  className="text-[10px] text-yellow-400 mb-2"
                  style={{ fontFamily: "'Press Start 2P', monospace" }}
                >
                  INTENTO {attempt + 1}
                </div>
              )}

              <div
                className="text-lg sm:text-xl font-bold text-white/80 mb-2 tracking-wider"
                style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.75rem' }}
              >
                ¡POKEMON SALVAJE!
              </div>

              <div
                className="relative inline-block px-8 py-3 bg-gradient-to-b from-slate-700 to-slate-900 border-4 border-slate-600 rounded-lg shadow-xl"
                style={{ borderStyle: 'outset' }}
              >
                <div className="absolute inset-1 border-2 border-slate-500/30 rounded" />
                <h2
                  className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wide"
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    textShadow: `2px 2px 0 ${typeColors.secondary}, 4px 4px 0 #000`,
                  }}
                >
                  {pokemon.name}
                </h2>
                <div className="flex justify-center gap-2 mt-2">
                  {pokemon.types.map(type => (
                    <span
                      key={type}
                      className="px-3 py-1 text-[10px] font-bold uppercase rounded shadow-md"
                      style={{
                        background: TYPE_COLORS[type]?.primary || '#888',
                        color: '#fff',
                        textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
                        fontFamily: "'Press Start 2P', monospace",
                      }}
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Catching status */}
          {phase === 'catching' && (
            <div className="animate-fade-in">
              <div
                className="text-xl font-bold text-white tracking-wider"
                style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.875rem' }}
              >
                {shakeCount === 0 ? 'CAPTURANDO...' : `${shakeCount}...`}
              </div>
              <div className="flex justify-center gap-3 mt-4">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                      i <= shakeCount
                        ? 'bg-yellow-400 border-yellow-500 shadow-[0_0_10px_#FFD700]'
                        : 'bg-slate-800 border-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Result text */}
          {phase === 'result' && (
            <div className={`animate-result-pop ${catchResult === 'success' ? 'text-yellow-400' : 'text-red-400'}`}>
              <div
                className="text-3xl sm:text-4xl font-black tracking-wider"
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  textShadow: catchResult === 'success'
                    ? '0 0 20px #FFD700, 0 0 40px #FFD700'
                    : '0 0 20px #EF4444',
                }}
              >
                {catchResult === 'success' ? 'GOTCHA!' : '¡HUYÓ!'}
              </div>
              {catchResult === 'success' && (
                <div
                  className="text-sm text-white mt-4 animate-fade-in"
                  style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem', animationDelay: '0.5s' }}
                >
                  ¡{pokemon.name} fue capturado!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom: Instructions and difficulty */}
        <div className="text-center">
          {phase === 'ready' && (
            <div className="animate-slide-up">
              <div
                className="mb-4 px-4 py-2 bg-slate-900/80 rounded-lg border-2 border-slate-700"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                <span className="text-[10px] text-slate-400 mr-2">DIFICULTAD:</span>
                <span className={`text-[10px] font-bold ${
                  difficulty < 0.3 ? 'text-emerald-400' :
                  difficulty < 0.6 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {difficulty < 0.3 ? 'FÁCIL' : difficulty < 0.6 ? 'NORMAL' : 'DIFÍCIL'}
                </span>

                {/* Speed indicator for higher attempts */}
                {attempt > 0 && (
                  <span className="text-[10px] text-orange-400 ml-3">
                    {'⚡'.repeat(Math.min(attempt, 3))}
                  </span>
                )}
              </div>

              <div
                className="text-[10px] text-slate-400 animate-pulse"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                {attempt === 0 ? 'TOCA CUANDO EL ANILLO SEA PEQUEÑO' : '¡SE MUEVE! APUNTA BIEN'}
              </div>

              <div className="flex justify-center gap-4 mt-3 text-[8px]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                <span className="text-yellow-400">● PERFECTO x2</span>
                <span className="text-emerald-400">● BUENO</span>
                <span className="text-amber-400">● OK 50%</span>
              </div>
            </div>
          )}

          {/* Angry warning */}
          {phase === 'miss_react' && (
            <div
              className="text-red-400 text-[10px] animate-pulse"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              ¡{pokemon.name} está furioso!
            </div>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes grass-burst {
          0% { opacity: 1; transform: rotate(var(--burst-angle)) translateY(0); }
          100% { opacity: 0; transform: rotate(var(--burst-angle)) translateY(calc(var(--burst-distance) * -1)) translateX(var(--burst-distance)); }
        }
        .animate-grass-burst {
          animation: grass-burst 0.8s ease-out forwards;
        }

        @keyframes alert-pop {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          50% { transform: scale(1.3) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-alert-pop {
          animation: alert-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes shockwave {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
        .animate-shockwave {
          animation: shockwave 0.6s ease-out forwards;
        }

        @keyframes pokemon-emerge {
          0% { transform: translateY(50px) scale(0.5); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-pokemon-emerge {
          animation: pokemon-emerge 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes pokemon-angry {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-10px); }
          80% { transform: translateX(10px); }
        }
        .animate-pokemon-angry {
          animation: pokemon-angry 0.4s ease-in-out;
        }

        @keyframes impact-flash {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(3) saturate(0); }
        }
        .animate-impact-flash {
          animation: impact-flash 0.2s ease-out;
        }

        @keyframes hit-popup {
          0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
          50% { transform: translate(-50%, -20px) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, -40px) scale(1); opacity: 0; }
        }
        .animate-hit-popup {
          animation: hit-popup 0.8s ease-out forwards;
        }

        @keyframes miss-popup {
          0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
          30% { transform: translate(-50%, -10px) scale(1.3); opacity: 1; }
          100% { transform: translate(-50%, -30px) scale(1); opacity: 0; }
        }
        .animate-miss-popup {
          animation: miss-popup 0.6s ease-out forwards;
        }

        @keyframes ball-miss {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(calc(-50% + 50px), calc(-50% - 30px)) scale(0.8) rotate(180deg); opacity: 0.8; }
          100% { transform: translate(calc(-50% + 100px), calc(-50% + 100px)) scale(0.5) rotate(360deg); opacity: 0; }
        }
        .animate-ball-miss {
          animation: ball-miss 0.8s ease-out forwards;
        }

        @keyframes pokeball-shake-heavy {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
          20% { transform: translate(-50%, -50%) rotate(-25deg) translateX(-5px); }
          40% { transform: translate(-50%, -50%) rotate(25deg) translateX(5px); }
          60% { transform: translate(-50%, -50%) rotate(-15deg) translateX(-3px); }
          80% { transform: translate(-50%, -50%) rotate(15deg) translateX(3px); }
        }
        .animate-pokeball-shake-heavy {
          animation: pokeball-shake-heavy 0.5s ease-in-out;
        }

        @keyframes button-glow {
          0%, 100% { box-shadow: 0 0 5px #FFD700; }
          50% { box-shadow: 0 0 20px #FFD700, 0 0 30px #FFD700; }
        }
        .animate-button-glow {
          animation: button-glow 0.3s ease-in-out;
        }

        @keyframes shake-star {
          0% { transform: translate(-50%, -50%) rotate(var(--star-angle)) translateX(0) scale(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(var(--star-angle)) translateX(60px) scale(1); opacity: 0; }
        }
        .animate-shake-star {
          animation: shake-star 0.4s ease-out forwards;
        }

        @keyframes catch-success {
          0% { transform: scale(1); }
          30% { transform: scale(1.3); }
          50% { transform: scale(0.9); }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-catch-success {
          animation: catch-success 0.6s ease-out;
        }

        @keyframes ball-break-open {
          0% { transform: translate(-50%, -50%) scale(1.2); }
          30% { transform: translate(-50%, -50%) scale(1.4); }
          100% { transform: translate(-50%, -50%) scale(0.8) translateY(50px); opacity: 0.3; }
        }
        .animate-ball-break-open {
          animation: ball-break-open 0.5s ease-out forwards;
        }

        @keyframes break-free {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-break-free {
          animation: break-free 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(var(--rotation)); opacity: 0; }
        }
        .animate-confetti-fall {
          animation: confetti-fall linear forwards;
        }

        @keyframes slide-down {
          0% { transform: translateY(-30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slide-down 0.5s ease-out forwards;
        }

        @keyframes slide-up {
          0% { transform: translateY(30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }

        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        @keyframes result-pop {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-result-pop {
          animation: result-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}
