import { useEffect, useState } from 'react';
import { Loader2, Volume2, SkipForward } from 'lucide-react';
import { audioPreloader, type AudioLoadingState } from '../utils/audioPreloader';
import {
  StartMenuShell,
  MenuActionButton,
  MenuBadge,
  MenuPanel,
  MenuStatRow,
} from './menu/StartMenuTheme';

interface AudioLoadingScreenProps {
  onComplete: () => void;
}

const MAX_WAIT_MS = 10_000;
const SKIP_BUTTON_DELAY_MS = 4_000;

export function AudioLoadingScreen({ onComplete }: AudioLoadingScreenProps) {
  const [loadingState, setLoadingState] = useState<AudioLoadingState>({
    total: 0,
    loaded: 0,
    failed: [],
    isComplete: false,
  });
  const [isUnlocked, setIsUnlocked] = useState(audioPreloader.isUnlocked);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const unsubscribe = audioPreloader.onLoadingStateChange(setLoadingState);
    const unsubscribeUnlock = audioPreloader.onUnlockStateChange(setIsUnlocked);

    return () => {
      unsubscribe();
      unsubscribeUnlock();
    };
  }, []);

  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), SKIP_BUTTON_DELAY_MS);
    const autoSkipTimer = setTimeout(() => {
      if (!audioPreloader.getLoadingState().isComplete) {
        console.warn('[Audio] Loading timed out, skipping to game');
        onComplete();
      }
    }, MAX_WAIT_MS);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(autoSkipTimer);
    };
  }, [onComplete]);

  useEffect(() => {
    if (loadingState.isComplete && isUnlocked) {
      const timer = setTimeout(onComplete, 350);
      return () => clearTimeout(timer);
    }
  }, [loadingState.isComplete, isUnlocked, onComplete]);

  const progress = loadingState.total > 0
    ? Math.round((loadingState.loaded / loadingState.total) * 100)
    : 0;
  const needsActivation = loadingState.isComplete && !isUnlocked;

  return (
    <StartMenuShell>
      <div className="h-full flex items-center justify-center p-4">
        <div className="w-full max-w-lg animate-start-menu-slide-up">
          <MenuPanel
            title="Audio Boot"
            subtitle="Preloading soundtrack and effects"
            accent="amber"
            rightSlot={<MenuBadge label={loadingState.isComplete ? (isUnlocked ? 'Ready' : 'Tap to Start') : 'Loading'} accent={loadingState.isComplete ? (isUnlocked ? 'green' : 'amber') : 'blue'} />}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="w-9 h-9 rounded-sm border-2 border-amber-900/45 bg-[#f6edd8] flex items-center justify-center">
                  {loadingState.isComplete && isUnlocked ? (
                    <Volume2 className="w-5 h-5 text-emerald-700" />
                  ) : (
                    <Loader2 className={`w-5 h-5 text-amber-700 ${loadingState.isComplete ? '' : 'animate-spin'}`} />
                  )}
                </div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#493a29]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  {needsActivation ? 'Tap to enable audio' : loadingState.isComplete ? 'Sound bank ready' : 'Caching audio assets'}
                </p>
              </div>

              <div className="border-2 border-amber-900/35 rounded-sm bg-[#f7edd6] p-2">
                <div className="h-4 border-2 border-amber-900/35 bg-[#ebdcc0] rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-300 relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 loading-shimmer" />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[8px] uppercase tracking-[0.1em] text-[#6e573a]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    Progress
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.12em] text-amber-800" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    {progress}%
                  </span>
                </div>
              </div>

              <div className="border-2 border-amber-900/35 bg-[#f7edd6] rounded-sm p-3 space-y-2">
                <MenuStatRow label="Loaded" value={`${loadingState.loaded}`} />
                <MenuStatRow label="Total" value={`${loadingState.total}`} />
                <MenuStatRow label="Failed" value={`${loadingState.failed.length}`} />
                <MenuStatRow label="Audio" value={isUnlocked ? 'Enabled' : 'Locked'} />
              </div>

              {loadingState.failed.length > 0 && (
                <div className="border border-red-500/65 bg-red-950/45 rounded-sm p-3">
                  <p className="text-[8px] uppercase tracking-[0.1em] text-red-200 mb-2" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    Failed files
                  </p>
                  <ul className="space-y-1">
                    {loadingState.failed.slice(0, 5).map((key) => (
                      <li key={key} className="text-[8px] text-red-200/85 font-mono break-all">{key}</li>
                    ))}
                  </ul>
                </div>
              )}

              {needsActivation && (
                <MenuActionButton
                  label="Activar Audio"
                  icon={Volume2}
                  color="green"
                  onClick={() => {
                    void audioPreloader.unlockAudio();
                    onComplete();
                  }}
                  subtitle="Entrar con musica y efectos listos"
                />
              )}

              {showSkip && (!loadingState.isComplete || needsActivation) && (
                <MenuActionButton
                  label={needsActivation ? 'Seguir Sin Audio' : 'Skip'}
                  icon={SkipForward}
                  color="slate"
                  onClick={onComplete}
                  subtitle={needsActivation ? 'Entrar y activar sonido mas tarde' : 'Continue without waiting'}
                />
              )}
            </div>
          </MenuPanel>
        </div>
      </div>
    </StartMenuShell>
  );
}
