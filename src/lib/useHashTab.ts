import { useCallback, useEffect, useState } from 'react';
import { isTabId, TabId } from './navigation';

function readHash(): TabId {
  const raw = window.location.hash.replace(/^#\/?/, '');
  return isTabId(raw) ? raw : 'overview';
}

export function useHashTab(): [TabId, (t: TabId) => void] {
  const [tab, setTab] = useState<TabId>(readHash);

  useEffect(() => {
    const onChange = () => {
      setTab(readHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((t: TabId) => {
    window.location.hash = '/' + t;
  }, []);

  return [tab, navigate];
}
