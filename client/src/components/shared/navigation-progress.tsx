'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * A slim progress bar at the very top of the viewport.
 * Animates during route transitions to give visual feedback.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [state, setState] = useState<'idle' | 'loading' | 'complete'>('idle');
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // On pathname change → start loading animation
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;

      // Use microtask to avoid synchronous setState in effect body
      queueMicrotask(() => setState('loading'));

      const timer = setTimeout(() => {
        setState('complete');
      }, 150);

      const resetTimer = setTimeout(() => {
        setState('idle');
      }, 500);

      return () => {
        clearTimeout(timer);
        clearTimeout(resetTimer);
      };
    }
  }, [pathname]);

  if (state === 'idle') return null;

  return <div className="nav-progress" data-state={state} />;
}
