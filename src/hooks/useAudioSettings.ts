import { useEffect, useState } from 'react';

export interface AudioSettings {
  musicMuted: boolean;
  sfxMuted: boolean;
  musicVolume: number;
  sfxVolume: number;
}

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  musicMuted: false,
  sfxMuted: false,
  musicVolume: 0.75,
  sfxVolume: 0.9,
};

const listeners = new Set<(settings: AudioSettings) => void>();

function clampVolume(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function sanitizeSettings(value: unknown): AudioSettings {
  if (!value || typeof value !== 'object') {
    return DEFAULT_AUDIO_SETTINGS;
  }

  const candidate = value as Partial<AudioSettings>;
  return {
    musicMuted: Boolean(candidate.musicMuted),
    sfxMuted: Boolean(candidate.sfxMuted),
    musicVolume: clampVolume(typeof candidate.musicVolume === 'number' ? candidate.musicVolume : DEFAULT_AUDIO_SETTINGS.musicVolume),
    sfxVolume: clampVolume(typeof candidate.sfxVolume === 'number' ? candidate.sfxVolume : DEFAULT_AUDIO_SETTINGS.sfxVolume),
  };
}

let currentSettings = DEFAULT_AUDIO_SETTINGS;

function emitSettings() {
  const snapshot = { ...currentSettings };
  listeners.forEach((listener) => listener(snapshot));
}

function updateSettings(patch: Partial<AudioSettings>) {
  currentSettings = sanitizeSettings({
    ...currentSettings,
    ...patch,
  });
  emitSettings();
}

export function getAudioSettingsSnapshot(): AudioSettings {
  return { ...currentSettings };
}

export function subscribeAudioSettings(listener: (settings: AudioSettings) => void): () => void {
  listeners.add(listener);
  listener(getAudioSettingsSnapshot());
  return () => {
    listeners.delete(listener);
  };
}

export function resetAudioSettings() {
  currentSettings = DEFAULT_AUDIO_SETTINGS;
  emitSettings();
}

export function useAudioSettings() {
  const [settings, setSettings] = useState<AudioSettings>(() => getAudioSettingsSnapshot());

  useEffect(() => {
    return subscribeAudioSettings(setSettings);
  }, []);

  return {
    settings,
    setMusicMuted: (musicMuted: boolean) => updateSettings({ musicMuted }),
    setSfxMuted: (sfxMuted: boolean) => updateSettings({ sfxMuted }),
    setMusicVolume: (musicVolume: number) => updateSettings({ musicVolume }),
    setSfxVolume: (sfxVolume: number) => updateSettings({ sfxVolume }),
    resetAudioSettings,
  };
}
