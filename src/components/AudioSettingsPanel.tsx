import { Music2, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useAudioSettings } from '../hooks/useAudioSettings';

interface AudioSettingsPanelProps {
  compact?: boolean;
  className?: string;
}

interface AudioChannelControlsProps {
  label: string;
  value: number;
  muted: boolean;
  onToggleMuted: () => void;
  onChangeVolume: (value: number) => void;
  tone: 'amber' | 'sky';
  icon: 'music' | 'sfx';
}

function AudioChannelControls({
  label,
  value,
  muted,
  onToggleMuted,
  onChangeVolume,
  tone,
  icon,
}: AudioChannelControlsProps) {
  const toneStyles = tone === 'amber'
    ? {
        panel: 'bg-[#f6ecd7] border-amber-700/35',
        button: muted
          ? 'bg-stone-200 border-stone-500/50 text-stone-700'
          : 'bg-amber-100 border-amber-500/50 text-amber-900',
        accent: 'accent-amber-600',
      }
    : {
        panel: 'bg-[#f1e7d3] border-sky-600/30',
        button: muted
          ? 'bg-stone-200 border-stone-500/50 text-stone-700'
          : 'bg-sky-100 border-sky-500/50 text-sky-900',
        accent: 'accent-sky-600',
      };

  const Icon = icon === 'music' ? Music2 : Volume2;
  const ToggleIcon = muted ? VolumeX : Volume2;

  return (
    <div className={`rounded-sm border px-2.5 py-2 ${toneStyles.panel}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-sm border border-amber-700/25 bg-white/60 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-slate-700" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.14em] text-slate-800 font-bold">
              {label}
            </div>
            <div className="text-[10px] text-slate-600">
              {muted ? 'Muted' : `${Math.round(value * 100)}%`}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleMuted}
          className={`px-2 py-1 rounded-sm border text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${toneStyles.button}`}
        >
          <span className="flex items-center gap-1">
            <ToggleIcon className="w-3 h-3" />
            {muted ? 'Off' : 'On'}
          </span>
        </button>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={Math.round(value * 100)}
        onChange={(event) => onChangeVolume(Number(event.currentTarget.value) / 100)}
        className={`mt-2 w-full ${toneStyles.accent}`}
        aria-label={`${label} volume`}
      />
    </div>
  );
}

export function AudioSettingsPanel({ compact = false, className = '' }: AudioSettingsPanelProps) {
  const {
    settings,
    setMusicMuted,
    setSfxMuted,
    setMusicVolume,
    setSfxVolume,
    resetAudioSettings,
  } = useAudioSettings();

  return (
    <div
      className={`rounded-sm border border-amber-700/35 bg-gradient-to-b from-[#f8efd9] to-[#ebddbf] ${compact ? 'p-2' : 'p-3'} ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-800 font-bold">
            Audio
          </div>
          <div className="text-[11px] text-slate-600">
            Activo para esta sesion
          </div>
        </div>
        <button
          type="button"
          onClick={resetAudioSettings}
          className="px-2 py-1 rounded-sm border border-stone-500/50 bg-stone-100 text-stone-700 text-[10px] font-bold uppercase tracking-[0.12em]"
        >
          <span className="flex items-center gap-1">
            <RotateCcw className="w-3 h-3" />
            Reset
          </span>
        </button>
      </div>

      <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        <AudioChannelControls
          label="Music"
          value={settings.musicVolume}
          muted={settings.musicMuted}
          onToggleMuted={() => setMusicMuted(!settings.musicMuted)}
          onChangeVolume={(value) => setMusicVolume(value)}
          tone="amber"
          icon="music"
        />
        <AudioChannelControls
          label="Effects"
          value={settings.sfxVolume}
          muted={settings.sfxMuted}
          onToggleMuted={() => setSfxMuted(!settings.sfxMuted)}
          onChangeVolume={(value) => setSfxVolume(value)}
          tone="sky"
          icon="sfx"
        />
      </div>
    </div>
  );
}
