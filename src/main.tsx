import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/chakra-petch/500.css';
import '@fontsource/chakra-petch/600.css';
import '@fontsource/chakra-petch/700.css';
import '@fontsource/press-start-2p';
import Game from './Game';
import { PwaUpdateBanner } from './components/PwaUpdateBanner';
import './index.css';

const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

function AppRoot() {
  const [updateRegistration, setUpdateRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [dismissedWorkerUrl, setDismissedWorkerUrl] = useState<string | null>(null);
  const [isApplyingUpdate, setIsApplyingUpdate] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const reloadTimeoutRef = useRef<number | null>(null);

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

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    void registerServiceWorker();

    return () => {
      isDisposed = true;
      window.clearInterval(updateInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);

      if (reloadTimeoutRef.current) {
        window.clearTimeout(reloadTimeoutRef.current);
        reloadTimeoutRef.current = null;
      }
    };
  }, [markUpdateReady]);

  const shouldShowUpdateBanner =
    !!updateRegistration?.waiting &&
    updateRegistration.waiting.scriptURL !== dismissedWorkerUrl;

  return (
    <>
      <Game />
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
