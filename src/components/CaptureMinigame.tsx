import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Swords, Circle, LogOut, Heart, Zap, Shield } from 'lucide-react';
import { getAnimatedFrontSprite } from '../utils/sprites';
import type { PokemonTemplate, Player, PokemonType } from '../types/game';

interface CaptureMinigameProps {
  pokemon: PokemonTemplate;
  player: Player;
  playerPokemon?: PokemonTemplate; // The Pokemon doing the capturing
  onSuccess: () => void;
  onFail: () => void;
  onFlee: () => void;
}

type Phase = 'intro' | 'battle' | 'attacking' | 'capturing' | 'shaking' | 'result';
type Result = 'success' | 'fail' | 'escaped' | null;

// Type colors for visual effects
const TYPE_COLORS: Record<PokemonType, { primary: string; glow: string }> = {
  normal: { primary: '#A8A878', glow: 'rgba(168,168,120,0.6)' },
  fire: { primary: '#F08030', glow: 'rgba(240,128,48,0.7)' },
  water: { primary: '#6890F0', glow: 'rgba(104,144,240,0.7)' },
  grass: { primary: '#78C850', glow: 'rgba(120,200,80,0.7)' },
  electric: { primary: '#F8D030', glow: 'rgba(248,208,48,0.7)' },
  ice: { primary: '#98D8D8', glow: 'rgba(152,216,216,0.7)' },
  fighting: { primary: '#C03028', glow: 'rgba(192,48,40,0.7)' },
  poison: { primary: '#A040A0', glow: 'rgba(160,64,160,0.7)' },
  ground: { primary: '#E0C068', glow: 'rgba(224,192,104,0.7)' },
  flying: { primary: '#A890F0', glow: 'rgba(168,144,240,0.7)' },
  psychic: { primary: '#F85888', glow: 'rgba(248,88,136,0.7)' },
  bug: { primary: '#A8B820', glow: 'rgba(168,184,32,0.7)' },
  rock: { primary: '#B8A038', glow: 'rgba(184,160,56,0.7)' },
  ghost: { primary: '#705898', glow: 'rgba(112,88,152,0.7)' },
  dragon: { primary: '#7038F8', glow: 'rgba(112,56,248,0.7)' },
  steel: { primary: '#B8B8D0', glow: 'rgba(184,184,208,0.7)' },
  fairy: { primary: '#EE99AC', glow: 'rgba(238,153,172,0.7)' },
};

// Calculate damage based on attacker stats
function calculateDamage(attacker: PokemonTemplate, defender: PokemonTemplate): number {
  const baseDamage = Math.floor(attacker.atk * 0.8);
  const defense = Math.floor(defender.def * 0.3);
  return Math.max(5, baseDamage - defense + Math.floor(Math.random() * 10));
}

// Calculate capture probability
function calculateCaptureChance(
  pokemon: PokemonTemplate,
  currentHp: number,
  timingQuality: 'perfect' | 'great' | 'good' | 'miss'
): number {
  // Base chance: 25-35% depending on Pokemon stats
  const statTotal = pokemon.hp + pokemon.atk + pokemon.def;
  const baseDifficulty = Math.min(0.4, Math.max(0.15, 1 - (statTotal / 400)));

  // HP bonus: 0% at full HP, up to +45% at 1 HP
  const hpRatio = currentHp / pokemon.hp;
  const hpBonus = (1 - hpRatio) * 0.45;

  // Timing bonus
  const timingBonus = {
    'perfect': 0.20,
    'great': 0.12,
    'good': 0.05,
    'miss': -0.10,
  }[timingQuality];

  // Final chance (capped at 95% - never guaranteed)
  return Math.min(0.95, Math.max(0.05, baseDifficulty + hpBonus + timingBonus));
}

