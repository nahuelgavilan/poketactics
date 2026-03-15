import { useState, useEffect, useMemo, useCallback } from 'react';
import { Swords, BookOpen, Wifi, Map, Shield, Users } from 'lucide-react';
import { useSFX } from '../hooks/useSFX';
import { VERSION } from '../constants/version';
import { getAnimatedFrontSprite } from '../utils/sprites';
import { audioPreloader, type AudioLoadingState } from '../utils/audioPreloader';
import { AudioSettingsPanel } from './AudioSettingsPanel';
import {
  StartMenuShell,
  MenuActionButton,
  MenuBadge,
  MenuOrbitParticle,
  MenuPanel,
  MenuStatRow,
} from './menu/StartMenuTheme';

interface StartScreenProps {
  onStartGame: () => void;
  onHowToPlay: () => void;
  onMultiplayer?: (mode: 'quick' | 'draft') => void;
  onDraft?: () => void;
  onMapEditor?: () => void;
}

const VS_PAIRS = [
  { left: { id: 6, name: 'Charizard' }, right: { id: 9, name: 'Blastoise' } },
  { left: { id: 3, name: 'Venusaur' }, right: { id: 25, name: 'Pikachu' } },
  { left: { id: 448, name: 'Lucario' }, right: { id: 94, name: 'Gengar' } },
];

function generateOrbitParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    offset: (i / count) * 360,
    speed: 2 + Math.random() * 2,
    radius: 8 + Math.random() * 16,
    size: 2 + Math.random() * 3,
    color: i % 2 === 0 ? '#4fb6c8' : '#c17259',
  }));
}

