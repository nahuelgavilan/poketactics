import { useCallback, useEffect, useRef } from 'react';
import { audioPreloader } from '../utils/audioPreloader';
import { getAudioSettingsSnapshot, subscribeAudioSettings } from './useAudioSettings';

// SFX keys must match keys in AUDIO_CONFIGS
export type SFXKey =
  | 'menu_open'
  | 'menu_close'
  | 'button_click'
  | 'unit_select'
  | 'unit_deselect'
  | 'unit_move'
  | 'attack_hit'
  | 'critical_hit'
  | 'super_effective'
  | 'not_effective'
  | 'unit_faint'
  | 'wild_encounter'
  | 'ring_hit_perfect'
  | 'ring_hit_good'
  | 'ring_miss'
  | 'pokeball_throw'
  | 'pokeball_shake'
  | 'pokeball_open'
  | 'capture_fail'
  | 'flee_success';

export function useSFX() {
  const settingsRef = useRef(getAudioSettingsSnapshot());

  useEffect(() => {
    return subscribeAudioSettings((settings) => {
      settingsRef.current = settings;
    });
  }, []);

  /**
   * Play a sound effect using preloaded audio pool
   * - Essential menu sounds are ready up front
   * - Other sounds are hydrated lazily on first use
   * - Reuses Audio instances (better performance)
   * - Supports overlapping sounds via pooling
   */
  const playSFX = useCallback((key: SFXKey, volume = 0.5) => {
    const { sfxMuted, sfxVolume } = settingsRef.current;
    const finalVolume = sfxMuted ? 0 : volume * sfxVolume;

    if (finalVolume <= 0) {
      return;
    }

    if (!audioPreloader.isLoaded(key)) {
      void audioPreloader.preloadKeys([key]).then(() => {
        audioPreloader.playSFX(key, Math.max(0, Math.min(1, finalVolume)));
      });
      return;
    }

    audioPreloader.playSFX(key, Math.max(0, Math.min(1, finalVolume)));
  }, []);

  return { playSFX };
}
