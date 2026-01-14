import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Swords, Target, LogOut, Zap } from 'lucide-react';
import { getAnimatedFrontSprite } from '../utils/sprites';
import type { PokemonTemplate, Player, PokemonType } from '../types/game';

interface CaptureMinigameProps {
  pokemon: PokemonTemplate;
  player: Player;
  playerPokemon?: PokemonTemplate;
  onSuccess: () => void;
  onFail: () => void;
  onFlee: () => void;
}

type Phase =
  | 'flash'           // Initial white flash
  | 'alert'           // "!" appears
  | 'silhouette'      // Dark silhouette
  | 'reveal'          // Pokemon reveals
  | 'battle'          // Menu: Attack/Capture/Flee
  | 'attacking'       // Attack animation
  | 'ring1'           // First ring (slow)
  | 'ring2'           // Second ring (medium)
  | 'ring3'           // Third ring (fast)
  | 'shaking'         // Pokeball shakes
  | 'result';         // Success or fail

type RingResult = 'perfect' | 'great' | 'good' | 'miss' | null;

// Type colors
const TYPE_COLORS: Record<PokemonType, { primary: string; secondary: string; glow: string }> = {
  normal: { primary: '#A8A878', secondary: '#6D6D4E', glow: 'rgba(168,168,120,0.6)' },
  fire: { primary: '#F08030', secondary: '#9C531F', glow: 'rgba(240,128,48,0.8)' },
  water: { primary: '#6890F0', secondary: '#445E9C', glow: 'rgba(104,144,240,0.8)' },
  grass: { primary: '#78C850', secondary: '#4E8234', glow: 'rgba(120,200,80,0.8)' },
  electric: { primary: '#F8D030', secondary: '#A1871F', glow: 'rgba(248,208,48,0.8)' },
  ice: { primary: '#98D8D8', secondary: '#638D8D', glow: 'rgba(152,216,216,0.8)' },
  fighting: { primary: '#C03028', secondary: '#7D1F1A', glow: 'rgba(192,48,40,0.8)' },
  poison: { primary: '#A040A0', secondary: '#682A68', glow: 'rgba(160,64,160,0.8)' },
  ground: { primary: '#E0C068', secondary: '#927D44', glow: 'rgba(224,192,104,0.8)' },
  flying: { primary: '#A890F0', secondary: '#6D5E9C', glow: 'rgba(168,144,240,0.8)' },
  psychic: { primary: '#F85888', secondary: '#A13959', glow: 'rgba(248,88,136,0.8)' },
  bug: { primary: '#A8B820', secondary: '#6D7815', glow: 'rgba(168,184,32,0.8)' },
  rock: { primary: '#B8A038', secondary: '#786824', glow: 'rgba(184,160,56,0.8)' },
  ghost: { primary: '#705898', secondary: '#493963', glow: 'rgba(112,88,152,0.8)' },
  dragon: { primary: '#7038F8', secondary: '#4924A1', glow: 'rgba(112,56,248,0.8)' },
  steel: { primary: '#B8B8D0', secondary: '#787887', glow: 'rgba(184,184,208,0.8)' },
  fairy: { primary: '#EE99AC', secondary: '#9B6470', glow: 'rgba(238,153,172,0.8)' },
};

// Ring timing bonuses
const RING_BONUS = {
  perfect: 10,
  great: 6,
  good: 3,
  miss: 0,
};

// Ring speeds (ms to close)
const RING_SPEEDS = [1800, 1400, 1000];

// Calculate base capture rate from stats
function getBaseRate(pokemon: PokemonTemplate): number {
  const statTotal = pokemon.hp + pokemon.atk + pokemon.def;
  if (statTotal < 100) return 45;
  if (statTotal < 150) return 35;
  if (statTotal < 200) return 25;
  return 15;
}

// Calculate HP bonus
function getHpBonus(currentHp: number, maxHp: number): number {
  const hpRatio = currentHp / maxHp;
  return Math.floor((1 - hpRatio) * 40);
}

// Calculate ring bonus
function getRingBonus(result: RingResult): number {
  if (!result) return 0;
  return RING_BONUS[result];
}

// Calculate damage
function calculateDamage(attacker: PokemonTemplate, defender: PokemonTemplate): number {
  const baseDamage = Math.floor(attacker.atk * 0.7);
  const defense = Math.floor(defender.def * 0.25);
  return Math.max(8, baseDamage - defense + Math.floor(Math.random() * 8));
}

