/**
 * Audio Preloader & Pool Manager
 *
 * Goals:
 * 1. Preload all audio files early so gameplay never waits on the network
 * 2. Keep a small reusable pool for SFX overlap
 * 3. Expose loading + unlock state so music can recover after autoplay blocks
 * 4. Stay resilient on mobile browsers where `canplaythrough` is unreliable
 */

export type AudioCategory = 'music' | 'sfx';

export interface AudioConfig {
  path: string;
  category: AudioCategory;
  poolSize?: number;
}

export interface AudioLoadingState {
  total: number;
  loaded: number;
  failed: string[];
  isComplete: boolean;
}

const AUDIO_READY_TIMEOUT_MS = 12_000;
const UNLOCK_EVENTS = ['click', 'keydown'] as const;

class AudioPreloader {
  private musicCache: Map<string, HTMLAudioElement> = new Map();
  private sfxPools: Map<string, HTMLAudioElement[]> = new Map();
  private loadingState: AudioLoadingState = {
    total: 0,
    loaded: 0,
    failed: [],
    isComplete: false,
  };
  private loadingListeners: Set<(state: AudioLoadingState) => void> = new Set();
  private unlockListeners: Set<(unlocked: boolean) => void> = new Set();
  private audioUnlocked = false;
  private pendingPlaybacks: Array<() => void> = [];
  private preloadPromise: Promise<void> | null = null;
  private unlockHandler = () => {
    void this.unlockAudio();
  };

  constructor() {
    this.setupAutoUnlock();
  }

  /**
   * Listen for the first user interaction so later playback requests are allowed.
   */
  private setupAutoUnlock(): void {
    if (typeof document === 'undefined') return;

    UNLOCK_EVENTS.forEach((eventName) => {
      document.addEventListener(eventName, this.unlockHandler, {
        capture: true,
        passive: true,
      });
    });
  }

  private removeAutoUnlockListeners(): void {
    if (typeof document === 'undefined') return;

    UNLOCK_EVENTS.forEach((eventName) => {
      document.removeEventListener(eventName, this.unlockHandler, true);
    });
  }

  private createAudioElement(path: string): HTMLAudioElement {
    const audio = new Audio(path);
    audio.preload = 'auto';
    audio.setAttribute('playsinline', 'true');
    audio.setAttribute('webkit-playsinline', 'true');
    return audio;
  }

  private waitForAudioReady(audio: HTMLAudioElement, path: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      let settled = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        audio.removeEventListener('loadeddata', onReady);
        audio.removeEventListener('canplay', onReady);
        audio.removeEventListener('canplaythrough', onReady);
        audio.removeEventListener('error', onError);
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      const settle = (handler: () => void) => {
        if (settled) return;
        settled = true;
        cleanup();
        handler();
      };

      const onReady = () => {
        settle(() => resolve(audio));
      };

      const onError = () => {
        settle(() => reject(new Error(`Failed to load ${path}`)));
      };

      if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        resolve(audio);
        return;
      }

      audio.addEventListener('loadeddata', onReady, { once: true });
      audio.addEventListener('canplay', onReady, { once: true });
      audio.addEventListener('canplaythrough', onReady, { once: true });
      audio.addEventListener('error', onError, { once: true });

