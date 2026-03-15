import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/chakra-petch/latin-500.css';
import '@fontsource/chakra-petch/latin-600.css';
import '@fontsource/chakra-petch/latin-700.css';
import '@fontsource/press-start-2p/latin-400.css';
import Game from './Game';
import { ConnectionStatusBanner } from './components/ConnectionStatusBanner';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { PwaUpdateBanner } from './components/PwaUpdateBanner';
import './index.css';

const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000;
const INSTALL_PROMPT_DISMISS_KEY = 'poketactics:pwa-install-dismissed-at';
const INSTALL_PROMPT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const ONLINE_RECOVERY_BANNER_MS = 3000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function isStandaloneDisplayMode() {
  return window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches;
}

function shouldHideInstallPromptFromStorage() {
  try {
    const stored = window.localStorage.getItem(INSTALL_PROMPT_DISMISS_KEY);
    if (!stored) {
      return false;
    }

    const dismissedAt = Number(stored);
    if (!Number.isFinite(dismissedAt)) {
      return false;
    }

    return Date.now() - dismissedAt < INSTALL_PROMPT_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function AppRoot() {
  const [updateRegistration, setUpdateRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [dismissedWorkerUrl, setDismissedWorkerUrl] = useState<string | null>(null);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallPromptDismissed, setIsInstallPromptDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [showOnlineRecovery, setShowOnlineRecovery] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const reloadTimeoutRef = useRef<number | null>(null);
  const onlineRecoveryTimeoutRef = useRef<number | null>(null);

  const markUpdateReady = useCallback((registration: ServiceWorkerRegistration) => {
    const waitingWorker = registration.waiting;
    if (!waitingWorker) {
      return;
    }

    setUpdateRegistration(registration);
    setDismissedWorkerUrl((current) =>
      current === waitingWorker.scriptURL ? current : null
    );
  }, []);

  const dismissUpdate = useCallback(() => {
    const waitingUrl = updateRegistration?.waiting?.scriptURL;
    if (waitingUrl) {
      setDismissedWorkerUrl(waitingUrl);
    }
  }, [updateRegistration]);

  const applyUpdate = useCallback(() => {
    const waitingWorker = updateRegistration?.waiting;
    if (!waitingWorker) {
      window.location.reload();
      return;
    }

    setIsApplyingUpdate(true);
    reloadTimeoutRef.current = window.setTimeout(() => {
      window.location.reload();
    }, 4000);

    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  }, [updateRegistration]);

  const dismissInstallPrompt = useCallback(() => {
    setIsInstallPromptDismissed(true);
    try {
      window.localStorage.setItem(INSTALL_PROMPT_DISMISS_KEY, String(Date.now()));
    } catch {
      // Ignore storage failures; dismissal still applies for this session.
    }
  }, []);

  const installApp = useCallback(async () => {
    if (!installPromptEvent) {
      return;
    }

    setIsInstalling(true);

    try {
      await installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;

      if (choice.outcome !== 'accepted') {
        dismissInstallPrompt();
      }
    } catch (error) {
      console.warn('[PWA] Install prompt failed', error);
    } finally {
      setInstallPromptEvent(null);
      setIsInstalling(false);
    }
  }, [dismissInstallPrompt, installPromptEvent]);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
      return;
    }

    let isDisposed = false;

    const handleControllerChange = () => {
      if (reloadTimeoutRef.current) {
        window.clearTimeout(reloadTimeoutRef.current);
        reloadTimeoutRef.current = null;
      }
      window.location.reload();
    };

    const checkForUpdates = () => {
      void registrationRef.current?.update().catch((error) => {
        console.warn('[PWA] Update check failed', error);
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setInstallPromptEvent(promptEvent);
      setIsInstallPromptDismissed(shouldHideInstallPromptFromStorage());
    };

    const handleAppInstalled = () => {
      setInstallPromptEvent(null);
      setIsInstalled(true);
      setIsInstallPromptDismissed(false);
      try {
        window.localStorage.removeItem(INSTALL_PROMPT_DISMISS_KEY);
      } catch {
        // Ignore.
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (onlineRecoveryTimeoutRef.current) {
        window.clearTimeout(onlineRecoveryTimeoutRef.current);
        onlineRecoveryTimeoutRef.current = null;
      }
      setShowOnlineRecovery(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineRecovery(true);
      if (onlineRecoveryTimeoutRef.current) {
        window.clearTimeout(onlineRecoveryTimeoutRef.current);
      }
      onlineRecoveryTimeoutRef.current = window.setTimeout(() => {
        setShowOnlineRecovery(false);
        onlineRecoveryTimeoutRef.current = null;
      }, ONLINE_RECOVERY_BANNER_MS);
    };

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          `/sw.js?build=${encodeURIComponent(__BUILD_ID__)}`
        );

        if (isDisposed) {
          return;
        }

        registrationRef.current = registration;

        if (registration.waiting) {
          markUpdateReady(registration);
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener('statechange', () => {
            if (
              installingWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              markUpdateReady(registration);
            }
          });
        });
      } catch (error) {
        console.error('[PWA] Service worker registration failed', error);
      }
    };

    const updateInterval = window.setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL_MS);

    setIsInstalled(isStandaloneDisplayMode());
    setIsInstallPromptDismissed(shouldHideInstallPromptFromStorage());
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    void registerServiceWorker();

    return () => {
      isDisposed = true;
      window.clearInterval(updateInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);

      if (reloadTimeoutRef.current) {
        window.clearTimeout(reloadTimeoutRef.current);
        reloadTimeoutRef.current = null;
      }

      if (onlineRecoveryTimeoutRef.current) {
        window.clearTimeout(onlineRecoveryTimeoutRef.current);
        onlineRecoveryTimeoutRef.current = null;
      }
    };
  }, [markUpdateReady]);

  const shouldShowUpdateBanner =
    !!updateRegistration?.waiting &&
    updateRegistration.waiting.scriptURL !== dismissedWorkerUrl;
  const shouldShowInstallBanner =
    import.meta.env.PROD &&
    !!installPromptEvent &&
    !isInstalled &&
    !isInstallPromptDismissed &&
    !shouldShowUpdateBanner;
  const connectionBannerVisible = !isOnline || showOnlineRecovery;

  return (
    <>
      <Game />
      <ConnectionStatusBanner isOnline={isOnline} visible={connectionBannerVisible} />
      {shouldShowInstallBanner && (
        <PwaInstallBanner
          isInstalling={isInstalling}
          onInstall={() => {
            void installApp();
          }}
          onDismiss={dismissInstallPrompt}
        />
      )}
      {shouldShowUpdateBanner && (
        <PwaUpdateBanner
          version={__APP_VERSION__}
          isRefreshing={isApplyingUpdate}
          onRefresh={applyUpdate}
          onDismiss={dismissUpdate}
        />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);
