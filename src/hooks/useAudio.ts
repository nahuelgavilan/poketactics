import { useRef, useCallback, useEffect } from 'react';
import { audioPreloader } from '../utils/audioPreloader';
import { getAudioSettingsSnapshot, subscribeAudioSettings } from './useAudioSettings';

export type AudioKey = 'menu_theme' | 'board_theme' | 'battle_theme' | 'victory' | 'defeat';

type MusicOptions = {
  loop?: boolean;
  volume?: number;
};

type MusicRequest = {
  key: AudioKey;
  options: Required<MusicOptions>;
};

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef<AudioKey | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const desiredTrackRef = useRef<MusicRequest | null>(null);
  const settingsRef = useRef(getAudioSettingsSnapshot());

  const clearFade = useCallback(() => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  }, []);

  const resetAudio = useCallback((audio: HTMLAudioElement | null) => {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  const flushDesiredTrack = useCallback(() => {
    const request = desiredTrackRef.current;
    if (!request || !audioPreloader.isUnlocked) {
      return;
    }

    const { key, options } = request;
    const audio = audioPreloader.getMusic(key);
    if (!audio) {
      return;
    }

    clearFade();

    if (audioRef.current && audioRef.current !== audio) {
      resetAudio(audioRef.current);
    }

    audio.loop = options.loop;
    audio.volume = settingsRef.current.musicMuted
      ? 0
      : Math.max(0, Math.min(1, options.volume * settingsRef.current.musicVolume));

    const sameTrack = audioRef.current === audio && currentTrackRef.current === key;
    if (sameTrack && !audio.paused && !audio.ended) {
      return;
    }

    if (!sameTrack || audio.ended) {
      audio.currentTime = 0;
    }

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
          console.warn(`Music playback failed for "${key}":`, err);
        }
      });
    }

    audioRef.current = audio;
    currentTrackRef.current = key;
  }, [clearFade, resetAudio]);

  const playMusic = useCallback((key: AudioKey, options?: MusicOptions) => {
    desiredTrackRef.current = {
      key,
      options: {
        loop: options?.loop ?? false,
        volume: options?.volume ?? 0.7,
      },
    };

    flushDesiredTrack();
  }, [flushDesiredTrack]);

  const stopMusic = useCallback((fadeMs = 0) => {
    desiredTrackRef.current = null;

    if (!audioRef.current) {
      currentTrackRef.current = null;
      clearFade();
      return;
    }

    clearFade();

    if (fadeMs > 0) {
      const audio = audioRef.current;
      const startVolume = audio.volume;
      const fadeSteps = 20;
      const stepTime = fadeMs / fadeSteps;
      const volumeStep = startVolume / fadeSteps;

      let step = 0;
      fadeIntervalRef.current = setInterval(() => {
        step++;
        if (!audio.paused) {
          audio.volume = Math.max(0, startVolume - volumeStep * step);
        }

        if (step >= fadeSteps) {
          clearFade();
          resetAudio(audio);
          audioRef.current = null;
          currentTrackRef.current = null;
        }
      }, stepTime);
      return;
    }

    resetAudio(audioRef.current);
    audioRef.current = null;
    currentTrackRef.current = null;
  }, [clearFade, resetAudio]);

  useEffect(() => {
    const unsubscribeLoading = audioPreloader.onLoadingStateChange(() => {
      flushDesiredTrack();
    });
    const unsubscribeUnlock = audioPreloader.onUnlockStateChange((unlocked) => {
      if (unlocked) {
        flushDesiredTrack();
      }
    });
    const unsubscribeSettings = subscribeAudioSettings((settings) => {
      settingsRef.current = settings;
      flushDesiredTrack();
    });

    return () => {
      unsubscribeLoading();
      unsubscribeUnlock();
      unsubscribeSettings();
    };
  }, [flushDesiredTrack]);

  useEffect(() => {
    return () => {
      desiredTrackRef.current = null;
      clearFade();
      resetAudio(audioRef.current);
      audioRef.current = null;
      currentTrackRef.current = null;
    };
  }, [clearFade, resetAudio]);

  return { playMusic, stopMusic };
}
