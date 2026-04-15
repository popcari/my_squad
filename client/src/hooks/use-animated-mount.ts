/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';

/**
 * Coordinates mount/unmount with an enter+exit transition.
 *
 * - When `open` flips to true, mounts immediately so consumers can render
 *   the panel synchronously (tests querying for the dialog right after open
 *   work without awaiting frames). On the next frame `visible` flips so a
 *   CSS transition can run from the off-screen state to on-screen.
 * - When `open` flips to false, clears `visible` (animating back to closed)
 *   and unmounts after `durationMs`.
 *
 * The setState-in-effect lint rule is intentionally disabled — this is an
 * established "delayed unmount + paint-on-next-frame" animation pattern
 * that is impossible without effect-driven state.
 */
export function useAnimatedMount(open: boolean, durationMs = 220) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const timer = setTimeout(() => setMounted(false), durationMs);
    return () => clearTimeout(timer);
  }, [open, durationMs]);

  return { mounted, visible };
}
