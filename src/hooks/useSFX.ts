import { useCallback } from 'react';
import { audioPreloader } from '../utils/audioPreloader';

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
  /**
   * Play a sound effect using preloaded audio pool
   * - No network delay (preloaded on game start)
   * - Reuses Audio instances (better performance)
   * - Supports overlapping sounds via pooling
   */
  const playSFX = useCallback((key: SFXKey, volume = 0.5) => {
    audioPreloader.playSFX(key, volume);
  }, []);

  return { playSFX };
}
