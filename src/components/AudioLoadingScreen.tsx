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
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const unsubscribe = audioPreloader.onLoadingStateChange(setLoadingState);
    return unsubscribe;
  }, []);

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
    if (loadingState.isComplete) {
      const timer = setTimeout(onComplete, 350);
      return () => clearTimeout(timer);
    }
  }, [loadingState.isComplete, onComplete]);

  const progress = loadingState.total > 0
    ? Math.round((loadingState.loaded / loadingState.total) * 100)
    : 0;

  return (
    <StartMenuShell>
      <div className="h-full flex items-center justify-center p-4">
        <div className="w-full max-w-lg animate-start-menu-slide-up">
          <MenuPanel
            title="Audio Boot"
            subtitle="Preloading soundtrack and effects"
            accent="amber"
            rightSlot={<MenuBadge label={loadingState.isComplete ? 'Ready' : 'Loading'} accent={loadingState.isComplete ? 'green' : 'blue'} />}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="w-9 h-9 rounded-sm border border-slate-600 bg-slate-900/85 flex items-center justify-center">
                  {loadingState.isComplete ? (
                    <Volume2 className="w-5 h-5 text-emerald-300" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-amber-300 animate-spin" />
                  )}
                </div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-slate-200" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  {loadingState.isComplete ? 'Sound bank ready' : 'Caching audio assets'}
                </p>
              </div>

              <div className="border border-slate-700 rounded-sm bg-slate-950/70 p-2">
                <div className="h-4 border-2 border-slate-700 bg-slate-900 rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-300 relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 loading-shimmer" />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[8px] uppercase tracking-[0.1em] text-slate-300" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    Progress
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.12em] text-amber-200" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    {progress}%
                  </span>
                </div>
              </div>

              <div className="border border-slate-700 bg-slate-950/70 rounded-sm p-3 space-y-2">
                <MenuStatRow label="Loaded" value={`${loadingState.loaded}`} />
                <MenuStatRow label="Total" value={`${loadingState.total}`} />
                <MenuStatRow label="Failed" value={`${loadingState.failed.length}`} />
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

              {showSkip && !loadingState.isComplete && (
                <MenuActionButton
                  label="Skip"
                  icon={SkipForward}
                  color="slate"
                  onClick={onComplete}
                  subtitle="Continue without waiting"
                />
              )}
            </div>
          </MenuPanel>
        </div>
      </div>
    </StartMenuShell>
  );
}