export function StartScreen({ onStartGame, onHowToPlay, onMultiplayer, onDraft, onMapEditor }: StartScreenProps) {
  const [phase, setPhase] = useState<'boot' | 'ready'>('boot');
  const [activePair, setActivePair] = useState(0);
  const [onlineMode, setOnlineMode] = useState<'quick' | 'draft'>('quick');
  const [audioLoadingState, setAudioLoadingState] = useState<AudioLoadingState>(() => audioPreloader.getLoadingState());
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(audioPreloader.isUnlocked);

  const { playSFX } = useSFX();
  const orbitParticles = useMemo(() => generateOrbitParticles(12), []);

  const handleStartWithSFX = useCallback(() => {
    playSFX('button_click', 0.5);
    onStartGame();
  }, [playSFX, onStartGame]);

  const handleHowToPlayWithSFX = useCallback(() => {
    playSFX('button_click', 0.5);
    onHowToPlay();
  }, [playSFX, onHowToPlay]);

  const handleDraftWithSFX = useCallback(() => {
    playSFX('button_click', 0.5);
    onDraft?.();
  }, [playSFX, onDraft]);

  const handleMapEditorWithSFX = useCallback(() => {
    playSFX('button_click', 0.5);
    onMapEditor?.();
  }, [playSFX, onMapEditor]);

  const handleOnlineWithSFX = useCallback(() => {
    playSFX('button_click', 0.5);
    onMultiplayer?.(onlineMode);
  }, [playSFX, onMultiplayer, onlineMode]);

  const setOnlineModeWithSFX = useCallback((mode: 'quick' | 'draft') => {
    playSFX('button_click', 0.4);
    setOnlineMode(mode);
  }, [playSFX]);

  useEffect(() => {
    const timer = setTimeout(() => setPhase('ready'), 750);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePair((prev) => (prev + 1) % VS_PAIRS.length);
    }, 4200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribeLoading = audioPreloader.onLoadingStateChange(setAudioLoadingState);
    const unsubscribeUnlock = audioPreloader.onUnlockStateChange(setIsAudioUnlocked);

    return () => {
      unsubscribeLoading();
      unsubscribeUnlock();
    };
  }, []);

  const audioStatus = !audioLoadingState.isComplete
    ? 'Loading'
    : isAudioUnlocked
    ? 'Enabled'
    : 'Tap any button';

  return (
    <StartMenuShell>
      <div
        className={`absolute inset-0 z-30 flex items-center justify-center bg-[#e8dcc2] transition-opacity duration-500 ${
          phase === 'boot' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="text-center animate-pulse">
          <Swords className="w-12 h-12 text-amber-700 mx-auto mb-3" strokeWidth={1.5} />
          <p
            className="text-[9px] tracking-[0.22em] text-amber-800/85 uppercase"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            Booting Command Deck
          </p>
        </div>
      </div>

      <div
        className={`min-h-full transition-opacity duration-700 ${
          phase === 'ready' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="min-h-full max-w-6xl mx-auto px-3 py-3 md:px-6 md:py-5 flex flex-col gap-3 md:gap-4">
          <MenuPanel
            title="PokeTactics"
            subtitle="Command Terminal"
            accent="amber"
            rightSlot={<MenuBadge label={`v${VERSION}`} accent="green" />}
            className="animate-start-menu-slide-up"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1
                  className="text-base md:text-lg text-amber-900 uppercase tracking-[0.14em]"
                  style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '1px 1px 0 rgba(255,255,255,0.42)' }}
                >
                  Tactical Pokemon Battles
                </h1>
                <p
                  className="text-[12px] md:text-[13px] text-slate-700 mt-1 font-ui"
                >
                  Local, online and draft combat with shared battle rules.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <MenuBadge label="Mobile Ready" accent="green" />
                <MenuBadge label="Alpha" accent="slate" />
              </div>
            </div>
          </MenuPanel>

          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-3 md:gap-4 flex-1">
            <MenuPanel
              title="Battle Feed"
              subtitle={`${VS_PAIRS[activePair].left.name} vs ${VS_PAIRS[activePair].right.name}`}
              accent="slate"
              className="min-h-[300px] lg:min-h-0 animate-start-menu-slide-up"
            >
              <div className="relative h-[260px] sm:h-[300px] lg:h-full min-h-[260px]">
                <div className="absolute inset-x-[8%] bottom-6 h-[38%] overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-25"
                    style={{
                      background: 'linear-gradient(180deg, rgba(45,164,188,0.24) 0%, rgba(191,111,83,0.2) 100%)',
                      maskImage: 'linear-gradient(180deg, transparent 0%, black 45%)',
                      WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 45%)',
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: 'linear-gradient(90deg, rgba(148,163,184,0.45) 1px, transparent 1px), linear-gradient(0deg, rgba(148,163,184,0.35) 1px, transparent 1px)',
                      backgroundSize: '20% 24%',
                      transform: 'perspective(350px) rotateX(52deg)',
                      transformOrigin: 'bottom center',
                    }}
                  />
                </div>

                <div className="absolute left-[18%] right-[18%] top-1/2 h-1 -translate-y-1/2 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/70 via-amber-200/70 to-rose-400/70 blur-[2px] animate-start-menu-pulse" />
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-300/30 via-white/35 to-rose-300/30 blur-md" />
                </div>

                <div className="absolute top-1/2 left-1/2 w-0 h-0 -translate-x-1/2 -translate-y-1/2">
                  {orbitParticles.map((p) => (
                    <MenuOrbitParticle
                      key={p.id}
                      offset={p.offset}
                      radius={p.radius}
                      speed={p.speed}
                      size={p.size}
                      color={p.color}
                    />
                  ))}
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[58%] z-10">
                  <span
                    className="text-xl sm:text-3xl text-amber-300 animate-start-menu-pulse"
                    style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '2px 2px 0 #000, 0 0 16px rgba(251,191,36,0.55)' }}
                  >
                    VS
                  </span>
                </div>

                <div className="absolute left-[5%] bottom-[17%] w-[36%]">
                  {VS_PAIRS.map((pair, i) => (
                    <div
                      key={pair.left.id}
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 transition-all duration-700 ${
                        i === activePair ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                      }`}
                    >
                      <div className="absolute inset-0 blur-2xl scale-150 bg-cyan-500/20 animate-start-menu-pulse" />
                      <img
                        src={getAnimatedFrontSprite(pair.left.id)}
                        alt={pair.left.name}
                        className="relative w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 object-contain scale-x-[-1] animate-start-menu-idle"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <p
                        className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-cyan-300 uppercase tracking-[0.1em] whitespace-nowrap"
                        style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '1px 1px 0 #000' }}
                      >
                        {pair.left.name}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="absolute right-[5%] bottom-[17%] w-[36%]">
                  {VS_PAIRS.map((pair, i) => (
                    <div
                      key={pair.right.id}
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 transition-all duration-700 ${
                        i === activePair ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                      }`}
                    >
                      <div className="absolute inset-0 blur-2xl scale-150 bg-rose-500/20 animate-start-menu-pulse" />
                      <img
                        src={getAnimatedFrontSprite(pair.right.id)}
                        alt={pair.right.name}
                        className="relative w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 object-contain animate-start-menu-idle"
                        style={{ imageRendering: 'pixelated', animationDelay: '0.35s' }}
                      />
                      <p
                        className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-rose-300 uppercase tracking-[0.1em] whitespace-nowrap"
                        style={{ fontFamily: '"Press Start 2P", monospace', textShadow: '1px 1px 0 #000' }}
                      >
                        {pair.right.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </MenuPanel>

            <div className="flex flex-col gap-3 md:gap-4 min-h-0">
              <MenuPanel
                title="Operations"
                subtitle="Pick your way in"
                accent="amber"
                className="animate-start-menu-slide-up"
              >
                <div className="space-y-3">
                  <MenuActionButton
                    label="Batalla Rapida"
                    icon={Swords}
                    color="blue"
                    onClick={handleStartWithSFX}
                    subtitle="Local random teams"
                  />

                  {onMultiplayer && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setOnlineModeWithSFX('quick')}
                          className={`px-2 py-2 border-[2px] rounded-sm text-[8px] uppercase tracking-[0.12em] transition-colors ${
                            onlineMode === 'quick'
                              ? 'bg-emerald-100 border-emerald-500 text-emerald-900'
                              : 'bg-[#f5ead3] border-amber-700/45 text-amber-900/85 hover:border-amber-600/70'
                          }`}
                          style={{ fontFamily: '"Press Start 2P", monospace' }}
                        >
                          Online Quick
                        </button>
                        <button
                          type="button"
                          onClick={() => setOnlineModeWithSFX('draft')}
                          className={`px-2 py-2 border-[2px] rounded-sm text-[8px] uppercase tracking-[0.12em] transition-colors ${
                            onlineMode === 'draft'
                              ? 'bg-indigo-100 border-indigo-400 text-indigo-900'
                              : 'bg-[#f5ead3] border-amber-700/45 text-amber-900/85 hover:border-amber-600/70'
                          }`}
                          style={{ fontFamily: '"Press Start 2P", monospace' }}
                        >
                          Online Draft
                        </button>
                      </div>
                      <MenuActionButton
                        label="Multijugador"
                        icon={Wifi}
                        color="green"
                        onClick={handleOnlineWithSFX}
                        subtitle={onlineMode === 'quick' ? 'Quick battle room' : 'Draft battle room'}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {onDraft && (
                      <MenuActionButton
                        label="Draft Local"
                        icon={Shield}
                        color="violet"
                        onClick={handleDraftWithSFX}
                      />
                    )}
                    {onMapEditor && (
                      <MenuActionButton
                        label="Map Editor"
                        icon={Map}
                        color="amber"
                        onClick={handleMapEditorWithSFX}
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleHowToPlayWithSFX}
                    className="w-full px-3 py-3 border-[2px] border-amber-400 rounded-sm bg-gradient-to-b from-amber-100 to-amber-200 hover:from-amber-50 hover:to-amber-100 text-amber-950 transition-colors shadow-[0_0_14px_rgba(251,191,36,0.18)]"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-900" />
                      <span
                        className="text-[9px] uppercase tracking-[0.14em] text-amber-950"
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                      >
                        Como Jugar
                      </span>
                    </span>
                  </button>
                </div>
              </MenuPanel>

              <MenuPanel
                title="Field Intel"
                subtitle="Current profile"
                accent="blue"
                className="animate-start-menu-slide-up"
              >
                <div className="space-y-2.5">
                  <MenuStatRow label="Format" value="Turn based tactics" />
                  <MenuStatRow label="Ruleset" value="Shared combat parity" />
                  <MenuStatRow label="Supports" value="Touch + desktop" />
                  <MenuStatRow label="Audio" value={audioStatus} />
                  <div className="pt-1 flex flex-wrap gap-2">
                    <MenuBadge label="Fog of war" accent="blue" />
                    <MenuBadge label="Capture" accent="green" />
                    <MenuBadge label="Reserve deploy" accent="amber" />
                  </div>
                  <div className="pt-1 flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-700" />
                    <p className="text-[12px] tracking-[0.02em] text-slate-700 font-ui">
                      Online rooms with host and guest sync.
                    </p>
                  </div>
                  <div className="pt-1">
                    <AudioSettingsPanel />
                  </div>
                </div>
              </MenuPanel>
            </div>
          </div>
        </div>
      </div>
    </StartMenuShell>
  );
}
