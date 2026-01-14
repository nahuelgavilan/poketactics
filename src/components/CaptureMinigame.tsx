import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getAnimatedFrontSprite } from '../utils/sprites';
import type { PokemonTemplate, Player, PokemonType } from '../types/game';

interface CaptureMinigameProps {
  pokemon: PokemonTemplate;
  player: Player;
  onSuccess: () => void;
  onFail: () => void;
  onFlee: () => void;
}

type Direction = 'up' | 'down' | 'left' | 'right';
type AttackType = 'single' | 'combo' | 'hold' | 'fake' | 'phase';
type HitQuality = 'perfect' | 'good' | 'miss';
type Phase = 'intro' | 'ready' | 'battle' | 'capture_attempt' | 'result';

interface Attack {
  id: number;
  type: AttackType;
  directions: Direction[];
  currentIndex: number;
  startTime: number;
  duration: number;
  fakeDirection?: Direction;
  phaseVisible: boolean;
  state: 'approaching' | 'active' | 'resolved';
  position: number; // 0-100, 100 = reached center
}

// Type colors
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

// Type-specific attack patterns
interface TypePattern {
  attackTypes: AttackType[];
  baseSpeed: number;
  burstMode?: boolean;
  continuous?: boolean;
  reversed?: boolean;
  heavy?: boolean;
  erratic?: boolean;
  description: string;
}

const TYPE_PATTERNS: Partial<Record<PokemonType, TypePattern>> = {
  fire: {
    attackTypes: ['single', 'single', 'combo'],
    baseSpeed: 1.3,
    burstMode: true,
    description: '¡Ráfagas explosivas!',
  },
  water: {
    attackTypes: ['single', 'single', 'single'],
    baseSpeed: 1.0,
    continuous: true,
    description: 'Oleadas constantes',
  },
  electric: {
    attackTypes: ['single', 'single', 'fake'],
    baseSpeed: 1.4,
    erratic: true,
    description: '¡Impredecible!',
  },
  grass: {
    attackTypes: ['single', 'combo'],
    baseSpeed: 0.8,
    description: 'Calma... ¡EMBOSCADA!',
  },
  psychic: {
    attackTypes: ['fake', 'single', 'single'],
    baseSpeed: 1.1,
    reversed: true,
    description: '¡CONTROLES INVERTIDOS!',
  },
  ghost: {
    attackTypes: ['phase', 'single', 'phase'],
    baseSpeed: 1.0,
    description: 'Ataques fantasma',
  },
  fighting: {
    attackTypes: ['hold', 'single'],
    baseSpeed: 0.7,
    heavy: true,
    description: 'Golpes devastadores',
  },
  dragon: {
    attackTypes: ['combo', 'single', 'fake', 'hold'],
    baseSpeed: 1.5,
    description: '¡EL DESAFÍO FINAL!',
  },
  ice: {
    attackTypes: ['single', 'hold', 'single'],
    baseSpeed: 0.9,
    description: 'Frío paralizante',
  },
  poison: {
    attackTypes: ['single', 'single', 'phase'],
    baseSpeed: 1.1,
    description: 'Ataques venenosos',
  },
  ground: {
    attackTypes: ['hold', 'single', 'single'],
    baseSpeed: 0.85,
    heavy: true,
    description: 'Temblores sísmicos',
  },
  flying: {
    attackTypes: ['single', 'single', 'combo'],
    baseSpeed: 1.35,
    description: 'Ataques aéreos rápidos',
  },
  bug: {
    attackTypes: ['single', 'single', 'single', 'combo'],
    baseSpeed: 1.2,
    continuous: true,
    description: 'Enjambre imparable',
  },
  rock: {
    attackTypes: ['hold', 'single'],
    baseSpeed: 0.6,
    heavy: true,
    description: 'Impactos aplastantes',
  },
  steel: {
    attackTypes: ['hold', 'single', 'hold'],
    baseSpeed: 0.75,
    heavy: true,
    description: 'Defensa de acero',
  },
  fairy: {
    attackTypes: ['single', 'fake', 'single'],
    baseSpeed: 1.15,
    description: 'Engaños mágicos',
  },
  normal: {
    attackTypes: ['single', 'single'],
    baseSpeed: 1.0,
    description: 'Ataques estándar',
  },
};

