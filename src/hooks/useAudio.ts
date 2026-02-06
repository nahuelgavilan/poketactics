import { useRef, useCallback, useEffect } from 'react';
import { audioPreloader } from '../utils/audioPreloader';

export type AudioKey = 'menu_theme' | 'board_theme' | 'battle_theme';

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef<AudioKey | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Play a music track using preloaded audio
   * - No network delay (preloaded on game start)
   * - Reuses same Audio element for performance
   * - Supports crossfading between tracks
   */
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

    // Get preloaded audio instance
    const audio = audioPreloader.getMusic(key);
    if (!audio) {
      console.warn(`Music track "${key}" not preloaded`);
      return;
    }

    // Configure and play
    audio.loop = loop;
    audio.volume = volume;
    audio.currentTime = 0; // Reset to start

    audio.play().catch((err) => {
      console.warn('Audio playback failed:', err);
    });

    audioRef.current = audio;
    currentTrackRef.current = key;
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
