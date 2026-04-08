'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

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
      setState('loading');
      prevPathname.current = pathname;

      // After a brief moment, mark as complete (page has rendered)
      const timer = setTimeout(() => {
        setState('complete');
      }, 150);

      // Reset to idle after the complete animation finishes
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
