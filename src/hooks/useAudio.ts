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
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Play a music track
  const playMusic = useCallback((key: AudioKey, options?: { loop?: boolean; volume?: number }) => {
    const { loop = false, volume = 0.7 } = options || {};

    // If same track is already playing, just ensure it's playing and update volume
    if (currentTrackRef.current === key && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch((err) => {
          console.warn('Audio resume failed:', err);
        });
      }
      // Update volume if different
      if (Math.abs(audioRef.current.volume - volume) > 0.01) {
        audioRef.current.volume = volume;
      }
      return;
    }

    // Stop current track if different (clear any fade intervals)
    if (audioRef.current && currentTrackRef.current !== key) {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    // Create new audio instance
    try {
      const audio = new Audio(AUDIO_PATHS[key]);
      audio.loop = loop;
      audio.volume = volume;
      audio.preload = 'auto';

      audio.play().catch((err) => {
        console.warn('Audio playback failed:', err);
      });

      audioRef.current = audio;
      currentTrackRef.current = key;
    } catch (err) {
      console.warn('Failed to create audio:', err);
    }
  }, []);

  // Stop current music with optional fade
  const stopMusic = useCallback((fadeMs = 0) => {
    if (!audioRef.current) return;

    // Clear any existing fade interval
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    if (fadeMs > 0) {
      const audio = audioRef.current;
      const startVolume = audio.volume;
      const fadeSteps = 20;
      const stepTime = fadeMs / fadeSteps;
      const volumeStep = startVolume / fadeSteps;

      let step = 0;
      fadeIntervalRef.current = setInterval(() => {
        step++;
        if (audio && !audio.paused) {
          audio.volume = Math.max(0, startVolume - volumeStep * step);
        }

        if (step >= fadeSteps) {
          if (fadeIntervalRef.current) {
            clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = null;
          }
          if (audio) {
            audio.pause();
            audio.currentTime = 0;
          }
          audioRef.current = null;
          currentTrackRef.current = null;
        }
      }, stepTime);
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      currentTrackRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      currentTrackRef.current = null;
    };
  }, []);

  return { playMusic, stopMusic };
}