export function CaptureMinigame({
  pokemon,
  player,
  playerPokemon,
  onSuccess,
  onFail,
  onFlee
}: CaptureMinigameProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [result, setResult] = useState<Result>(null);

  // Battle state
  const [wildHp, setWildHp] = useState(pokemon.hp);
  const [playerHearts, setPlayerHearts] = useState(3);
  const [message, setMessage] = useState('');
  const [showDamage, setShowDamage] = useState<{ amount: number; isPlayer: boolean } | null>(null);

  // Capture ring state
  const [ringSize, setRingSize] = useState(100);
  const [ringActive, setRingActive] = useState(false);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Shake animation
  const [shakeCount, setShakeCount] = useState(0);

  const typeColor = TYPE_COLORS[pokemon.types[0]] || TYPE_COLORS.normal;

  // Default player Pokemon if not provided
  const activePlayerPokemon: PokemonTemplate = playerPokemon || {
    id: 25, name: 'Pikachu', types: ['electric'] as PokemonType[],
    hp: 60, atk: 25, def: 15, mov: 3, rng: 2,
    moveName: 'Rayo', moveType: 'electric' as PokemonType
  };

  // Intro sequence
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('battle');
      setMessage(`¡Un ${pokemon.name} salvaje apareció!`);
    }, 800);
    return () => clearTimeout(timer);
  }, [pokemon.name]);

  // Handle attack action
  const handleAttack = useCallback(() => {
    if (phase !== 'battle') return;

    setPhase('attacking');
    setMessage(`¡${activePlayerPokemon.name} ataca!`);

    // Calculate and apply damage
    const damage = calculateDamage(activePlayerPokemon, pokemon);

    setTimeout(() => {
      setWildHp(hp => {
        const newHp = Math.max(0, hp - damage);
        setShowDamage({ amount: damage, isPlayer: false });

        // Check if Pokemon fainted
        if (newHp <= 0) {
          setTimeout(() => {
            setMessage(`¡${pokemon.name} se debilitó demasiado y huyó!`);
            setResult('escaped');
            setPhase('result');
          }, 800);
        }
        return newHp;
      });

      setTimeout(() => setShowDamage(null), 600);

      // Wild Pokemon counter-attack (70% chance if still alive)
      setTimeout(() => {
        setWildHp(currentHp => {
          if (currentHp > 0 && Math.random() < 0.7) {
            setMessage(`¡${pokemon.name} contraataca!`);
            const counterDamage = Math.random() < 0.3 ? 2 : 1; // 30% chance of heavy hit

            setTimeout(() => {
              setPlayerHearts(hearts => {
                const newHearts = Math.max(0, hearts - counterDamage);
                setShowDamage({ amount: counterDamage, isPlayer: true });
                setTimeout(() => setShowDamage(null), 600);

                if (newHearts <= 0) {
                  setTimeout(() => {
                    setMessage(`¡Tu Pokemon está agotado! ${pokemon.name} escapó...`);
                    setResult('fail');
                    setPhase('result');
                  }, 600);
                } else {
                  setTimeout(() => {
                    setPhase('battle');
                    setMessage('¿Qué harás?');
                  }, 800);
                }
                return newHearts;
              });
            }, 400);
          } else if (currentHp > 0) {
            setPhase('battle');
            setMessage('¿Qué harás?');
          }
          return currentHp;
        });
      }, 800);
    }, 500);
  }, [phase, activePlayerPokemon, pokemon]);

  // Handle capture attempt - start ring
  const handleCapture = useCallback(() => {
    if (phase !== 'battle') return;

    setPhase('capturing');
    setMessage('¡Apunta bien y toca!');
    setRingSize(100);
    setRingActive(true);

    // Ring shrinks over time
    ringIntervalRef.current = setInterval(() => {
      setRingSize(size => {
        if (size <= 0) {
          // Missed completely
          if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
          setRingActive(false);

          // Calculate with "miss" timing
          const chance = calculateCaptureChance(pokemon, wildHp, 'miss');
          attemptCapture(chance, 'miss');
          return 100;
        }
        return size - 2;
      });
    }, 30);
  }, [phase, pokemon, wildHp]);

  // Handle ring tap
  const handleRingTap = useCallback(() => {
    if (!ringActive || phase !== 'capturing') return;

    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    setRingActive(false);

    // Determine timing quality based on ring size
    let timing: 'perfect' | 'great' | 'good' | 'miss';
    if (ringSize <= 25) {
      timing = 'perfect';
      setMessage('¡PERFECTO!');
    } else if (ringSize <= 45) {
      timing = 'great';
      setMessage('¡Genial!');
    } else if (ringSize <= 70) {
      timing = 'good';
      setMessage('¡Bien!');
    } else {
      timing = 'miss';
      setMessage('Demasiado pronto...');
    }

    const chance = calculateCaptureChance(pokemon, wildHp, timing);

    setTimeout(() => attemptCapture(chance, timing), 500);
  }, [ringActive, phase, ringSize, pokemon, wildHp]);

  // Attempt capture with probability
  const attemptCapture = useCallback((chance: number, timing: string) => {
    setPhase('shaking');
    setMessage('...');
    setShakeCount(0);

    const roll = Math.random();
    const success = roll < chance;

    // Show shake animation (1-3 shakes)
    const shakes = success ? 3 : Math.floor(Math.random() * 3) + 1;
    let currentShake = 0;

    const shakeInterval = setInterval(() => {
      currentShake++;
      setShakeCount(currentShake);

      if (currentShake >= shakes) {
        clearInterval(shakeInterval);

        setTimeout(() => {
          if (success) {
            setMessage(`¡${pokemon.name} fue capturado!`);
            setResult('success');
          } else {
            setMessage(`¡${pokemon.name} se liberó!`);
            // Pokemon might flee after failed capture (20% + 10% per failed attempt)
            if (Math.random() < 0.25) {
              setTimeout(() => {
                setMessage(`¡${pokemon.name} huyó!`);
                setResult('escaped');
              }, 800);
            } else {
              setTimeout(() => {
                setPhase('battle');
                setMessage('¿Qué harás?');
              }, 800);
            }
          }
          setPhase('result');
        }, 500);
      }
    }, 600);
  }, [pokemon.name]);

  // Handle flee
  const handleFlee = useCallback(() => {
    if (phase !== 'battle') return;
    setMessage('¡Huiste a salvo!');
    setResult('escaped');
    setPhase('result');
    setTimeout(() => onFlee(), 1000);
  }, [phase, onFlee]);

  // Handle result completion
  useEffect(() => {
    if (phase === 'result' && result) {
      const timer = setTimeout(() => {
        if (result === 'success') {
          onSuccess();
        } else if (result === 'fail' || result === 'escaped') {
          if (result === 'escaped' && playerHearts > 0) {
            onFlee(); // Escaped safely
          } else {
            onFail();
          }
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, result, onSuccess, onFail, onFlee, playerHearts]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    };
  }, []);

  const hpPercentage = (wildHp / pokemon.hp) * 100;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, #1a1a2e 0%, ${typeColor.glow} 50%, #1a1a2e 100%)`,
        }}
      />

      {/* Battle arena gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/50 via-transparent to-slate-950/80" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.7)_100%)]" />

      {/* Main content */}
      <div className={`relative w-full max-w-lg mx-4 transition-all duration-500 ${
        phase === 'intro' ? 'scale-90 opacity-0' : 'scale-100 opacity-100'
      }`}>

        {/* GBA-style frame */}
        <div
          className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl overflow-hidden"
          style={{
            border: '4px solid',
            borderColor: '#4B5563 #1F2937 #1F2937 #4B5563',
            boxShadow: `0 0 40px ${typeColor.glow}, inset 0 0 30px rgba(0,0,0,0.5)`,
          }}
        >
          {/* Header */}
          <div className="px-4 py-2 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 border-b-2 border-slate-800">
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-bold text-amber-400 uppercase tracking-wider"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                ¡Pokémon Salvaje!
              </span>
              <div className="flex items-center gap-1">
                {[...Array(3)].map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-4 h-4 transition-all duration-300 ${
                      i < playerHearts
                        ? 'text-red-500 fill-red-500'
                        : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Battle area */}
          <div className="relative p-4 min-h-[280px]">

            {/* Wild Pokemon (top right) */}
            <div className="absolute top-2 right-4">
              {/* Info panel */}
              <div className="bg-slate-800/90 rounded-lg px-3 py-2 border border-slate-600 mb-2 min-w-[140px]">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-[10px] font-bold text-white uppercase"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    {pokemon.name}
                  </span>
                  <span className="text-[8px] text-slate-400">Lv.{Math.floor(pokemon.hp / 10)}</span>
                </div>
                {/* HP bar */}
                <div className="relative h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                      hpPercentage > 50 ? 'bg-emerald-500' : hpPercentage > 25 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${hpPercentage}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white drop-shadow-lg">
                      {wildHp}/{pokemon.hp}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pokemon sprite */}
              <div className={`relative transition-all duration-300 ${
                phase === 'attacking' ? 'animate-shake' : ''
              } ${showDamage && !showDamage.isPlayer ? 'brightness-150' : ''}`}>
                <div
                  className="absolute inset-0 blur-2xl"
                  style={{ background: typeColor.glow }}
                />
                <img
                  src={getAnimatedFrontSprite(pokemon.id)}
                  alt={pokemon.name}
                  className="relative w-28 h-28 object-contain drop-shadow-2xl"
                  style={{ imageRendering: 'pixelated' }}
                />
                {/* Damage number */}
                {showDamage && !showDamage.isPlayer && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-damage-pop">
                    <span
                      className="text-2xl font-black text-red-400"
                      style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '2px 2px 0 #000' }}
                    >
                      -{showDamage.amount}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Player Pokemon (bottom left) */}
            <div className="absolute bottom-16 left-4">
              <div className={`relative transition-all duration-300 ${
                showDamage?.isPlayer ? 'animate-shake brightness-150' : ''
              }`}>
                <img
                  src={getAnimatedFrontSprite(activePlayerPokemon.id)}
                  alt={activePlayerPokemon.name}
                  className="w-24 h-24 object-contain scale-x-[-1] drop-shadow-2xl"
                  style={{ imageRendering: 'pixelated' }}
                />
                {/* Damage number */}
                {showDamage?.isPlayer && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-damage-pop">
                    <span
                      className="text-xl font-black text-red-400"
                      style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '2px 2px 0 #000' }}
                    >
                      -{showDamage.amount}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-center mt-1">
                <span
                  className="text-[8px] text-blue-400 font-bold"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {activePlayerPokemon.name}
                </span>
              </div>
            </div>

            {/* Capture ring overlay */}
            {phase === 'capturing' && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/60 cursor-pointer"
                onClick={handleRingTap}
              >
                <div className="relative">
                  {/* Target circle */}
                  <div
                    className="w-32 h-32 rounded-full border-4 border-white/30"
                    style={{ boxShadow: `0 0 30px ${typeColor.glow}` }}
                  />
                  {/* Shrinking ring */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 transition-colors duration-200"
                    style={{
                      width: `${ringSize * 1.28}px`,
                      height: `${ringSize * 1.28}px`,
                      borderColor: ringSize <= 25 ? '#22C55E' : ringSize <= 45 ? '#EAB308' : ringSize <= 70 ? '#F97316' : '#EF4444',
                      boxShadow: ringSize <= 25 ? '0 0 20px #22C55E' : 'none',
                    }}
                  />
                  {/* Pokeball center */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-b from-red-500 to-red-600 border-2 border-slate-900 relative overflow-hidden">
                      <div className="absolute inset-x-0 top-1/2 h-1 bg-slate-900" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-slate-900" />
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-slate-100 to-slate-200" />
                    </div>
                  </div>
                  {/* Instructions */}
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span
                      className="text-[10px] text-white font-bold animate-pulse"
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      ¡TOCA AHORA!
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Pokeball shake animation */}
            {phase === 'shaking' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className={`relative ${shakeCount > 0 ? 'animate-pokeball-shake' : ''}`}>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-b from-red-500 to-red-600 border-4 border-slate-900 relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-x-0 top-1/2 h-2 bg-slate-900" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-4 border-slate-900" />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-slate-100 to-slate-200" />
                  </div>
                  {/* Shake stars */}
                  {[...Array(shakeCount)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute -top-4 text-yellow-400 animate-star-pop"
                      style={{ left: `${20 + i * 25}px` }}
                    >
                      ★
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Message box */}
          <div className="px-4 py-3 bg-slate-900/80 border-t-2 border-slate-700">
            <div
              className="text-sm text-white min-h-[24px]"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '11px' }}
            >
              {message}
            </div>
          </div>

          {/* Action buttons */}
          {phase === 'battle' && wildHp > 0 && playerHearts > 0 && (
            <div className="p-3 bg-gradient-to-t from-slate-950 to-slate-900 border-t-2 border-slate-700">
              <div className="grid grid-cols-3 gap-2">
                {/* Attack button */}
                <button
                  onClick={handleAttack}
                  className="group flex flex-col items-center gap-1 px-3 py-3 bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg border-2 border-red-400/50 transition-all active:scale-95 shadow-lg hover:shadow-red-500/30"
                >
                  <Swords className="w-6 h-6 text-white" />
                  <span
                    className="text-[9px] font-bold text-white uppercase"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    Atacar
                  </span>
                </button>

                {/* Capture button */}
                <button
                  onClick={handleCapture}
                  className="group flex flex-col items-center gap-1 px-3 py-3 bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-lg border-2 border-amber-400/50 transition-all active:scale-95 shadow-lg hover:shadow-amber-500/30"
                >
                  <Circle className="w-6 h-6 text-white" />
                  <span
                    className="text-[9px] font-bold text-white uppercase"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    Capturar
                  </span>
                </button>

                {/* Flee button */}
                <button
                  onClick={handleFlee}
                  className="group flex flex-col items-center gap-1 px-3 py-3 bg-gradient-to-b from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 rounded-lg border-2 border-slate-400/50 transition-all active:scale-95 shadow-lg hover:shadow-slate-500/20"
                >
                  <LogOut className="w-6 h-6 text-white" />
                  <span
                    className="text-[9px] font-bold text-white uppercase"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    Huir
                  </span>
                </button>
              </div>

              {/* Capture chance hint */}
              <div className="mt-2 text-center">
                <span className="text-[8px] text-slate-500">
                  Probabilidad de captura: ~{Math.round(calculateCaptureChance(pokemon, wildHp, 'good') * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* Result state - show appropriate message */}
          {phase === 'result' && result && (
            <div className="p-4 bg-gradient-to-t from-slate-950 to-slate-900 border-t-2 border-slate-700">
              <div className={`text-center py-4 rounded-lg ${
                result === 'success'
                  ? 'bg-emerald-500/20 border-2 border-emerald-500/50'
                  : 'bg-red-500/20 border-2 border-red-500/50'
              }`}>
                <span
                  className={`text-lg font-bold ${
                    result === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {result === 'success' ? '¡CAPTURADO!' : result === 'escaped' ? 'ESCAPÓ' : 'FALLÓ'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

        @keyframes damage-pop {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          50% { transform: translate(-50%, -80%) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, -100%) scale(1); opacity: 0; }
        }
        .animate-damage-pop {
          animation: damage-pop 0.6s ease-out forwards;
        }

        @keyframes pokeball-shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-20deg); }
          75% { transform: rotate(20deg); }
        }
        .animate-pokeball-shake {
          animation: pokeball-shake 0.4s ease-in-out;
        }

        @keyframes star-pop {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          50% { transform: translateY(-10px) scale(1.2); opacity: 1; }
          100% { transform: translateY(-20px) scale(0.8); opacity: 0; }
        }
        .animate-star-pop {
          animation: star-pop 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
