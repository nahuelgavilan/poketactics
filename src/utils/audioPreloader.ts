/**
 * Audio Preloader & Pool Manager
 *
 * Optimized for staged loading:
 * - Load only the menu-critical audio up front
 * - Allow later batches to hydrate the rest of the sound bank on demand
 * - Recover cleanly after autoplay restrictions are lifted
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

export const AUDIO_CONFIGS = {
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
} satisfies Record<string, AudioConfig>;

export type AudioAssetKey = keyof typeof AUDIO_CONFIGS;

export const MENU_AUDIO_KEYS: readonly AudioAssetKey[] = [
  'menu_theme',
  'menu_open',
  'menu_close',
  'button_click',
];

export const GAMEPLAY_AUDIO_KEYS: readonly AudioAssetKey[] = [
  'board_theme',
  'battle_theme',
  'unit_select',
  'unit_deselect',
  'unit_move',
  'attack_hit',
  'critical_hit',
  'super_effective',
  'not_effective',
  'unit_faint',
];

export const CAPTURE_AUDIO_KEYS: readonly AudioAssetKey[] = [
  'wild_encounter',
  'ring_hit_perfect',
  'ring_hit_good',
  'ring_miss',
  'pokeball_throw',
  'pokeball_shake',
  'pokeball_open',
  'capture_fail',
  'flee_success',
];

export const ENDING_AUDIO_KEYS: readonly AudioAssetKey[] = [
  'victory',
  'defeat',
];

const AUDIO_READY_TIMEOUT_MS = 12_000;
const UNLOCK_EVENTS = ['click', 'keydown'] as const;

class AudioPreloader {
  private musicCache: Map<string, HTMLAudioElement> = new Map();
  private sfxPools: Map<string, HTMLAudioElement[]> = new Map();
  private requestedKeys = new Set<string>();
  private loadedKeys = new Set<string>();
  private failedKeys = new Set<string>();
  private inFlightLoads: Map<string, Promise<void>> = new Map();
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
  private unlockHandler = () => {
    void this.unlockAudio();
  };

  constructor() {
    this.setupAutoUnlock();
  }

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

  private syncLoadingState(): void {
    const total = this.requestedKeys.size;
    const loaded = this.loadedKeys.size + this.failedKeys.size;

    this.loadingState = {
      total,
      loaded,
      failed: [...this.failedKeys],
      isComplete: total > 0 && loaded >= total && this.inFlightLoads.size === 0,
    };
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

  async unlockAudio(): Promise<void> {
    if (this.audioUnlocked) return;

    this.audioUnlocked = true;
    this.notifyUnlockListeners();
    this.removeAutoUnlockListeners();

    const pending = [...this.pendingPlaybacks];
    this.pendingPlaybacks = [];
    pending.forEach((playback) => playback());
  }

  isLoaded(key: string): boolean {
    return this.loadedKeys.has(key);
  }

  async preloadAll(): Promise<void> {
    await this.preloadKeys(Object.keys(AUDIO_CONFIGS) as AudioAssetKey[]);
  }

  async preloadKeys(keys: readonly string[]): Promise<void> {
    const uniqueKeys = [...new Set(keys)];
    const pendingPromises: Promise<void>[] = [];
    let stateChanged = false;

    for (const key of uniqueKeys) {
      const config = AUDIO_CONFIGS[key as AudioAssetKey];
      if (!config) {
        console.warn(`Audio "${key}" is not configured`);
        continue;
      }

      if (!this.requestedKeys.has(key)) {
        this.requestedKeys.add(key);
        stateChanged = true;
      }

      if (this.loadedKeys.has(key)) {
        continue;
      }

      if (this.failedKeys.has(key)) {
        this.failedKeys.delete(key);
        stateChanged = true;
      }

      const existingLoad = this.inFlightLoads.get(key);
      if (existingLoad) {
        pendingPromises.push(existingLoad);
        continue;
      }

      const loadPromise = this.preloadAudio(key, config).finally(() => {
        this.inFlightLoads.delete(key);
        this.notifyLoadingListeners();
      });
      this.inFlightLoads.set(key, loadPromise);
      pendingPromises.push(loadPromise);
      stateChanged = true;
    }

    if (stateChanged) {
      this.notifyLoadingListeners();
    }

    if (pendingPromises.length > 0) {
      await Promise.allSettled(pendingPromises);
    }
  }

  private async preloadAudio(key: string, config: AudioConfig): Promise<void> {
    try {
      if (config.category === 'music') {
        await this.preloadMusic(key, config.path);
      } else {
        await this.preloadSFX(key, config.path, config.poolSize || 2);
      }

      this.loadedKeys.add(key);
      this.failedKeys.delete(key);
    } catch (err) {
      console.error(`Failed to preload ${key}:`, err);
      this.loadedKeys.delete(key);
      this.failedKeys.add(key);
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
    callback({ ...this.loadingState, failed: [...this.loadingState.failed] });

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
    return { ...this.loadingState, failed: [...this.loadingState.failed] };
  }

  get isUnlocked(): boolean {
    return this.audioUnlocked;
  }

  private notifyLoadingListeners(): void {
    this.syncLoadingState();
    const state = { ...this.loadingState, failed: [...this.loadingState.failed] };
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
    this.requestedKeys.clear();
    this.loadedKeys.clear();
    this.failedKeys.clear();
    this.inFlightLoads.clear();
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
