import { useCallback } from 'react';

const SFX_PATHS = {
  menu_open: '/audio/sfx/menu_open.mp3',
  menu_close: '/audio/sfx/menu_close.mp3',
  button_click: '/audio/sfx/button_click.mp3',
  unit_select: '/audio/sfx/unit_select.mp3',
  unit_deselect: '/audio/sfx/unit_deselect.mp3',
  unit_move: '/audio/sfx/unit_move.mp3',
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
