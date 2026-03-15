import { useState, useEffect, useRef } from 'react';
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
    if (isCritical) return 'rgb(244, 63, 94)'; // rose-500
    if (isWarning) return 'rgb(245, 158, 11)'; // amber-500
    return playerColor === 'blue' ? 'rgb(56, 189, 248)' : 'rgb(244, 63, 94)';
  };

  if (compact) {
    return (
      <div className={`
        flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono font-bold border
        transition-all duration-300
        ${isCritical ? 'bg-rose-100 border-rose-500/50 text-rose-800 animate-pulse' :
          isWarning ? 'bg-amber-100 border-amber-500/50 text-amber-900' :
          playerColor === 'blue'
            ? 'bg-sky-100 border-sky-500/45 text-sky-900'
            : 'bg-rose-100 border-rose-500/45 text-rose-900'}
      `}>
        <Clock className="w-3 h-3" />
        <span>{timeLeft}s</span>
      </div>
    );
  }

  return (
    <div className={`
      relative flex items-center gap-2 px-3 py-2 rounded-sm border-[2px]
      bg-gradient-to-b from-[#f3e7c7] to-[#e4d4ad]
      transition-all duration-300
      ${isCritical ? 'border-rose-500/75 shadow-[3px_3px_0_0_rgba(159,18,57,0.35)]' :
        isWarning ? 'border-amber-600/75 shadow-[3px_3px_0_0_rgba(146,64,14,0.28)]' :
        playerColor === 'blue'
          ? 'border-sky-500/75 shadow-[3px_3px_0_0_rgba(12,74,110,0.28)]'
          : 'border-rose-500/75 shadow-[3px_3px_0_0_rgba(127,29,29,0.28)]'}
    `}>
      {/* Timer icon */}
      <div className={`relative ${isCritical ? 'animate-bounce' : ''}`}>
        {isCritical ? (
          <AlertTriangle className="w-5 h-5 text-rose-500" />
        ) : (
          <Clock className={`w-5 h-5 ${isWarning ? 'text-amber-600' : playerColor === 'blue' ? 'text-sky-700' : 'text-rose-700'}`} />
        )}
      </div>

      {/* Time display */}
      <div className="flex flex-col">
        <span className={`
          text-lg font-mono font-bold leading-none
          ${isCritical ? 'text-rose-700' : isWarning ? 'text-amber-700' : 'text-slate-800'}
        `}>
          {timeLeft}
        </span>
        <span className="text-[9px] text-slate-600 uppercase tracking-wider">
          segundos
        </span>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-sm overflow-hidden">
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
        <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-rose-500 text-white text-[8px] font-bold rounded-full animate-pulse">
          !
        </span>
      )}
    </div>
  );
}
