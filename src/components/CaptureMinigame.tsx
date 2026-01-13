import { useState, useEffect, useCallback, useRef } from 'react';
import { getAnimatedFrontSprite } from '../utils/sprites';
import type { PokemonTemplate, Player } from '../types/game';

interface CaptureMinigameProps {
  pokemon: PokemonTemplate;
  player: Player;
  onSuccess: () => void;
  onFail: () => void;
}

type Phase = 'intro' | 'ready' | 'throwing' | 'catching' | 'result';

// Calculate catch difficulty based on Pokemon stats (0-1, higher = harder)
function calculateDifficulty(pokemon: PokemonTemplate): number {
  const totalStats = pokemon.hp + pokemon.atk + pokemon.def;
  // Base forms: ~150-200, Final forms: ~250-350
  const normalized = Math.min(1, Math.max(0, (totalStats - 120) / 250));
  return normalized;
}

// Calculate catch zone size based on difficulty
function getCatchZoneWidth(difficulty: number): number {
  // Easy Pokemon: 40% zone, Hard Pokemon: 15% zone
  return 40 - (difficulty * 25);
}

export function CaptureMinigame({ pokemon, player, onSuccess, onFail }: CaptureMinigameProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [markerPosition, setMarkerPosition] = useState(0);
  const [markerDirection, setMarkerDirection] = useState(1);
  const [catchResult, setCatchResult] = useState<'success' | 'fail' | null>(null);
  const [pokeballY, setPokeballY] = useState(100);
  const [pokeballScale, setPokeballScale] = useState(1);
  const [shakeCount, setShakeCount] = useState(0);
  const animationRef = useRef<number | null>(null);

  const difficulty = calculateDifficulty(pokemon);
  const catchZoneWidth = getCatchZoneWidth(difficulty);
  const catchZoneStart = 50 - catchZoneWidth / 2;
  const catchZoneEnd = 50 + catchZoneWidth / 2;

  // Marker animation speed based on difficulty
  const markerSpeed = 1.5 + difficulty * 1.5; // 1.5-3

  // Animate the marker back and forth
  useEffect(() => {
    if (phase !== 'ready') return;

    const animate = () => {
      setMarkerPosition(prev => {
        let next = prev + markerDirection * markerSpeed;
        if (next >= 100 || next <= 0) {
          setMarkerDirection(d => -d);
          next = Math.max(0, Math.min(100, next));
        }
        return next;
      });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [phase, markerDirection, markerSpeed]);

  // Intro animation
  useEffect(() => {
    const timer = setTimeout(() => setPhase('ready'), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Handle throw action
  const handleThrow = useCallback(() => {
    if (phase !== 'ready') return;

    // Stop the marker
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    // Check if in catch zone
    const isInZone = markerPosition >= catchZoneStart && markerPosition <= catchZoneEnd;

    setPhase('throwing');

    // Animate pokeball throw
    let throwY = 100;
    const throwAnimation = () => {
      throwY -= 8;
      setPokeballY(throwY);
      setPokeballScale(1 - (100 - throwY) / 200);
      if (throwY > 30) {
        requestAnimationFrame(throwAnimation);
      } else {
        setPhase('catching');
        // Start shake animation
        animateCatch(isInZone);
      }
    };
    requestAnimationFrame(throwAnimation);
  }, [phase, markerPosition, catchZoneStart, catchZoneEnd]);

  const animateCatch = (success: boolean) => {
    let shakes = 0;
    const maxShakes = success ? 3 : 1 + Math.floor(Math.random() * 2);

    const doShake = () => {
      shakes++;
      setShakeCount(shakes);

      if (shakes < maxShakes) {
        setTimeout(doShake, 800);
      } else {
        setTimeout(() => {
          setPhase('result');
          setCatchResult(success ? 'success' : 'fail');

          // Callback after showing result
          setTimeout(() => {
            if (success) {
              onSuccess();
            } else {
              onFail();
            }
          }, 1500);
        }, 600);
      }
    };

    setTimeout(doShake, 500);
  };

  // Handle keyboard/touch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        handleThrow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleThrow]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md"
      onClick={handleThrow}
    >
      <div className="relative w-full max-w-md px-4">
        {/* Wild Pokemon appeared! */}
        <div className={`
          text-center mb-6 transition-all duration-500
          ${phase === 'intro' ? 'opacity-100 scale-100' : 'opacity-70 scale-95'}
        `}>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
            {phase === 'intro' && 'POKEMON SALVAJE ENCONTRADO'}
            {phase === 'ready' && 'PULSA PARA CAPTURAR'}
            {phase === 'throwing' && 'LANZANDO...'}
            {phase === 'catching' && (shakeCount > 0 ? '...' : 'CAPTURANDO...')}
            {phase === 'result' && (catchResult === 'success' ? 'CAPTURADO' : 'ESCAPO')}
          </h2>
          <p className={`text-lg font-bold ${player === 'P1' ? 'text-blue-400' : 'text-red-400'}`}>
            {pokemon.name}
          </p>
        </div>

        {/* Pokemon sprite area */}
        <div className="relative flex justify-center mb-8 h-40">
          {/* Pokemon */}
          <div className={`
            relative transition-all duration-300
            ${phase === 'result' && catchResult === 'success' ? 'opacity-0 scale-0' : 'opacity-100'}
            ${phase === 'catching' && shakeCount > 0 ? 'opacity-50' : ''}
          `}>
            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
            <img
              src={getAnimatedFrontSprite(pokemon.id)}
              alt={pokemon.name}
              className="w-32 h-32 object-contain relative z-10"
              style={{
                imageRendering: 'pixelated',
                filter: phase === 'catching' ? 'brightness(2)' : 'none'
              }}
            />
          </div>

          {/* Pokeball */}
          {(phase === 'throwing' || phase === 'catching' || phase === 'result') && (
            <div
              className={`
                absolute transition-all
                ${phase === 'catching' ? 'animate-pokeball-shake' : ''}
                ${phase === 'result' && catchResult === 'fail' ? 'animate-pokeball-break' : ''}
              `}
              style={{
                top: phase === 'throwing' ? `${pokeballY}%` : '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${phase === 'throwing' ? pokeballScale : 1})`,
              }}
            >
              <div className={`
                w-16 h-16 rounded-full relative overflow-hidden shadow-lg
                ${phase === 'result' && catchResult === 'success' ? 'animate-pokeball-success' : ''}
              `}>
                {/* Pokeball design */}
                <div className="absolute inset-0 bg-red-500" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }} />
                <div className="absolute inset-0 bg-white" style={{ clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-1.5 bg-slate-900" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-white border-4 border-slate-900">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                      {phase === 'catching' && shakeCount > 0 && (
                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timing bar - only show in ready phase */}
        {phase === 'ready' && (
          <div className="relative mb-6">
            {/* Track */}
            <div className="h-8 bg-slate-800 rounded-full overflow-hidden border-2 border-slate-600 relative">
              {/* Catch zone (green) */}
              <div
                className="absolute top-0 bottom-0 bg-gradient-to-b from-emerald-500 to-emerald-700 opacity-80"
                style={{
                  left: `${catchZoneStart}%`,
                  width: `${catchZoneWidth}%`
                }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>

              {/* Fail zones (red edges) */}
              <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-red-600/60 to-transparent" style={{ width: '15%' }} />
              <div className="absolute top-0 bottom-0 right-0 bg-gradient-to-l from-red-600/60 to-transparent" style={{ width: '15%' }} />

              {/* Moving marker */}
              <div
                className="absolute top-0 bottom-0 w-2 bg-white shadow-lg transition-none"
                style={{
                  left: `${markerPosition}%`,
                  transform: 'translateX(-50%)',
                  boxShadow: '0 0 10px white, 0 0 20px white'
                }}
              />
            </div>

            {/* Difficulty indicator */}
            <div className="flex justify-between mt-2 text-xs">
              <span className={`font-bold ${difficulty < 0.3 ? 'text-emerald-400' : difficulty < 0.6 ? 'text-yellow-400' : 'text-red-400'}`}>
                {difficulty < 0.3 ? 'Facil' : difficulty < 0.6 ? 'Normal' : 'Dificil'}
              </span>
              <span className="text-slate-500">Zona verde = captura</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        {phase === 'ready' && (
          <p className="text-center text-slate-400 text-sm animate-pulse">
            Toca la pantalla o pulsa ESPACIO cuando el marcador este en verde
          </p>
        )}

        {/* Shake indicators */}
        {phase === 'catching' && (
          <div className="flex justify-center gap-2">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`
                  w-3 h-3 rounded-full transition-all duration-300
                  ${i <= shakeCount ? 'bg-emerald-500 scale-100' : 'bg-slate-700 scale-75'}
                `}
              />
            ))}
          </div>
        )}

        {/* Result message */}
        {phase === 'result' && (
          <div className={`
            text-center text-2xl font-black
            ${catchResult === 'success' ? 'text-emerald-400' : 'text-red-400'}
            animate-bounce
          `}>
            {catchResult === 'success' ? 'GOTCHA!' : 'OH NO! ESCAPO!'}
          </div>
        )}
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes pokeball-shake {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
          25% { transform: translate(-50%, -50%) rotate(-20deg); }
          75% { transform: translate(-50%, -50%) rotate(20deg); }
        }
        .animate-pokeball-shake {
          animation: pokeball-shake 0.3s ease-in-out infinite;
        }

        @keyframes pokeball-success {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); box-shadow: 0 0 30px gold; }
          100% { transform: scale(1); }
        }
        .animate-pokeball-success {
          animation: pokeball-success 0.5s ease-out;
        }

        @keyframes pokeball-break {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.3); }
          100% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        }
        .animate-pokeball-break {
          animation: pokeball-break 0.5s ease-out forwards;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