// Direction arrows
const DIRECTION_ARROWS: Record<Direction, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
};

const DIRECTION_ANGLES: Record<Direction, number> = {
  up: -90,
  down: 90,
  left: 180,
  right: 0,
};

// Calculate difficulty from stats
function calculateDifficulty(pokemon: PokemonTemplate) {
  const totalStats = pokemon.hp + pokemon.atk + pokemon.def;
  const difficulty = Math.min(1, Math.max(0, (totalStats - 120) / 280));

  return {
    hitsRequired: Math.floor(6 + difficulty * 10), // 6-16 hits
    attackInterval: Math.max(800, 1400 - difficulty * 500), // 900-1400ms
    perfectWindow: Math.max(120, 200 - difficulty * 60), // 140-200ms
    goodWindow: Math.max(250, 350 - difficulty * 80), // 270-350ms
    approachTime: Math.max(600, 900 - difficulty * 250), // 650-900ms
  };
}

// Random direction
function randomDirection(): Direction {
  const dirs: Direction[] = ['up', 'down', 'left', 'right'];
  return dirs[Math.floor(Math.random() * dirs.length)];
}

// Different direction (for fakes)
function differentDirection(dir: Direction): Direction {
  const dirs: Direction[] = ['up', 'down', 'left', 'right'].filter(d => d !== dir) as Direction[];
  return dirs[Math.floor(Math.random() * dirs.length)];
}

