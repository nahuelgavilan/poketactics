/**
 * Audio Preloader & Pool Manager
 *
 * Solves production performance issues by:
 * 1. Preloading all audio files on game start (no network delays during gameplay)
 * 2. Pooling Audio instances (reuse instead of creating new ones)
 * 3. Providing loading state tracking
 * 4. Handling network failures gracefully
 */

export type AudioCategory = 'music' | 'sfx';

export interface AudioConfig {
  path: string;
  category: AudioCategory;
  poolSize?: number; // For SFX, how many instances to create
}

export interface AudioLoadingState {
  total: number;
  loaded: number;
  failed: string[];
  isComplete: boolean;
}

class AudioPreloader {
  private musicCache: Map<string, HTMLAudioElement> = new Map();
  private sfxPools: Map<string, HTMLAudioElement[]> = new Map();
  private loadingState: AudioLoadingState = {
    total: 0,
    loaded: 0,
    failed: [],
    isComplete: false,
  };
  private listeners: Set<(state: AudioLoadingState) => void> = new Set();

  /**
   * Preload all audio files
   */
  async preloadAll(configs: Record<string, AudioConfig>): Promise<void> {
    const entries = Object.entries(configs);
    this.loadingState.total = entries.length;
    this.loadingState.loaded = 0;
    this.loadingState.failed = [];
    this.loadingState.isComplete = false;
    this.notifyListeners();

    const promises = entries.map(([key, config]) =>
      this.preloadAudio(key, config)
    );

    await Promise.allSettled(promises);
    this.loadingState.isComplete = true;
    this.notifyListeners();
  }

  /**
   * Preload a single audio file
   */
  private async preloadAudio(key: string, config: AudioConfig): Promise<void> {
    try {
      if (config.category === 'music') {
        await this.preloadMusic(key, config.path);
      } else {
        await this.preloadSFX(key, config.path, config.poolSize || 2);
      }
      this.loadingState.loaded++;
      this.notifyListeners();
    } catch (err) {
      console.error(`Failed to preload ${key}:`, err);
      this.loadingState.failed.push(key);
      this.loadingState.loaded++;
      this.notifyListeners();
    }
  }

