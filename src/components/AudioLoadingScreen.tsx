import { useEffect, useState, useMemo } from 'react';
import { audioPreloader, type AudioLoadingState } from '../utils/audioPreloader';

interface AudioLoadingScreenProps {
  onComplete: () => void;
}

// Generate sparkle particles (same as StartScreen)
function generateSparkles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    delay: Math.random() * 4,
    duration: 3 + Math.random() * 3,
    color: Math.random() > 0.5 ? '#3B82F6' : '#EF4444',
  }));
}

const MAX_WAIT_MS = 10_000; // Auto-skip after 10s
const SKIP_BUTTON_DELAY_MS = 4_000; // Show skip button after 4s

export function AudioLoadingScreen({ onComplete }: AudioLoadingScreenProps) {
  const [loadingState, setLoadingState] = useState<AudioLoadingState>({
    total: 0,
    loaded: 0,
    failed: [],
    isComplete: false,
  });
  const [showSkip, setShowSkip] = useState(false);

  const sparkles = useMemo(() => generateSparkles(20), []);

  useEffect(() => {
    // Subscribe to loading state changes
    const unsubscribe = audioPreloader.onLoadingStateChange(setLoadingState);
    return unsubscribe;
  }, []);

  // Show skip button after a delay, auto-skip after max wait
  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), SKIP_BUTTON_DELAY_MS);
    const autoSkipTimer = setTimeout(() => {
      console.warn('[Audio] Loading timed out, skipping to game');
      onComplete();
    }, MAX_WAIT_MS);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(autoSkipTimer);
    };
  }, [onComplete]);

  useEffect(() => {
    // When loading completes, call onComplete after a brief delay
    if (loadingState.isComplete) {
      const timer = setTimeout(onComplete, 300);
      return () => clearTimeout(timer);
    }
  }, [loadingState.isComplete, onComplete]);

  const progress = loadingState.total > 0
    ? Math.round((loadingState.loaded / loadingState.total) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* DEEP BACKGROUND (same as StartScreen) */}
      <div className="absolute inset-0 bg-[#030305]" />

      {/* Diagonal team split */}
      <div className="absolute inset-0">
        {/* Blue team side */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-950/80 via-blue-900/40 to-transparent"
          style={{ clipPath: 'polygon(0 0, 55% 0, 35% 100%, 0 100%)' }}
        />
        {/* Red team side */}
        <div
          className="absolute inset-0 bg-gradient-to-tl from-red-950/80 via-red-900/40 to-transparent"
          style={{ clipPath: 'polygon(45% 0, 100% 0, 100% 100%, 65% 100%)' }}
        />
        {/* Center clash line */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: 'linear-gradient(135deg, transparent 47%, rgba(251,191,36,0.3) 49%, rgba(251,191,36,0.5) 50%, rgba(251,191,36,0.3) 51%, transparent 53%)',
          }}
        />
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.9)_100%)]" />

      {/* Floating sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {sparkles.map(s => (
          <div
            key={s.id}
            className="absolute rounded-full animate-sparkle"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              background: s.color,
              boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>

      {/* CONTENT */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center px-8 max-w-md">
          {/* GAME FREAK style "NOW LOADING" */}
          <div className="mb-8">
            <div className="text-amber-400 text-sm font-bold tracking-[0.3em] mb-2 animate-pulse">
              NOW LOADING
            </div>
            <div className="flex items-center justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-amber-400"
                  style={{
                    animation: 'bounce 1.4s infinite ease-in-out',
                    animationDelay: `${i * 0.16}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* GBA-style loading bar */}
          <div className="relative">
            {/* Outer border (chunky retro style) */}
            <div className="bg-slate-900 border-4 border-slate-700 rounded-sm p-1 shadow-2xl">
              {/* Inner border */}
              <div className="border-2 border-slate-600 rounded-sm overflow-hidden bg-slate-950">
                {/* Progress bar */}
                <div
                  className="h-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 transition-all duration-300 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  {/* Animated shine effect */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    style={{
                      animation: 'shimmer 2s infinite',
                      backgroundSize: '200% 100%',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Progress text (pixelated font style) */}
            <div className="mt-3 text-slate-300 text-xs tracking-wider">
              {loadingState.isComplete ? (
                <span className="text-green-400 font-bold animate-pulse">COMPLETE!</span>
              ) : (
                <span>
                  {loadingState.loaded} / {loadingState.total} FILES
                </span>
              )}
            </div>
          </div>

          {/* Error messages (GBA style) */}
          {loadingState.failed.length > 0 && (
            <div className="mt-6 bg-red-900/20 border-2 border-red-700/50 rounded-sm p-3">
              <p className="text-red-400 text-xs font-bold mb-1">
                FAILED TO LOAD:
              </p>
              <ul className="text-red-300 text-xs space-y-0.5 font-mono">
                {loadingState.failed.map((key) => (
                  <li key={key}>• {key}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Skip button - appears after delay */}
          {showSkip && !loadingState.isComplete && (
            <button
              onClick={onComplete}
              className="mt-6 px-4 py-2 text-[10px] font-bold text-slate-400 hover:text-white tracking-wider uppercase transition-colors"
            >
              SKIP
            </button>
          )}
        </div>
      </div>
      {/* Animations (sparkle defined here since StartScreen is not mounted during loading) */}
      <style>{`
        @keyframes sparkle {
          0%, 100% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1); opacity: 1; }
        }
        .animate-sparkle {
          animation: sparkle ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
