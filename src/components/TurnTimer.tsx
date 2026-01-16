import { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface TurnTimerProps {
  /** Duration in seconds */
  duration: number;
  /** Called when timer reaches 0 */
  onTimeout: () => void;
  /** Pause the timer (e.g., during battle animations) */
  paused?: boolean;
  /** Reset the timer to full duration */
  resetKey?: number;
  /** Show compact version */
  compact?: boolean;
  /** Current player color */
  playerColor: 'blue' | 'red';
}

export const TURN_TIMER_DURATION = 45; // seconds

export function TurnTimer({
  duration,
  onTimeout,
  paused = false,
  resetKey = 0,
  compact = false,
  playerColor
}: TurnTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const onTimeoutRef = useRef(onTimeout);
  const hasCalledTimeout = useRef(false);

  // Keep ref updated
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  // Reset timer when resetKey changes
  useEffect(() => {
    setTimeLeft(duration);
    setIsWarning(false);
    setIsCritical(false);
    hasCalledTimeout.current = false;
  }, [resetKey, duration]);

  // Countdown logic
  useEffect(() => {
    if (paused) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;

        // Update warning states
        if (newTime <= 10 && newTime > 5) {
          setIsWarning(true);
          setIsCritical(false);
        } else if (newTime <= 5) {
          setIsWarning(true);
          setIsCritical(true);
        }

        // Trigger timeout
        if (newTime <= 0 && !hasCalledTimeout.current) {
          hasCalledTimeout.current = true;
          onTimeoutRef.current();
          return 0;
        }

        return Math.max(0, newTime);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [paused]);

  // Calculate progress percentage
  const progress = (timeLeft / duration) * 100;

  // Color based on state and player
  const getColor = () => {
    if (isCritical) return 'rgb(239, 68, 68)'; // red-500
    if (isWarning) return 'rgb(245, 158, 11)'; // amber-500
    return playerColor === 'blue' ? 'rgb(59, 130, 246)' : 'rgb(239, 68, 68)';
  };

  if (compact) {
    return (
      <div className={`
        flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono font-bold
        transition-all duration-300
        ${isCritical ? 'bg-red-900/80 text-red-300 animate-pulse' :
          isWarning ? 'bg-amber-900/80 text-amber-300' :
          'bg-slate-800/80 text-slate-300'}
      `}>
        <Clock className="w-3 h-3" />
        <span>{timeLeft}s</span>
      </div>
    );
  }

  return (
    <div className={`
      relative flex items-center gap-2 px-3 py-2 rounded-lg
      bg-slate-900/90 border backdrop-blur-sm
      transition-all duration-300
      ${isCritical ? 'border-red-500/70 shadow-lg shadow-red-500/20' :
        isWarning ? 'border-amber-500/50' :
        'border-slate-700/50'}
    `}>
      {/* Timer icon */}
      <div className={`relative ${isCritical ? 'animate-bounce' : ''}`}>
        {isCritical ? (
          <AlertTriangle className="w-5 h-5 text-red-400" />
        ) : (
          <Clock className={`w-5 h-5 ${isWarning ? 'text-amber-400' : 'text-slate-400'}`} />
        )}
      </div>

      {/* Time display */}
      <div className="flex flex-col">
        <span className={`
          text-lg font-mono font-bold leading-none
          ${isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-slate-200'}
        `}>
          {timeLeft}
        </span>
        <span className="text-[9px] text-slate-500 uppercase tracking-wider">
          segundos
        </span>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800 rounded-b-lg overflow-hidden">
        <div
          className="h-full transition-all duration-1000 ease-linear"
          style={{
            width: `${progress}%`,
            backgroundColor: getColor(),
          }}
        />
      </div>

      {/* Critical warning text */}
      {isCritical && (
        <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full animate-pulse">
          !
        </span>
      )}
    </div>
  );
}