// Generate particles
function generateParticles(count: number, color: string) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 60,
    y: 50 + (Math.random() - 0.5) * 60,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 0.5,
    duration: 0.8 + Math.random() * 0.6,
    color,
  }));
}

export function CaptureMinigame({
  pokemon,
  player,
  playerPokemon,
  onSuccess,
  onFail,
  onFlee
}: CaptureMinigameProps) {
  const [phase, setPhase] = useState<Phase>('flash');
  const [wildHp, setWildHp] = useState(pokemon.hp);
  const [hasAttacked, setHasAttacked] = useState(false);
  const [showDamage, setShowDamage] = useState<{ amount: number; target: 'wild' | 'player' } | null>(null);

  // Ring states
  const [ringResults, setRingResults] = useState<[RingResult, RingResult, RingResult]>([null, null, null]);
  const [currentRingSize, setCurrentRingSize] = useState(100);
  const [ringMessage, setRingMessage] = useState('');
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Shake state
  const [shakeIndex, setShakeIndex] = useState(0);
  const [captureSuccess, setCaptureSuccess] = useState(false);

  const typeColor = TYPE_COLORS[pokemon.types[0]] || TYPE_COLORS.normal;
  const particles = useMemo(() => generateParticles(20, typeColor.primary), [typeColor.primary]);

  // Default player Pokemon
  const activePlayerPokemon: PokemonTemplate = playerPokemon || {
    id: 25, name: 'Pikachu', types: ['electric'] as PokemonType[],
    hp: 60, atk: 25, def: 15, mov: 3, rng: 2,
    moveName: 'Rayo', moveType: 'electric' as PokemonType
  };

  // Calculate current capture chance
  const baseRate = getBaseRate(pokemon);
  const hpBonus = getHpBonus(wildHp, pokemon.hp);
  const ringBonus = ringResults.reduce((sum, r) => sum + getRingBonus(r), 0);
  const totalChance = Math.min(95, Math.max(5, baseRate + hpBonus + ringBonus));

  // Intro sequence
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Flash → Alert
    timers.push(setTimeout(() => setPhase('alert'), 150));
    // Alert → Silhouette
    timers.push(setTimeout(() => setPhase('silhouette'), 700));
    // Silhouette → Reveal
    timers.push(setTimeout(() => setPhase('reveal'), 1400));
    // Reveal → Battle
    timers.push(setTimeout(() => setPhase('battle'), 2200));

    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  // Handle attack
  const handleAttack = useCallback(() => {
    if (phase !== 'battle' || hasAttacked) return;

    setPhase('attacking');
    setHasAttacked(true);

    // Player attacks wild
    const damage = calculateDamage(activePlayerPokemon, pokemon);

    setTimeout(() => {
      setWildHp(hp => Math.max(1, hp - damage)); // Min 1 HP so it doesn't faint
      setShowDamage({ amount: damage, target: 'wild' });

      setTimeout(() => {
        setShowDamage(null);

        // Wild counter-attacks (always happens)
        setTimeout(() => {
          const counterDamage = calculateDamage(pokemon, activePlayerPokemon);
          setShowDamage({ amount: counterDamage, target: 'player' });

          setTimeout(() => {
            setShowDamage(null);
            setPhase('battle');
          }, 600);
        }, 400);
      }, 500);
    }, 400);
  }, [phase, hasAttacked, activePlayerPokemon, pokemon]);

  // Start ring sequence
  const handleCapture = useCallback(() => {
    if (phase !== 'battle') return;
    setPhase('ring1');
    setCurrentRingSize(100);
    setRingMessage('¡Ring 1 - Prepárate!');

    setTimeout(() => startRing(0), 500);
  }, [phase]);

  // Start a specific ring
  const startRing = useCallback((ringIndex: number) => {
    const speed = RING_SPEEDS[ringIndex];
    const decrementPerFrame = 100 / (speed / 16); // 60fps

    setRingMessage(ringIndex === 0 ? '¡TOCA!' : ringIndex === 1 ? '¡MÁS RÁPIDO!' : '¡AHORA!');

    ringIntervalRef.current = setInterval(() => {
      setCurrentRingSize(size => {
        const newSize = size - decrementPerFrame;
        if (newSize <= 0) {
          // Time ran out - miss
          if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
          completeRing(ringIndex, 'miss');
          return 100;
        }
        return newSize;
      });
    }, 16);
  }, []);

  // Handle ring tap
  const handleRingTap = useCallback(() => {
    const ringIndex = phase === 'ring1' ? 0 : phase === 'ring2' ? 1 : phase === 'ring3' ? 2 : -1;
    if (ringIndex === -1) return;

    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);

    // Determine quality
    let quality: RingResult;
    if (currentRingSize <= 20) {
      quality = 'perfect';
      setRingMessage('¡¡PERFECTO!!');
    } else if (currentRingSize <= 40) {
      quality = 'great';
      setRingMessage('¡GENIAL!');
    } else if (currentRingSize <= 65) {
      quality = 'good';
      setRingMessage('¡BIEN!');
    } else {
      quality = 'miss';
      setRingMessage('Fallaste...');
    }

    completeRing(ringIndex, quality);
  }, [phase, currentRingSize]);

  // Complete a ring and move to next
  const completeRing = useCallback((ringIndex: number, quality: RingResult) => {
    setRingResults(prev => {
      const newResults = [...prev] as [RingResult, RingResult, RingResult];
      newResults[ringIndex] = quality;
      return newResults;
    });

    setCurrentRingSize(100);

    // Move to next ring or shaking
    setTimeout(() => {
      if (ringIndex === 0) {
        setPhase('ring2');
        setTimeout(() => startRing(1), 500);
      } else if (ringIndex === 1) {
        setPhase('ring3');
        setTimeout(() => startRing(2), 500);
      } else {
        // All rings done - start shaking
        setPhase('shaking');
        setShakeIndex(0);
      }
    }, 600);
  }, [startRing]);

  // Pokeball shake sequence
  useEffect(() => {
    if (phase !== 'shaking') return;

    // Calculate final chance
    const finalChance = Math.min(95, Math.max(5, baseRate + hpBonus + ringBonus));
    const success = Math.random() * 100 < finalChance;
    setCaptureSuccess(success);

    // Shake animation
    const shakeTimers: ReturnType<typeof setTimeout>[] = [];

    shakeTimers.push(setTimeout(() => setShakeIndex(1), 600));
    shakeTimers.push(setTimeout(() => setShakeIndex(2), 1200));
    shakeTimers.push(setTimeout(() => setShakeIndex(3), 1800));
    shakeTimers.push(setTimeout(() => {
      setPhase('result');
    }, 2400));

    return () => shakeTimers.forEach(t => clearTimeout(t));
  }, [phase, baseRate, hpBonus, ringBonus]);

  // Handle result
  useEffect(() => {
    if (phase !== 'result') return;

    const timer = setTimeout(() => {
      if (captureSuccess) {
        onSuccess();
      } else {
        onFail();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [phase, captureSuccess, onSuccess, onFail]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    };
  }, []);

  // Handle flee
  const handleFlee = useCallback(() => {
    if (phase !== 'battle') return;
    onFlee();
  }, [phase, onFlee]);

  const hpPercentage = (wildHp / pokemon.hp) * 100;
  const isRingPhase = phase === 'ring1' || phase === 'ring2' || phase === 'ring3';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden">

      {/* === PHASE: FLASH === */}
      {phase === 'flash' && (
        <div className="absolute inset-0 bg-white animate-flash-out" />
      )}

      {/* === BACKGROUND === */}
      <div className={`absolute inset-0 transition-all duration-1000 ${
        phase === 'flash' ? 'opacity-0' : 'opacity-100'
      }`}>
        {/* Base dark */}
        <div className="absolute inset-0 bg-[#0a0a12]" />

        {/* Type-colored gradient */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `radial-gradient(ellipse at center, ${typeColor.glow} 0%, transparent 70%)`,
          }}
        />

        {/* Grass/ground area */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-emerald-950/60 via-emerald-900/30 to-transparent" />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)]" />

        {/* Particles */}
        {phase !== 'flash' && phase !== 'alert' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map(p => (
              <div
                key={p.id}
                className="absolute rounded-full animate-particle-float"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  opacity: 0.4,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* === PHASE: ALERT (!) === */}
      {phase === 'alert' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-alert-pop">
            <div
              className="text-8xl md:text-9xl font-black text-red-500 animate-alert-shake"
              style={{
                fontFamily: '"Press Start 2P", monospace',
                textShadow: '0 0 60px rgba(239,68,68,0.8), 0 0 120px rgba(239,68,68,0.5), 4px 4px 0 #7F1D1D',
                filter: 'drop-shadow(0 0 30px rgba(239,68,68,0.8))',
              }}
            >
              !
            </div>
          </div>
        </div>
      )}

      {/* === PHASE: SILHOUETTE === */}
      {phase === 'silhouette' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative animate-silhouette-appear">
            {/* Mystery glow */}
            <div
              className="absolute inset-0 blur-3xl scale-150"
              style={{ background: typeColor.glow }}
            />
            {/* Black silhouette */}
            <img
              src={getAnimatedFrontSprite(pokemon.id)}
              alt=""
              className="w-40 h-40 md:w-56 md:h-56 object-contain brightness-0"
              style={{ imageRendering: 'pixelated', filter: 'brightness(0) drop-shadow(0 0 20px rgba(255,255,255,0.3))' }}
            />
          </div>
          <div className="absolute bottom-1/4 text-center">
            <span
              className="text-lg md:text-xl text-slate-400 animate-pulse"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              ¿...?
            </span>
          </div>
        </div>
      )}

      {/* === PHASE: REVEAL === */}
      {phase === 'reveal' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative animate-reveal-pokemon">
            {/* Type glow */}
            <div
              className="absolute inset-0 blur-3xl scale-150 animate-pulse"
              style={{ background: typeColor.glow }}
            />
            {/* Pokemon */}
            <img
              src={getAnimatedFrontSprite(pokemon.id)}
              alt={pokemon.name}
              className="relative w-40 h-40 md:w-56 md:h-56 object-contain drop-shadow-2xl"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div className="absolute bottom-1/4 text-center animate-fade-in">
            <span
              className="text-xl md:text-2xl text-white font-bold"
              style={{
                fontFamily: '"Press Start 2P", monospace',
                textShadow: `0 0 20px ${typeColor.glow}, 2px 2px 0 #000`,
              }}
            >
              ¡{pokemon.name.toUpperCase()}!
            </span>
          </div>
        </div>
      )}

      {/* === MAIN BATTLE UI === */}
      {(phase === 'battle' || phase === 'attacking' || isRingPhase || phase === 'shaking' || phase === 'result') && (
        <div className="relative w-full max-w-lg mx-4 animate-slide-up">

          {/* GBA Premium Frame */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
              border: '4px solid',
              borderColor: `${typeColor.primary} ${typeColor.secondary} ${typeColor.secondary} ${typeColor.primary}`,
              boxShadow: `0 0 60px ${typeColor.glow}, inset 0 0 40px rgba(0,0,0,0.6)`,
            }}
          >
            {/* Inner border shine */}
            <div className="absolute inset-1 rounded-xl border border-white/10 pointer-events-none" />

            {/* Header */}
            <div
              className="relative px-4 py-3 border-b-2"
              style={{
                background: `linear-gradient(90deg, ${typeColor.secondary}40, ${typeColor.primary}60, ${typeColor.secondary}40)`,
                borderColor: typeColor.secondary,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span
                    className="text-[10px] font-bold text-amber-400 uppercase tracking-wider"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    ¡Pokémon Salvaje!
                  </span>
                </div>

                {/* Capture chance indicator */}
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-slate-400">Captura:</span>
                  <span
                    className={`text-[10px] font-bold ${
                      totalChance >= 70 ? 'text-emerald-400' :
                      totalChance >= 40 ? 'text-amber-400' : 'text-red-400'
                    }`}
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    {totalChance}%
                  </span>
                </div>
              </div>
            </div>

            {/* Battle Arena */}
            <div className="relative p-4 min-h-[300px]">

              {/* Wild Pokemon (top right) */}
              <div className="absolute top-4 right-4">
                {/* Info panel */}
                <div
                  className="rounded-lg px-3 py-2 mb-2 min-w-[150px]"
                  style={{
                    background: 'linear-gradient(180deg, rgba(30,30,50,0.95) 0%, rgba(20,20,35,0.95) 100%)',
                    border: `2px solid ${typeColor.primary}50`,
                    boxShadow: `0 0 20px ${typeColor.glow}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-[10px] font-bold text-white uppercase"
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      {pokemon.name}
                    </span>
                    {/* Type badge */}
                    <span
                      className="text-[7px] px-1.5 py-0.5 rounded font-bold text-white uppercase"
                      style={{ background: typeColor.primary }}
                    >
                      {pokemon.types[0]}
                    </span>
                  </div>

                  {/* HP Bar */}
                  <div className="relative h-4 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-900">
                    <div
                      className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                        hpPercentage > 50 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                        hpPercentage > 25 ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                        'bg-gradient-to-r from-red-600 to-red-400'
                      }`}
                      style={{ width: `${hpPercentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className="text-[8px] font-bold text-white drop-shadow-lg"
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                      >
                        {wildHp}/{pokemon.hp}
                      </span>
                    </div>
                    {/* HP bar shine */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2" />
                  </div>
                </div>

                {/* Pokemon sprite */}
                <div className={`relative ${phase === 'attacking' && showDamage?.target === 'wild' ? 'animate-damage-shake' : ''}`}>
                  <div
                    className="absolute inset-0 blur-2xl scale-125"
                    style={{ background: typeColor.glow }}
                  />
                  <img
                    src={getAnimatedFrontSprite(pokemon.id)}
                    alt={pokemon.name}
                    className={`relative w-28 h-28 md:w-32 md:h-32 object-contain drop-shadow-2xl transition-all duration-200 ${
                      showDamage?.target === 'wild' ? 'brightness-200' : ''
                    }`}
                    style={{ imageRendering: 'pixelated' }}
                  />

                  {/* Damage popup */}
                  {showDamage?.target === 'wild' && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-damage-float">
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
              <div className="absolute bottom-20 left-4">
                <div className={`relative ${showDamage?.target === 'player' ? 'animate-damage-shake' : ''}`}>
                  <img
                    src={getAnimatedFrontSprite(activePlayerPokemon.id)}
                    alt={activePlayerPokemon.name}
                    className={`w-24 h-24 md:w-28 md:h-28 object-contain scale-x-[-1] drop-shadow-2xl transition-all duration-200 ${
                      showDamage?.target === 'player' ? 'brightness-200' : ''
                    }`}
                    style={{ imageRendering: 'pixelated' }}
                  />

                  {/* Damage popup */}
                  {showDamage?.target === 'player' && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-damage-float">
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
                    className="text-[9px] font-bold text-blue-400"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    {activePlayerPokemon.name}
                  </span>
                </div>
              </div>

              {/* === RING OVERLAY === */}
              {isRingPhase && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/70 cursor-pointer z-10"
                  onClick={handleRingTap}
                >
                  <div className="relative">
                    {/* Ring indicators */}
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex gap-3">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className={`w-8 h-8 rounded-full border-3 flex items-center justify-center transition-all duration-300 ${
                            ringResults[i] === 'perfect' ? 'bg-emerald-500 border-emerald-300' :
                            ringResults[i] === 'great' ? 'bg-blue-500 border-blue-300' :
                            ringResults[i] === 'good' ? 'bg-amber-500 border-amber-300' :
                            ringResults[i] === 'miss' ? 'bg-red-500 border-red-300' :
                            (phase === 'ring1' && i === 0) || (phase === 'ring2' && i === 1) || (phase === 'ring3' && i === 2)
                            ? 'bg-white/20 border-white animate-pulse'
                            : 'bg-slate-800 border-slate-600'
                          }`}
                          style={{ borderWidth: '3px' }}
                        >
                          {ringResults[i] && (
                            <span className="text-[8px] font-bold text-white">
                              {ringResults[i] === 'perfect' ? '★' : ringResults[i] === 'great' ? '◆' : ringResults[i] === 'good' ? '●' : '✕'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Target circle */}
                    <div
                      className="w-36 h-36 rounded-full border-4"
                      style={{
                        borderColor: typeColor.primary,
                        boxShadow: `0 0 40px ${typeColor.glow}, inset 0 0 40px ${typeColor.glow}`,
                      }}
                    />

                    {/* Shrinking ring */}
                    <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 transition-colors duration-100"
                      style={{
                        width: `${currentRingSize * 1.44}px`,
                        height: `${currentRingSize * 1.44}px`,
                        borderColor: currentRingSize <= 20 ? '#22C55E' :
                                    currentRingSize <= 40 ? '#3B82F6' :
                                    currentRingSize <= 65 ? '#F59E0B' : '#EF4444',
                        boxShadow: currentRingSize <= 20 ? '0 0 30px #22C55E, inset 0 0 20px #22C55E50' :
                                  currentRingSize <= 40 ? '0 0 20px #3B82F6' : 'none',
                      }}
                    />

                    {/* Pokeball center */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-b from-red-500 to-red-600 border-4 border-slate-900 relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 bg-slate-900" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-3 border-slate-900" style={{ borderWidth: '3px' }} />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-slate-100 to-slate-200" />
                      </div>
                    </div>

                    {/* Ring message */}
                    <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span
                        className={`text-sm font-bold ${
                          ringMessage.includes('PERFECTO') ? 'text-emerald-400' :
                          ringMessage.includes('GENIAL') ? 'text-blue-400' :
                          ringMessage.includes('BIEN') ? 'text-amber-400' :
                          ringMessage.includes('Fallaste') ? 'text-red-400' : 'text-white'
                        } animate-pulse`}
                        style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '2px 2px 0 #000' }}
                      >
                        {ringMessage}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* === POKEBALL SHAKING === */}
              {phase === 'shaking' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                  <div className="text-center">
                    {/* Shake indicators */}
                    <div className="flex justify-center gap-4 mb-6">
                      {[1, 2, 3].map(i => (
                        <div
                          key={i}
                          className={`text-3xl transition-all duration-300 ${
                            shakeIndex >= i ? 'text-yellow-400 scale-125' : 'text-slate-600'
                          }`}
                        >
                          ★
                        </div>
                      ))}
                    </div>

                    {/* Pokeball */}
                    <div className={`relative inline-block ${shakeIndex > 0 ? 'animate-pokeball-shake' : ''}`}>
                      <div className="w-24 h-24 rounded-full bg-gradient-to-b from-red-500 to-red-600 border-4 border-slate-900 relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 bg-slate-900" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border-4 border-slate-900" />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-slate-100 to-slate-200" />
                      </div>

                      {/* Shake effect particles */}
                      {shakeIndex > 0 && (
                        <div className="absolute inset-0 pointer-events-none">
                          {[...Array(6)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-particle-burst"
                              style={{
                                top: '50%',
                                left: '50%',
                                animationDelay: `${i * 0.1}s`,
                                transform: `rotate(${i * 60}deg) translateY(-40px)`,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      <span
                        className="text-lg text-slate-400 animate-pulse"
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                      >
                        ...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* === RESULT === */}
              {phase === 'result' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                  <div className={`text-center animate-result-pop ${captureSuccess ? '' : 'animate-shake'}`}>
                    {captureSuccess ? (
                      <>
                        {/* Success confetti */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          {[...Array(20)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute animate-confetti"
                              style={{
                                left: `${Math.random() * 100}%`,
                                top: '-10%',
                                animationDelay: `${Math.random() * 0.5}s`,
                              }}
                            >
                              <div
                                className="w-3 h-3 rounded-sm"
                                style={{
                                  background: ['#22C55E', '#3B82F6', '#F59E0B', '#EC4899'][Math.floor(Math.random() * 4)],
                                  transform: `rotate(${Math.random() * 360}deg)`,
                                }}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="text-6xl mb-4">🎉</div>
                        <h2
                          className="text-2xl md:text-3xl font-black text-emerald-400 mb-2"
                          style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '0 0 30px rgba(34,197,94,0.6), 3px 3px 0 #000' }}
                        >
                          ¡CAPTURADO!
                        </h2>
                        <p
                          className="text-sm text-white"
                          style={{ fontFamily: '"Press Start 2P", monospace' }}
                        >
                          {pokemon.name} se unió a tu equipo
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-6xl mb-4">💨</div>
                        <h2
                          className="text-2xl md:text-3xl font-black text-red-400 mb-2"
                          style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '0 0 30px rgba(239,68,68,0.6), 3px 3px 0 #000' }}
                        >
                          ¡ESCAPÓ!
                        </h2>
                        <p
                          className="text-sm text-slate-400"
                          style={{ fontFamily: '"Press Start 2P", monospace' }}
                        >
                          {pokemon.name} se liberó
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* === ACTION BUTTONS === */}
            {phase === 'battle' && (
              <div
                className="p-4 border-t-2"
                style={{
                  background: 'linear-gradient(180deg, rgba(20,20,35,0.95) 0%, rgba(10,10,20,0.98) 100%)',
                  borderColor: typeColor.secondary,
                }}
              >
                {/* Stats summary */}
                <div className="flex justify-center gap-6 mb-3 text-[8px]">
                  <div className="text-center">
                    <span className="text-slate-500">Base</span>
                    <span className="block text-white font-bold">{baseRate}%</span>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-500">HP Bonus</span>
                    <span className={`block font-bold ${hpBonus > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>+{hpBonus}%</span>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-500">Rings</span>
                    <span className="block text-slate-400">+?%</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Attack button */}
                  <button
                    onClick={handleAttack}
                    disabled={hasAttacked}
                    className={`group flex flex-col items-center gap-1 px-3 py-3 rounded-xl transition-all active:scale-95 ${
                      hasAttacked
                        ? 'bg-slate-800 border-2 border-slate-700 opacity-50 cursor-not-allowed'
                        : 'bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border-2 border-red-400/50 shadow-lg hover:shadow-red-500/30'
                    }`}
                  >
                    <Swords className={`w-6 h-6 ${hasAttacked ? 'text-slate-500' : 'text-white'}`} />
                    <span
                      className={`text-[9px] font-bold uppercase ${hasAttacked ? 'text-slate-500' : 'text-white'}`}
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      {hasAttacked ? 'Usado' : 'Atacar'}
                    </span>
                  </button>

                  {/* Capture button */}
                  <button
                    onClick={handleCapture}
                    className="group flex flex-col items-center gap-1 px-3 py-3 bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 rounded-xl border-2 border-amber-300/50 transition-all active:scale-95 shadow-lg hover:shadow-amber-500/40"
                  >
                    <Target className="w-6 h-6 text-white" />
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
                    className="group flex flex-col items-center gap-1 px-3 py-3 bg-gradient-to-b from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 rounded-xl border-2 border-slate-400/50 transition-all active:scale-95 shadow-lg hover:shadow-slate-500/20"
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* === ANIMATIONS === */}
      <style>{`
        @keyframes flash-out {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-flash-out {
          animation: flash-out 0.15s ease-out forwards;
        }

        @keyframes alert-pop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-alert-pop {
          animation: alert-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes alert-shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-5px) rotate(-5deg); }
          75% { transform: translateX(5px) rotate(5deg); }
        }
        .animate-alert-shake {
          animation: alert-shake 0.15s ease-in-out infinite;
        }

        @keyframes silhouette-appear {
          0% { transform: scale(0.5) translateY(50px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-silhouette-appear {
          animation: silhouette-appear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes reveal-pokemon {
          0% { transform: scale(1.2); filter: brightness(3); }
          100% { transform: scale(1); filter: brightness(1); }
        }
        .animate-reveal-pokemon {
          animation: reveal-pokemon 0.8s ease-out forwards;
        }

        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        @keyframes slide-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
        }

        @keyframes damage-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-10px); }
          80% { transform: translateX(10px); }
        }
        .animate-damage-shake {
          animation: damage-shake 0.4s ease-out;
        }

        @keyframes damage-float {
          0% { transform: translateX(-50%) translateY(0); opacity: 1; }
          100% { transform: translateX(-50%) translateY(-40px); opacity: 0; }
        }
        .animate-damage-float {
          animation: damage-float 0.8s ease-out forwards;
        }

        @keyframes particle-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 0.7; }
        }
        .animate-particle-float {
          animation: particle-float ease-in-out infinite;
        }

        @keyframes pokeball-shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-25deg); }
          75% { transform: rotate(25deg); }
        }
        .animate-pokeball-shake {
          animation: pokeball-shake 0.5s ease-in-out;
        }

        @keyframes particle-burst {
          0% { transform: rotate(var(--rotation, 0deg)) translateY(0) scale(1); opacity: 1; }
          100% { transform: rotate(var(--rotation, 0deg)) translateY(-60px) scale(0); opacity: 0; }
        }
        .animate-particle-burst {
          animation: particle-burst 0.6s ease-out forwards;
        }

        @keyframes result-pop {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-result-pop {
          animation: result-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti 2s ease-out forwards;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
