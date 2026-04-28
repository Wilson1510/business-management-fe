import { useSyncExternalStore } from 'react';
import { Toaster } from 'sonner';

function subscribeDarkClass(onStoreChange: () => void) {
  const obs = new MutationObserver(onStoreChange);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => obs.disconnect();
}

function getDarkClassSnapshot() {
  return document.documentElement.classList.contains('dark');
}

function getServerSnapshot() {
  return false;
}

export function AppToaster() {
  const isDark = useSyncExternalStore(subscribeDarkClass, getDarkClassSnapshot, getServerSnapshot);
  return (
    <Toaster
      position="top-right"
      theme={isDark ? 'dark' : 'light'}
      richColors
    />
  );
}
