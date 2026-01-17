import { useRef, useCallback, useEffect } from 'react';

const AUDIO_PATHS = {
  menu_theme: '/audio/music/menu_theme.mp3',
  board_theme: '/audio/music/board_theme.mp3',
  battle_theme: '/audio/music/battle_theme.mp3',
} as const;

type AudioKey = keyof typeof AUDIO_PATHS;

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef<AudioKey | null>(null);

  // Play a music track
  const playMusic = useCallback((key: AudioKey, options?: { loop?: boolean; volume?: number }) => {
    const { loop = false, volume = 0.7 } = options || {};

    // Stop current track if different
    if (audioRef.current && currentTrackRef.current !== key) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Don't restart if same track is playing
    if (currentTrackRef.current === key && audioRef.current && !audioRef.current.paused) {
      return;
    }

    const audio = new Audio(AUDIO_PATHS[key]);
    audio.loop = loop;
    audio.volume = volume;
    audio.play().catch((err) => {
      console.warn('Audio playback failed:', err);
    });

    audioRef.current = audio;
    currentTrackRef.current = key;
  }, []);

  // Stop current music with optional fade
  const stopMusic = useCallback((fadeMs = 0) => {
    if (!audioRef.current) return;

    if (fadeMs > 0) {
      const audio = audioRef.current;
      const startVolume = audio.volume;
      const fadeSteps = 20;
      const stepTime = fadeMs / fadeSteps;
      const volumeStep = startVolume / fadeSteps;

      let step = 0;
      const fadeInterval = setInterval(() => {
        step++;
        audio.volume = Math.max(0, startVolume - volumeStep * step);

        if (step >= fadeSteps) {
          clearInterval(fadeInterval);
          audio.pause();
          audio.volume = startVolume;
          audioRef.current = null;
          currentTrackRef.current = null;
        }
      }, stepTime);
    } else {
      audioRef.current.pause();
      audioRef.current = null;
      currentTrackRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return { playMusic, stopMusic };
}