export function CaptureMinigame({ pokemon, player, onSuccess, onFail, onFlee }: CaptureMinigameProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [hearts, setHearts] = useState(3);
  const [dominance, setDominance] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [lastHit, setLastHit] = useState<{ quality: HitQuality; direction: Direction; time: number } | null>(null);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [result, setResult] = useState<'success' | 'fail' | 'fled' | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const attackIdRef = useRef(0);
  const gameLoopRef = useRef<number | null>(null);
  const lastAttackTimeRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const primaryType = pokemon.types[0];
  const typeColors = TYPE_COLORS[primaryType] || TYPE_COLORS.normal;
  const typePattern = TYPE_PATTERNS[primaryType] || TYPE_PATTERNS.normal!;
  const difficulty = useMemo(() => calculateDifficulty(pokemon), [pokemon]);

  // Combo multiplier
  const comboMultiplier = combo < 3 ? 1 : combo < 6 ? 1.5 : combo < 10 ? 2 : 2.5;

  // Start battle after intro
  useEffect(() => {
    if (phase === 'intro') {
      const timer = setTimeout(() => setPhase('ready'), 1500);
      return () => clearTimeout(timer);
    }
    if (phase === 'ready') {
      const timer = setTimeout(() => setPhase('battle'), 1000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Generate attack based on type pattern
  const generateAttack = useCallback((): Attack => {
    const attackTypePool = typePattern.attackTypes;
    const attackType = attackTypePool[Math.floor(Math.random() * attackTypePool.length)];

    let directions: Direction[] = [];
    let fakeDirection: Direction | undefined;

    switch (attackType) {
      case 'single':
        directions = [randomDirection()];
        break;
      case 'combo':
        const comboLength = 2 + Math.floor(Math.random() * 2); // 2-3 hits
        for (let i = 0; i < comboLength; i++) {
          directions.push(randomDirection());
        }
        break;
      case 'hold':
        directions = [randomDirection()];
        break;
      case 'fake':
        const realDir = randomDirection();
        fakeDirection = differentDirection(realDir);
        directions = [realDir];
        break;
      case 'phase':
        directions = [randomDirection()];
        break;
    }

    // Apply speed modifier from type pattern
    const speedMod = typePattern.baseSpeed;
    const approachTime = difficulty.approachTime / speedMod;

    // Erratic timing for electric types
    const erraticMod = typePattern.erratic ? (0.6 + Math.random() * 0.8) : 1;

    return {
      id: attackIdRef.current++,
      type: attackType,
      directions,
      currentIndex: 0,
      startTime: Date.now(),
      duration: approachTime * erraticMod,
      fakeDirection,
      phaseVisible: attackType !== 'phase',
      state: 'approaching',
      position: 0,
    };
  }, [typePattern, difficulty]);

  // Game loop
  useEffect(() => {
    if (phase !== 'battle' || isPaused) return;

    const loop = () => {
      const now = Date.now();

      // Generate new attacks
      const timeSinceLastAttack = now - lastAttackTimeRef.current;
      const interval = typePattern.continuous
        ? difficulty.attackInterval * 0.7
        : typePattern.burstMode
          ? (Math.random() > 0.7 ? difficulty.attackInterval * 0.4 : difficulty.attackInterval * 1.5)
          : difficulty.attackInterval;

      if (timeSinceLastAttack > interval) {
        setAttacks(prev => [...prev, generateAttack()]);
        lastAttackTimeRef.current = now;
      }

      // Update attacks
      setAttacks(prev => {
        return prev.map(attack => {
          if (attack.state === 'resolved') return attack;

          const elapsed = now - attack.startTime;
          const progress = Math.min(1, elapsed / attack.duration);

          // Phase attacks visibility toggle
          let phaseVisible = attack.phaseVisible;
          if (attack.type === 'phase') {
            const cycleTime = 400;
            const cycle = Math.floor(elapsed / cycleTime);
            phaseVisible = cycle % 2 === 0;
          }

          // Check if attack reached center without being countered
          if (progress >= 1 && attack.state === 'approaching') {
            return { ...attack, state: 'resolved' as const, position: 100 };
          }

          return {
            ...attack,
            position: progress * 100,
            state: progress >= 0.7 ? 'active' as const : 'approaching' as const,
            phaseVisible,
          };
        }).filter(attack => {
          // Remove resolved attacks and handle misses
          if (attack.state === 'resolved') {
            // This was a miss - attack reached center
            handleMiss(attack);
            return false;
          }
          return true;
        });
      });

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    lastAttackTimeRef.current = Date.now();

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [phase, isPaused, generateAttack, difficulty, typePattern]);

  // Handle miss
  const handleMiss = useCallback((attack: Attack) => {
    const damage = typePattern.heavy ? 2 : 1;
    setHearts(h => {
      const newHearts = Math.max(0, h - damage);
      if (newHearts === 0) {
        setPhase('result');
        setResult('fail');
      }
      return newHearts;
    });
    setCombo(0);
    setShakeScreen(true);
    setTimeout(() => setShakeScreen(false), 300);
    setLastHit({ quality: 'miss', direction: attack.directions[attack.currentIndex], time: Date.now() });
  }, [typePattern.heavy]);

  // Handle swipe input
  const handleSwipe = useCallback((direction: Direction) => {
    if (phase !== 'battle' || isPaused) return;

    const now = Date.now();

    // Use ref to track hit result across the setState callback
    const hitResultRef = { attack: null as Attack | null, quality: 'miss' as HitQuality };

    setAttacks(prev => {
      const sorted = [...prev]
        .filter(a => a.state === 'active' && a.phaseVisible)
        .sort((a, b) => b.position - a.position); // Most urgent first

      for (const attack of sorted) {
        const expectedDir = attack.type === 'fake' && attack.position < 85
          ? attack.fakeDirection!
          : attack.directions[attack.currentIndex];

        // For psychic (reversed), we need opposite direction
        const requiredDir = typePattern.reversed ? getOppositeDirection(direction) : direction;

        if (expectedDir === requiredDir || (typePattern.reversed && getOppositeDirection(expectedDir) === direction)) {
          // Calculate timing quality
          const activeWindow = attack.position - 70; // 0-30 range in active zone
          const perfectZone = activeWindow >= 15 && activeWindow <= 25; // Middle of active zone
          const goodZone = activeWindow >= 5 && activeWindow <= 30;

          hitResultRef.attack = attack;
          hitResultRef.quality = perfectZone ? 'perfect' : goodZone ? 'good' : 'miss';
          break;
        }
      }

      if (!hitResultRef.attack) return prev;

      const hitId = hitResultRef.attack.id;
      const hitType = hitResultRef.attack.type;
      const hitIndex = hitResultRef.attack.currentIndex;
      const hitDirCount = hitResultRef.attack.directions.length;

      // Process hit
      return prev.map(a => {
        if (a.id !== hitId) return a;

        // For combo attacks, advance to next direction
        if (hitType === 'combo' && hitIndex < hitDirCount - 1) {
          return { ...a, currentIndex: a.currentIndex + 1 };
        }

        // Mark as resolved
        return { ...a, state: 'resolved' as const };
      }).filter(a => a.state !== 'resolved' || a.id !== hitId);
    });

    // Use the result captured in the ref
    if (hitResultRef.attack) {
      // Successful hit
      const dominanceGain = hitResultRef.quality === 'perfect' ? 2 : 1;
      const totalGain = dominanceGain * comboMultiplier;

      setDominance(d => {
        const newDom = Math.min(difficulty.hitsRequired, d + totalGain);
        if (newDom >= difficulty.hitsRequired) {
          // Victory!
          setTimeout(() => {
            setPhase('capture_attempt');
            setTimeout(() => {
              setPhase('result');
              setResult('success');
            }, 2000);
          }, 500);
        }
        return newDom;
      });

      setCombo(c => {
        const newCombo = c + 1;
        setMaxCombo(m => Math.max(m, newCombo));
        return newCombo;
      });

      setLastHit({ quality: hitResultRef.quality, direction, time: now });
    } else {
      // Swipe in wrong direction or no active attack - penalty
      setCombo(0);
    }
  }, [phase, isPaused, typePattern.reversed, comboMultiplier, difficulty.hitsRequired]);

  // Get opposite direction
  const getOppositeDirection = (dir: Direction): Direction => {
    switch (dir) {
      case 'up': return 'down';
      case 'down': return 'up';
      case 'left': return 'right';
      case 'right': return 'left';
    }
  };

  // Touch/swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const point = 'touches' in e ? e.touches[0] : e;
    touchStartRef.current = {
      x: point.clientX,
      y: point.clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!touchStartRef.current) return;

    const point = 'changedTouches' in e ? e.changedTouches[0] : e;
    const dx = point.clientX - touchStartRef.current.x;
    const dy = point.clientY - touchStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Minimum swipe distance
    if (distance < 30) {
      touchStartRef.current = null;
      return;
    }

    // Determine direction
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    let direction: Direction;

    if (angle >= -45 && angle < 45) {
      direction = 'right';
    } else if (angle >= 45 && angle < 135) {
      direction = 'down';
    } else if (angle >= -135 && angle < -45) {
      direction = 'up';
    } else {
      direction = 'left';
    }

    handleSwipe(direction);
    touchStartRef.current = null;
  }, [handleSwipe]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'battle') return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleSwipe('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleSwipe('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleSwipe('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleSwipe('right');
          break;
        case 'Escape':
          handleFlee();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleSwipe]);

  // Flee handler
  const handleFlee = useCallback(() => {
    if (phase !== 'battle') return;
    setIsPaused(true);
    setPhase('result');
    setResult('fled');
    setTimeout(() => onFlee(), 1500);
  }, [phase, onFlee]);

  // Result handlers
  useEffect(() => {
    if (result === 'success') {
      setTimeout(() => onSuccess(), 2500);
    } else if (result === 'fail') {
      setTimeout(() => onFail(), 2000);
    }
  }, [result, onSuccess, onFail]);

  // Render attack indicator
  const renderAttack = (attack: Attack) => {
    if (attack.state === 'resolved') return null;

    const dir = attack.type === 'fake' && attack.position < 85
      ? attack.fakeDirection!
      : attack.directions[attack.currentIndex];

    const angle = DIRECTION_ANGLES[dir];
    const distance = 100 - attack.position; // Distance from center
    const opacity = attack.phaseVisible ? 1 : 0.2;
    const isActive = attack.state === 'active';
    const scale = isActive ? 1.2 : 0.8 + (attack.position / 100) * 0.4;

    // Position calculation - attacks come from edges toward center
    const radius = 120 * (distance / 100);
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;

    return (
      <div
        key={attack.id}
        className={`absolute transition-all ${isActive ? 'z-20' : 'z-10'}`}
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`,
          opacity,
        }}
      >
        {/* Attack indicator */}
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl font-bold transition-all ${
            isActive
              ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse'
              : 'bg-slate-700 text-slate-300'
          } ${attack.type === 'hold' ? 'border-4 border-yellow-400' : ''}`}
          style={{
            transform: `rotate(${angle}deg)`,
          }}
        >
          {attack.type === 'combo' && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full text-xs flex items-center justify-center">
              {attack.directions.length - attack.currentIndex}
            </span>
          )}
          →
        </div>

        {/* Hold indicator */}
        {attack.type === 'hold' && isActive && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-yellow-400 font-bold whitespace-nowrap">
            MANTÉN
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[60] overflow-hidden select-none ${shakeScreen ? 'animate-screen-shake' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
    >
      {/* Background */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          background: result === 'fail'
            ? 'radial-gradient(ellipse at center, rgba(239,68,68,0.4) 0%, #0a0a0a 70%)'
            : result === 'success'
              ? 'radial-gradient(ellipse at center, rgba(34,197,94,0.4) 0%, #0a0a0a 70%)'
              : `radial-gradient(ellipse at center, ${typeColors.glow} 0%, #0a0a0a 70%)`,
        }}
      />

      {/* Hit zone ring */}
      {phase === 'battle' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div
            className="w-40 h-40 rounded-full border-4 border-dashed opacity-30"
            style={{ borderColor: typeColors.primary }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-2 opacity-20"
            style={{ borderColor: typeColors.primary }}
          />
        </div>
      )}

      {/* Pokemon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className={`relative ${phase === 'intro' ? 'animate-pokemon-emerge' : ''}`}>
          {/* Glow */}
          <div
            className="absolute inset-0 rounded-full blur-3xl animate-pulse"
            style={{ background: typeColors.glow, transform: 'scale(2)' }}
          />

          {/* Sprite */}
          <img
            src={getAnimatedFrontSprite(pokemon.id)}
            alt={pokemon.name}
            className={`w-32 h-32 sm:w-40 sm:h-40 object-contain relative z-10 ${
              result === 'fail' ? 'animate-pokemon-escape' : ''
            } ${result === 'success' ? 'animate-pokemon-caught' : ''}`}
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>

      {/* Attack indicators */}
      {phase === 'battle' && attacks.map(renderAttack)}

      {/* Hit feedback */}
      {lastHit && Date.now() - lastHit.time < 500 && (
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-hit-feedback pointer-events-none z-30"
        >
          <div
            className={`text-3xl font-black px-4 py-2 rounded-lg ${
              lastHit.quality === 'perfect'
                ? 'text-yellow-400 bg-yellow-400/20'
                : lastHit.quality === 'good'
                  ? 'text-green-400 bg-green-400/20'
                  : 'text-red-400 bg-red-400/20'
            }`}
            style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '1rem' }}
          >
            {lastHit.quality === 'perfect' ? '¡PERFECTO!' : lastHit.quality === 'good' ? '¡BIEN!' : '¡FALLO!'}
            {lastHit.quality !== 'miss' && (
              <span className="text-sm ml-2">
                +{lastHit.quality === 'perfect' ? Math.floor(2 * comboMultiplier) : Math.floor(comboMultiplier)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* UI Overlay */}
      <div className="absolute inset-0 flex flex-col pointer-events-none">
        {/* Top bar - Hearts, Combo, Flee */}
        <div className="flex items-start justify-between p-4">
          {/* Hearts */}
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`text-3xl transition-all ${
                  i < hearts ? 'text-red-500 scale-100' : 'text-slate-700 scale-75'
                } ${i === hearts - 1 && hearts < 3 ? 'animate-pulse' : ''}`}
              >
                ❤️
              </div>
            ))}
          </div>

          {/* Combo */}
          {combo > 0 && phase === 'battle' && (
            <div
              className="bg-slate-900/80 px-3 py-2 rounded-lg border-2 border-purple-500"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              <div className="text-[10px] text-purple-400">COMBO</div>
              <div className="text-xl text-white">{combo}x</div>
              {comboMultiplier > 1 && (
                <div className="text-[8px] text-yellow-400">×{comboMultiplier}</div>
              )}
            </div>
          )}

          {/* Flee button */}
          {phase === 'battle' && (
            <button
              onClick={handleFlee}
              className="pointer-events-auto bg-slate-800/90 px-4 py-2 rounded-lg border-2 border-slate-600 text-slate-300 text-sm font-bold hover:bg-slate-700 hover:border-slate-500 transition-all active:scale-95"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem' }}
            >
              HUIR
            </button>
          )}
        </div>

        {/* Center - Phase messages */}
        {phase === 'intro' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-slide-down">
              <div
                className="text-sm text-white/80 mb-2"
                style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem' }}
              >
                ¡POKEMON SALVAJE!
              </div>
              <div
                className="text-2xl sm:text-3xl font-black text-white"
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  textShadow: `2px 2px 0 ${typeColors.secondary}`,
                }}
              >
                {pokemon.name}
              </div>
              <div className="flex justify-center gap-2 mt-2">
                {pokemon.types.map(type => (
                  <span
                    key={type}
                    className="px-3 py-1 text-[10px] font-bold uppercase rounded"
                    style={{
                      background: TYPE_COLORS[type]?.primary,
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

        {phase === 'ready' && (
          <div className="flex-1 flex items-center justify-center">
            <div
              className="text-xl text-yellow-400 animate-pulse"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              {typePattern.description}
            </div>
          </div>
        )}

        {phase === 'capture_attempt' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl animate-bounce">🔴</div>
              <div
                className="text-xl text-white mt-4"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                CAPTURANDO...
              </div>
            </div>
          </div>
        )}

        {phase === 'result' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-result-pop">
              <div
                className={`text-3xl sm:text-4xl font-black ${
                  result === 'success'
                    ? 'text-yellow-400'
                    : result === 'fled'
                      ? 'text-blue-400'
                      : 'text-red-400'
                }`}
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  textShadow: result === 'success'
                    ? '0 0 20px #FFD700'
                    : result === 'fled'
                      ? '0 0 20px #3B82F6'
                      : '0 0 20px #EF4444',
                }}
              >
                {result === 'success' && '¡CAPTURADO!'}
                {result === 'fled' && '¡HUISTE!'}
                {result === 'fail' && '¡ESCAPÓ!'}
              </div>
              {result === 'success' && (
                <div
                  className="text-white mt-4 text-sm"
                  style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem' }}
                >
                  Combo máximo: {maxCombo}
                </div>
              )}
              {result === 'fail' && (
                <div
                  className="text-red-300 mt-4 text-sm"
                  style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem' }}
                >
                  Tu unidad pierde el turno
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom bar - Dominance meter + Instructions */}
        <div className="p-4">
          {/* Dominance bar */}
          {(phase === 'battle' || phase === 'ready') && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span
                  className="text-[10px] text-slate-400"
                  style={{ fontFamily: "'Press Start 2P', monospace" }}
                >
                  DOMINANCIA
                </span>
                <span
                  className="text-[10px] text-white"
                  style={{ fontFamily: "'Press Start 2P', monospace" }}
                >
                  {Math.floor(dominance)}/{difficulty.hitsRequired}
                </span>
              </div>
              <div className="h-4 bg-slate-800 rounded-full overflow-hidden border-2 border-slate-700">
                <div
                  className="h-full transition-all duration-200"
                  style={{
                    width: `${(dominance / difficulty.hitsRequired) * 100}%`,
                    background: `linear-gradient(to right, ${typeColors.primary}, ${typeColors.secondary})`,
                    boxShadow: `0 0 10px ${typeColors.primary}`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Instructions */}
          {phase === 'battle' && (
            <div
              className="text-center text-[10px] text-slate-500"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              DESLIZA para contrarrestar • FLECHAS/WASD en PC
              {typePattern.reversed && (
                <span className="block text-purple-400 mt-1">¡CONTROLES INVERTIDOS!</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes screen-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-10px); }
          80% { transform: translateX(10px); }
        }
        .animate-screen-shake {
          animation: screen-shake 0.3s ease-in-out;
        }

        @keyframes pokemon-emerge {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-pokemon-emerge {
          animation: pokemon-emerge 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes pokemon-escape {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2) translateY(-20px); }
          100% { transform: scale(0) translateY(-100px); opacity: 0; }
        }
        .animate-pokemon-escape {
          animation: pokemon-escape 0.8s ease-out forwards;
        }

        @keyframes pokemon-caught {
          0% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(0.5); filter: brightness(2); }
          100% { transform: scale(0); filter: brightness(3); }
        }
        .animate-pokemon-caught {
          animation: pokemon-caught 0.6s ease-in forwards;
        }

        @keyframes hit-feedback {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          30% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, calc(-50% - 30px)) scale(1); opacity: 0; }
        }
        .animate-hit-feedback {
          animation: hit-feedback 0.5s ease-out forwards;
        }

        @keyframes slide-down {
          0% { transform: translateY(-30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slide-down 0.5s ease-out forwards;
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