      timeoutId = setTimeout(() => {
        if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          onReady();
          return;
        }
        onError();
      }, AUDIO_READY_TIMEOUT_MS);

      audio.load();
    });
  }

  /**
   * Explicitly unlock audio after a user gesture.
   * This is also called by the passive global listeners above.
   */
  async unlockAudio(): Promise<void> {
    if (this.audioUnlocked) return;

    this.audioUnlocked = true;
    this.notifyUnlockListeners();
    this.removeAutoUnlockListeners();

    const pending = [...this.pendingPlaybacks];
    this.pendingPlaybacks = [];
    pending.forEach((playback) => playback());
  }

  /**
   * Preload all audio files once and reuse the same promise for subsequent calls.
   */
  async preloadAll(configs: Record<string, AudioConfig>): Promise<void> {
    if (this.loadingState.isComplete) {
      return;
    }

    if (this.preloadPromise) {
      return this.preloadPromise;
    }

    const entries = Object.entries(configs);
    this.loadingState = {
      total: entries.length,
      loaded: 0,
      failed: [],
      isComplete: false,
    };
    this.notifyLoadingListeners();

    this.preloadPromise = (async () => {
      const promises = entries.map(([key, config]) => this.preloadAudio(key, config));
      await Promise.allSettled(promises);
      this.loadingState.isComplete = true;
      this.notifyLoadingListeners();
    })();

    try {
      await this.preloadPromise;
    } finally {
      this.preloadPromise = this.loadingState.isComplete ? this.preloadPromise : null;
    }
  }

  private async preloadAudio(key: string, config: AudioConfig): Promise<void> {
    try {
      if (config.category === 'music') {
        await this.preloadMusic(key, config.path);
      } else {
        await this.preloadSFX(key, config.path, config.poolSize || 2);
      }
    } catch (err) {
      console.error(`Failed to preload ${key}:`, err);
      this.loadingState.failed.push(key);
    } finally {
      this.loadingState.loaded++;
      this.notifyLoadingListeners();
    }
  }

  private async preloadMusic(key: string, path: string): Promise<void> {
    const audio = this.createAudioElement(path);
    await this.waitForAudioReady(audio, path);
    this.musicCache.set(key, audio);
  }

  private async preloadSFX(key: string, path: string, poolSize: number): Promise<void> {
    const baseAudio = this.createAudioElement(path);
    await this.waitForAudioReady(baseAudio, path);

    const pool: HTMLAudioElement[] = [baseAudio];
    for (let i = 1; i < poolSize; i++) {
      const clone = baseAudio.cloneNode(true) as HTMLAudioElement;
      clone.preload = 'auto';
      clone.setAttribute('playsinline', 'true');
      clone.setAttribute('webkit-playsinline', 'true');
      pool.push(clone);
    }

    this.sfxPools.set(key, pool);
  }

  getMusic(key: string): HTMLAudioElement | null {
    return this.musicCache.get(key) || null;
  }

  playSFX(key: string, volume: number = 0.5): void {
    const pool = this.sfxPools.get(key);
    if (!pool || pool.length === 0) {
      console.warn(`SFX "${key}" not preloaded`);
      return;
    }

    if (!this.audioUnlocked) {
      this.pendingPlaybacks.push(() => this.playSFX(key, volume));
      return;
    }

    let audio = pool.find((candidate) => candidate.paused || candidate.ended);
    if (!audio) {
      audio = pool[0];
    }

    audio.pause();
    audio.currentTime = 0;
    audio.volume = volume;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
          console.warn(`SFX playback failed for "${key}":`, err);
        }
      });
    }
  }

  onLoadingStateChange(callback: (state: AudioLoadingState) => void): () => void {
    this.loadingListeners.add(callback);
    callback({ ...this.loadingState });

    return () => {
      this.loadingListeners.delete(callback);
    };
  }

  onUnlockStateChange(callback: (unlocked: boolean) => void): () => void {
    this.unlockListeners.add(callback);
    callback(this.audioUnlocked);

    return () => {
      this.unlockListeners.delete(callback);
    };
  }

  getLoadingState(): AudioLoadingState {
    return { ...this.loadingState };
  }

  get isUnlocked(): boolean {
    return this.audioUnlocked;
  }

  private notifyLoadingListeners(): void {
    const state = { ...this.loadingState };
    this.loadingListeners.forEach((listener) => listener(state));
  }

  private notifyUnlockListeners(): void {
    this.unlockListeners.forEach((listener) => listener(this.audioUnlocked));
  }

  clear(): void {
    this.musicCache.forEach((audio) => {
      audio.pause();
      audio.src = '';
    });
    this.musicCache.clear();

    this.sfxPools.forEach((pool) => {
      pool.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
    });
    this.sfxPools.clear();

    this.pendingPlaybacks = [];
    this.preloadPromise = null;
    this.loadingState = {
      total: 0,
      loaded: 0,
      failed: [],
      isComplete: false,
    };
    this.notifyLoadingListeners();
  }
}

export const audioPreloader = new AudioPreloader();

export const AUDIO_CONFIGS: Record<string, AudioConfig> = {
  menu_theme: { path: '/audio/music/menu_theme.mp3', category: 'music' },
  board_theme: { path: '/audio/music/board_theme.mp3', category: 'music' },
  battle_theme: { path: '/audio/music/battle_theme.mp3', category: 'music' },
  victory: { path: '/audio/music/victory.mp3', category: 'music' },
  defeat: { path: '/audio/music/defeat.mp3', category: 'music' },

  menu_open: { path: '/audio/sfx/menu_open.mp3', category: 'sfx', poolSize: 2 },
  menu_close: { path: '/audio/sfx/menu_close.mp3', category: 'sfx', poolSize: 2 },
  button_click: { path: '/audio/sfx/button_click.mp3', category: 'sfx', poolSize: 2 },
  unit_select: { path: '/audio/sfx/unit_select.mp3', category: 'sfx', poolSize: 2 },
  unit_deselect: { path: '/audio/sfx/unit_deselect.mp3', category: 'sfx', poolSize: 2 },
  unit_move: { path: '/audio/sfx/unit_move.mp3', category: 'sfx', poolSize: 2 },

  attack_hit: { path: '/audio/sfx/attack_hit.mp3', category: 'sfx', poolSize: 2 },
  critical_hit: { path: '/audio/sfx/critical_hit.mp3', category: 'sfx', poolSize: 2 },
  super_effective: { path: '/audio/sfx/super_effective.mp3', category: 'sfx', poolSize: 2 },
  not_effective: { path: '/audio/sfx/not_effective.mp3', category: 'sfx', poolSize: 2 },
  unit_faint: { path: '/audio/sfx/unit_faint.mp3', category: 'sfx', poolSize: 2 },

  wild_encounter: { path: '/audio/sfx/wild_encounter.mp3', category: 'sfx', poolSize: 2 },
  ring_hit_perfect: { path: '/audio/sfx/ring_hit_perfect.mp3', category: 'sfx', poolSize: 3 },
  ring_hit_good: { path: '/audio/sfx/ring_hit_good.mp3', category: 'sfx', poolSize: 3 },
  ring_miss: { path: '/audio/sfx/ring_miss.mp3', category: 'sfx', poolSize: 2 },
  pokeball_throw: { path: '/audio/sfx/pokeball_throw.mp3', category: 'sfx', poolSize: 2 },
  pokeball_shake: { path: '/audio/sfx/pokeball_shake.mp3', category: 'sfx', poolSize: 3 },
  pokeball_open: { path: '/audio/sfx/pokeball_open.mp3', category: 'sfx', poolSize: 2 },
  capture_fail: { path: '/audio/sfx/capture_fail.mp3', category: 'sfx', poolSize: 2 },
  flee_success: { path: '/audio/sfx/flee_success.mp3', category: 'sfx', poolSize: 2 },
};
