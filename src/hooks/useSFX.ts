import { useCallback } from 'react';

const SFX_PATHS = {
  // UI sounds
  menu_open: '/audio/sfx/menu_open.mp3',
  menu_close: '/audio/sfx/menu_close.mp3',
  button_click: '/audio/sfx/button_click.mp3',
  unit_select: '/audio/sfx/unit_select.mp3',
  unit_deselect: '/audio/sfx/unit_deselect.mp3',
  unit_move: '/audio/sfx/unit_move.mp3',
  // Capture minigame sounds
  wild_encounter: '/audio/sfx/wild_encounter.mp3',
  ring_hit_perfect: '/audio/sfx/ring_hit_perfect.mp3',
  ring_hit_good: '/audio/sfx/ring_hit_good.mp3',
  ring_miss: '/audio/sfx/ring_miss.mp3',
  pokeball_throw: '/audio/sfx/pokeball_throw.mp3',
  pokeball_shake: '/audio/sfx/pokeball_shake.mp3',
  pokeball_open: '/audio/sfx/pokeball_open.mp3',
  capture_fail: '/audio/sfx/capture_fail.mp3',
  flee_success: '/audio/sfx/flee_success.mp3',
} as const;

type SFXKey = keyof typeof SFX_PATHS;

export function useSFX() {
  // Play a sound effect (one-shot)
  const playSFX = useCallback((key: SFXKey, volume = 0.5) => {
    try {
      const audio = new Audio(SFX_PATHS[key]);
      audio.volume = volume;
      audio.play().catch((err) => {
        console.warn('SFX playback failed:', err);
      });
    } catch (err) {
      console.warn('Failed to create audio:', err);
    }
  }, []);

  return { playSFX };
}
