import { useEffect, useState } from 'react';

export interface AudioSettings {
  musicMuted: boolean;
  sfxMuted: boolean;
  musicVolume: number;
  sfxVolume: number;
}

const STORAGE_KEY = 'poketactics:audio-settings';

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

function loadSettings(): AudioSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_AUDIO_SETTINGS;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_AUDIO_SETTINGS;
    }

    return sanitizeSettings(JSON.parse(stored));
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

let currentSettings = loadSettings();

function persistSettings() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
}

function emitSettings() {
  const snapshot = { ...currentSettings };
  listeners.forEach((listener) => listener(snapshot));
}

function updateSettings(patch: Partial<AudioSettings>) {
  currentSettings = sanitizeSettings({
    ...currentSettings,
    ...patch,
  });
  persistSettings();
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
  persistSettings();
  emitSettings();
}

export function useAudioSettings() {
  const [settings, setSettings] = useState<AudioSettings>(() => getAudioSettingsSnapshot());

  useEffect(() => {
    const unsubscribe = subscribeAudioSettings(setSettings);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      currentSettings = loadSettings();
      emitSettings();
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
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