  /**
   * Preload a music track (single instance)
   */
  private async preloadMusic(key: string, path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.preload = 'auto';

      const onCanPlay = () => {
        audio.removeEventListener('canplaythrough', onCanPlay);
        audio.removeEventListener('error', onError);
        this.musicCache.set(key, audio);
        resolve();
      };

      const onError = (e: ErrorEvent | Event) => {
        audio.removeEventListener('canplaythrough', onCanPlay);
        audio.removeEventListener('error', onError);
        reject(new Error(`Failed to load ${path}: ${e}`));
      };

      audio.addEventListener('canplaythrough', onCanPlay, { once: true });
      audio.addEventListener('error', onError, { once: true });
      audio.src = path;
      audio.load();
    });
  }

  /**
   * Preload SFX with pooling (multiple instances for overlapping sounds)
   */
  private async preloadSFX(key: string, path: string, poolSize: number): Promise<void> {
    const pool: HTMLAudioElement[] = [];

    const loadPromises = Array.from({ length: poolSize }, () => {
      return new Promise<HTMLAudioElement>((resolve, reject) => {
        const audio = new Audio();
        audio.preload = 'auto';

        const onCanPlay = () => {
          audio.removeEventListener('canplaythrough', onCanPlay);
          audio.removeEventListener('error', onError);
          resolve(audio);
        };

        const onError = (e: ErrorEvent | Event) => {
          audio.removeEventListener('canplaythrough', onCanPlay);
          audio.removeEventListener('error', onError);
          reject(new Error(`Failed to load ${path}: ${e}`));
        };

        audio.addEventListener('canplaythrough', onCanPlay, { once: true });
        audio.addEventListener('error', onError, { once: true });
        audio.src = path;
        audio.load();
      });
    });

    const results = await Promise.all(loadPromises);
    pool.push(...results);
    this.sfxPools.set(key, pool);
  }

  /**
   * Get music audio element (for playback control)
   */
  getMusic(key: string): HTMLAudioElement | null {
    return this.musicCache.get(key) || null;
  }

  /**
   * Play SFX from pool (automatically finds available instance)
   * Optimized for instant playback with no delay
   */
  playSFX(key: string, volume: number = 0.5): void {
    const pool = this.sfxPools.get(key);
    if (!pool || pool.length === 0) {
      console.warn(`SFX "${key}" not preloaded`);
      return;
    }

    // Find first available (paused or ended) audio instance
    let audio = pool.find(a => a.paused || a.ended);

    // If all instances are playing, use the first one (interrupt it)
    if (!audio) {
      audio = pool[0];
    }

    // Reset to start and set volume
    audio.currentTime = 0;
    audio.volume = volume;

    // Play immediately - preloaded audio should have no delay
    // Use a trick: pause first to ensure clean state, then play
    audio.pause();
    audio.currentTime = 0;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        // Only warn if it's not an AbortError (which happens when interrupting)
        if (err.name !== 'AbortError') {
          console.warn(`SFX playback failed for "${key}":`, err);
        }
      });
    }
  }

  /**
   * Subscribe to loading state changes
   */
  onLoadingStateChange(callback: (state: AudioLoadingState) => void): () => void {
    this.listeners.add(callback);
    // Immediately call with current state
    callback({ ...this.loadingState });

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get current loading state (snapshot)
   */
  getLoadingState(): AudioLoadingState {
    return { ...this.loadingState };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const state = { ...this.loadingState };
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * Clear all cached audio (for cleanup)
   */
  clear(): void {
    this.musicCache.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.musicCache.clear();

    this.sfxPools.forEach(pool => {
      pool.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    });
    this.sfxPools.clear();

    this.loadingState = {
      total: 0,
      loaded: 0,
      failed: [],
      isComplete: false,
    };
    this.notifyListeners();
  }
}

// Singleton instance
export const audioPreloader = new AudioPreloader();

// Audio configuration
export const AUDIO_CONFIGS: Record<string, AudioConfig> = {
  // Music (single instance each)
  menu_theme: { path: '/audio/music/menu_theme.mp3', category: 'music' },
  board_theme: { path: '/audio/music/board_theme.mp3', category: 'music' },
  battle_theme: { path: '/audio/music/battle_theme.mp3', category: 'music' },
  victory: { path: '/audio/music/victory.mp3', category: 'music' },
  defeat: { path: '/audio/music/defeat.mp3', category: 'music' },

  // UI SFX (2 instances each - rarely overlap)
  menu_open: { path: '/audio/sfx/menu_open.mp3', category: 'sfx', poolSize: 2 },
  menu_close: { path: '/audio/sfx/menu_close.mp3', category: 'sfx', poolSize: 2 },
  button_click: { path: '/audio/sfx/button_click.mp3', category: 'sfx', poolSize: 2 },
  unit_select: { path: '/audio/sfx/unit_select.mp3', category: 'sfx', poolSize: 2 },
  unit_deselect: { path: '/audio/sfx/unit_deselect.mp3', category: 'sfx', poolSize: 2 },
  unit_move: { path: '/audio/sfx/unit_move.mp3', category: 'sfx', poolSize: 2 },

  // Battle SFX (2 instances each)
  attack_hit: { path: '/audio/sfx/attack_hit.mp3', category: 'sfx', poolSize: 2 },
  critical_hit: { path: '/audio/sfx/critical_hit.mp3', category: 'sfx', poolSize: 2 },
  super_effective: { path: '/audio/sfx/super_effective.mp3', category: 'sfx', poolSize: 2 },
  not_effective: { path: '/audio/sfx/not_effective.mp3', category: 'sfx', poolSize: 2 },
  unit_faint: { path: '/audio/sfx/unit_faint.mp3', category: 'sfx', poolSize: 2 },

  // Capture minigame (3 instances - pokeball_shake plays 3x in sequence)
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
